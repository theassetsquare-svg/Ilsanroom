/**
 * Supabase client placeholder.
 *
 * This module exports a createClient helper that will connect to Supabase
 * once the environment variables are configured. Until then, all calls will
 * return null and log a warning.
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      '[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
        'Database features are disabled until Supabase is configured.',
    );
    return null;
  }

  // Placeholder: replace with actual @supabase/supabase-js createClient call
  // import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
  // return supabaseCreateClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return null;
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
