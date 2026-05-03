/**
 * 방문자 행동 추적 — 자체 시스템
 * 페이지뷰·스크롤깊이·체류시간·이탈·전환을 Supabase page_events에 기록.
 * 외부 SaaS 불필요. UTM/유입채널/디바이스/유저ID까지 자동 수집.
 */
import { createClient } from './supabase';

type EventType =
  | 'view' | 'scroll_25' | 'scroll_50' | 'scroll_75' | 'scroll_100'
  | 'time_10s' | 'time_30s' | 'time_60s' | 'time_180s' | 'exit'
  | 'signup' | 'login' | 'share_click' | 'post_create' | 'invite_open';

type SourceType = 'google' | 'naver' | 'kakao' | 'daum' | 'bing' | 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'direct' | 'internal' | 'other';
type DeviceType = 'mobile' | 'tablet' | 'desktop';

const SESSION_KEY = 'nc_session_id';
const ATTR_KEY = 'nc_session_attr'; // UTM/source 한 세션 동안 유지

/* ── 관리자/봇/개발 트래픽 제외 — "진짜 방문자"만 기록 ── */
const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'baesunwook513@gmail.com', 'theassetsquare@gmail.com'];
const BOT_UA_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|googlebot|yeti|gptbot|claude|chatgpt|perplexity|headlesschrome|phantomjs|puppeteer|playwright|lighthouse|pagespeed/i;

function isBot(ua: string): boolean {
  return BOT_UA_RE.test(ua);
}

function isInternalHost(): boolean {
  if (typeof window === 'undefined') return true;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.pages.dev') || h.startsWith('192.168.') || h.startsWith('10.');
}

let trackingDisabled = false; // 관리자 로그인 시 true

const sessionId = ((): string => {
  if (typeof window === 'undefined') return 'ssr';
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
})();

/* ── 디바이스 타입 (UA 기반) ── */
function detectDevice(ua: string): DeviceType {
  const s = ua.toLowerCase();
  if (/ipad|tablet|kindle|silk|playbook/.test(s)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/.test(s)) return 'mobile';
  return 'desktop';
}

/* ── 유입 채널 카테고리 (referrer 호스트 기반) ── */
function detectSource(referrer: string): SourceType {
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes('nolcool')) return 'internal';
    if (host.includes('google')) return 'google';
    if (host.includes('naver')) return 'naver';
    if (host.includes('kakao') || host.includes('daum.net')) return 'kakao';
    if (host.includes('daum')) return 'daum';
    if (host.includes('bing')) return 'bing';
    if (host.includes('twitter') || host.includes('x.com') || host.includes('t.co')) return 'twitter';
    if (host.includes('facebook') || host.includes('fb.com')) return 'facebook';
    if (host.includes('instagram')) return 'instagram';
    if (host.includes('youtube') || host.includes('youtu.be')) return 'youtube';
    return 'other';
  } catch {
    return 'other';
  }
}

/* ── 세션 진입 시 1회만 캡처 (UTM + 첫 referrer + 첫 source) ── */
type SessionAttr = {
  source_type: SourceType;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  device_type: DeviceType;
  landing_path: string;
  first_referrer: string;
};

function loadOrInitAttr(): SessionAttr {
  if (typeof window === 'undefined') {
    return {
      source_type: 'direct', utm_source: null, utm_medium: null, utm_campaign: null,
      utm_content: null, utm_term: null, device_type: 'desktop', landing_path: '/', first_referrer: '',
    };
  }
  try {
    const cached = sessionStorage.getItem(ATTR_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}

  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer || '';
  const ua = navigator.userAgent || '';
  // UTM 우선, 없으면 referrer로 추정
  const utmSource = params.get('utm_source');
  const sourceType: SourceType = utmSource
    ? (detectSource(`https://${utmSource}.com`) === 'other' ? 'other' : detectSource(`https://${utmSource}.com`))
    : detectSource(referrer);

  const attr: SessionAttr = {
    source_type: sourceType,
    utm_source: utmSource,
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
    device_type: detectDevice(ua),
    landing_path: window.location.pathname,
    first_referrer: referrer,
  };
  try { sessionStorage.setItem(ATTR_KEY, JSON.stringify(attr)); } catch {}
  return attr;
}

const attr = loadOrInitAttr();

let currentPath = '';
let pageEnterTime = 0;
let firedEvents = new Set<EventType>();
let timers: number[] = [];
let currentUserId: string | null = null;

export function setTrackerUser(userId: string | null, email?: string | null) {
  currentUserId = userId;
  // 관리자 이메일이면 추적 비활성화 — 진짜 방문자 데이터만 남음
  if (email && ADMIN_EMAILS.includes(email)) {
    trackingDisabled = true;
    try { localStorage.setItem('nc_admin_skip', '1'); } catch {}
  }
}

function send(eventType: EventType, opts?: { dwellMs?: number; meta?: Record<string, any>; once?: boolean }) {
  if (typeof window === 'undefined') return;
  // 관리자/봇/개발 트래픽 차단 — 진짜 방문자 데이터만 남김
  if (trackingDisabled) return;
  try { if (localStorage.getItem('nc_admin_skip') === '1') { trackingDisabled = true; return; } } catch {}
  if (isInternalHost()) return;
  if (isBot(navigator.userAgent || '')) return;
  const once = opts?.once !== false; // default = once per page
  if (once && firedEvents.has(eventType)) return;
  if (once) firedEvents.add(eventType);

  const payload: Record<string, any> = {
    session_id: sessionId,
    user_id: currentUserId,
    path: currentPath || window.location.pathname,
    event_type: eventType,
    dwell_ms: opts?.dwellMs ?? null,
    referrer: document.referrer || null,
    viewport_w: window.innerWidth,
    viewport_h: window.innerHeight,
    user_agent: navigator.userAgent.slice(0, 200),
    source_type: attr.source_type,
    utm_source: attr.utm_source,
    utm_medium: attr.utm_medium,
    utm_campaign: attr.utm_campaign,
    device_type: attr.device_type,
    meta: opts?.meta ?? null,
  };
  const supabase = createClient();
  if (!supabase) return;
  supabase.from('page_events').insert(payload).then(() => {}, () => {});
}

/* ── 외부 트리거용 — 가입/공유/포스트 등 전환 이벤트 ── */
export function trackEvent(eventType: EventType, meta?: Record<string, any>) {
  send(eventType, { meta, once: false });
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
  send('exit', { dwellMs: dwell, once: false });
}

export function trackPageView(path: string) {
  if (typeof window === 'undefined') return;
  if (currentPath && currentPath !== path) {
    const dwell = Date.now() - pageEnterTime;
    send('exit', { dwellMs: dwell, once: false });
  }
  currentPath = path;
  pageEnterTime = Date.now();
  firedEvents = new Set();
  timers.forEach(t => clearTimeout(t));
  timers = [];

  send('view');

  timers.push(window.setTimeout(() => send('time_10s', { dwellMs: 10_000 }), 10_000));
  timers.push(window.setTimeout(() => send('time_30s', { dwellMs: 30_000 }), 30_000));
  timers.push(window.setTimeout(() => send('time_60s', { dwellMs: 60_000 }), 60_000));
  timers.push(window.setTimeout(() => send('time_180s', { dwellMs: 180_000 }), 180_000));
}

let installed = false;
export function installVisitorTracker() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('beforeunload', onExit);
  window.addEventListener('pagehide', onExit);
}
