import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Force dynamic rendering - uses cookies/auth
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        credits: 0,
        plan: 'free',
        used: 0,
      });
    }

    // Use correct column names: subscription_tier, credits, used_credits
    const { data: userData, error } = await supabase
      .from('zestio_users')
      .select('subscription_tier, credits, used_credits')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      return NextResponse.json({
        credits: 5,
        plan: 'free',
        used: 0,
      });
    }

    const creditsTotal = userData.credits ?? 5;
    const creditsUsed = userData.used_credits ?? 0;
    const creditsRemaining = creditsTotal - creditsUsed;

    return NextResponse.json({
      credits: userData.subscription_tier === 'enterprise' ? 999999 : creditsRemaining,
      plan: userData.subscription_tier || 'free',
      used: creditsUsed,
    });
  } catch (error) {
    console.error('Credits error:', error);
    return NextResponse.json({
      credits: 5,
      plan: 'free',
      used: 0,
    });
  }
}
