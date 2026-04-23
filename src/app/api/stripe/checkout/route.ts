// Stripe Checkout Session API
// Creates a Stripe Checkout session for subscriptions or one-time credit top-ups

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { TOP_UP_PACKS } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    stripe = new Stripe(key, { apiVersion: '2025-03-31.basil' });
  }
  return stripe;
}

const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
};

// Top-up price IDs (create these in Stripe Dashboard as one-time prices)
const TOP_UP_PRICE_IDS: Record<number, string> = {
  50: process.env.STRIPE_TOPUP_50_ID || '',
  200: process.env.STRIPE_TOPUP_200_ID || '',
  500: process.env.STRIPE_TOPUP_500_ID || '',
};

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const supabase = await createClient();
    const baseUrl = process.env.NEXT_PUBLIC_URL || request.headers.get('origin') || `https://${request.headers.get('host')}`;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { priceId, plan, topUpCredits } = body;

    // Get or create Stripe customer
    const { data: userData } = await supabase
      .from('zestio_users')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    let customerId = userData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from('zestio_users').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    // ── Top-up (one-time payment) ─────────────────────────────
    if (topUpCredits) {
      const pack = TOP_UP_PACKS.find(p => p.credits === topUpCredits);
      if (!pack) {
        return NextResponse.json({ error: 'Invalid top-up pack' }, { status: 400 });
      }

      const topUpPriceId = TOP_UP_PRICE_IDS[topUpCredits];

      // If price ID isn't configured, create an ad-hoc price
      let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;

      if (topUpPriceId) {
        lineItem = { price: topUpPriceId, quantity: 1 };
      } else {
        // Ad-hoc price — works without pre-creating products in Stripe
        lineItem = {
          price_data: {
            currency: 'eur',
            unit_amount: pack.price * 100, // euros → cents
            product_data: {
              name: `${pack.credits} Zestio Credits`,
              description: `Credit top-up — ${pack.perCredit}/credit`,
            },
          },
          quantity: 1,
        };
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment', // one-time, not subscription
        payment_method_types: ['card'],
        line_items: [lineItem],
        success_url: `${baseUrl}/billing?topup=success`,
        cancel_url: `${baseUrl}/billing?canceled=true`,
        metadata: {
          user_id: user.id,
          type: 'topup',
          credits: String(topUpCredits),
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // ── Subscription ──────────────────────────────────────────
    if (!plan || !['pro', 'enterprise'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        { price: priceId || PRICE_IDS[plan as keyof typeof PRICE_IDS], quantity: 1 },
      ],
      success_url: `${baseUrl}/billing?success=true`,
      cancel_url: `${baseUrl}/billing?canceled=true`,
      metadata: {
        user_id: user.id,
        plan: plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}
