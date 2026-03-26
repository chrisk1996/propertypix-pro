// Portal Credentials API
// GET /api/portals/credentials - Get all portal credentials for current user

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: credentials, error } = await supabase
    .from('portal_credentials')
    .select('id, portal_name, status, last_used_at, created_at, expires_at')
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }

  return NextResponse.json(credentials || []);
}
