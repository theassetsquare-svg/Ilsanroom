import { useState, useEffect } from 'react';

/**
 * 시즌64 — venue 폐업/오정보 신고 모달 (anti-abuse 8중 방어와 정렬)
 *
 * 폼:
 *  - reason (closed/wrong_info/duplicate/scam/other)
 *  - evidenceUrl (URL 또는 사진 링크) 필수
 *  - memo (선택, 500자)
 *  - hp (honeypot, 화면에 안 보임)
 *  - fingerprint (자동 생성, localStorage 저장)
 *
 * 서버:
 *  POST /api/venue-report
 *  서버에서 rate limit / cooldown / threshold / shadowban 등 처리
 */

interface Props {
  venueSlug: string;
  venueName: string;
  onClose: () => void;
}

const REASONS: Array<{ value: string; label: string }> = [
  { value: 'closed', label: '폐업했어요' },
  { value: 'wrong_info', label: '정보가 잘못됐어요' },
  { value: 'duplicate', label: '같은 업소가 중복 등록' },
  { value: 'scam', label: '사기·바가지 의심' },
  { value: 'other', label: '기타' },
];

function getOrCreateFingerprint(): string {
  try {
    const KEY = 'nolcool_report_fp_v1';
    let fp = localStorage.getItem(KEY);
    if (fp && fp.length >= 12) return fp;
    const rand = crypto.getRandomValues(new Uint8Array(16));
    const ua = (navigator.userAgent || '').slice(0, 50);
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC').slice(0, 30);
    const seed = Array.from(rand).map(b => b.toString(16).padStart(2, '0')).join('') + '|' + ua.length + '|' + tz;
    fp = btoa(unescape(encodeURIComponent(seed))).slice(0, 40);
    localStorage.setItem(KEY, fp);
    return fp;
  } catch {
    return 'fp-' + Math.random().toString(36).slice(2);
  }
}

export default function VenueReportModal({ venueSlug, venueName, onClose }: Props) {
  const [reason, setReason] = useState<string>('closed');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [hp, setHp] = useState(''); // honeypot
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (evidenceUrl.trim().length < 10 || !/^https?:\/\//i.test(evidenceUrl.trim())) {
      setResult({ ok: false, msg: '증거 URL은 http/https로 시작하고 10자 이상 입력하세요.' });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const fingerprint = getOrCreateFingerprint();
      const res = await fetch('/api/venue-report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          venueSlug,
          reason,
          evidenceUrl: evidenceUrl.trim(),
          memo: memo.trim(),
          hp,
          fingerprint,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult({ ok: true, msg: j.message || '신고가 접수되었습니다. 검토 후 24~72h 내 처리됩니다.' });
      } else {
        setResult({ ok: false, msg: j.error || '신고 처리 실패. 잠시 후 다시 시도해 주세요.' });
      }
    } catch {
      setResult({ ok: false, msg: '네트워크 오류. 잠시 후 다시 시도해 주세요.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#111]">{venueName} 신고</h2>
          <button onClick={onClose} aria-label="닫기" className="text-[#555] hover:text-[#111]" style={{ minWidth: 44, minHeight: 44 }}>✕</button>
        </div>

        <p className="mb-3 text-xs text-[#666] leading-relaxed">
          허위 신고 방지를 위해 증거 URL이 필수입니다. 같은 업소는 7일 1회만 신고 가능합니다.
          반복 거짓 신고는 자동 차단됩니다.
        </p>

        {result && (
          <div className={`mb-3 rounded-lg p-3 text-xs ${result.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
            {result.msg}
          </div>
        )}

        {!result?.ok && (
          <form onSubmit={submit} className="space-y-3">
            {/* honeypot — 사용자에겐 안 보임. 봇만 채움 */}
            <input
              type="text"
              name="website"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
            />

            <div>
              <label className="block text-xs font-bold text-[#333] mb-1">신고 사유</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#8B5CF6]"
                style={{ minHeight: 44 }}
              >
                {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#333] mb-1">증거 URL <span className="text-rose-500">*</span></label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https:// 로 시작하는 사진/뉴스/SNS 링크"
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#8B5CF6]"
                style={{ minHeight: 44 }}
              />
              <p className="mt-1 text-[10px] text-[#999]">현장 사진(임고)·네이버 폐업 표시·뉴스 기사 URL 등</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#333] mb-1">상세 설명 (선택)</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="언제·어디서 확인했는지 등 (최대 500자)"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#8B5CF6]"
              />
              <p className="mt-0.5 text-[10px] text-[#999]">{memo.length} / 500</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-[#333] hover:bg-gray-50"
                style={{ minHeight: 44 }}
              >취소</button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-lg bg-[#8B5CF6] px-4 py-2 text-sm font-bold text-white hover:bg-[#7C3AED] disabled:opacity-50"
                style={{ minHeight: 44 }}
              >{busy ? '제출 중…' : '신고하기'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
