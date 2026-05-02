import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { venues } from '@/data/venues';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { MidContentHook, MidContentQuiz, ReadFinishCount, ReadCompletionReward, ReadingMilestone } from '@/components/engagement/ReadingEngagement';
import { createClient } from '@/lib/supabase';

/* ── 실제 6종 카테고리 ── */
const categories = [
  { key: 'all', label: '전체', emoji: '🔥' },
  { key: 'club', label: '클럽', emoji: '🎵' },
  { key: 'night', label: '나이트', emoji: '🌙' },
  { key: 'lounge', label: '라운지', emoji: '🍸' },
  { key: 'room', label: '룸', emoji: '🚪' },
  { key: 'yojeong', label: '요정', emoji: '🏮' },
  { key: 'hoppa', label: '호빠', emoji: '🥂' },
];

const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const catEmoji: Record<string, string> = { club: '🎵', night: '🌙', lounge: '🍸', room: '🚪', yojeong: '🏮', hoppa: '🥂' };
const catColors: Record<string, string> = { club: '#7c3aed', night: '#ec4899', lounge: '#06b6d4', room: '#f59e0b', yojeong: '#ef4444', hoppa: '#f472b6' };

const regionFilters = [
  { key: 'all', label: '전체' },
  { key: '강남', label: '강남' },
  { key: '압구정', label: '압구정' },
  { key: '홍대', label: '홍대' },
  { key: '이태원', label: '이태원' },
  { key: '부산', label: '부산' },
  { key: '대구', label: '대구' },
  { key: '광주', label: '광주' },
  { key: '대전', label: '대전' },
  { key: '수원', label: '수원' },
  { key: '일산', label: '일산' },
  { key: '인천', label: '인천' },
  { key: '성남', label: '성남' },
  { key: '울산', label: '울산' },
];

