/**
 * 방문자 행동 추적 — 자체 시스템
 * 페이지뷰·스크롤깊이·체류시간·이탈을 Supabase page_events 테이블에 기록.
 * 외부 SaaS 불필요, 가입 없이 즉시 작동.
 */
import { createClient } from './supabase';

type EventType = 'view' | 'scroll_25' | 'scroll_50' | 'scroll_75' | 'scroll_100'
  | 'time_10s' | 'time_30s' | 'time_60s' | 'time_180s' | 'exit';

const SESSION_KEY = 'nc_session_id';
const sessionId = ((): string => {
  if (typeof window === 'undefined') return 'ssr';
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
})();

let currentPath = '';
let pageEnterTime = 0;
let firedEvents = new Set<EventType>();
let timers: number[] = [];

function send(eventType: EventType, dwellMs?: number) {
  if (typeof window === 'undefined') return;
  if (firedEvents.has(eventType)) return;
  firedEvents.add(eventType);
  const payload = {
    session_id: sessionId,
    path: currentPath,
    event_type: eventType,
    dwell_ms: dwellMs ?? null,
    referrer: document.referrer || null,
    viewport_w: window.innerWidth,
    viewport_h: window.innerHeight,
    user_agent: navigator.userAgent.slice(0, 200),
  };
  // fire-and-forget; do not block UI on failure
  const supabase = createClient();
  if (!supabase) return;
  supabase.from('page_events').insert(payload).then(() => {}, () => {});
}

function onScroll() {
  const h = document.documentElement;
  const scrolled = (h.scrollTop + window.innerHeight) / h.scrollHeight;
  if (scrolled >= 0.25) send('scroll_25');
  if (scrolled >= 0.50) send('scroll_50');
  if (scrolled >= 0.75) send('scroll_75');
  if (scrolled >= 0.99) send('scroll_100');
}

function onExit() {
  if (!currentPath) return;
  const dwell = Date.now() - pageEnterTime;
  // sendBeacon for reliable exit tracking
  try {
    const blob = new Blob([JSON.stringify({
      session_id: sessionId, path: currentPath, event_type: 'exit',
      dwell_ms: dwell,
    })], { type: 'application/json' });
    navigator.sendBeacon?.('/__exit', blob);
  } catch {}
  send('exit', dwell);
}

export function trackPageView(path: string) {
  if (typeof window === 'undefined') return;
  // flush previous page exit timing first
  if (currentPath && currentPath !== path) {
    const dwell = Date.now() - pageEnterTime;
    send('exit', dwell);
  }
  // reset state for new page
  currentPath = path;
  pageEnterTime = Date.now();
  firedEvents = new Set();
  timers.forEach(t => clearTimeout(t));
  timers = [];

  send('view');

  timers.push(window.setTimeout(() => send('time_10s', 10_000), 10_000));
  timers.push(window.setTimeout(() => send('time_30s', 30_000), 30_000));
  timers.push(window.setTimeout(() => send('time_60s', 60_000), 60_000));
  timers.push(window.setTimeout(() => send('time_180s', 180_000), 180_000));
}

let installed = false;
export function installVisitorTracker() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('beforeunload', onExit);
  window.addEventListener('pagehide', onExit);
}
