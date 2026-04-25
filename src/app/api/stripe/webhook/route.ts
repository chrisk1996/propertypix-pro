// Stripe Webhook Handler
// Handles Stripe webhook events to sync subscription status

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { logCreditTransaction } from '@/lib/credit-transactions';

export const dynamic = 'force-dynamic';

// Plan mapping by price ID (fallback when metadata not set)
const PLAN_BY_PRICE_ID: Record<string, string> = {
  'price_1TMa2mA6xKRaC5AwwNZeerHl': 'pro', // Pro subscription
  'price_1TMa3oA6xKRaC5AwPM8TLeER': 'enterprise', // Enterprise subscription
};

// Lazy-initialize Stripe to avoid build-time errors when key is missing
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripe = new Stripe(key, {
      apiVersion: '2025-03-31.basil',
    });
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

// Helper to map Stripe subscription status to our status
function mapSubscriptionStatus(subscription: Stripe.Subscription): string {
  // Handle cancel_at_period_end - user still has access until period ends
  if (subscription.cancel_at_period_end) {
    return 'cancel_at_period_end';
  }
  return subscription.status;
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
        const type = session.metadata?.type;
        const credits = session.metadata?.credits;

        console.log(`[Stripe] Checkout completed - userId: ${userId}, type: ${type}, plan: ${plan}`);

        if (userId && type === 'topup' && credits) {
          // ── Credit top-up ──
          const topUpAmount = parseInt(credits, 10);
          const { data: userData } = await supabaseAdmin
            .from('zestio_users')
            .select('credits, used_credits')
            .eq('id', userId)
            .single();

          if (userData) {
            const newCredits = (userData.credits || 0) + topUpAmount;
            const { error: updateError } = await supabaseAdmin
              .from('zestio_users')
              .update({ credits: newCredits })
              .eq('id', userId);

            if (updateError) {
              console.error(`[Stripe] Top-up failed:`, updateError);
            } else {
              console.log(`[Stripe] Top-up: added ${topUpAmount} credits to user ${userId}. New total: ${newCredits}`);
              logCreditTransaction({ userId, type: 'topup', amount: topUpAmount, description: `${topUpAmount} credit top-up` });
            }
          }
          break;
        }

        if (userId && plan) {
          // ── New subscription ──
          const { error: updateError } = await supabaseAdmin
            .from('zestio_users')
            .update({
              subscription_tier: plan,
              subscription_status: 'active',
              credits: plan === 'pro' ? 100 : 500,
              used_credits: 0,
              stripe_subscription_id: session.subscription as string,
              // Clear any cancellation dates on new subscription
              subscription_cancel_at: null,
              subscription_canceled_at: null,
            })
            .eq('id', userId);

          if (updateError) {
            console.error(`[Stripe] Failed to update subscription_tier:`, updateError);
          } else {
            console.log(`[Stripe] Subscription created for user ${userId}: ${plan}`);
            logCreditTransaction({ userId, type: 'subscription', amount: plan === 'enterprise' ? 500 : 100, description: `${plan} plan — monthly credits` });
          }
        } else {
          console.warn(`[Stripe] Missing metadata - userId: ${userId}, plan: ${plan}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('[Stripe] Raw webhook subscription object:', JSON.stringify({
          id: subscription.id,
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: (subscription as any).current_period_end,
          cancel_at: subscription.cancel_at,
        }));

        // Fetch full subscription from Stripe to get all fields
        // Note: In API version 2025-03-31.basil, current_period_end moved to items.data[].current_period_end
        const fullSubscription = await stripe.subscriptions.retrieve(subscription.id);

        console.log('[Stripe] FULL fetched subscription:', JSON.stringify({
          id: fullSubscription.id,
          status: fullSubscription.status,
          cancel_at_period_end: fullSubscription.cancel_at_period_end,
          items_count: fullSubscription.items.data.length,
          first_item: fullSubscription.items.data[0] ? {
            id: fullSubscription.items.data[0].id,
            current_period_start: fullSubscription.items.data[0].current_period_start,
            current_period_end: fullSubscription.items.data[0].current_period_end,
          } : null,
          legacy_current_period_end: (fullSubscription as any).current_period_end,
          cancel_at: fullSubscription.cancel_at,
        }));

        // Get period end from subscription items (new API structure)
        const firstItem = fullSubscription.items.data[0];
        const periodEndTimestamp = firstItem?.current_period_end || (fullSubscription as any).current_period_end;
        const periodEnd = periodEndTimestamp ? new Date(periodEndTimestamp * 1000).toISOString() : null;
        const cancelAt = fullSubscription.cancel_at ? new Date(fullSubscription.cancel_at * 1000).toISOString() : null;

        console.log('[Stripe] Extracted period values:', { periodEnd, cancelAt });

        const { data: user } = await supabaseAdmin
          .from('zestio_users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          const status = mapSubscriptionStatus(fullSubscription);
          const price = fullSubscription.items.data[0]?.price;
          const plan = price ? getPlanFromPrice(price) : 'pro';

          // If cancel_at_period_end, keep their plan until period ends
          const effectivePlan = status === 'cancel_at_period_end'
            ? plan
            : (status === 'active' ? plan : 'free');
          const effectiveStatus = status === 'cancel_at_period_end'
            ? 'cancel_at_period_end'
            : fullSubscription.status;

          // If reactivating (no longer cancel_at_period_end), clear canceled_at
          const canceledAt = status === 'cancel_at_period_end' ? null : undefined;

          const { error: updateError } = await supabaseAdmin
            .from('zestio_users')
            .update({
              subscription_tier: effectivePlan,
              subscription_status: effectiveStatus,
              credits: status === 'cancel_at_period_end' || status === 'active'
                ? (plan === 'enterprise' ? 500 : 100)
                : 10,
              subscription_current_period_end: periodEnd,
              subscription_cancel_at: cancelAt,
              // Clear canceled_at if reactivating
              ...(canceledAt !== undefined && { subscription_canceled_at: canceledAt }),
            })
            .eq('id', user.id);

          if (updateError) {
            console.error(`[Stripe] Failed to update subscription:`, updateError);
          } else {
            console.log(`[Stripe] Subscription updated for user ${user.id}: ${effectiveStatus}, tier: ${effectivePlan}, periodEnd: ${periodEnd}`);
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
              // Clear Stripe subscription ID and dates
              stripe_subscription_id: null,
              subscription_cancel_at: null,
              subscription_current_period_end: null,
              subscription_canceled_at: new Date().toISOString(),
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

        // Get the subscription from the invoice to determine the correct plan
        const subscriptionId = invoice.subscription as string | undefined;
        let plan = 'free';

        if (subscriptionId) {
          // Fetch the subscription to get the current price
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const price = subscription.items.data[0]?.price;
          plan = price ? getPlanFromPrice(price) : 'pro';
        }

    const { data: user } = await supabaseAdmin
      .from('zestio_users')
      .select('id, subscription_tier, credits, used_credits')
      .eq('stripe_customer_id', customerId)
      .single();

    if (user && plan !== 'free') {
      const planCredits = plan === 'enterprise' ? 500 : 100;
      // Preserve unused top-up credits: any credits beyond the plan allocation are top-ups
      const currentCredits = user.credits ?? 0;
      const currentUsed = user.used_credits ?? 0;
      const remainingCredits = currentCredits === -1 ? 0 : Math.max(0, currentCredits - currentUsed);
      // Top-up credits = whatever remains beyond what the plan would have provided
      const previousPlanCredits = user.subscription_tier === 'enterprise' ? 500 : (user.subscription_tier === 'pro' ? 100 : 10);
      const extraCredits = Math.max(0, remainingCredits - previousPlanCredits);
      const newTotalCredits = planCredits + extraCredits;

      await supabaseAdmin
        .from('zestio_users')
        .update({
          used_credits: 0,
          credits: newTotalCredits,
        })
        .eq('id', user.id);
      console.log(`[Stripe] Credits reset for user ${user.id}: ${planCredits} plan + ${extraCredits} top-up = ${newTotalCredits} total`);
      logCreditTransaction({ userId: user.id, type: 'reset', amount: planCredits, description: `Monthly credit reset (${plan}) — ${extraCredits} top-up credits preserved` });
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
