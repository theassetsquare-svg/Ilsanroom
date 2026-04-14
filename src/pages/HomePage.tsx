
import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { venues as localVenues, getPopularVenues } from '@/data/venues';
import type { Venue } from '@/types';
import { createClient } from '@/lib/supabase';
import JsonLd from '@/components/seo/JsonLd';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import HeroSearch from '@/components/home/HeroSearch';
import KakaoShareButton from '@/components/engagement/KakaoShareButton';

/* ── Helpers ── */
function getCategoryHref(category: string, slug: string, region: string) {
  const pathMap: Record<string, string> = {
    club: `/clubs/${region}/${slug}`,
    night: `/nights/${slug}`,
    lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`,
    yojeong: `/yojeong/${region}/${slug}`,
    hoppa: `/hoppa/${slug}`,
  };
  return pathMap[category] || `/${category}/${slug}`;
}

const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const catEmoji: Record<string, string> = { club: '🎵', night: '🌙', lounge: '🍸', room: '🚪', yojeong: '🏮', hoppa: '🥂' };

/* ── Region labels for filter ── */
const regionLabels = ['전체', '강남', '홍대', '이태원', '부산', '수원', '일산', '대전', '인천', '대구'];

/* ── Banner slides ── */
const bannerSlides = [
  { text: '🔥 지금 실시간 1위: 강남클럽 레이스', href: '/clubs/gangnam/cheongdamrace', color: 'from-violet-600 to-purple-700' },
  { text: '🆚 아르쥬 vs 레이스 — 투표하고 결과 확인', href: '/vs', color: 'from-blue-600 to-indigo-700' },
  { text: '💬 오늘 밤 같이 갈 사람? 조각모임', href: '/community/jogak', color: 'from-teal-500 to-emerald-600' },
  { text: '🎰 오늘의 행운 업소 — 룰렛 돌려봐', href: '/roulette', color: 'from-amber-500 to-orange-600' },
];

/* ── VS Polls ── */
const vsPolls = [
  { q: '강남클럽 레이스 vs 아르쥬 — 어디?', a: '레이스', b: '아르쥬' },
  { q: '금요일 밤, 클럽 vs 나이트?', a: '클럽', b: '나이트' },
  { q: '혼자 가도 괜찮은 곳은?', a: '라운지', b: '나이트' },
];

/* ── Community hot posts — DB에서 가져옴 ── */
const boardLabels: Record<string, string> = { free: '자유', reviews: '후기', party: '모집', tips: '팁', discussion: 'Q&A' };
function getTimeLabel(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return '방금';
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

interface HotPost { id: string; board: string; author: string; title: string; likes: number; comments: number; time: string; }
interface JogakItem { id: string; title: string; region: string; gender: string; current: number; max: number; time: string; }

/* ── Night fortune ── */
function getTodayFortune() {
  const fortunes = [
    { emoji: '🔥', text: '오늘 밤은 당신이 주인공. 강남이 부른다.', lucky: '강남 클럽' },
    { emoji: '💃', text: '새로운 만남의 별이 빛난다. 나이트에서 인연을 만나라.', lucky: '나이트' },
    { emoji: '🍸', text: '조용한 대화가 통하는 밤. 라운지가 정답.', lucky: '라운지' },
    { emoji: '🎶', text: '리듬을 타면 모든 게 풀린다. 플로어로 나가라.', lucky: '클럽' },
    { emoji: '✨', text: '오늘은 새로운 곳을 도전할 때. 안 가본 곳이 행운.', lucky: '신규 업소' },
    { emoji: '🥂', text: '친구와 함께하면 두 배로 즐겁다. 단체 모임이 길하다.', lucky: '호빠' },
    { emoji: '🌙', text: '밤이 깊을수록 좋아진다. 새벽 타임이 대박.', lucky: '새벽 영업' },
  ];
  const idx = new Date().getDate() % fortunes.length;
  return fortunes[idx];
}

/* ── Tabs ── */
const feedTabs = ['🔥인기', '🆕신규', '⭐추천', '📍지역별'] as const;

/* ══════════════════════════════════════════════════════ */
/*                    HOMEPAGE                            */
/* ══════════════════════════════════════════════════════ */

export default function HomePage() {
  useDocumentMeta('놀쿨 — 오늘 밤 어디 갈지, 여기서 정해진다', '클럽·나이트·룸·요정·호빠 전국 120곳 실시간 비교. 솔직 후기, 조각모임, 벙개까지.');

  const openVenues = useMemo(() => localVenues.filter(v => v.status !== 'closed_or_unclear'), []);
  const popularVenues = getPopularVenues(20);

  // === COMMUNITY DATA FROM SUPABASE ===
  const [hotPosts, setHotPosts] = useState<HotPost[]>([]);
  const [jogakList, setJogakList] = useState<JogakItem[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    // 인기글 8개
    (async () => {
      try {
        const { data } = await supabase.from('posts')
          .select('id, title, category, likes, comment_count, created_at, users!posts_user_id_fkey(nickname)')
          .order('likes', { ascending: false })
          .limit(8);
        if (data && data.length > 0) {
          setHotPosts(data.map((p: any) => ({
            id: p.id,
            board: boardLabels[p.category] || p.category,
            author: p.users?.nickname || '사용자',
            title: p.title,
            likes: p.likes || 0,
            comments: p.comment_count || 0,
            time: getTimeLabel(p.created_at),
          })));
        }
      } catch {}
    })();

    // 조각모임 최신 4개
    (async () => {
      try {
        const { data } = await supabase.from('posts')
          .select('id, title, content, created_at, users!posts_user_id_fkey(nickname)')
          .eq('category', 'party')
          .order('created_at', { ascending: false })
          .limit(4);
        if (data && data.length > 0) {
          setJogakList(data.map((p: any) => {
            let parsed: any = {};
            try { parsed = JSON.parse(p.content); } catch {}
            return {
              id: p.id,
              title: p.title,
              region: parsed.region || '',
              gender: parsed.genderPref || '혼성',
              current: parsed.currentPeople || 1,
              max: parsed.maxPeople || 4,
              time: parsed.meetDate ? `${parsed.meetDate} ${parsed.meetTime || ''}` : '',
            };
          }));
        }
      } catch {}
    })();
  }, []);

  // === BANNER STATE ===
  const [bannerIdx, setBannerIdx] = useState(0);
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    bannerTimerRef.current = setInterval(() => setBannerIdx(prev => (prev + 1) % bannerSlides.length), 4000);
    return () => { if (bannerTimerRef.current) clearInterval(bannerTimerRef.current); };
  }, []);

  // === REGION FILTER ===
  const [activeRegion, setActiveRegion] = useState('all');

  // === TAB STATE ===
  const [activeTab, setActiveTab] = useState(0);

  // === STICKY SEARCH ===
  const [searchSticky, setSearchSticky] = useState(false);
  const searchSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setSearchSticky(!entry.isIntersecting), { threshold: 0 });
    if (searchSentinelRef.current) observer.observe(searchSentinelRef.current);
    return () => observer.disconnect();
  }, []);

  // === FEED DATA ===
  const filteredVenues = useMemo(() => {
    let list = openVenues;
    if (activeRegion !== 'all') list = list.filter(v => v.regionKo.includes(activeRegion));
    return list;
  }, [openVenues, activeRegion]);

  const feedVenues = useMemo(() => {
    if (activeTab === 0) return filteredVenues.slice(0, 30);
    if (activeTab === 1) return [...filteredVenues].reverse().slice(0, 30);
    if (activeTab === 2) return filteredVenues.filter(v => v.isPremium).concat(filteredVenues.filter(v => !v.isPremium)).slice(0, 30);
    return filteredVenues.slice(0, 30);
  }, [filteredVenues, activeTab]);

  // === VS Vote ===
  const [vsVotes, setVsVotes] = useState<Record<number, string>>({});
  const currentPoll = vsPolls[new Date().getDate() % vsPolls.length];

  // === Vibe Score (실시간 분위기 지수) ===
  const vibeScores = useRef<Record<string, number>>({});
  const getVibeScore = (id: string) => {
    if (!vibeScores.current[id]) {
      const h = new Date().getHours();
      const base = (h >= 21 || h < 4) ? 60 : (h >= 18 ? 40 : 20);
      vibeScores.current[id] = base + Math.floor(Math.random() * 30);
    }
    return Math.min(vibeScores.current[id], 100);
  };

  // === Favorites ===
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nolcool_favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('nolcool_favorites', JSON.stringify([...next]));
      return next;
    });
  };

  // === Roulette ===
  const [rouletteResult, setRouletteResult] = useState<Venue | null>(null);
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const spinRoulette = () => {
    if (rouletteSpinning) return;
    setRouletteSpinning(true);
    setRouletteResult(null);
    const timer = setTimeout(() => {
      setRouletteResult(openVenues[Math.floor(Math.random() * openVenues.length)]);
      setRouletteSpinning(false);
    }, 1500);
    return () => clearTimeout(timer);
  };

  const fortune = getTodayFortune();

  return (
    <div className="bg-white min-h-screen">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'WebSite', name: '놀쿨',
        url: 'https://nolcool.com',
        potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: 'https://nolcool.com/search?q={search_term_string}' }, 'query-input': 'required name=search_term_string' },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'ItemList', name: '인기 매장',
        itemListElement: popularVenues.slice(0, 10).map((v, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'LocalBusiness', name: v.nameKo, address: v.address } })),
      }} />

      {/* ═══ TIME GREETING ═══ */}
      <section className="px-4 pt-5 pb-1 text-center max-w-3xl mx-auto">
        <p className="text-sm text-[#555]">
          {(() => {
            const h = new Date().getHours();
            if (h >= 18 && h < 21) return '오늘 밤, 어디로 갈까? 🌙';
            if (h >= 21 || h < 4) return '지금이 딱 좋은 시간 🔥';
            if (h >= 4 && h < 12) return '오늘 밤을 미리 준비하자 ☀️';
            return '저녁이 기다려지는 시간 🌆';
          })()}
        </p>
      </section>

      {/* ═══ HERO ═══ */}
      <section className="px-4 pt-2 pb-2 text-center max-w-3xl mx-auto">
        <h1 className="text-[26px] font-black text-[#111] leading-[1.3] tracking-tight">
          오늘 밤, 여기서 정한다
        </h1>
        <p className="mt-1.5 text-sm text-[#555]" style={{ lineHeight: 1.7 }}>
          전국 {openVenues.length}곳 실시간 비교 · 솔직 후기 · 조각모임
        </p>
      </section>

      {/* ═══ SEARCH BAR (sticky) ═══ */}
      <div ref={searchSentinelRef} />
      <div className={`px-4 py-2 z-[60] transition-all ${searchSticky ? 'fixed top-[88px] left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : ''}`}>
        <div className={searchSticky ? 'max-w-3xl mx-auto' : ''}>
          <HeroSearch />
        </div>
      </div>

      {/* ═══ BANNER SLIDER ═══ */}
      <section className="px-4 py-2 max-w-3xl mx-auto">
        <Link
          to={bannerSlides[bannerIdx].href}
          className={`block rounded-2xl bg-gradient-to-r ${bannerSlides[bannerIdx].color} px-5 py-3.5 transition-all`}
        >
          <p className="text-sm font-bold text-white">{bannerSlides[bannerIdx].text}</p>
        </Link>
        <div className="flex justify-center gap-1.5 mt-2">
          {bannerSlides.map((_, i) => (
            <button key={i} onClick={() => setBannerIdx(i)} className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? 'w-4 bg-[#8B5CF6]' : 'w-1.5 bg-gray-300'}`} />
          ))}
        </div>
      </section>

      {/* ═══ LIVE HOT TOP 5 — horizontal scroll ═══ */}
      <section className="py-3 max-w-3xl mx-auto">
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="text-base font-bold text-[#111]">🔥 실시간 HOT</h2>
          <Link to="/ranking" className="text-xs text-[#8B5CF6] font-medium">전체보기 →</Link>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1">
          {popularVenues.slice(0, 8).map((v, i) => (
            <Link
              key={v.id}
              to={getCategoryHref(v.category, v.slug, v.region)}
              target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0"
              style={{ width: 130 }}
            >
              {/* 이미지 카드 — 3:4 비율 통일 */}
              <div className="relative rounded-xl overflow-hidden" style={{ width: 130, height: 173 }}>
                <img
                  src={`/venues/${v.slug}-1.jpg`}
                  alt={v.nameKo}
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  className="absolute inset-0 w-full h-full object-cover z-[1]"
                />
                {/* Fallback — 카테고리별 그라데이션 */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center ${
                  v.category === 'club' ? 'bg-gradient-to-br from-violet-500 to-indigo-700' :
                  v.category === 'night' ? 'bg-gradient-to-br from-blue-500 to-purple-700' :
                  v.category === 'lounge' ? 'bg-gradient-to-br from-amber-500 to-orange-700' :
                  v.category === 'room' ? 'bg-gradient-to-br from-rose-500 to-pink-700' :
                  v.category === 'yojeong' ? 'bg-gradient-to-br from-emerald-500 to-teal-700' :
                  'bg-gradient-to-br from-pink-500 to-rose-700'
                }`}>
                  <span className="text-3xl">{catEmoji[v.category] || '🎵'}</span>
                  <span className="mt-1 text-xs font-bold text-white/80">{v.nameKo.slice(0, 4)}</span>
                </div>
                {/* Rank badge */}
                <span className={`absolute top-2 left-2 z-[2] flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white ${i < 3 ? 'bg-[#8B5CF6]' : 'bg-black/50'}`}>
                  {i + 1}
                </span>
                {/* Vibe score overlay */}
                <div className="absolute bottom-0 left-0 right-0 z-[2] bg-gradient-to-t from-black/70 to-transparent p-2">
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                      <div className="h-full rounded-full bg-orange-400" style={{ width: `${getVibeScore(v.id)}%` }} />
                    </div>
                    <span className="text-[10px] text-orange-300 font-bold">{getVibeScore(v.id)}</span>
                  </div>
                </div>
              </div>
              {/* 카드 아래 텍스트 — 이미지 밖 */}
              <p className="mt-1.5 text-xs font-bold text-[#111] truncate px-0.5">{v.nameKo}</p>
              <p className="text-[10px] text-[#999] truncate px-0.5">{v.regionKo}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ COMMUNITY HOT POSTS ═══ */}
      {hotPosts.length > 0 && (
        <section className="px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-[#111]">💬 커뮤니티 핫글</h2>
            <Link to="/community" className="text-xs text-[#8B5CF6] font-medium">더보기 →</Link>
          </div>
          <div className="space-y-2">
            {hotPosts.map(post => (
              <Link key={post.id} to={`/community/post/${post.id}`} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 active:bg-gray-50 transition">
                <span className="flex-shrink-0 rounded-lg bg-[#F3F0FF] px-2 py-1 text-xs font-bold text-[#8B5CF6]">{post.board}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111] truncate">{post.title}</p>
                  <p className="text-xs text-[#999] mt-0.5">{post.author} · {post.time}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 text-xs text-[#999]">
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ 조각모임 — KILLER FEATURE ═══ */}
      <section className="px-4 py-3 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-[#111]">🙋 오늘 밤 조각모임</h2>
          <Link to="/community/jogak" className="text-xs text-[#8B5CF6] font-medium">전체보기 →</Link>
        </div>
        {jogakList.length > 0 ? (
          <div className="space-y-2">
            {jogakList.map(j => (
              <Link key={j.id} to={`/community/jogak`} className="block rounded-xl border border-gray-100 bg-white p-3 active:bg-gray-50 transition">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111]">{j.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {j.region && <span className="text-xs text-[#555]">📍{j.region}</span>}
                      <span className="text-xs text-[#555]">👤{j.gender}</span>
                      {j.time && <span className="text-xs text-[#555]">🕐{j.time}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${j.current / j.max >= 0.8 ? 'bg-red-500' : 'bg-[#8B5CF6]'}`}
                        style={{ width: `${(j.current / j.max) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-[#111]">{j.current}/{j.max}명</span>
                  </div>
                  <span className="ml-3 flex-shrink-0 rounded-full bg-[#8B5CF6] px-4 py-1.5 text-xs font-bold text-white" style={{ minHeight: 32 }}>
                    참여하기
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Link to="/community/jogak" className="block rounded-xl border border-gray-100 bg-white p-4 text-center active:bg-gray-50 transition">
            <p className="text-sm text-[#555]">같이 놀러갈 사람을 구해보세요!</p>
            <span className="mt-2 inline-block rounded-full bg-[#8B5CF6] px-5 py-2 text-sm font-bold text-white" style={{ minHeight: 36 }}>
              조각모임 둘러보기
            </span>
          </Link>
        )}
      </section>

      {/* ═══ VS 투표 — 1탭 참여 ═══ */}
      <section className="px-4 py-3 max-w-3xl mx-auto">
        <div className="rounded-2xl bg-gradient-to-r from-[#EEF2FF] to-[#F3F0FF] p-4">
          <p className="text-xs font-bold text-[#8B5CF6] mb-1">🆚 오늘의 VS 투표</p>
          <p className="text-sm font-bold text-[#111] mb-3">{currentPoll.q}</p>
          <div className="grid grid-cols-2 gap-2">
            {[currentPoll.a, currentPoll.b].map(opt => (
              <button
                key={opt}
                onClick={() => setVsVotes(prev => ({ ...prev, [0]: opt }))}
                disabled={!!vsVotes[0]}
                className={`rounded-xl py-3 text-sm font-bold transition-all ${
                  vsVotes[0] === opt ? 'bg-[#8B5CF6] text-white' :
                  vsVotes[0] ? 'bg-white/60 text-[#999]' :
                  'bg-white text-[#333] hover:bg-[#8B5CF6] hover:text-white active:bg-[#8B5CF6] active:text-white'
                }`}
                style={{ minHeight: 44 }}
              >
                {opt}
              </button>
            ))}
          </div>
          {vsVotes[0] && (
            <p className="mt-2 text-xs text-[#8B5CF6] text-center">
              {Math.floor(Math.random() * 20 + 40)}% vs {Math.floor(Math.random() * 20 + 40)}% — 참여 완료!
            </p>
          )}
        </div>
      </section>

      {/* ═══ TONIGHT FORTUNE ═══ */}
      <section className="px-4 py-3 max-w-3xl mx-auto">
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4">
          <p className="text-xs font-bold text-amber-700 mb-1">🔮 오늘 밤 운세</p>
          <p className="text-lg mb-1">{fortune.emoji}</p>
          <p className="text-sm font-bold text-[#111] mb-1">{fortune.text}</p>
          <p className="text-xs text-amber-600">행운의 장소: {fortune.lucky}</p>
        </div>
      </section>

      {/* ═══ FEED — 지역 필터 + 정렬 탭 통합 ═══ */}
      <section className="mt-2 max-w-3xl mx-auto">
        {/* 지역 필터 */}
        <div className="overflow-x-auto scrollbar-hide px-4 py-2">
          <div className="flex gap-2">
            {regionLabels.map(r => (
              <button
                key={r}
                onClick={() => setActiveRegion(r === '전체' ? 'all' : r)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all whitespace-nowrap ${
                  (r === '전체' && activeRegion === 'all') || (r !== '전체' && activeRegion === r)
                    ? 'bg-[#8B5CF6] text-white shadow-sm'
                    : 'bg-gray-100 text-[#555]'
                }`}
                style={{ minHeight: 32 }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        {/* 정렬 탭 */}
        <div className="flex border-b border-gray-100">
          {feedTabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-2.5 text-center text-sm font-medium transition-all relative ${
                activeTab === i ? 'text-[#8B5CF6] font-bold' : 'text-[#555]'
              }`}
              style={{ minHeight: 40 }}
            >
              {tab}
              {activeTab === i && <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full bg-[#8B5CF6]" />}
            </button>
          ))}
        </div>
      </section>

      {/* ═══ VENUE FEED — 2 Column Cards ═══ */}
      <section className="px-4 py-4 max-w-3xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {feedVenues.map((venue, idx) => {
            const cards = [];
            const vibeScore = getVibeScore(venue.id);

            cards.push(
              <div key={venue.id} className="relative">
                <Link target="_blank" rel="noopener noreferrer" to={getCategoryHref(venue.category, venue.slug, venue.region)} className="block">
                  <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform hover:scale-[1.02]">
                    {/* Photo — 3:4 비율 통일 */}
                    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3/4' }}>
                      <img
                        src={`/venues/${venue.slug}-1.jpg`}
                        alt={venue.nameKo}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        className="absolute inset-0 w-full h-full object-cover z-[1]"
                      />
                      {/* Fallback — 카테고리별 그라데이션 + 이모지 */}
                      <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${
                        venue.category === 'club' ? 'from-violet-500 to-indigo-700' :
                        venue.category === 'night' ? 'from-blue-500 to-purple-700' :
                        venue.category === 'lounge' ? 'from-amber-500 to-orange-700' :
                        venue.category === 'room' ? 'from-rose-500 to-pink-700' :
                        venue.category === 'yojeong' ? 'from-emerald-500 to-teal-700' :
                        'from-pink-500 to-rose-700'
                      }`}>
                        <span className="text-3xl">{catEmoji[venue.category] || '🎵'}</span>
                        <span className="mt-1 text-xs font-bold text-white/80">{venue.nameKo.slice(0, 4)}</span>
                      </div>
                      {/* Category + Region badge */}
                      <span className="absolute top-2 left-2 z-[2] rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-[#111] shadow-sm">
                        {catEmoji[venue.category]} {venue.regionKo}
                      </span>
                    </div>
                    {/* Info */}
                    <div className="p-2.5">
                      <h3 className="text-sm font-bold text-[#111] leading-tight line-clamp-1">{venue.nameKo}</h3>
                      <p className="mt-0.5 text-xs text-[#555] line-clamp-1">{venue.shortDescription}</p>
                      {/* Vibe Score bar */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-[#555]">분위기</span>
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${vibeScore >= 70 ? 'bg-orange-500' : vibeScore >= 40 ? 'bg-[#8B5CF6]' : 'bg-gray-400'}`}
                            style={{ width: `${vibeScore}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${vibeScore >= 70 ? 'text-orange-500' : 'text-[#8B5CF6]'}`}>{vibeScore}</span>
                      </div>
                      {/* Tags */}
                      {venue.features.length > 0 && (
                        <div className="flex gap-1 mt-1.5 overflow-hidden">
                          {venue.features.slice(0, 2).map(f => (
                            <span key={f} className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] text-[#555] whitespace-nowrap">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
                {/* Heart */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(venue.id); }}
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"
                  aria-label="찜하기"
                >
                  <svg className={`h-4 w-4 ${favorites.has(venue.id) ? 'text-red-500 fill-red-500' : 'text-white'}`} fill={favorites.has(venue.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            );

            // 8번째 — 커뮤니티 CTA 1번만
            if (idx + 1 === 8) {
              cards.push(
                <Link key={`cta-${idx}`} to="/community" className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-xl bg-gradient-to-r from-[#F3F0FF] to-white border border-purple-100 p-3 active:bg-gray-50 transition text-center">
                  <p className="text-sm font-bold text-[#8B5CF6]">💬 커뮤니티에서 후기·꿀팁·조각모임 확인하기 →</p>
                </Link>
              );
            }

            // TOP5 — 1번만
            if (idx + 1 === 12) {
              cards.push(
                <div key={`top5-${idx}`} className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-xl bg-gradient-to-r from-violet-50 to-white p-4">
                  <p className="text-xs font-bold text-[#8B5CF6] mb-2">🏆 이번주 TOP 5</p>
                  <div className="space-y-1">
                    {popularVenues.slice(0, 5).map((v, i) => (
                      <Link key={v.id} to={getCategoryHref(v.category, v.slug, v.region)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 py-1">
                        <span className={`flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${i < 3 ? 'bg-[#8B5CF6] text-white' : 'bg-gray-200 text-gray-600'}`}>{i + 1}</span>
                        <span className="text-sm text-[#111] truncate">{v.nameKo}</span>
                        <span className="ml-auto text-xs text-[#555]">{v.regionKo}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return cards;
          })}
        </div>

        {feedVenues.length === 0 && (
          <div className="text-center py-12 text-[#999]">
            <p className="text-sm">이 지역에 등록된 업소가 없습니다</p>
          </div>
        )}
      </section>

      {/* ═══ LUCKY ROULETTE ═══ */}
      <section className="px-4 py-4 max-w-3xl mx-auto">
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 p-5 text-center">
          <p className="text-2xl mb-1">🎰</p>
          <h2 className="text-lg font-bold text-[#111] mb-1">오늘 밤 여기 어때?</h2>
          <p className="text-sm text-[#555] mb-3">탭 한 번으로 행운의 업소를 뽑아봐</p>
          <button
            onClick={spinRoulette}
            disabled={rouletteSpinning}
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-bold transition-all ${
              rouletteSpinning
                ? 'bg-violet-100 text-[#555] animate-pulse'
                : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] active:scale-95 shadow-lg'
            }`}
            style={{ minHeight: 48 }}
          >
            {rouletteSpinning ? '돌리는 중...' : '🎲 돌려보기'}
          </button>

          {rouletteResult && (
            <Link
              to={getCategoryHref(rouletteResult.category, rouletteResult.slug, rouletteResult.region)}
              target="_blank" rel="noopener noreferrer"
              className="mt-4 block rounded-xl bg-white border border-violet-200 p-4 text-left transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg font-bold text-[#8B5CF6]">
                  {rouletteResult.nameKo.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-[#111] truncate">{rouletteResult.nameKo}</p>
                  <p className="text-xs text-[#555]">{rouletteResult.regionKo} · {catLabel[rouletteResult.category]}</p>
                </div>
                <span className="text-[#8B5CF6] text-lg">→</span>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* ═══ QUICK LINKS ═══ */}
      <section className="px-4 py-3 max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '🔍', title: '비교', desc: '시세 한눈에', href: '/compare' },
            { icon: '📍', title: '내 근처', desc: '지금 갈 곳', href: '/map' },
            { icon: '📖', title: '가이드', desc: '초보 필독', href: '/guide' },
          ].map(card => (
            <Link
              key={card.title}
              to={card.href}
              target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm active:scale-[0.97]"
              style={{ minHeight: 44 }}
            >
              <span className="text-xl">{card.icon}</span>
              <span className="text-sm font-bold text-[#111]">{card.title}</span>
              <span className="text-xs text-[#555]">{card.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ GOOGLE/AI CTA ═══ */}
      <section className="px-4 py-4 max-w-3xl mx-auto">
        <div className="rounded-2xl bg-violet-50 border border-violet-200 px-6 py-4 text-center">
          <p className="text-sm font-bold text-[#111]">
            구글 · ChatGPT · Gemini에서 <span className="text-xl text-[#8B5CF6]" style={{ fontWeight: 300, letterSpacing: '0.05em' }}>"놀쿨"</span> 검색하세요
          </p>
        </div>
      </section>

      {/* ═══ SEO TEXT ═══ */}
      <section className="px-4 pb-8 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-gray-100 bg-[#F5F5F5] p-5">
          <h2 className="mb-2 text-base font-bold text-[#111]">전국 클럽·나이트·라운지 실시간 정보</h2>
          <div className="space-y-2 text-sm leading-relaxed text-[#555]">
            <p>
              놀쿨은 전국 {openVenues.length}개 클럽, 나이트, 라운지, 룸, 요정, 호빠의 실시간 정보를 제공하는 대한민국 대표 나이트라이프 플랫폼입니다.
              강남 클럽부터 일산 나이트, 부산 아시아드까지 직접 가본 사람의 솔직한 후기와 실시간 분위기를 확인할 수 있습니다.
            </p>
            <p>
              조각모임으로 함께 갈 사람을 찾고, 커뮤니티에서 실시간 정보를 공유하세요.
              EDM 클럽부터 소셜 댄스 나이트까지, 오늘 밤의 선택을 놀쿨에서 시작하세요.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
