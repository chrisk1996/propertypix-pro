// Stripe Webhook Handler
// Handles Stripe webhook events to sync subscription status

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Plan mapping by price ID (fallback when metadata not set)
const PLAN_BY_PRICE_ID: Record<string, string> = {
  // Add your actual price IDs here as fallback
  // 'price_pro_xxx': 'pro',
  // 'price_enterprise_xxx': 'enterprise',
};

// Lazy-initialize Stripe to avoid build-time errors when key is missing
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripe = new Stripe(key, { apiVersion: '2025-03-31.basil' });
  }
  return stripe;
}

// Lazy-initialize Supabase admin client to avoid build-time errors
let supabaseAdmin: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }
    supabaseAdmin = createClient(url, key);
  }
  return supabaseAdmin;
}

// Helper to determine plan from price
function getPlanFromPrice(price: Stripe.Price): string {
  // First check price metadata
  if (price.metadata?.plan) {
    return price.metadata.plan;
  }
  // Then check price ID mapping
  if (PLAN_BY_PRICE_ID[price.id]) {
    return PLAN_BY_PRICE_ID[price.id];
  }
  // Fallback: check env var price IDs
  if (price.id === process.env.STRIPE_PRO_PRICE_ID) {
    return 'pro';
  }
  if (price.id === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
    return 'enterprise';
  }
  // Default to pro
  return 'pro';
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;

        console.log(`[Stripe] Checkout completed - userId: ${userId}, plan: ${plan}, metadata:`, session.metadata);

        if (userId && plan) {
          const { error: updateError } = await supabaseAdmin
            .from('zestio_users')
            .update({
              subscription_tier: plan,
              subscription_status: 'active',
              credits: plan === 'pro' ? 100 : -1,
              used_credits: 0,
              stripe_subscription_id: session.subscription as string,
            })
            .eq('id', userId);

          if (updateError) {
            console.error(`[Stripe] Failed to update subscription_tier:`, updateError);
          } else {
            console.log(`[Stripe] Subscription created for user ${userId}: ${plan}`);
          }
        } else {
          console.warn(`[Stripe] Missing metadata - userId: ${userId}, plan: ${plan}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: user } = await supabaseAdmin
          .from('zestio_users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          const status = subscription.status;
          const price = subscription.items.data[0]?.price;
          const plan = price ? getPlanFromPrice(price) : 'pro';

          console.log(`[Stripe] Subscription update - status: ${status}, priceId: ${price?.id}, metadata:`, price?.metadata, `, detected plan: ${plan}`);

          const { error: updateError } = await supabaseAdmin
            .from('zestio_users')
            .update({
              subscription_tier: status === 'active' ? plan : 'free',
              subscription_status: status,
              credits: status === 'active' ? (plan === 'enterprise' ? -1 : 100) : 10,
            })
            .eq('id', user.id);

          if (updateError) {
            console.error(`[Stripe] Failed to update subscription:`, updateError);
          } else {
            console.log(`[Stripe] Subscription updated for user ${user.id}: ${status}, tier: ${plan}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`[Stripe] Subscription deleted event - customerId: ${customerId}`);

        const { data: user } = await supabaseAdmin
          .from('zestio_users')
          .select('id, subscription_tier')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          const { error: updateError } = await supabaseAdmin
            .from('zestio_users')
            .update({
              subscription_tier: 'free',
              subscription_status: 'canceled',
              credits: 10,
            })
            .eq('id', user.id);

          if (updateError) {
            console.error(`[Stripe] Failed to cancel subscription:`, updateError);
          } else {
            console.log(`[Stripe] Subscription canceled for user ${user.id}, was: ${user.subscription_tier}, now: free`);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: user } = await supabaseAdmin
          .from('zestio_users')
          .select('id, subscription_tier')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user && user.subscription_tier !== 'free') {
          await supabaseAdmin
            .from('zestio_users')
            .update({
              used_credits: 0,
              credits: user.subscription_tier === 'enterprise' ? -1 : 100,
            })
            .eq('id', user.id);
          console.log(`[Stripe] Credits reset for user ${user.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        console.log(`[Stripe] Payment failed for customer ${customerId}`);
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
