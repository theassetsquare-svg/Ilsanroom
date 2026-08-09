import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

/**
 * "도움 됐나요 👍/👎" (파트4.5) — 매거진·가이드 하단. 로그인 없이 익명 탭 가능.
 * 실집계만 노출(0이면 0으로 정직 표기). content_helpful 에 실제 탭만 적재.
 * 브라우저 토큰 + localStorage 로 1회만(가짜 카운터·난수 0).
 */
function voterToken(): string {
  try {
    let t = localStorage.getItem('nolcool_voter');
    if (!t) {
      t = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `v${Date.now()}${Math.floor(Math.random() * 1e6)}`;
      localStorage.setItem('nolcool_voter', t);
    }
    return t;
  } catch {
    return `v${Date.now()}`;
  }
}

export default function HelpfulVote({ contentKey }: { contentKey: string }) {
  const [counts, setCounts] = useState<{ up: number; down: number } | null>(null);
  const [voted, setVoted] = useState<null | 'up' | 'down'>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (supabase) {
      (supabase.rpc('get_helpful_counts', { p_content_key: contentKey }) as any).then(
        ({ data }: { data: { up: number; down: number }[] | { up: number; down: number } | null }) => {
          const r = Array.isArray(data) ? data[0] : data;
          if (r) setCounts({ up: Number(r.up) || 0, down: Number(r.down) || 0 });
          else setCounts({ up: 0, down: 0 });
        },
        () => setCounts({ up: 0, down: 0 }),
      );
    }
    try {
      const v = localStorage.getItem('nolcool_helpful_' + contentKey);
      if (v === 'up' || v === 'down') setVoted(v);
    } catch { /* ignore */ }
  }, [contentKey]);

  const vote = async (up: boolean) => {
    if (voted || busy) return;
    setBusy(true);
    const supabase = createClient();
    if (supabase) {
      await (supabase.from('content_helpful') as any)
        .insert({ content_key: contentKey, is_up: up, voter_token: voterToken() })
        .then(() => {}, () => {});
    }
    const dir = up ? 'up' : 'down';
    setVoted(dir);
    try { localStorage.setItem('nolcool_helpful_' + contentKey, dir); } catch { /* ignore */ }
    setCounts(c => ({ up: (c?.up || 0) + (up ? 1 : 0), down: (c?.down || 0) + (up ? 0 : 1) }));
    setBusy(false);
  };

  const up = counts?.up ?? 0;
  const down = counts?.down ?? 0;

  return (
    <div className="my-6 rounded-2xl border border-gray-200 bg-white p-4 text-center">
      <p className="text-sm font-bold" style={{ color: '#111' }}>이 글, 도움 됐나요?</p>
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          onClick={() => vote(true)}
          disabled={!!voted || busy}
          className={`flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold transition active:scale-[0.97] ${voted === 'up' ? 'border-[#8B5CF6] bg-[#F6F4FF] text-[#6D28D9]' : 'border-gray-200 bg-white text-[#555]'}`}
          style={{ minHeight: 44 }}
        >
          👍 도움됐어요 <span style={{ color: '#8B5CF6' }}>{up}</span>
        </button>
        <button
          onClick={() => vote(false)}
          disabled={!!voted || busy}
          className={`flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold transition active:scale-[0.97] ${voted === 'down' ? 'border-gray-400 bg-gray-100 text-[#555]' : 'border-gray-200 bg-white text-[#555]'}`}
          style={{ minHeight: 44 }}
        >
          👎 아쉬워요 <span style={{ color: '#999' }}>{down}</span>
        </button>
      </div>
      {voted && <p className="mt-2 text-[11px]" style={{ color: '#999' }}>참여 감사합니다 — 결과는 실제 탭 수 그대로예요.</p>}
    </div>
  );
}
