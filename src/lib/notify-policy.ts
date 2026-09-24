/**
 * [놀쿨11-5] 돌아오게 하는 알림 — 보내도 되는지 판정하는 규칙 한 곳(순수 함수 · 발송 코드 0).
 *
 *  법(11-1 연구 3):
 *   - 정보통신망법 제50조: 광고성 정보는 수신자의 명시적 사전 동의 · 오후 9시~오전 8시는 별도 동의 ·
 *     전송자 명칭·연락처·수신거부 방법 표기 · 광고성 제목 앞 「(광고)」.
 *   - 개인정보보호법 제16조: 필요한 최소 정보만 · 선택 항목에 동의하지 않았다고 서비스를 거부하지 않는다.
 *  우리 규칙(지시서 11-5 2-3 — 법보다 엄격):
 *   - 동의 없으면 0건 · 야간(21~08시 KST) 전송 0건(별도 동의가 있어도 보내지 않는다) · 주 상한 · 한 번에 해지.
 *   - 내용은 진짜 사건만(내 지역·내 관심 업종 새 가게/새 글 · 주간 투표 결과) · 사건이 없으면 보내지 않는다(빈 알림 0).
 */
export type NotifyKind = 'service' | 'ad';
export type NotifyPrefs = {
  service: boolean; // 서비스 알림(내 지역 새 가게·새 글·투표 결과)
  ad: boolean; // 광고성 정보(이벤트·광고주 소식)
  night: boolean; // 야간 광고성 수신 동의(기록만 · 우리는 야간에 보내지 않는다)
  weeklyCap: number; // 주 몇 번까지(1~3)
  regions: string[]; // 관심 지역(regionKo)
  cats: string[]; // 관심 업종(club·night·lounge·room·yojeong·hoppa)
  optinAt?: string; // 마지막 동의 시각(ISO)
  offAt?: string; // 마지막 해지 시각(ISO)
};
export type NotifyEvent = { type: 'new_venue' | 'new_post' | 'vote_result'; title: string; href: string; region?: string; cat?: string; at: string };

export const MAX_WEEKLY = 3;
export const NIGHT_START = 21; // 21시부터
export const NIGHT_END = 8; // 08시 전까지
export const SENDER = { name: '놀쿨(nolcool.com)', contact: 'nolcool.com/contact', unsubscribe: 'nolcool.com/my/favorites?notify=off' };
export const DEFAULT_PREFS: NotifyPrefs = { service: false, ad: false, night: false, weeklyCap: 2, regions: [], cats: [] };

/** KST 시(0~23) — 서버·브라우저 시간대와 무관 */
export function kstHour(d: Date): number {
  return (d.getUTCHours() + 9) % 24;
}
export function isNight(d: Date): boolean {
  const h = kstHour(d);
  return h >= NIGHT_START || h < NIGHT_END;
}

export function normalizePrefs(p: Partial<NotifyPrefs> | null | undefined): NotifyPrefs {
  const x = { ...DEFAULT_PREFS, ...(p || {}) };
  const cap = Math.max(1, Math.min(MAX_WEEKLY, Math.round(Number(x.weeklyCap) || DEFAULT_PREFS.weeklyCap)));
  return { ...x, service: x.service === true, ad: x.ad === true, night: x.night === true, weeklyCap: cap, regions: Array.isArray(x.regions) ? x.regions.slice(0, 10) : [], cats: Array.isArray(x.cats) ? x.cats.slice(0, 6) : [] };
}

/** 보내도 되나 — 이유를 같이 돌려준다(보고·검증용) */
export function canSend(opts: { prefs: Partial<NotifyPrefs> | null | undefined; kind: NotifyKind; now: Date; sentThisWeek: number }): { ok: boolean; reason: string } {
  const p = normalizePrefs(opts.prefs);
  if (opts.kind === 'service' && !p.service) return { ok: false, reason: 'no-consent-service' };
  if (opts.kind === 'ad' && !p.ad) return { ok: false, reason: 'no-consent-ad' };
  if (isNight(opts.now)) return { ok: false, reason: 'night' };
  if (opts.sentThisWeek >= p.weeklyCap) return { ok: false, reason: 'weekly-cap' };
  return { ok: true, reason: 'ok' };
}

/** 이번 알림에 실을 사건 — 관심 지역/업종에 맞는 진짜 사건만 · 투표 결과는 서비스 알림 동의자 모두 */
export function pickEvents(events: NotifyEvent[], prefs: Partial<NotifyPrefs> | null | undefined, max = 5): NotifyEvent[] {
  const p = normalizePrefs(prefs);
  const anyRegion = p.regions.length === 0, anyCat = p.cats.length === 0;
  return events
    .filter((e) => e && e.title && e.href && e.at)
    .filter((e) => e.type === 'vote_result' || ((anyRegion || (e.region && p.regions.includes(e.region))) && (anyCat || (e.cat && p.cats.includes(e.cat)))))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, max);
}

/** 한 사람에게 보낼 묶음 — 사건이 없으면 보내지 않는다 */
export function planDigest(opts: { events: NotifyEvent[]; prefs: Partial<NotifyPrefs> | null | undefined; now: Date; sentThisWeek: number; kind?: NotifyKind }): { send: boolean; reason: string; items: NotifyEvent[]; subject: string } {
  const kind = opts.kind || 'service';
  const gate = canSend({ prefs: opts.prefs, kind, now: opts.now, sentThisWeek: opts.sentThisWeek });
  if (!gate.ok) return { send: false, reason: gate.reason, items: [], subject: '' };
  const items = pickEvents(opts.events, opts.prefs);
  if (!items.length) return { send: false, reason: 'empty', items: [], subject: '' };
  return { send: true, reason: 'ok', items, subject: subjectFor(kind, `관심 지역 소식 ${items.length}건`) };
}

/** 광고성이면 제목 앞에 (광고) — 정보통신망법 제50조 제4항 */
export function subjectFor(kind: NotifyKind, s: string): string {
  return kind === 'ad' ? `(광고) ${s}` : s;
}
/** 모든 알림 끝에 붙는 전송자·수신거부 안내 */
export function footerText(): string {
  return `보낸 곳: ${SENDER.name} · 문의 ${SENDER.contact} · 수신거부: ${SENDER.unsubscribe} 에서 한 번에 끌 수 있습니다.`;
}
/** 한 번에 해지 */
export function unsubscribeAll(prefs: Partial<NotifyPrefs> | null | undefined, now: Date = new Date()): NotifyPrefs {
  return { ...normalizePrefs(prefs), service: false, ad: false, night: false, offAt: now.toISOString() };
}
