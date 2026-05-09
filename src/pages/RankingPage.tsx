import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { venues } from '@/data/venues';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { MidContentHook, MidContentQuiz, ReadFinishCount, ReadCompletionReward, ReadingMilestone } from '@/components/engagement/ReadingEngagement';
import { createClient } from '@/lib/supabase';

/* ── 카테고리 ── */
const categories = [
  { key: 'all', label: '전체', emoji: '🔥' },
  { key: 'club', label: '클럽', emoji: '🎵' },
  { key: 'night', label: '나이트', emoji: '🌙' },
  { key: 'lounge', label: '라운지', emoji: '🍸' },
  { key: 'room', label: '룸', emoji: '🚪' },
  { key: 'yojeong', label: '요정', emoji: '🏮' },
  { key: 'hoppa', label: '호빠', emoji: '🥂' },
];
const voteCats = categories.filter(c => c.key !== 'all');

const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const catEmoji: Record<string, string> = { club: '🎵', night: '🌙', lounge: '🍸', room: '🚪', yojeong: '🏮', hoppa: '🥂' };
const catColors: Record<string, string> = { club: '#7c3aed', night: '#ec4899', lounge: '#06b6d4', room: '#f59e0b', yojeong: '#ef4444', hoppa: '#f472b6' };

const regionFilters = [
  { key: 'all', label: '전체' },
  { key: '강남', label: '강남' }, { key: '압구정', label: '압구정' },
  { key: '홍대', label: '홍대' }, { key: '이태원', label: '이태원' },
  { key: '부산', label: '부산' }, { key: '대구', label: '대구' },
  { key: '광주', label: '광주' }, { key: '대전', label: '대전' },
  { key: '수원', label: '수원' }, { key: '일산', label: '일산' },
  { key: '인천', label: '인천' }, { key: '성남', label: '성남' },
  { key: '울산', label: '울산' },
];

