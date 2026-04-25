import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ credits: 0, plan: 'free', used: 0, total: 0 });
    }

    const { data: userData, error } = await supabase
      .from('zestio_users')
      .select('subscription_tier, credits, used_credits')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      return NextResponse.json({ credits: 5, plan: 'free', used: 0, total: 5 });
    }

    const creditsTotal = userData.credits ?? 5;
    const creditsUsed = userData.used_credits ?? 0;
  const isEnterpriseUnlimited = userData.subscription_tier === 'enterprise' && creditsTotal === -1;
  const creditsRemaining = isEnterpriseUnlimited ? -1 : Math.max(0, creditsTotal - creditsUsed);

  return NextResponse.json({
    credits: creditsRemaining,
    plan: userData.subscription_tier || 'free',
    used: creditsUsed,
    total: isEnterpriseUnlimited ? -1 : creditsTotal,
  });
    });
  } catch (error) {
    console.error('Credits error:', error);
    return NextResponse.json({ credits: 5, plan: 'free', used: 0, total: 5 });
  }
}
