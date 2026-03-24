import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Storage bucket names
export const STORAGE_BUCKETS = {
  UPLOADS: 'user-uploads',
  RESULTS: 'enhancement-results',
} as const;

// Helper to get public URL for a file
export function getPublicUrl(bucket: string, path: string): string {
  if (!supabase) return '';
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Helper to upload a file
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<{ success: boolean; path?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, path: data.path };
}

// Helper to download a file
export async function downloadFile(bucket: string, path: string): Promise<Blob | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error) {
    console.error('Download error:', error);
    return null;
  }

  return data as unknown as Blob;
}

// Helper to delete a file
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.storage.from(bucket).remove([path]);
  return !error;
}

// Database types
export interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface EnhancementCredit {
  id: string;
  user_id: string;
  credits_total: number;
  credits_used: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

// Auth helpers
export async function signUp(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Credit helpers
export async function getUserCredits(userId: string): Promise<EnhancementCredit | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('enhancement_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching credits:', error);
    return null;
  }

  return data;
}

export async function incrementCreditsUsed(userId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.rpc('increment_credits_used', {
    p_user_id: userId,
  });

  return !error;
}