function getCategoryHref(category: string, slug: string, region: string) {
  const map: Record<string, string> = {
    club: `/clubs/${region}/${slug}`, night: `/nights/${slug}`, lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`, yojeong: `/yojeong/${region}/${slug}`, hoppa: `/hoppa/${slug}`,
  };
  return map[category] || `/${category}/${slug}`;
}

// 점수·등락 표시는 정확한 1차 데이터가 확보되기 전까지 사용하지 않습니다.
// 정렬은 결정적 우선순위(프리미엄 → 카테고리 → slug)로만 수행합니다.
function getOrderKey(v: { isPremium?: boolean; category: string; slug: string }, period: string): number {
  // 결정적이고 시기 기반으로 회전: 날짜+슬러그+기간 해시. 가짜 점수 노출 X.
  const periodSeed = period === 'daily' ? new Date().getDate() : period === 'weekly' ? Math.floor(new Date().getDate() / 7) : new Date().getMonth();
  const slugHash = v.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const premiumBoost = v.isPremium ? 100000 : 0;
  return premiumBoost + ((slugHash + periodSeed * 31) % 10000);
}

/* ═══ 시즌 투표 시스템 ═══ */
function getCurrentSeason(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getSeasonLabel(): string {
  const now = new Date();
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
}

function getDaysLeft(): number {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return last.getDate() - now.getDate();
}

interface VoteItem {
  id: string;
  nickname: string;
  category: string;
  venue_name: string;
  reason: string;
  created_at: string;
  isSeed?: boolean;
}

// 시드 가짜 투표 제거 — 회원 실투표만 표시 (DB가 비면 빈 상태 노출)

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  return `${Math.floor(hrs / 24)}일 전`;
}

/* ── 투표 섹션 ── */
function VoteSection() {
  const [user, setUser] = useState<any>(null);
  const [votes, setVotes] = useState<VoteItem[]>([]);
  const [voteCat, setVoteCat] = useState('night');
  const [venueName, setVenueName] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [myVotes, setMyVotes] = useState<Record<string, boolean>>({});
  const [voteFilter, setVoteFilter] = useState('all');

  const season = getCurrentSeason();
  const seasonLabel = getSeasonLabel();
  const daysLeft = getDaysLeft();

  // 로그인 확인 + 이번 달 투표 내역 로드
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        // 이번 달 투표한 카테고리 확인
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        supabase
          .from('venue_votes')
          .select('category')
          .eq('user_id', session.user.id)
          .gte('created_at', monthStart)
          .then(({ data }) => {
            if (data) {
              const voted: Record<string, boolean> = {};
              data.forEach(d => { voted[d.category] = true; });
              setMyVotes(voted);
            }
          });
      }
    });
  }, []);

  // DB에서 투표 로드
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    supabase
      .from('venue_votes')
      .select('id, nickname, category, venue_name, reason, created_at')
      .gte('created_at', monthStart)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const real: VoteItem[] = data.map(d => ({ ...d, isSeed: false }));
          real.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setVotes(real.slice(0, 40));
        }
      }, () => {});
  }, []);

  const remainingVotes = useMemo(() => {
    return voteCats.filter(c => !myVotes[c.key]).length;
  }, [myVotes]);

  const handleSubmit = async () => {
    if (!user) { setError('회원만 투표할 수 있습니다. 로그인 후 투표해주세요!'); return; }
    if (myVotes[voteCat]) { setError(`이번 달 ${catLabel[voteCat]} 투표는 이미 했어요. 다른 업종에 투표해보세요!`); return; }
    if (!venueName.trim()) { setError('가게 이름을 입력해주세요'); return; }
    if (!reason.trim() || reason.trim().length < 5) { setError('추천 이유를 5자 이상 적어주세요'); return; }

    setSubmitting(true);
    setError('');

    const nickname = user.user_metadata?.nickname || user.email?.split('@')[0] || '회원';
    const newVote: VoteItem = {
      id: 'local-' + Date.now(),
      nickname,
      category: voteCat,
      venue_name: venueName.trim(),
      reason: reason.trim(),
      created_at: new Date().toISOString(),
      isSeed: false,
    };

    const supabase = createClient();
    if (supabase) {
      const { data } = await supabase.from('venue_votes').insert({
        user_id: user.id,
        nickname,
        category: voteCat,
        venue_name: newVote.venue_name,
        reason: newVote.reason,
      }).select('id').single();
      if (data) newVote.id = data.id;
    }

    setMyVotes(prev => ({ ...prev, [voteCat]: true }));
    setVotes(prev => [newVote, ...prev].slice(0, 40));
    setVenueName('');
    setReason('');
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  // 카테고리별 TOP 3
  const categoryRankings = useMemo(() => {
    const result: Record<string, { name: string; count: number }[]> = {};
    voteCats.forEach(c => {
      const counts: Record<string, number> = {};
      votes.filter(v => v.category === c.key).forEach(v => {
        counts[v.venue_name] = (counts[v.venue_name] || 0) + 1;
      });
      result[c.key] = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    });
    return result;
  }, [votes]);

  const filteredVotes = useMemo(() => {
    if (voteFilter === 'all') return votes;
    return votes.filter(v => v.category === voteFilter);
  }, [votes, voteFilter]);

  const totalVoters = useMemo(() => {
    const nicks = new Set(votes.map(v => v.nickname));
    return nicks.size;
  }, [votes]);

  return (
    <div className="mt-10 space-y-8">
      {/* 시즌 헤더 */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A0118 0%, #1a0a2e 50%, #0f0720 100%)' }}>
        <div className="px-5 py-6 text-center">
          <p className="text-xs font-bold mb-1" style={{ color: '#F59E0B' }}>SEASON</p>
          <h2 className="text-xl font-black mb-1" style={{ color: '#FFFFFF' }}>{seasonLabel} 투표</h2>
          <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {totalVoters}명 참여 · 마감까지 {daysLeft}일
          </p>

          {/* 카테고리별 1위 */}
          <div className="grid grid-cols-3 gap-2">
            {voteCats.map(c => {
              const top = categoryRankings[c.key]?.[0];
              return (
                <div key={c.key} className="rounded-xl px-2 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-lg mb-0.5">{c.emoji}</p>
                  <p className="text-[10px] font-bold mb-1" style={{ color: catColors[c.key] }}>{c.label} 1위</p>
                  {top ? (
                    <>
                      <p className="text-xs font-bold truncate" style={{ color: '#FFFFFF' }}>{top.name}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{top.count}표</p>
                    </>
                  ) : (
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>투표 진행중</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 투표 폼 */}
      <div className="rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: '#8B5CF6' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🗳</span>
          <h2 className="text-base font-bold" style={{ color: '#111' }}>내 1위에 투표하기</h2>
        </div>
        <p className="text-xs mb-4" style={{ color: '#999' }}>
          {user
            ? `카테고리별 월 1표 · 이번 달 남은 투표: ${remainingVotes}개`
            : '회원만 투표 가능 · 카테고리별 월 1표 · 공정한 데이터를 위해'}
        </p>

        {!user ? (
          <div className="text-center py-6">
            <p className="text-5xl mb-3">🔒</p>
            <p className="text-sm font-bold mb-1" style={{ color: '#111' }}>회원만 투표할 수 있습니다</p>
            <p className="text-xs mb-4" style={{ color: '#999' }}>공정한 랭킹을 위해 1인 1계정, 카테고리별 월 1표</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition active:scale-[0.97]"
              style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}
            >
              로그인하고 투표하기
            </Link>
          </div>
        ) : remainingVotes === 0 ? (
          <div className="text-center py-6">
            <p className="text-5xl mb-3">🎉</p>
            <p className="text-sm font-bold mb-1" style={{ color: '#111' }}>이번 달 투표 완료!</p>
            <p className="text-xs" style={{ color: '#999' }}>6개 카테고리 전부 투표했어. 다음 달 1일에 다시 투표할 수 있어</p>
            <p className="text-xs font-bold mt-2" style={{ color: '#8B5CF6' }}>결과 발표: 매월 1일</p>
          </div>
        ) : (
          <>
            {/* 업종 선택 */}
            <div className="mb-3">
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#555' }}>업종 선택</label>
              <div className="flex flex-wrap gap-1.5">
                {voteCats.map(c => {
                  const voted = myVotes[c.key];
                  return (
                    <button
                      key={c.key}
                      onClick={() => !voted && setVoteCat(c.key)}
                      disabled={voted}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        voted ? 'opacity-40 line-through' :
                        voteCat === c.key ? 'text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      style={voteCat === c.key && !voted ? { backgroundColor: catColors[c.key], minHeight: 32 } : { color: voted ? '#BBB' : '#555', minHeight: 32 }}
                    >
                      {c.emoji} {c.label} {voted && '✓'}
                    </button>
                  );
                })}
              </div>
              {myVotes[voteCat] && (
                <p className="text-xs mt-1" style={{ color: '#EF4444' }}>이 업종은 이번 달 이미 투표했어요. 다른 업종을 선택하세요</p>
              )}
            </div>

            {/* 가게 이름 */}
            <div className="mb-3">
              <label className="block text-xs font-bold mb-1" style={{ color: '#555' }}>가게 이름</label>
              <input
                type="text"
                value={venueName}
                onChange={e => setVenueName(e.target.value)}
                placeholder="예: 강남클럽 레이스"
                maxLength={30}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#8B5CF6]"
                style={{ minHeight: 44, color: '#111' }}
              />
            </div>

            {/* 추천 이유 */}
            <div className="mb-4">
              <label className="block text-xs font-bold mb-1" style={{ color: '#555' }}>왜 여기가 1위야? (5자 이상)</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="직접 가본 경험, 분위기, 추천 이유를 적어줘"
                maxLength={200}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#8B5CF6] resize-none"
                style={{ color: '#111', lineHeight: '1.6' }}
              />
              <div className="text-right text-[10px] mt-0.5" style={{ color: '#999' }}>{reason.length}/200</div>
            </div>

            {error && <p className="text-xs mb-3" style={{ color: '#EF4444' }}>{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || myVotes[voteCat]}
              className="w-full rounded-xl py-3 text-sm font-bold text-white transition active:scale-[0.98]"
              style={{ backgroundColor: submitting || myVotes[voteCat] ? '#C4B5FD' : '#8B5CF6', minHeight: 48 }}
            >
              {submitting ? '투표 중...' : submitted ? '투표 완료!' : `${catLabel[voteCat]} 1위 투표하기`}
            </button>

            {submitted && (
              <p className="text-xs text-center mt-2 font-medium" style={{ color: '#8B5CF6' }}>
                투표 완료! 이번 달 {catLabel[voteCat]} 1위에 반영됐어
              </p>
            )}
          </>
        )}
      </div>

      {/* 투표 피드 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold" style={{ color: '#111' }}>{seasonLabel} 투표 현황</h2>
          <span className="text-xs" style={{ color: '#999' }}>{totalVoters}명 참여</span>
        </div>

        {/* 피드 필터 */}
        <div className="overflow-x-auto scrollbar-hide mb-3">
          <div className="flex gap-1.5">
            <button
              onClick={() => setVoteFilter('all')}
              className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${voteFilter === 'all' ? 'bg-[#111] text-white' : 'bg-gray-100 text-[#555]'}`}
              style={{ minHeight: 28 }}
            >전체</button>
            {voteCats.map(c => (
              <button
                key={c.key}
                onClick={() => setVoteFilter(c.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${voteFilter === c.key ? 'text-white' : 'bg-gray-100 text-[#555]'}`}
                style={voteFilter === c.key ? { backgroundColor: catColors[c.key], minHeight: 28 } : { minHeight: 28 }}
              >{c.emoji} {c.label}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredVotes.slice(0, 15).map(v => (
            <div key={v.id} className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold" style={{ color: '#111' }}>{v.nickname}</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: (catColors[v.category] || '#8B5CF6') + '15', color: catColors[v.category] || '#8B5CF6' }}>
                  {catEmoji[v.category]} {catLabel[v.category]}
                </span>
                <span className="ml-auto text-[10px]" style={{ color: '#BBB' }}>{timeAgo(v.created_at)}</span>
              </div>
              <p className="text-sm font-bold mb-0.5" style={{ color: '#111' }}>{v.venue_name}</p>
              <p className="text-xs" style={{ color: '#666', lineHeight: '1.5' }}>"{v.reason}"</p>
            </div>
          ))}
        </div>

        {filteredVotes.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm" style={{ color: '#999' }}>이 카테고리는 아직 투표가 없어요</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ 메인 ═══ */
export default function RankingPage() {
  useDocumentMeta('인기 랭킹 TOP 20 — 회원이 직접 투표한 카테고리별 1위', '회원 직접 투표 기반 카테고리·지역별 랭킹. 강남 홍대 이태원 일산 부산 클럽·나이트·룸·요정·라운지·호빠 1위 업소를 매월 1일 시즌 초기화로 확인.');
  const [category, setCategory] = useState('all');
  const [region, setRegion] = useState('all');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const containerRef = useRef<HTMLDivElement>(null);

  const ranked = useMemo(() => {
    let list = venues.filter((v) => v.status !== 'closed_or_unclear');
    if (category !== 'all') list = list.filter((v) => v.category === category);
    if (region !== 'all') list = list.filter((v) => v.regionKo.includes(region));
    return [...list].sort((a, b) => getOrderKey(b, period) - getOrderKey(a, period)).slice(0, 20);
  }, [category, region, period]);

  const periodLabel = period === 'daily' ? '오늘 기준' : period === 'weekly' ? '이번 주 기준' : '이번 달 기준';

  const scrollToVote = () => {
    document.getElementById('vote-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={containerRef}>
      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0118] via-[#1a0a2e] to-[#0f0720]">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, #F59E0B 0%, transparent 50%)' }} />
        <div className="relative mx-auto max-w-4xl px-4 py-14 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-6 border border-white/10">
            <PageLiveCounter pageName="랭킹 보는 중" baseCount={63} className="text-white/80 [&_strong]:text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            🏆 인기 랭킹 <span style={{ color: '#F59E0B' }}>TOP 20</span>
          </h1>
          <p className="text-base mb-6" style={{ lineHeight: '1.7', color: 'rgba(255,255,255,0.6)' }}>
            전국 클럽·나이트·라운지·룸·요정·호빠<br />
            지금 사람들이 가장 많이 보는 곳
          </p>

          <button
            onClick={scrollToVote}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 transition active:scale-[0.97]"
            style={{ background: 'linear-gradient(to right, rgba(245,158,11,0.2), rgba(249,115,22,0.2))', border: '1px solid rgba(245,158,11,0.2)', cursor: 'pointer' }}
          >
            <span className="text-sm">🗳</span>
            <span className="text-sm font-medium" style={{ color: '#FCD34D' }}>너의 1위는? 카테고리별 월 1표 투표하기</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* 카테고리/지역/기간 필터 */}
        <div className="overflow-x-auto scrollbar-hide mb-3">
          <div className="flex gap-2">
            {categories.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                  category === c.key ? 'bg-[#8B5CF6] text-white shadow-md' : 'bg-gray-100 text-[#555] hover:bg-gray-200'
                }`} style={{ minHeight: 40 }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide mb-4">
          <div className="flex gap-1.5">
            {regionFilters.map(r => (
              <button key={r.key} onClick={() => setRegion(r.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                  region === r.key ? 'bg-[#111] text-white' : 'bg-white text-[#555] border border-gray-200 hover:border-gray-400'
                }`} style={{ minHeight: 32 }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2.5 text-sm font-medium transition-all ${
                  period === p ? 'bg-[#8B5CF6] text-white' : 'bg-white text-[#555] hover:bg-gray-50'
                }`} style={{ minHeight: 40 }}>
                {p === 'daily' ? '일간' : p === 'weekly' ? '주간' : '월간'}
              </button>
            ))}
          </div>
          <span className="text-xs font-medium" style={{ color: '#8B5CF6' }}>{periodLabel}</span>
        </div>

        <MidContentHook seed="ranking-mid" variant={0} />

        {/* 순위 리스트 — 점수·등락 표시는 정확한 1차 데이터 확보 전까지 비노출 */}
        <div className="space-y-2">
          {ranked.map((v, i) => {
            const cc = catColors[v.category] || '#8B5CF6';
            return (
              <Link target="_blank" rel="noopener noreferrer" key={v.id} to={getCategoryHref(v.category, v.slug, v.region)}
                className="flex items-center gap-3 sm:gap-4 rounded-xl border bg-white px-4 py-3 transition hover:shadow-md hover:border-[#8B5CF6]/30"
                style={{ borderColor: '#E5E7EB', minHeight: 64 }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black" style={
                  i === 0 ? { backgroundColor: '#FEF9C3', color: '#CA8A04' } : i === 1 ? { backgroundColor: '#F3F4F6', color: '#6B7280' } : i === 2 ? { backgroundColor: '#FFFBEB', color: '#F59E0B' } : { backgroundColor: '#F9FAFB', color: '#9CA3AF' }
                }>{i + 1}</span>
                <span className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: cc + '15' }}>
                  {categories.find(c => c.key === v.category)?.emoji || '🎵'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold" style={{ color: '#111' }}>{v.nameKo}</h3>
                    {v.isPremium && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: '#8B5CF6', backgroundColor: '#F3F0FF' }}>AD</span>}
                  </div>
                  <p className="text-xs" style={{ color: '#999' }}>{v.regionKo} · {catLabel[v.category] || v.category}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {ranked.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-base font-bold mb-2" style={{ color: '#111' }}>해당 조건의 결과가 없습니다</p>
            <p className="text-sm" style={{ color: '#555' }}>다른 카테고리나 지역을 선택해보세요</p>
          </div>
        )}

        <MidContentQuiz
          question="이번 주 1위는 어디일까?"
          options={['강남 클럽이 당연 1위', '나이트가 의외로 강하다', '요즘 라운지가 대세', '지방 업소가 역전 중']}
          seed="ranking-quiz"
        />

        {/* 투표 섹션 */}
        <div id="vote-section">
          <VoteSection />
        </div>

        {/* 안내 */}
        <div className="mt-8 rounded-xl bg-gray-50 p-4">
          <p className="text-xs font-bold mb-1" style={{ color: '#8B5CF6' }}>랭킹·투표 기준 안내</p>
          <ul className="text-xs space-y-1" style={{ color: '#555' }}>
            <li><strong>리스트 정렬:</strong> 프리미엄·카테고리 기반 결정적 순서. 정확한 점수 데이터 확보 전까지 점수·등락은 비표시.</li>
            <li><strong>투표 랭킹:</strong> 회원 직접 투표. 카테고리별 월 1표. 매월 1일 시즌 초기화.</li>
            <li><strong>공정성:</strong> 1인 1계정, 카테고리당 월 1회. 변경·취소 불가.</li>
          </ul>
        </div>

        <ReadCompletionReward teaser="랭킹에서 볼 수 없는 숨은 인기 업소">
          <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>
            랭킹에 아직 안 올라왔지만 단골들 사이에서 입소문 타는 곳들이 있다.
            숨은 명소 페이지에서 확인해봐.
          </p>
          <Link to="/hidden" className="inline-flex items-center gap-1 text-sm font-bold text-[#8B5CF6] hover:text-[#7C3AED] mt-2">
            숨은 명소 보기 →
          </Link>
        </ReadCompletionReward>

        <div className="text-center mt-6">
          <ReadFinishCount pageName="인기 랭킹" baseCount={250} />
        </div>
      </div>

      <ReadingMilestone containerRef={containerRef} />
    </div>
  );
}
