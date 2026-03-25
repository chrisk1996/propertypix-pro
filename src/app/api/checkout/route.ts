import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

// Lazy-load Stripe to avoid build-time errors when env vars are missing
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  });
}

// Price IDs (create these in Stripe Dashboard)
const PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID!, // €9/month
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!, // €99/month
};

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { priceId } = body;

    if (!priceId || !Object.values(PRICES).includes(priceId)) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    // Get user email from Supabase
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_API_URL || ''}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_API_URL || ''}/pricing`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
