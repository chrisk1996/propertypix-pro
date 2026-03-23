import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket names
export const STORAGE_BUCKETS = {
  UPLOADS: 'user-uploads',
  RESULTS: 'enhancement-results',
} as const;

// Helper to get public URL for a file
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Helper to upload a file
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<{ success: boolean; path?: string; error?: string }> {
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
  const { data, error } = await supabase.storage.from(bucket).download(path);
  
  if (error) {
    console.error('Download error:', error);
    return null;
  }

  return data;
}

// Helper to delete a file
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return !error;
}
