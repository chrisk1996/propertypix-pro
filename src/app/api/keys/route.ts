import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateApiKey } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// GET /api/keys - List user's API keys
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, last_used_at, created_at, is_active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 });
    }

    return NextResponse.json({ keys: keys || [] });
  } catch (error) {
    console.error('API keys fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/keys - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = body.name || 'Default Key';

    // Limit to 5 keys per user
    const { count } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if ((count || 0) >= 5) {
      return NextResponse.json({ error: 'Maximum 5 active API keys allowed' }, { status: 400 });
    }

    const { rawKey, keyHash, prefix } = await generateApiKey();

    const { data: apiKey, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_hash: keyHash,
        key_prefix: prefix,
      })
      .select('id, name, key_prefix, created_at')
      .single();

    if (insertError) {
      console.error('API key creation error:', insertError);
      return NextResponse.json({ error: 'Failed to create key' }, { status: 500 });
    }

    // Return the raw key ONLY on creation — can't be retrieved again
    return NextResponse.json({
      key: apiKey,
      secret: rawKey,
      warning: 'Store this key securely. It cannot be retrieved again.',
    }, { status: 201 });
  } catch (error) {
    console.error('API key creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/keys - Revoke an API key
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key_id } = await request.json();
    if (!key_id) {
      return NextResponse.json({ error: 'key_id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq('id', key_id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API key revocation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
