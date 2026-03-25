import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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

    const { data: userData, error } = await supabase
      .from('propertypix_users')
      .select('credits_remaining, credits_used, plan, plan_status')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      return NextResponse.json({ 
        credits: 5,
        plan: 'free',
        used: 0,
      });
    }

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
