// Stripe Webhook Handler
// Handles Stripe webhook events to sync subscription status

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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

// Supabase admin client for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const stripe = getStripe();
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

        if (userId && plan) {
          // Update user subscription
          await supabaseAdmin
            .from('zestio_users')
            .update({
              subscription_tier: plan,
              subscription_status: 'active',
              credits: plan === 'pro' ? 100 : -1, // -1 = unlimited for enterprise
              used_credits: 0,
              stripe_subscription_id: session.subscription as string,
            })
            .eq('id', userId);

          console.log(`[Stripe] Subscription created for user ${userId}: ${plan}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const { data: user } = await supabaseAdmin
          .from('zestio_users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          const status = subscription.status;
          const plan = subscription.items.data[0]?.price.metadata?.plan || 'pro';

          await supabaseAdmin
            .from('zestio_users')
            .update({
              subscription_tier: status === 'active' ? plan : 'free',
              subscription_status: status,
            })
            .eq('id', user.id);

          console.log(`[Stripe] Subscription updated for user ${user.id}: ${status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const { data: user } = await supabaseAdmin
          .from('zestio_users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          await supabaseAdmin
            .from('zestio_users')
            .update({
              subscription_tier: 'free',
              subscription_status: 'canceled',
              credits: 10,
            })
            .eq('id', user.id);

          console.log(`[Stripe] Subscription canceled for user ${user.id}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Reset credits on successful payment (monthly reset)
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

        // Notify about failed payment
        console.log(`[Stripe] Payment failed for customer ${customerId}`);
        
        // Could send email notification here
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
