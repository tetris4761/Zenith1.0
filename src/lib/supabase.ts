import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Read env from Vite (.env.local, Vercel envs)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let cachedClient: SupabaseClient | null = null;

/**
 * Lazily create and cache the Supabase client. Returns null if env is missing.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn(
        'Supabase environment variables are missing. Falling back to mock auth. ' +
          'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.'
      );
    }
    return null;
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return cachedClient;
}

/** Throw if Supabase is not configured. Useful for code paths that require it. */
export function requireSupabaseClient(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is not configured. Missing env variables.');
  }
  return client;
}