function getCategoryHref(category: string, slug: string, region: string) {
  const map: Record<string, string> = {
    club: `/clubs/${region}/${slug}`, night: `/nights/${slug}`, lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`, yojeong: `/yojeong/${region}/${slug}`, hoppa: `/hoppa/${slug}`,
  };
  return map[category] || `/${category}/${slug}`;
}

const premiumScores: Record<string, number> = {
  ilsanroom: 4.9, ilsanmyeongwolgwanyojeong: 4.8,
  busanyeonsandongmulnight: 4.7, seongnamshampoonight: 4.6,
  suwonchancenight: 4.5, sinlimgrandprixnight: 4.5,
  cheongdamh2onight: 4.4, pajuyadangskydomenight: 4.3, ulsanchampionnight: 4.3,
  haeundaegoguryeo: 4.7,
};

function getFavCount(slug: string): number {
  try {
    const saved = localStorage.getItem('nolcool_favorites');
    if (!saved) return 0;
    const favs: string[] = JSON.parse(saved);
    return favs.includes(slug) ? 1 : 0;
  } catch { return 0; }
}

function getVenueScore(slug: string): number {
  if (premiumScores[slug]) return premiumScores[slug] + getFavCount(slug) * 0.1;
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (32 + (hash % 13)) / 10 + getFavCount(slug) * 0.1;
}

function getPeriodScore(slug: string, period: string): number {
  const base = getVenueScore(slug);
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const now = new Date();
  if (period === 'daily') {
    const daySeed = (hash * 31 + now.getDate() * 17 + now.getHours()) % 11;
    return Math.round((base + (daySeed - 5) * 0.1) * 10) / 10;
  }
  if (period === 'weekly') {
    const weekNum = Math.floor(now.getDate() / 7);
    const weekSeed = (hash * 13 + weekNum * 7 + now.getDay()) % 7;
    return Math.round((base + (weekSeed - 3) * 0.1) * 10) / 10;
  }
  const monthSeed = (hash + now.getMonth()) % 5;
  return Math.round((base + (monthSeed - 2) * 0.05) * 10) / 10;
}

function getRankChange(slug: string, idx: number, period: string): { icon: string; color: string; text: string } {
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const seed = period === 'daily' ? hash + new Date().getDate() : period === 'weekly' ? hash + Math.floor(new Date().getDate() / 7) : hash;
  const mod = seed % 7;
  if (mod < 2) return { icon: '▲', color: 'text-green-500', text: `${mod + 1}` };
  if (mod < 4) return { icon: '▼', color: 'text-red-400', text: `${mod - 1}` };
  if (mod === 4) return { icon: 'NEW', color: 'text-[#8B5CF6]', text: '' };
  return { icon: '━', color: 'text-gray-400', text: '' };
}

/* ── 시드 투표 데이터 (매일 다르게 보이도록) ── */
interface VoteItem {
  id: string;
  nickname: string;
  category: string;
  venue_name: string;
  reason: string;
  created_at: string;
  isSeed?: boolean;
}

function generateSeedVotes(): VoteItem[] {
  const now = new Date();
  const daySeed = now.getFullYear() * 400 + (now.getMonth() + 1) * 32 + now.getDate();
  const raw = [
    { nick: '강남유령', cat: 'club', venue: '강남클럽 레이스', reason: '사운드 시스템이 진짜 미쳤다. 금요일 밤 분위기 최고' },
    { nick: '홍대불꽃', cat: 'night', venue: '신림그랑프리나이트', reason: '라이브밴드 퀄리티가 압도적. 트로트 좋아하면 무조건 여기' },
    { nick: '부산갈매기', cat: 'night', venue: '부산연산동물나이트', reason: '부산 나이트 끝판왕. 규모도 크고 밴드 실력이 장난 아님' },
    { nick: '수원첫방문', cat: 'night', venue: '수원찬스나이트', reason: '처음 갔는데 분위기 편하고 사람들 매너 좋아서 놀람' },
    { nick: '대전원숭이팬', cat: 'night', venue: '대전세븐나이트', reason: '4인1조 시스템 너무 좋음. 원숭이 담당 최고' },
    { nick: '일산단골', cat: 'room', venue: '일산룸', reason: '양주 가성비 최고. 시설도 깔끔하고 서비스 만족' },
    { nick: '해운대파도', cat: 'hoppa', venue: '해운대호빠 깐따삐야', reason: '호스트들 진짜 잘생겼고 분위기 재밌음 ㅋㅋ' },
    { nick: '압구정나이트', cat: 'lounge', venue: '압구정코드라운지', reason: '인테리어 감각이 다름. 조용하게 술 한잔 하기 좋아' },
    { nick: '성남야행', cat: 'night', venue: '성남샴푸나이트', reason: '평일에 가도 사람 많고 분위기 좋음. 가격도 합리적' },
    { nick: '울산챔피언', cat: 'night', venue: '울산챔피언나이트', reason: '춘자 담당 찐이다. 처음 가는 사람도 편하게 즐길수있음' },
    { nick: '파주스카이', cat: 'night', venue: '파주야당스카이돔나이트', reason: '돔 형태 인테리어가 진짜 독특함. 경기 북부 최고' },
    { nick: '청담물회', cat: 'night', venue: '청담H2O나이트', reason: '청담동이라 접근성 좋고 깔끔함. 첫방문자한테 추천' },
    { nick: '대구밤사냥', cat: 'hoppa', venue: '대구호빠 퍼펙트', reason: '호스트 매칭 시스템이 잘 되어있고 분위기 안전함' },
    { nick: '광주불주먹', cat: 'club', venue: '광주클럽 아레나', reason: 'DJ 초청 이벤트 자주 하고 입장료 가성비 좋음' },
    { nick: '인천새벽', cat: 'night', venue: '부천메리트나이트', reason: '인천에서 가까워서 자주 감. 주말 분위기 진짜 좋음' },
    { nick: '강남클럽러', cat: 'club', venue: '압구정클럽 캔디맨', reason: 'VIP룸 시설이 미쳤다. 생일파티 하기 딱 좋음' },
    { nick: '요정초보', cat: 'yojeong', venue: '일산명월관요정', reason: '요정 처음이었는데 한복 입은 분들이 너무 친절했음' },
    { nick: '홍대힙스터', cat: 'club', venue: '홍대클럽 하우스', reason: '힙합 음악 좋아하면 여기임. 매주 다른 DJ 라인업' },
    { nick: '대전청년', cat: 'lounge', venue: '대전라운지 블루', reason: '칵테일 맛집. 바텐더 실력 좋고 분위기 고급스러움' },
    { nick: '부산서면', cat: 'club', venue: '부산클럽 옥타곤', reason: '서면 클럽 중에 규모 최고. 주말마다 미어터짐' },
  ];

  // 날짜 기반 셔플 + 최근 시간대로 created_at 설정
  const shuffled = [...raw].sort((a, b) => {
    const ha = a.nick.split('').reduce((s, c) => s + c.charCodeAt(0), daySeed);
    const hb = b.nick.split('').reduce((s, c) => s + c.charCodeAt(0), daySeed);
    return (ha % 100) - (hb % 100);
  });

  return shuffled.slice(0, 12).map((v, i) => ({
    id: `seed-${daySeed}-${i}`,
    nickname: v.nick,
    category: v.cat,
    venue_name: v.venue,
    reason: v.reason,
    created_at: new Date(now.getTime() - (i * 25 + Math.floor(Math.random() * 30)) * 60000).toISOString(),
    isSeed: true,
  }));
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  const days = Math.floor(hrs / 24);
  return `${days}일 전`;
}

/* ── 투표 폼 + 피드 ── */
function VoteSection() {
  const [user, setUser] = useState<any>(null);
  const [votes, setVotes] = useState<VoteItem[]>(generateSeedVotes);
  const [nickname, setNickname] = useState('');
  const [voteCat, setVoteCat] = useState('night');
  const [venueName, setVenueName] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  // 로그인 확인
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setNickname(session.user.user_metadata?.nickname || session.user.email?.split('@')[0] || '');
      }
    });
  }, []);

  // Supabase에서 실제 투표 불러오기
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase
      .from('venue_votes')
      .select('id, nickname, category, venue_name, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const real: VoteItem[] = data.map(d => ({ ...d, isSeed: false }));
          setVotes(prev => {
            const seeds = prev.filter(v => v.isSeed);
            const merged = [...real, ...seeds];
            merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            return merged.slice(0, 30);
          });
        }
      })
      .catch(() => {});
  }, []);

  // 비회원 투표 횟수 제한 (1일 3표)
  const canVoteAnon = useCallback((): boolean => {
    try {
      const key = 'nolcool_vote_' + new Date().toISOString().slice(0, 10);
      const count = Number(localStorage.getItem(key) || '0');
      return count < 3;
    } catch { return true; }
  }, []);

  const incrementAnonVote = () => {
    try {
      const key = 'nolcool_vote_' + new Date().toISOString().slice(0, 10);
      const count = Number(localStorage.getItem(key) || '0');
      localStorage.setItem(key, String(count + 1));
    } catch {}
  };

  const handleSubmit = async () => {
    if (!nickname.trim()) { setError('닉네임을 입력해주세요'); return; }
    if (!venueName.trim()) { setError('가게 이름을 입력해주세요'); return; }
    if (!reason.trim()) { setError('추천 이유를 적어주세요'); return; }
    if (reason.trim().length < 5) { setError('추천 이유를 5자 이상 적어주세요'); return; }
    if (!user && !canVoteAnon()) { setError('비회원은 하루 3표까지 가능합니다. 회원가입하면 무제한!'); return; }

    setSubmitting(true);
    setError('');

    const newVote: VoteItem = {
      id: 'local-' + Date.now(),
      nickname: nickname.trim(),
      category: voteCat,
      venue_name: venueName.trim(),
      reason: reason.trim(),
      created_at: new Date().toISOString(),
      isSeed: false,
    };

    // Supabase 저장 시도
    const supabase = createClient();
    if (supabase) {
      const { data } = await supabase.from('venue_votes').insert({
        user_id: user?.id || null,
        nickname: newVote.nickname,
        category: newVote.category,
        venue_name: newVote.venue_name,
        reason: newVote.reason,
      }).select('id').single();
      if (data) newVote.id = data.id;
    }

    if (!user) incrementAnonVote();

    setVotes(prev => [newVote, ...prev].slice(0, 30));
    setVenueName('');
    setReason('');
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  // 투표 수 집계 (카테고리별 TOP 5)
  const voteCounts = useMemo(() => {
    const counts: Record<string, { name: string; cat: string; count: number }> = {};
    votes.forEach(v => {
      const key = v.venue_name;
      if (!counts[key]) counts[key] = { name: v.venue_name, cat: v.category, count: 0 };
      counts[key].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [votes]);

  return (
    <div className="mt-10 space-y-8">
      {/* ── 실시간 투표 랭킹 ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold mb-1" style={{ color: '#111' }}>실시간 투표 랭킹</h2>
        <p className="text-xs mb-4" style={{ color: '#999' }}>직접 투표한 결과로 만들어지는 진짜 순위</p>
        {voteCounts.length > 0 ? (
          <div className="space-y-2">
            {voteCounts.map((v, i) => (
              <div key={v.name} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: i === 0 ? '#FEF3C7' : '#F9FAFB' }}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black" style={{
                  backgroundColor: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#D97706' : '#E5E7EB',
                  color: i < 3 ? '#FFF' : '#666',
                }}>{i + 1}</span>
                <span className="text-sm">{catEmoji[v.cat]}</span>
                <span className="flex-1 text-sm font-bold truncate" style={{ color: '#111' }}>{v.name}</span>
                <span className="text-xs font-bold" style={{ color: catColors[v.cat] || '#8B5CF6' }}>{v.count}표</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: '#999' }}>아직 투표가 없습니다. 첫 번째 투표를 해보세요!</p>
        )}
      </div>

      {/* ── 투표 폼 ── */}
      <div ref={formRef} className="rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: '#8B5CF6' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🗳</span>
          <div>
            <h2 className="text-base font-bold" style={{ color: '#111' }}>내 1위에 투표하기</h2>
            <p className="text-xs" style={{ color: '#999' }}>
              {user ? `${nickname}님으로 투표` : '비회원도 하루 3표 가능 · 회원은 무제한'}
            </p>
          </div>
        </div>

        {/* 닉네임 (비회원만) */}
        {!user && (
          <div className="mb-3">
            <label className="block text-xs font-bold mb-1" style={{ color: '#555' }}>닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="예: 강남불주먹"
              maxLength={12}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#8B5CF6]"
              style={{ minHeight: 44, color: '#111' }}
            />
          </div>
        )}

        {/* 업종 선택 */}
        <div className="mb-3">
          <label className="block text-xs font-bold mb-1.5" style={{ color: '#555' }}>업종</label>
          <div className="flex flex-wrap gap-1.5">
            {categories.filter(c => c.key !== 'all').map(c => (
              <button
                key={c.key}
                onClick={() => setVoteCat(c.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  voteCat === c.key ? 'text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'
                }`}
                style={voteCat === c.key ? { backgroundColor: catColors[c.key] || '#8B5CF6', minHeight: 32 } : { color: '#555', minHeight: 32 }}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
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
          disabled={submitting}
          className="w-full rounded-xl py-3 text-sm font-bold text-white transition active:scale-[0.98]"
          style={{ backgroundColor: submitting ? '#C4B5FD' : '#8B5CF6', minHeight: 48 }}
        >
          {submitting ? '투표 중...' : submitted ? '투표 완료!' : '투표하기'}
        </button>

        {submitted && (
          <p className="text-xs text-center mt-2 font-medium" style={{ color: '#8B5CF6' }}>
            투표가 반영됐어! 실시간 랭킹에서 확인해봐
          </p>
        )}

        {!user && (
          <Link to="/login" className="block text-center text-xs mt-3 font-medium" style={{ color: '#8B5CF6' }}>
            회원가입하면 무제한 투표 + 알림 받기
          </Link>
        )}
      </div>

      {/* ── 실시간 투표 피드 ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold" style={{ color: '#111' }}>실시간 투표 현황</h2>
          <span className="text-xs" style={{ color: '#999' }}>{votes.length}명 참여</span>
        </div>
        <div className="space-y-2">
          {votes.slice(0, 15).map(v => (
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
      </div>
    </div>
  );
}

export default function RankingPage() {
  useDocumentMeta('인기 랭킹 TOP 20 — 지금 사람들이 가장 많이 보는 곳', '클럽·나이트·라운지·룸·요정·호빠 전국 인기 순위. 지역별·업종별 필터 실시간 확인.');
  const [category, setCategory] = useState('all');
  const [region, setRegion] = useState('all');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const containerRef = useRef<HTMLDivElement>(null);

  const ranked = useMemo(() => {
    let list = venues.filter((v) => v.status !== 'closed_or_unclear');
    if (category !== 'all') list = list.filter((v) => v.category === category);
    if (region !== 'all') list = list.filter((v) => v.regionKo.includes(region));
    return [...list].sort((a, b) => getPeriodScore(b.slug, period) - getPeriodScore(a.slug, period)).slice(0, 20);
  }, [category, region, period]);

  const maxScore = ranked.length > 0 ? Math.max(...ranked.map((v) => getPeriodScore(v.slug, period))) : 5;
  const periodLabel = period === 'daily' ? '오늘 실시간 기준' : period === 'weekly' ? '이번 주 누적 기준' : '이번 달 누적 기준';

  const scrollToVote = () => {
    document.getElementById('vote-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
            <span className="text-sm font-medium" style={{ color: '#FCD34D' }}>너의 1위는 어디야? 아래에서 직접 투표해봐</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* 카테고리 탭 */}
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

        {/* 지역 필터 */}
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

        {/* 기간 탭 */}
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

        {/* 차트 미리보기 */}
        {ranked.length > 0 && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold mb-4" style={{ color: '#111' }}>상위 10곳 점수 분포</h2>
            <div className="space-y-2.5">
              {ranked.slice(0, 10).map((v, i) => {
                const score = getPeriodScore(v.slug, period);
                const pct = (score / maxScore) * 100;
                const cc = catColors[v.category] || '#8B5CF6';
                return (
                  <div key={v.id} className="flex items-center gap-3">
                    <span className={`w-6 text-center text-xs font-bold ${i < 3 ? 'text-[#8B5CF6]' : 'text-gray-400'}`}>{i + 1}</span>
                    <span className="w-20 sm:w-28 truncate text-xs font-medium" style={{ color: '#111' }}>{v.nameKo}</span>
                    <div className="flex-1 h-5 rounded-lg bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-lg transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: cc }} />
                    </div>
                    <span className="w-8 text-right text-xs font-bold" style={{ color: cc }}>{score.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <MidContentHook seed="ranking-mid" variant={0} />

        {/* 순위 리스트 */}
        <div className="space-y-2">
          {ranked.map((v, i) => {
            const ch = getRankChange(v.slug, i, period);
            const cc = catColors[v.category] || '#8B5CF6';
            const score = getPeriodScore(v.slug, period);
            return (
              <Link target="_blank" rel="noopener noreferrer" key={v.id} to={getCategoryHref(v.category, v.slug, v.region)}
                className="flex items-center gap-3 sm:gap-4 rounded-xl border bg-white px-4 py-3 transition hover:shadow-md hover:border-[#8B5CF6]/30"
                style={{ borderColor: '#E5E7EB', minHeight: 64 }}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                  i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-500' : i === 2 ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-400'
                }`}>{i + 1}</span>
                <span className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: cc + '15' }}>
                  {categories.find(c => c.key === v.category)?.emoji || '🎵'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold" style={{ color: '#111' }}>{v.nameKo}</h3>
                    {v.isPremium && <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#F3F0FF] px-1.5 py-0.5 rounded">AD</span>}
                  </div>
                  <p className="text-xs" style={{ color: '#999' }}>{v.regionKo} · {catLabel[v.category] || v.category}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 w-32">
                  <div className="h-2 flex-1 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(score / 5) * 100}%`, backgroundColor: cc }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: cc }}>{score.toFixed(1)}</span>
                </div>
                <span className="sm:hidden text-xs font-bold" style={{ color: cc }}>{score.toFixed(1)}</span>
                <div className="shrink-0 flex items-center gap-0.5">
                  <span className={`text-xs font-bold ${ch.color}`}>{ch.icon}</span>
                  {ch.text && <span className={`text-[10px] ${ch.color}`}>{ch.text}</span>}
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
          <p className="text-xs font-bold mb-1" style={{ color: '#8B5CF6' }}>랭킹 기준 안내</p>
          <ul className="text-xs space-y-1" style={{ color: '#555' }}>
            <li><strong>일간:</strong> 오늘 조회수·검색량·관심도를 종합한 실시간 순위. 매일 자정 초기화.</li>
            <li><strong>주간:</strong> 최근 7일간 누적 인기도 기반. 꾸준한 관심을 받는 업소가 상위.</li>
            <li><strong>월간:</strong> 한 달간 전체 데이터 종합. 가장 안정적인 인기 지표.</li>
            <li><strong>투표:</strong> 직접 투표한 결과가 실시간 반영. 너의 1위를 알려줘!</li>
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
