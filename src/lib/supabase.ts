import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rkqnblbajhnehmxfnvri.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hjLH8puvrYsVNPt38KROkQ_v99vtC3c';

/**
 * 카카오톡/네이버 등 인앱브라우저에서 localStorage 차단 시 메모리 폴백
 * → 세션이 유지되진 않지만 사이트 자체는 정상 동작
 */
function getSafeStorage(): Storage {
  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return window.localStorage;
  } catch {
    // localStorage 차단 시 메모리 기반 폴백
    const memStore: Record<string, string> = {};
    return {
      getItem: (key: string) => memStore[key] ?? null,
      setItem: (key: string, value: string) => { memStore[key] = value; },
      removeItem: (key: string) => { delete memStore[key]; },
      clear: () => { Object.keys(memStore).forEach(k => delete memStore[k]); },
      get length() { return Object.keys(memStore).length; },
      key: (index: number) => Object.keys(memStore)[index] ?? null,
    };
  }
}

export const safeStorage = getSafeStorage();

// ★ 시즌73 — Supabase REST 동시 요청 큐 (HTTP/2 stream limit ~6 회피)
// 홈 페이지에서 HomeFeed/TemperatureRanking/HomePage party fetch가 동시 폭발 →
// ERR_HTTP2_SERVER_REFUSED_STREAM 5+건. 클라 측에서 max 4 동시로 throttle.
const SB_MAX_CONCURRENT = 4;
let sbInflight = 0;
const sbWaiters: Array<() => void> = [];
function sbAcquire(): Promise<void> {
  if (sbInflight < SB_MAX_CONCURRENT) { sbInflight++; return Promise.resolve(); }
  return new Promise(resolve => sbWaiters.push(() => { sbInflight++; resolve(); }));
}
function sbRelease() {
  sbInflight--;
  const next = sbWaiters.shift();
  if (next) next();
}
async function queuedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  await sbAcquire();
  try { return await fetch(input, init); }
  finally { sbRelease(); }
}

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
        detectSessionInUrl: true,
        storageKey: 'nolcool-auth',
        storage: safeStorage,
        flowType: 'pkce',
      },
      global: { fetch: queuedFetch },
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
