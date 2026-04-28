import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: transactions, error } = await supabase
      .from('credit_transactions')
      .select('id, type, amount, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ transactions: [] });
    }

    // Compute usage breakdown
    const usageRows = (transactions || []).filter(t => t.type === 'usage');
    const breakdown: Record<string, number> = {};
    for (const t of usageRows) {
      const desc = t.description || 'Other';
      // Group by feature category
      const feature = desc.toLowerCase().includes('enhanc') ? 'Enhancement'
        : desc.toLowerCase().includes('staging') ? 'Virtual Staging'
        : desc.toLowerCase().includes('video') ? 'Video'
        : desc.toLowerCase().includes('floorplan') || desc.toLowerCase().includes('floor plan') ? 'Floor Plan'
        : desc.toLowerCase().includes('upscale') ? 'Enhancement'
        : desc.toLowerCase().includes('renovat') ? 'Enhancement'
        : 'Other';
      breakdown[feature] = (breakdown[feature] || 0) + Math.abs(t.amount);
    }

    return NextResponse.json({ transactions: transactions || [], breakdown });
  } catch {
    return NextResponse.json({ transactions: [] });
  }
}
