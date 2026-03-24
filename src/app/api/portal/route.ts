import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Stripe customer ID
    const { data: userData } = await supabase
      .from('propertypix_users')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (!userData?.stripe_subscription_id) {
      return NextResponse.json({ 
        error: 'No active subscription',
        portalUrl: null,
      });
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id!,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ 
      url: portalSession.url,
    });

  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
