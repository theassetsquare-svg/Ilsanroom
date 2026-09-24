/**
 * [놀쿨11-5] 가입·로그인 뒤 「방금 보던 쪽」으로 돌아가기(이탈 0).
 *  - 같은 출처의 경로만 받는다(열린 리디렉트 0) · 로그인/콜백/닉네임/관리 쪽은 받지 않는다.
 *  - OAuth 는 다른 사이트를 거쳐 오므로 localStorage 에 30분만 둔다.
 */
const KEY = 'nc_return_to';
const TTL_MS = 30 * 60 * 1000;
const BLOCK = /^\/(login|auth|setup-nickname|admin)(\/|$)/;

export function safePath(p: string | null | undefined): string | null {
  if (!p || typeof p !== 'string') return null;
  try {
    const u = new URL(p, window.location.origin);
    if (u.origin !== window.location.origin) return null;
    if (BLOCK.test(u.pathname)) return null;
    return u.pathname + u.search + u.hash;
  } catch {
    return null;
  }
}

export function rememberReturn(p: string | null | undefined): void {
  const s = safePath(p);
  if (!s) return;
  try { localStorage.setItem(KEY, JSON.stringify({ p: s, t: Date.now() })); } catch { /* 저장 불가 */ }
}

export function peekReturn(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { p?: string; t?: number };
    if (!v.p || !v.t || Date.now() - v.t > TTL_MS) return null;
    return safePath(v.p);
  } catch {
    return null;
  }
}

export function takeReturn(): string | null {
  const p = peekReturn();
  try { localStorage.removeItem(KEY); } catch { /* 없음 */ }
  return p;
}

/** 로그인 쪽 주소 — 지금 보는 쪽을 redirect 로 싣는다 */
export function loginHref(path?: string): string {
  const here = path ?? (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
  const s = safePath(here);
  return s && s !== '/' ? `/login?redirect=${encodeURIComponent(s)}` : '/login';
}
