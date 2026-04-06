import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rkqnblbajhnehmxfnvri.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hjLH8puvrYsVNPt38KROkQ_v99vtC3c';

// Client-side singleton — direct SDK queries, no API routes
let clientInstance: ReturnType<typeof supabaseCreateClient<Database>> | null = null;

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = supabaseCreateClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'nolcool-auth',
        storage: window.localStorage,
      },
    });
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
