/**
 * GA4 PII 차단 — ★단일 관문.
 *
 * GA4(gtag)로 나가는 ★모든 이벤트 파라미터는 반드시 이 scrubPii()를 통과한다.
 * 목적: 이메일·전화번호·URL 쿼리스트링에 섞여 들어갈 수 있는 개인식별정보(PII)가
 *       Google Analytics 로 전송되지 않게 한다(Google "Do not send PII" 정책 + GDPR/PIPA).
 *       구글이 지목하는 PII 1순위 누출원 = page_location 등 URL 쿼리 파라미터.
 *
 * ★중요: 이 모듈은 "GA4로 전송되는 값"만 정화한다. 화면에 표시되는 광고주 전화번호
 *        (tel: 링크·StickyPhoneBar 등)는 ★절대 건드리지 않는다 — 그 링크는 그대로 작동한다.
 *        여기서 마스킹되는 것은 오직 gtag 페이로드뿐.
 *
 * DOM/window 의존 없음(순수 함수) → 빌드 게이트(node)에서 그대로 import 해 양방향 검증한다.
 */

// 이메일 — RFC 근사. GA4로 가면 안 됨.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// 전화번호(한국+국제). 연도(2026)·짧은 숫자는 매치하지 않게 보수적으로.
//  - 구분자 있는 국번: 010-1111-2222 / 02-333-4444 / 031.555.6666
//  - 붙여 쓴 0번호: 01011112222 / 0212345678 (0 + 8~10자리)
//  - 국제: +82 10 1111 2222 형태
const PHONE_RE = /\b0\d{1,2}[-.\s]\d{3,4}[-.\s]\d{4}\b|\b0\d{8,10}\b|\+\d[\d\s.-]{7,}\d/g;

// URL 쿼리 중 개인식별 불가 = 첨부 허용. 그 외(q/email/phone/token/...)는 전부 제거.
const SAFE_QUERY_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'gclid', 'fbclid', 'ref', 'page', 'tab', 'sort', 'cat', 'type',
]);

// URL 성격의 파라미터 키 — 값에서 쿼리 PII 까지 제거(redact 만으로는 ?q=이름 못 막음).
const URL_KEYS = new Set([
  'page_location', 'page_referrer', 'link_url', 'page_path',
  'form_destination', 'video_url',
]);

/** 문자열에서 이메일·전화번호를 마스킹. */
export function redactString(value: string): string {
  if (typeof value !== 'string' || !value) return value;
  return value
    .replace(EMAIL_RE, '[redacted_email]')
    .replace(PHONE_RE, '[redacted_phone]');
}

/** URL → 경로 + 화이트리스트 쿼리만 남기고(나머지 쿼리 제거), 남은 문자열도 redact. */
export function scrubUrl(value: string): string {
  if (typeof value !== 'string' || !value) return value;
  try {
    const isAbs = /^https?:\/\//i.test(value);
    const u = new URL(value, 'https://nolcool.com');
    const kept = new URLSearchParams();
    for (const [k, v] of u.searchParams) {
      if (SAFE_QUERY_PARAMS.has(k.toLowerCase())) kept.set(k, v);
    }
    const qs = kept.toString();
    const base = isAbs ? `${u.origin}${u.pathname}` : u.pathname;
    return redactString(qs ? `${base}?${qs}` : base);
  } catch {
    // URL 파싱 실패 → 쿼리부 통째 제거 후 redact
    return redactString(value.split('?')[0]);
  }
}

/**
 * GA4 이벤트 파라미터 객체를 정화한다.
 * - URL 키(page_location 등)는 쿼리 PII 제거 + redact
 * - 그 외 문자열(search_term 등)은 이메일/전화 redact
 * - 중첩 객체/배열은 재귀
 */
export function scrubPii<T>(params: T): T {
  if (params == null) return params;
  if (typeof params === 'string') return redactString(params) as unknown as T;
  if (Array.isArray(params)) return params.map((x) => scrubPii(x)) as unknown as T;
  if (typeof params === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = URL_KEYS.has(k) ? scrubUrl(v) : redactString(v);
      else if (v && typeof v === 'object') out[k] = scrubPii(v);
      else out[k] = v;
    }
    return out as T;
  }
  return params;
}
