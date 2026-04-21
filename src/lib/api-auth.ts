import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export interface ApiAuthResult {
  userId: string;
  authMethod: 'session' | 'api_key';
  apiKeyId?: string;
}

/**
 * Authenticate a request via either Supabase session or API key.
 * API keys are passed as: Authorization: Bearer zest_xxxxxxxxxxxxxxxx
 */
export async function authenticateRequest(request: Request): Promise<ApiAuthResult | null> {
  // 1. Try API key auth
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer zest_')) {
    const rawKey = authHeader.slice('Bearer '.length);
    return authenticateApiKey(rawKey);
  }

  // 2. Try session auth
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return { userId: user.id, authMethod: 'session' };
    }
  } catch {
    // No valid session
  }

  return null;
}

async function authenticateApiKey(rawKey: string): Promise<ApiAuthResult | null> {
  // Hash the key for lookup
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const prefix = rawKey.slice(0, 8);

  try {
    const supabase = await createClient();

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select('id, user_id, is_active')
      .eq('key_hash', keyHash)
      .eq('key_prefix', prefix)
      .eq('is_active', true)
      .is('revoked_at', null)
      .single();

    if (error || !apiKey) {
      return null;
    }

    // Update last_used_at (fire and forget)
    supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKey.id)
      .then(() => {});

    return {
      userId: apiKey.user_id,
      authMethod: 'api_key',
      apiKeyId: apiKey.id,
    };
  } catch {
    return null;
  }
}

/**
 * Log API usage for metering
 */
export async function logApiUsage(params: {
  apiKeyId?: string;
  userId: string;
  endpoint: string;
  method?: string;
  creditsUsed?: number;
  model?: string;
  statusCode?: number;
  ipAddress?: string;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from('api_usage').insert({
      api_key_id: params.apiKeyId || null,
      user_id: params.userId,
      endpoint: params.endpoint,
      method: params.method || 'POST',
      credits_used: params.creditsUsed || 0,
      model: params.model || null,
      status_code: params.statusCode || null,
      ip_address: params.ipAddress || null,
    });
  } catch {
    // Don't fail requests over logging errors
  }
}

/**
 * Generate a new API key. Returns the raw key (only shown once) and the hash for storage.
 */
export async function generateApiKey(): Promise<{ rawKey: string; keyHash: string; prefix: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const keyBody = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const rawKey = `zest_${keyBody}`;
  const prefix = rawKey.slice(0, 8);

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawKey));
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return { rawKey, keyHash, prefix };
}
