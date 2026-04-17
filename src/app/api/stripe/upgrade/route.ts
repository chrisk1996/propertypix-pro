// Stripe Subscription Upgrade/Downgrade API
// Handles plan changes with proration

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

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

const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
};

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newPlan } = await request.json();
    if (!newPlan || !['pro', 'enterprise'].includes(newPlan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get user's current subscription info
    const { data: userData } = await supabase
      .from('zestio_users')
      .select('stripe_customer_id, stripe_subscription_id, subscription_tier')
      .eq('id', user.id)
      .single();

    if (!userData?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Update the subscription with proration
    const subscription = await stripe.subscriptions.update(
      userData.stripe_subscription_id,
      {
        items: [
          {
            id: (await stripe.subscriptions.retrieve(userData.stripe_subscription_id)).items.data[0].id,
            price: PRICE_IDS[newPlan as keyof typeof PRICE_IDS],
          },
        ],
        proration_behavior: 'create_prorations', // Stripe will calculate the difference
        payment_behavior: 'pending_if_incomplete', // Don't charge immediately if proration is $0
      }
    );

    // Update user's subscription tier in database
    await supabase
      .from('zestio_users')
      .update({
        subscription_tier: newPlan,
        credits: newPlan === 'enterprise' ? -1 : 100,
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        tier: newPlan,
      },
    });
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
