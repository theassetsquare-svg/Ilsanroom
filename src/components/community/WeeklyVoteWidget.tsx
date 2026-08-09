import { useEffect, useState } from 'react';
import { Link } from '@/components/ui/SafeLink';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';
import { venues } from '@/data/venues';
import { popularity, isRanked, popScore, hasPopularityData, POPULARITY_UPDATED_AT } from '@/lib/popularity';

/**
 * 주간 원터치 투표 (파트4 S2c) — 주제는 실측 인기 데이터(28일 점수 상위 2곳)로 자동 생성, 창작 0.
 * 회원 1인 1표(weekly_poll_votes UNIQUE), 집계는 get_poll_counts RPC(실제 표 수만).
 * 실측 데이터가 없으면 위젯 자체를 렌더하지 않는다 (가짜 주제 0).
 */
export default function WeeklyVoteWidget() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myChoice, setMyChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 실측 상위 2곳 — popularity JSON은 주 1회 갱신되므로 poll_key가 자동으로 주간 회전
  const top2 = hasPopularityData()
    ? venues
        .filter(v => v.status !== 'closed_or_unclear' && isRanked(v.slug))
        .sort((a, b) => popScore(b.slug) - popScore(a.slug))
        .slice(0, 2)
    : [];
  const pollKey = `weekly-top2-${POPULARITY_UPDATED_AT}`;

  useEffect(() => {
    if (top2.length < 2) return;
    const supabase = createClient();
    if (!supabase) return;
    (supabase.rpc('get_poll_counts', { p_poll_key: pollKey }) as any).then(({ data }: { data: { choice: string; votes: number }[] | null }) => {
      if (data) {
        const c: Record<string, number> = {};
        data.forEach(r => { c[r.choice] = Number(r.votes); });
        setCounts(c);
      }
    }, () => {});
    if (user) {
      (supabase.from('weekly_poll_votes') as any)
        .select('choice').eq('poll_key', pollKey).eq('user_id', user.id).maybeSingle()
        .then(({ data }: { data: { choice: string } | null }) => { if (data) setMyChoice(data.choice); }, () => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pollKey, top2.length]);

  if (top2.length < 2) return null;

  const vote = async (slug: string) => {
    if (!user || myChoice || busy) return;
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await (supabase.from('weekly_poll_votes') as any).insert({ poll_key: pollKey, choice: slug, user_id: user.id });
    if (!error) {
      setMyChoice(slug);
      setCounts(prev => ({ ...prev, [slug]: (prev[slug] || 0) + 1 }));
    }
    setBusy(false);
  };

  const total = top2.reduce((s, v) => s + (counts[v.slug] || 0), 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-xs font-bold" style={{ color: '#8B5CF6' }}>🗳 이번 주 원터치 투표</p>
      <p className="mt-1 text-sm font-bold" style={{ color: '#111', lineHeight: '1.5' }}>
        이번 주 실제 조회 1·2위, 먼저 가보고 싶은 곳은?
      </p>
      <p className="mt-0.5 text-[10px]" style={{ color: '#AAA' }}>후보 = 최근 28일 실측 조회 상위 2곳 ({POPULARITY_UPDATED_AT} 기준) · 표는 회원 실투표만</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {top2.map(v => {
          const n = counts[v.slug] || 0;
          const picked = myChoice === v.slug;
          return (
            <button
              key={v.slug}
              onClick={() => vote(v.slug)}
              disabled={!!myChoice || busy || !user}
              className={`rounded-xl border-2 px-3 py-3 text-left transition active:scale-[0.98] ${picked ? 'border-[#8B5CF6] bg-[#F6F4FF]' : 'border-gray-200 bg-white'}`}
              style={{ minHeight: 64 }}
            >
              <p className="truncate text-sm font-bold" style={{ color: '#111' }}>{v.nameKo}</p>
              <p className="text-xs" style={{ color: '#999' }}>{v.regionKo}</p>
              {(myChoice || total > 0) && (
                <p className="mt-1 text-xs font-bold" style={{ color: '#8B5CF6' }}>{n}표{total > 0 ? ` · ${Math.round((n / total) * 100)}%` : ''}</p>
              )}
            </button>
          );
        })}
      </div>
      {!user && (
        <p className="mt-2 text-[11px]" style={{ color: '#999' }}>
          투표는 회원만 (1인 1표) — <Link to="/login" className="font-bold" style={{ color: '#8B5CF6' }}>3초 로그인 →</Link>
        </p>
      )}
      {total > 0 && <p className="mt-2 text-[11px] font-medium" style={{ color: '#8B5CF6' }}>지금까지 {total}명 참여</p>}
      {myChoice && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] font-medium" style={{ color: '#8B5CF6' }}>투표 완료! 결과는 실제 표 수 그대로예요.</p>
          <Link to="/community/reviews" className="text-[11px] font-bold" style={{ color: '#8B5CF6' }}>✍️ 한 줄 보태기 →</Link>
        </div>
      )}
      {!myChoice && user && total === 0 && <p className="mt-2 text-[11px]" style={{ color: '#BBB' }}>아직 첫 표를 기다리는 중 — 첫 표의 주인공이 되어보세요.</p>}
    </div>
  );
}
