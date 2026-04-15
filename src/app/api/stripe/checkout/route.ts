// Stripe Checkout Session API
// Creates a Stripe Checkout session for subscription

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

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

// Stripe Price IDs (create these in Stripe Dashboard)
// For now, we'll use price IDs from env vars
const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
};

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const supabase = await createClient();
    
    // Get the base URL from the request
    const baseUrl = process.env.NEXT_PUBLIC_URL || request.headers.get('origin') || `https://${request.headers.get('host')}`;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, plan } = await request.json();

    if (!plan || !['pro', 'enterprise'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get or create Stripe customer
    const { data: userData } = await supabase
      .from('zestio_users')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    let customerId = userData?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('zestio_users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId || PRICE_IDS[plan as keyof typeof PRICE_IDS],
          quantity: 1,
        },
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
