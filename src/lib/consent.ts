/**
 * [놀쿨11-5] 가입 동의 — 필수(만 19세 이상 · 이용약관 · 개인정보 수집·이용)와 선택(서비스 알림 · 광고성 정보)을 나눈다.
 *  - 개인정보보호법 제16조: 필요 최소 정보 · 선택에 동의하지 않았다고 가입을 막지 않는다.
 *  - 정보통신망법 제50조: 광고성 정보는 명시적 사전 동의(기본값 꺼짐) · 야간 전송은 하지 않는다(별도 동의 칸 없음).
 *  - 청소년보호법: 만 19세 이상만 — 자기 확인(본인인증 아님) 칸.
 *  저장 자리: Supabase 인증 사용자 메타데이터(user_metadata.consent · user_metadata.notify) — 새 표·새 백엔드 0.
 *  OAuth 는 다른 사이트를 거쳐 오므로 누르기 직전에 localStorage 에 잠깐 두었다가 콜백에서 옮긴다.
 */
import { normalizePrefs, type NotifyPrefs } from './notify-policy';

export const CONSENT_VERSION = '2026-09-24';
export type Consent = { age19: boolean; terms: boolean; privacy: boolean; service: boolean; ad: boolean; night: false; at: string; version: string; via: string };
export const REQUIRED_KEYS = ['age19', 'terms', 'privacy'] as const;
export const OPTIONAL_KEYS = ['service', 'ad'] as const;

const PENDING = 'nc_pending_consent';
const GIVEN = 'nc_consent_given';

export function requiredOk(c: Partial<Consent>): boolean {
  return REQUIRED_KEYS.every((k) => c[k] === true);
}

export function makeConsent(c: { age19: boolean; terms: boolean; privacy: boolean; service: boolean; ad: boolean }, via: string): Consent {
  return { age19: !!c.age19, terms: !!c.terms, privacy: !!c.privacy, service: !!c.service, ad: !!c.ad, night: false, at: new Date().toISOString(), version: CONSENT_VERSION, via };
}

export function savePending(c: Consent): void {
  try { localStorage.setItem(PENDING, JSON.stringify(c)); localStorage.setItem(GIVEN, CONSENT_VERSION); } catch { /* 저장 불가 */ }
}
export function takePending(): Consent | null {
  try {
    const raw = localStorage.getItem(PENDING);
    localStorage.removeItem(PENDING);
    if (!raw) return null;
    const c = JSON.parse(raw) as Consent;
    return requiredOk(c) ? c : null;
  } catch {
    return null;
  }
}
/** 이 브라우저에서 이번 판 필수 동의를 이미 한 적이 있나(재로그인 때 칸을 미리 채워 두는 용도) */
export function givenBefore(): boolean {
  try { return localStorage.getItem(GIVEN) === CONSENT_VERSION; } catch { return false; }
}

/** 콜백에서 — 대기 중인 동의를 사용자 메타데이터로 옮긴다. 알림 설정은 켜는 쪽만 합친다(있던 설정을 끄지 않는다). */
export function mergeForUser(pending: Consent, existingNotify: Partial<NotifyPrefs> | null | undefined): { consent: Consent; notify: NotifyPrefs } {
  const base = normalizePrefs(existingNotify);
  const turnedOn = (pending.service && !base.service) || (pending.ad && !base.ad);
  const notify = normalizePrefs({ ...base, service: base.service || pending.service, ad: base.ad || pending.ad, night: false, optinAt: turnedOn ? pending.at : base.optinAt });
  return { consent: pending, notify };
}
