import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Force dynamic rendering - uses cookies/auth
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('Credits API - Auth check:', { userId: user?.id, authError: authError?.message });

    if (authError || !user) {
      console.log('Credits API - No user, returning defaults');
      return NextResponse.json({
        credits: 0,
        plan: 'free',
        used: 0,
      });
    }

    const { data: userData, error } = await supabase
      .from('propertypix_users')
      .select('credits_remaining, credits_used, plan, plan_status')
      .eq('id', user.id)
      .single();

    console.log('Credits API - Query result:', { userData, error: error?.message, code: error?.code });

    if (error || !userData) {
      console.log('Credits API - Query failed, returning fallback');
      return NextResponse.json({
        credits: 5,
        plan: 'free',
        used: 0,
      });
    }

    console.log('Credits API - Returning:', {
      credits: userData.credits_remaining,
      used: userData.credits_used,
      plan: userData.plan
    });

    return NextResponse.json({
      credits: userData.plan === 'enterprise' ? 999999 : userData.credits_remaining,
      plan: userData.plan,
      used: userData.credits_used,
      status: userData.plan_status,
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
