import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

// Supabase admin client using SERVICE_ROLE_KEY for privileged server-side operations
export const supabaseAdmin: SupabaseClient = createClient(
  config.SUPABASE_URL || 'https://placeholder.supabase.co',
  config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Creates a scoped Supabase client with the authenticated user's JWT
export const getSupabaseClient = (accessToken: string): SupabaseClient => {
  return createClient(
    config.SUPABASE_URL || 'https://placeholder.supabase.co',
    config.SUPABASE_ANON_KEY || 'placeholder-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
};
