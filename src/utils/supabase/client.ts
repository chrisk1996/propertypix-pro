import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check for missing env vars
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const createClient = () => {
  // Return a mock client if env vars are missing (for development/preview)
  if (!supabaseUrl || !supabaseKey) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: new Error('Missing Supabase config') }),
        signInWithOAuth: async () => ({ data: null, error: new Error('Missing Supabase config') }),
        signInWithPassword: async () => ({ data: null, error: new Error('Missing Supabase config') }),
        signUp: async () => ({ data: null, error: new Error('Missing Supabase config') }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    } as any;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
};
