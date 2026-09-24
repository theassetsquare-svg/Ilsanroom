import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { trackEvent } from '@/lib/visitor-tracker';
import { normalizePrefs, unsubscribeAll, MAX_WEEKLY, NIGHT_START, NIGHT_END, footerText, type NotifyPrefs } from '@/lib/notify-policy';
import type { User } from '@supabase/supabase-js';

/**
 * [놀쿨11-5] 알림 설정 — 회원만 · 새 주소 0(저장 목록 쪽 /my/favorites 안에 둔다).
 *  저장 자리: 사용자 메타데이터 notify(새 표 0). 규칙은 notify-policy.ts 한 곳.
 *  - 서비스 알림·광고성 정보는 각각 따로 켠다(기본 꺼짐) · 밤 9시~아침 8시엔 보내지 않는다 · 주 최대 3번.
 *  - 「모든 알림 끄기」 한 번 · 알림 속 수신거부 주소 /my/favorites?notify=off 로 와도 한 번에 꺼진다.
 */
const CATS: [string, string][] = [['club', '클럽'], ['night', '나이트'], ['lounge', '라운지'], ['room', '룸'], ['yojeong', '요정'], ['hoppa', '호빠']];

export default function NotifySettings({ user, regions }: { user: User; regions: string[] }) {
  const [prefs, setPrefs] = useState<NotifyPrefs>(() => normalizePrefs((user.user_metadata as any)?.notify));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const regionChoices = useMemo(() => regions.slice(0, 16), [regions]);

  const save = async (next: NotifyPrefs, note: string) => {
    const supabase = createClient();
    if (!supabase) { setMsg('저장하지 못했습니다(연결 없음)'); return; }
    const wasOn = prefs.service || prefs.ad;
    const nowOn = next.service || next.ad;
    const stamped = { ...next, optinAt: !wasOn && nowOn ? new Date().toISOString() : next.optinAt };
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { notify: stamped } });
    setSaving(false);
    if (error) { setMsg('저장하지 못했습니다 — 잠시 뒤 다시 눌러 주세요'); return; }
    setPrefs(stamped);
    setMsg(note);
    if (!wasOn && nowOn) trackEvent('notify_optin', { service: stamped.service ? 1 : 0, ad: stamped.ad ? 1 : 0 });
  };

  // 알림 속 수신거부 주소로 들어오면 한 번에 끈다
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('notify') === 'off' && (prefs.service || prefs.ad)) {
      save(unsubscribeAll(prefs), '모든 알림을 껐습니다. 다시 받으려면 아래에서 켜 주세요.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (k: 'service' | 'ad') => save({ ...prefs, [k]: !prefs[k] }, !prefs[k] ? '켰습니다' : '껐습니다');
  const toggleIn = (k: 'regions' | 'cats', v: string) => { const set = new Set(prefs[k]); set.has(v) ? set.delete(v) : set.add(v); save({ ...prefs, [k]: [...set] }, '관심 항목을 바꿨습니다'); };

  return (
    <section id="notify" className="mb-6 rounded-2xl border border-gray-200 bg-white p-4" aria-label="알림 설정" data-nc-notify>
      <p className="text-sm font-bold" style={{ color: '#111' }}>🔔 알림 설정</p>
      <p className="mt-0.5 text-xs" style={{ color: '#888', lineHeight: '1.6' }}>
        새 가게·새 글·주간 투표 결과가 실제로 생겼을 때만 보냅니다. 주 최대 {MAX_WEEKLY}번 · 밤 {NIGHT_START}시~아침 {NIGHT_END}시엔 보내지 않습니다.
      </p>
      <div className="mt-3 space-y-2">
        {([['service', '서비스 알림', '내 지역·관심 업종 새 가게·새 글·주간 투표 결과'], ['ad', '광고성 정보', '이벤트·광고주 소식 · 제목에 (광고) 표시']] as const).map(([k, label, note]) => (
          <label key={k} className="flex items-start justify-between gap-3">
            <span className="min-w-0 text-[13px]" style={{ color: '#111' }}>{label}<span className="block text-[11px]" style={{ color: '#888' }}>{note}</span></span>
            <button type="button" role="switch" aria-checked={prefs[k]} disabled={saving} onClick={() => toggle(k)} data-nc-notify-toggle={k}
              className="shrink-0 rounded-full px-4 py-2 text-xs font-bold" style={prefs[k] ? { background: '#7C3AED', color: '#fff', minHeight: 40 } : { background: '#F3F4F6', color: '#374151', minHeight: 40 }}>
              {prefs[k] ? '켜짐' : '꺼짐'}
            </button>
          </label>
        ))}
        <label className="flex items-center justify-between gap-3 text-[13px]" style={{ color: '#111' }}>
          한 주에 최대
          <select value={prefs.weeklyCap} disabled={saving} onChange={(e) => save({ ...prefs, weeklyCap: Number(e.target.value) }, '횟수를 바꿨습니다')} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" data-nc-notify-cap>
            {Array.from({ length: MAX_WEEKLY }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}번</option>)}
          </select>
        </label>
      </div>
      {(prefs.service || prefs.ad) && (
        <div className="mt-3">
          <p className="text-[12px] font-bold" style={{ color: '#555' }}>관심 지역(안 고르면 전체)</p>
          <div className="mt-1 flex flex-wrap gap-1.5">{regionChoices.map((r) => <button key={r} type="button" onClick={() => toggleIn('regions', r)} aria-pressed={prefs.regions.includes(r)} className="rounded-full border px-2.5 py-1 text-[11px]" style={prefs.regions.includes(r) ? { background: '#EDE9FE', borderColor: '#7C3AED', color: '#5B21B6' } : { borderColor: '#E5E7EB', color: '#374151' }}>{r}</button>)}</div>
          <p className="mt-2 text-[12px] font-bold" style={{ color: '#555' }}>관심 업종(안 고르면 전체)</p>
          <div className="mt-1 flex flex-wrap gap-1.5">{CATS.map(([k, l]) => <button key={k} type="button" onClick={() => toggleIn('cats', k)} aria-pressed={prefs.cats.includes(k)} className="rounded-full border px-2.5 py-1 text-[11px]" style={prefs.cats.includes(k) ? { background: '#EDE9FE', borderColor: '#7C3AED', color: '#5B21B6' } : { borderColor: '#E5E7EB', color: '#374151' }}>{l}</button>)}</div>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" disabled={saving || (!prefs.service && !prefs.ad)} onClick={() => save(unsubscribeAll(prefs), '모든 알림을 껐습니다')} className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold" style={{ color: '#374151', minHeight: 40 }} data-nc-notify-off>
          모든 알림 끄기
        </button>
        {msg && <span className="text-[11px]" style={{ color: '#7C3AED' }} role="status">{msg}</span>}
      </div>
      <p className="mt-2 text-[10px]" style={{ color: '#9CA3AF' }}>{footerText()}</p>
    </section>
  );
}
