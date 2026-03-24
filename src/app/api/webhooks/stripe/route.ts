import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createClient();

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan || 'pro';

      if (!userId) {
        console.error('No user_id in checkout session metadata');
        break;
      }

      // Update user plan
      const { error } = await supabase
        .from('propertypix_users')
        .update({
          plan: plan,
          plan_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          credits_remaining: plan === 'pro' ? 100 : 999999, // Unlimited for enterprise
          plan_updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user plan:', error);
      }

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find user by stripe customer id
      const { data: user } = await supabase
        .from('propertypix_users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (!user) break;

      const status = subscription.status;
      const plan = subscription.metadata?.plan || 'pro';

      // Update subscription status
      await supabase
        .from('propertypix_users')
        .update({
          plan_status: status === 'active' ? 'active' : 'inactive',
          plan: plan,
        })
        .eq('id', user.id);

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Downgrade to free plan
      const { error } = await supabase
        .from('propertypix_users')
        .update({
          plan: 'free',
          plan_status: 'inactive',
          credits_remaining: 5,
        })
        .eq('stripe_customer_id', customerId);

      if (error) {
        console.error('Error downgrading user:', error);
      }

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      // Mark payment as failed
      await supabase
        .from('propertypix_users')
        .update({
          plan_status: 'payment_failed',
        })
        .eq('stripe_customer_id', customerId);

      break;
    }
  }

  return NextResponse.json({ received: true });
}
