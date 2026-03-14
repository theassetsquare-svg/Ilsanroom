import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Client-side singleton — direct SDK queries, no API routes
let clientInstance: ReturnType<typeof supabaseCreateClient<Database>> | null = null;

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = supabaseCreateClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return clientInstance;
}

// Build-time / server-side client (no session persistence)
export function createServerClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  return supabaseCreateClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
