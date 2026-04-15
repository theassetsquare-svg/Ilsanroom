
import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { venues as localVenues, getPopularVenues } from '@/data/venues';
import type { Venue } from '@/types';
import { createClient } from '@/lib/supabase';
import JsonLd from '@/components/seo/JsonLd';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
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

/* ── Region labels for 지역별 tab filter ── */
const regionLabels = ['전체', '강남', '압구정', '홍대', '이태원', '부산', '대구', '광주', '대전', '수원', '일산', '인천', '성남', '천안', '울산'];

/* ── Banner slides ── */
const bannerSlides = [
  { text: '🔥 지금 실시간 1위: 강남클럽 레이스', href: '/clubs/gangnam/cheongdamrace', color: 'from-violet-600 to-purple-700' },
  { text: '🆚 아르쥬 vs 레이스 — 투표하고 결과 확인', href: '/vs', color: 'from-blue-600 to-indigo-700' },
  { text: '💬 오늘 밤 같이 갈 사람? 조각모임', href: '/community/jogak', color: 'from-teal-500 to-emerald-600' },
  { text: '🎰 오늘의 행운 업소 — 룰렛 돌려봐', href: '/roulette', color: 'from-amber-500 to-orange-600' },
];

/* ── VS Polls — 매일 다른 투표 3세트 ── */
const vsPolls = [
  { q: '강남 양대산맥! 어디가 더 미쳤어?', a: '레이스', b: '아르쥬', aEmoji: '🔥', bEmoji: '💎', aPct: 54, bPct: 46 },
  { q: '금요일 밤, 뭐가 더 끌려?', a: '클럽', b: '나이트', aEmoji: '🎵', bEmoji: '🌙', aPct: 61, bPct: 39 },
  { q: '혼자 가도 괜찮은 곳은?', a: '라운지', b: '나이트', aEmoji: '🍸', bEmoji: '💃', aPct: 67, bPct: 33 },
  { q: '첫 방문이면 어디부터?', a: '홍대', b: '강남', aEmoji: '🎨', bEmoji: '💰', aPct: 48, bPct: 52 },
  { q: '분위기 vs 가격, 뭐가 더 중요?', a: '분위기', b: '가격', aEmoji: '✨', bEmoji: '💵', aPct: 72, bPct: 28 },
  { q: '단체 모임, 어디가 찐이야?', a: '룸', b: '호빠', aEmoji: '🚪', bEmoji: '🥂', aPct: 58, bPct: 42 },
  { q: '주말 새벽 2시, 아직 놀고 싶다면?', a: '클럽', b: '요정', aEmoji: '🎶', bEmoji: '🏮', aPct: 63, bPct: 37 },
];

/* ── Fortune — 더 풍부하고 재미있는 밤 운세 ── */
const allFortunes = [
  { emoji: '🔥', title: '불꽃 에너지', text: '오늘 밤은 당신이 주인공. 입장 순간부터 시선 집중.', lucky: '강남 클럽', luckyColor: '레드', luckyNum: 7, tip: '첫 곡이 나올 때 플로어 앞줄로 가라. 운명이 바뀐다.' },
  { emoji: '💃', title: '인연의 밤', text: '새로운 만남의 별이 빛난다. 눈이 마주치면 먼저 웃어라.', lucky: '나이트', luckyColor: '핑크', luckyNum: 3, tip: '혼자 갈수록 더 좋은 인연이 온다. 믿어라.' },
  { emoji: '🍸', title: '고급 취향', text: '조용한 대화가 통하는 밤. 분위기로 승부하라.', lucky: '라운지', luckyColor: '골드', luckyNum: 9, tip: '칵테일 한 잔의 여유가 오늘 밤을 결정한다.' },
  { emoji: '🎶', title: '리듬 마스터', text: '리듬을 타면 모든 게 풀린다. 몸이 먼저 아는 밤.', lucky: '클럽', luckyColor: '퍼플', luckyNum: 5, tip: 'DJ가 바뀌는 타임에 가면 최고의 셋을 만난다.' },
  { emoji: '✨', title: '탐험가의 밤', text: '안 가본 곳이 행운이다. 새로운 도전이 대박의 시작.', lucky: '신규 업소', luckyColor: '블루', luckyNum: 1, tip: '친구가 추천한 곳 말고, 니 직감을 믿어라.' },
  { emoji: '🥂', title: '인싸력 만렙', text: '사람이 모이는 곳에 니가 있다. 오늘은 단체전이 답.', lucky: '호빠', luckyColor: '로즈골드', luckyNum: 8, tip: '3명 이상이면 분위기 장악 가능. 크루를 소집하라.' },
  { emoji: '🌙', title: '새벽형 인간', text: '밤이 깊을수록 좋아진다. 새벽 타임이 진짜 시작.', lucky: '새벽 영업', luckyColor: '네이비', luckyNum: 2, tip: '자정 넘어서 도착하면 VIP 대우를 받는다.' },
  { emoji: '🎭', title: '변신의 밤', text: '평소와 다른 스타일을 시도하라. 오늘 밤은 반전이다.', lucky: '요정', luckyColor: '에메랄드', luckyNum: 6, tip: '드레스 코드를 한 단계 올리면 대접이 달라진다.' },
  { emoji: '💎', title: '럭셔리 운', text: '오늘은 좋은 곳에 가야 한다. 아끼지 마라, 돌아온다.', lucky: '프리미엄 업소', luckyColor: '다이아', luckyNum: 4, tip: '테이블 예약하면 3배 더 즐긴다. 투자하라.' },
  { emoji: '🎪', title: '파티 본능', text: '음악이 커질수록 기분이 올라간다. 미친 듯이 놀아라.', lucky: '클럽', luckyColor: '네온그린', luckyNum: 11, tip: '혼자 춤추는 사람이 가장 멋있다. 눈치 보지 마라.' },
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

function getTodayFortune() {
  const idx = new Date().getDate() % allFortunes.length;
  return allFortunes[idx];
}

/* ── Tabs ── */
const feedTabs = ['🔥인기', '🆕신규', '⭐추천', '📍지역별'] as const;

/* ── VenueCard — 재사용 카드 컴포넌트 ── */
function VenueCard({ venue, favorites, toggleFavorite, rank }: { venue: Venue; favorites: Set<string>; toggleFavorite: (id: string) => void; rank?: number }) {
  return (
    <div className="relative">
      <Link target="_blank" rel="noopener noreferrer" to={getCategoryHref(venue.category, venue.slug, venue.region)} className="block">
        <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform hover:scale-[1.02]">
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1/1' }}>
            <img src={`/venues/${venue.slug}-1.jpg`} alt={venue.nameKo} loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              className="absolute inset-0 w-full h-full object-cover z-[1]" />
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
            {rank && (
              <span className={`absolute top-2 left-2 z-[2] flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white ${rank <= 3 ? 'bg-[#8B5CF6]' : 'bg-black/50'}`}>
                {rank}
              </span>
            )}
            <div className="absolute bottom-0 left-0 right-0 z-[2] bg-black/75 px-2.5 py-2">
              <h3 className="text-sm font-bold text-white leading-tight truncate">{venue.nameKo}</h3>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-white/90 truncate">{catLabel[venue.category]} · {venue.regionKo}</p>
                {venue.rating > 0 && <span className="text-[11px] text-yellow-300 font-bold">★ {venue.rating.toFixed(1)}</span>}
              </div>
            </div>
          </div>
        </div>
      </Link>
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(venue.id); }}
        className="absolute top-2 right-2 z-[3] flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm" aria-label="찜하기">
        <svg className={`h-4 w-4 ${favorites.has(venue.id) ? 'text-red-500 fill-red-500' : 'text-white'}`} fill={favorites.has(venue.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */
/*                    HOMEPAGE                            */
/* ══════════════════════════════════════════════════════ */

export default function HomePage() {
  useDocumentMeta('놀쿨 — 오늘 밤 어디 갈지, 여기서 정해진다', '클럽·나이트·룸·요정·호빠 전국 120곳 실시간 비교. 솔직 후기, 조각모임, 벙개까지.');
  const navigate = useNavigate();

  const openVenues = useMemo(() => localVenues.filter(v => v.status !== 'closed_or_unclear'), []);
  const popularVenues = getPopularVenues(20);

  // === 네이버 스타일 실시간 검색 ===
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<Venue[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // 실시간 검색 — 토큰 분리 + 카테고리/지역 인식
  const catKw: Record<string, string> = useMemo(() => ({
    '클럽': 'club', '나이트': 'night', '나이트클럽': 'night', '라운지': 'lounge',
    '바': 'lounge', '룸': 'room', '룸싸롱': 'room', '룸살롱': 'room',
    '요정': 'yojeong', '호빠': 'hoppa', '호스트바': 'hoppa', '고구려': 'night',
  }), []);
  const norm = useCallback((s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]/g, ''), []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      const qn = norm(searchQuery);
      let detectedCat = '';
      let residual = qn;
      for (const [kw, code] of Object.entries(catKw).sort((a, b) => b[0].length - a[0].length)) {
        if (residual.includes(norm(kw))) { if (!detectedCat) detectedCat = code; residual = residual.replace(norm(kw), ''); }
      }
      const scored = openVenues.map(v => {
        let score = 0;
        const nk = norm(v.nameKo); const rk = norm(v.regionKo);
        if (nk === qn) score += 1000;
        else if (nk.startsWith(qn)) score += 600;
        else if (nk.includes(qn)) score += 300;
        if (v.tags?.some(t => norm(t) === qn)) score += 500;
        if (v.tags?.some(t => norm(t).includes(qn))) score += 150;
        if (detectedCat && v.category === detectedCat) score += 200;
        if (residual && (rk.includes(residual) || residual.includes(rk))) score += 200;
        if (residual && nk.includes(residual)) score += 150;
        if (qn.length >= 2 && score === 0) {
          for (let len = Math.min(qn.length, nk.length); len >= 2; len--) {
            let found = false;
            for (let i = 0; i <= qn.length - len; i++) { if (nk.includes(qn.substring(i, i + len))) { score += len * 15; found = true; break; } }
            if (found) break;
          }
        }
        if (v.isPremium) score += 20;
        return { venue: v, score };
      });
      const filtered = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
      setSearchResults(filtered.slice(0, 8).map(s => s.venue));
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, openVenues, catKw, norm]);

  // 검색창 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
    }
  };

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

  // === TAB STATE ===
  const [activeTab, setActiveTab] = useState(0);

  // === REGION FILTER (지역별 탭 전용) ===
  const [activeRegion, setActiveRegion] = useState('all');


  // === FEED DATA ===
  const filteredVenues = useMemo(() => {
    let list = openVenues;
    // 지역 필터는 지역별 탭(탭3)에서만 적용
    if (activeTab === 3 && activeRegion !== 'all') list = list.filter(v => v.regionKo.includes(activeRegion));
    return list;
  }, [openVenues, activeRegion, activeTab]);

  const feedVenues = useMemo(() => {
    // 인기: rating + reviewCount 기반 실제 인기순
    if (activeTab === 0) return [...filteredVenues].sort((a, b) => (b.rating * 10 + b.reviewCount) - (a.rating * 10 + a.reviewCount)).slice(0, 30);
    // 신규: 최근 등록순 (배열 뒤쪽 = 최신)
    if (activeTab === 1) return [...filteredVenues].reverse().slice(0, 30);
    // 추천: 프리미엄 + 평점 높은 순
    if (activeTab === 2) return [...filteredVenues].sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      return b.rating - a.rating;
    }).slice(0, 30);
    // 지역별: 지역 그룹으로 정렬
    return filteredVenues.slice(0, 30);
  }, [filteredVenues, activeTab]);

  // 지역별 탭용 그룹핑 데이터
  const regionGroupedVenues = useMemo(() => {
    if (activeTab !== 3) return null;
    const groups: Record<string, Venue[]> = {};
    filteredVenues.forEach(v => {
      if (!groups[v.regionKo]) groups[v.regionKo] = [];
      if (groups[v.regionKo].length < 6) groups[v.regionKo].push(v);
    });
    return Object.entries(groups).filter(([, list]) => list.length > 0);
  }, [filteredVenues, activeTab]);

  // === VS Vote (날짜별 키로 저장 — 날짜 바뀌면 투표 초기화) ===
  const vsDateKey = useMemo(() => {
    const d = new Date();
    return `nolcool_vs_home_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
  }, []);
  const [vsVotes, setVsVotes] = useState<Record<number, string>>(() => {
    try { const s = localStorage.getItem(vsDateKey); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [vsAnimating, setVsAnimating] = useState(false);
  const todayPolls = useMemo(() => {
    const d = new Date().getDate();
    return [vsPolls[d % vsPolls.length], vsPolls[(d + 3) % vsPolls.length]];
  }, []);
  const handleVsVote = useCallback((pollIdx: number, opt: string) => {
    if (vsVotes[pollIdx] || vsAnimating) return;
    setVsAnimating(true);
    setVsVotes(prev => {
      const next = { ...prev, [pollIdx]: opt };
      try { localStorage.setItem(vsDateKey, JSON.stringify(next)); } catch {}
      return next;
    });
    const timer = setTimeout(() => setVsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [vsVotes, vsAnimating, vsDateKey]);

  // === Fortune ===
  const [fortuneRevealed, setFortuneRevealed] = useState(false);

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
  const fortuneScore = useMemo(() => Math.floor(60 + (new Date().getDate() * 7 + new Date().getMonth() * 13) % 40), []);

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

      {/* ═══ HERO + 네이버 스타일 검색바 ═══ */}
      <section className="px-4 pt-2 pb-4 text-center max-w-3xl mx-auto">
        <h1 className="text-[26px] font-black text-[#111] leading-[1.3] tracking-tight">
          오늘 밤, 여기서 정한다
        </h1>
        <p className="mt-1.5 text-sm text-[#555]" style={{ lineHeight: 1.7 }}>
          전국 {openVenues.length}곳 실시간 비교 · 솔직 후기 · 조각모임
        </p>
        {/* 검색바 — 네이버 스타일: 타이핑→실시간 결과 드롭다운 */}
        <div ref={searchWrapperRef} className="relative mt-4 mx-auto" style={{ maxWidth: 520 }}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className={`flex items-center rounded-2xl border bg-white px-4 transition-all ${
              searchFocused ? 'border-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/10' : 'border-gray-200 shadow-sm'
            }`}>
              <svg className="h-5 w-5 text-[#8B5CF6] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="업소, 지역, 키워드 검색"
                className="h-12 w-full bg-transparent px-3 text-[15px] text-[#111] outline-none placeholder-gray-400 [&::-webkit-search-cancel-button]:hidden"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }} className="shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>

          {/* 드롭다운 — 검색 결과 or 인기 검색어 */}
          {searchFocused && (
            <div className="absolute left-0 right-0 top-full z-[80] mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl animate-fade-in" style={{ maxHeight: 400, overflowY: 'auto' }}>
              {searchQuery.trim() && searchResults.length > 0 ? (
                <div className="py-2">
                  <p className="px-4 py-1.5 text-[11px] font-bold text-[#8B5CF6] tracking-wider">검색 결과</p>
                  {searchResults.map((v) => (
                    <Link
                      key={v.id || v.slug}
                      to={getCategoryHref(v.category, v.slug, v.region)}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => { setSearchFocused(false); setSearchQuery(''); }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3F0FF] text-sm font-bold text-[#8B5CF6]">
                        {v.nameKo.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-sm font-medium text-[#111] truncate">{v.nameKo}</p>
                        <p className="text-xs text-[#555] truncate">{v.regionKo} · {catLabel[v.category]}</p>
                      </div>
                    </Link>
                  ))}
                  <button
                    onClick={handleSearchSubmit}
                    className="w-full border-t border-gray-100 py-3 text-center text-sm font-medium text-[#8B5CF6] hover:bg-gray-50 transition"
                  >
                    "{searchQuery}" 전체 검색 결과 보기
                  </button>
                </div>
              ) : searchQuery.trim() && searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-[#555]">"{searchQuery}" 결과가 없습니다</p>
                  <p className="mt-1 text-xs text-gray-400">다른 키워드로 검색해 보세요</p>
                </div>
              ) : (
                <div className="py-3">
                  <p className="px-4 py-1.5 text-[11px] font-bold text-[#8B5CF6] tracking-wider">인기 검색어</p>
                  {['강남클럽', '홍대나이트', '일산룸', '강남호빠', '해운대', '압구정라운지', '일산요정', '부산나이트'].map((term, i) => (
                    <button
                      key={term}
                      onClick={() => { setSearchQuery(term); searchInputRef.current?.focus(); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${i < 3 ? 'bg-[#8B5CF6] text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                      <span className="text-sm text-[#111]">{term}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

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
              style={{ width: 140 }}
            >
              {/* 이미지 카드 — 1:1 정사각형 통일 */}
              <div className="relative rounded-xl overflow-hidden" style={{ width: 140, height: 140 }}>
                <img
                  src={`/venues/${v.slug}-1.jpg`}
                  alt={v.nameKo}
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  className="absolute inset-0 w-full h-full object-cover z-[1]"
                />
                {/* Fallback */}
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
                {/* 하단 업소명 — 솔리드 검정 배경 */}
                <div className="absolute bottom-0 left-0 right-0 z-[2] bg-black/75 px-2.5 py-2">
                  <p className="text-xs font-bold text-white truncate">{v.nameKo}</p>
                  <p className="text-[10px] text-white/90 truncate">{v.regionKo}</p>
                </div>
              </div>
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

      {/* ═══ VS 투표 — 실시간 배틀 ═══ */}
      <section className="px-4 py-3 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-[#111]">🆚 오늘의 VS 배틀</h2>
          <Link to="/vs" className="text-xs text-[#8B5CF6] font-medium">더 많은 투표 →</Link>
        </div>
        <div className="space-y-3">
          {todayPolls.map((poll, pi) => {
            const voted = vsVotes[pi];
            const aPct = voted ? (voted === poll.a ? Math.min(poll.aPct + 3, 99) : poll.aPct) : poll.aPct;
            const bPct = 100 - aPct;
            return (
              <div key={pi} className="rounded-2xl border border-[#8B5CF6]/15 bg-gradient-to-br from-white to-[#FAFAFE] p-4 shadow-sm">
                <p className="text-sm font-bold text-[#111] mb-3 text-center">{poll.q}</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* A 선택지 */}
                  <button
                    onClick={() => handleVsVote(pi, poll.a)}
                    disabled={!!voted}
                    className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                      voted === poll.a ? 'ring-2 ring-[#8B5CF6] shadow-lg scale-[1.02]' :
                      voted ? 'opacity-60' : 'hover:shadow-md active:scale-95'
                    }`}
                    style={{ minHeight: 70 }}
                  >
                    {voted && (
                      <div className="absolute inset-0 bg-[#8B5CF6]/10 rounded-xl">
                        <div className="absolute bottom-0 left-0 right-0 bg-[#8B5CF6]/20 transition-all duration-700 rounded-b-xl"
                          style={{ height: `${aPct}%` }} />
                      </div>
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full py-3">
                      <span className="text-2xl mb-1">{poll.aEmoji}</span>
                      <span className="text-sm font-bold text-[#111]">{poll.a}</span>
                      {voted && <span className="text-lg font-black text-[#8B5CF6] mt-1">{aPct}%</span>}
                    </div>
                  </button>
                  {/* B 선택지 */}
                  <button
                    onClick={() => handleVsVote(pi, poll.b)}
                    disabled={!!voted}
                    className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                      voted === poll.b ? 'ring-2 ring-[#EC4899] shadow-lg scale-[1.02]' :
                      voted ? 'opacity-60' : 'hover:shadow-md active:scale-95'
                    }`}
                    style={{ minHeight: 70 }}
                  >
                    {voted && (
                      <div className="absolute inset-0 bg-[#EC4899]/10 rounded-xl">
                        <div className="absolute bottom-0 left-0 right-0 bg-[#EC4899]/20 transition-all duration-700 rounded-b-xl"
                          style={{ height: `${bPct}%` }} />
                      </div>
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full py-3">
                      <span className="text-2xl mb-1">{poll.bEmoji}</span>
                      <span className="text-sm font-bold text-[#111]">{poll.b}</span>
                      {voted && <span className="text-lg font-black text-[#EC4899] mt-1">{bPct}%</span>}
                    </div>
                  </button>
                </div>
                {(() => {
                  const participants = Math.floor(300 + (pi * 137 + new Date().getDate() * 53) % 700);
                  return voted ? (
                    <p className="mt-2 text-xs text-center font-medium text-[#8B5CF6]">
                      <span className="font-bold">{voted === poll.a ? poll.a : poll.b}</span> 선택! · {participants.toLocaleString()}명 참여
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-center text-[#999]">터치해서 투표하세요 · {participants.toLocaleString()}명 참여 중</p>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ 오늘 밤 운세 — 카드 뒤집기 ═══ */}
      <section className="px-4 py-3 max-w-3xl mx-auto">
        <h2 className="text-base font-bold text-[#111] mb-2">🔮 오늘 밤 운세</h2>
        {!fortuneRevealed ? (
          <button
            onClick={() => setFortuneRevealed(true)}
            className="w-full rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-800 p-6 text-center transition-all hover:shadow-xl active:scale-[0.98] relative overflow-hidden"
            style={{ minHeight: 140 }}
          >
            <div className="absolute inset-0 opacity-20">
              {['✦', '✧', '⭑', '✫', '⋆'].map((s, i) => (
                <span key={i} className="absolute text-white animate-pulse" style={{
                  top: `${15 + (i * 17) % 70}%`, left: `${10 + (i * 23) % 80}%`,
                  fontSize: `${10 + i * 3}px`, animationDelay: `${i * 0.3}s`
                }}>{s}</span>
              ))}
            </div>
            <div className="relative z-10">
              <span className="text-4xl block mb-3">🔮</span>
              <p className="text-lg font-black text-white mb-1">터치해서 오늘의 운세 확인</p>
              <p className="text-xs text-white/60">매일 자정에 바뀌는 당신만의 밤 운세</p>
            </div>
          </button>
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-amber-50 border border-purple-200 p-5 animate-fade-in">
            {/* 헤더 */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{fortune.emoji}</span>
              <div>
                <p className="text-lg font-black text-[#111]">{fortune.title}</p>
                <p className="text-xs text-[#8B5CF6] font-bold">오늘의 밤 에너지</p>
              </div>
              <div className="ml-auto flex flex-col items-center">
                <span className="text-2xl font-black text-[#8B5CF6]">{fortuneScore}</span>
                <span className="text-[10px] text-[#555]">운세점수</span>
              </div>
            </div>
            {/* 운세 메시지 */}
            <p className="text-sm font-bold text-[#111] leading-relaxed mb-3 bg-white/60 rounded-xl p-3">{fortune.text}</p>
            {/* 운세 디테일 */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-xl bg-white/80 p-2.5 text-center">
                <p className="text-[10px] text-[#999] mb-0.5">행운의 장소</p>
                <p className="text-xs font-bold text-[#111]">{fortune.lucky}</p>
              </div>
              <div className="rounded-xl bg-white/80 p-2.5 text-center">
                <p className="text-[10px] text-[#999] mb-0.5">행운의 색</p>
                <p className="text-xs font-bold text-[#111]">{fortune.luckyColor}</p>
              </div>
              <div className="rounded-xl bg-white/80 p-2.5 text-center">
                <p className="text-[10px] text-[#999] mb-0.5">행운의 숫자</p>
                <p className="text-xs font-bold text-[#8B5CF6]">{fortune.luckyNum}</p>
              </div>
            </div>
            {/* 꿀팁 */}
            <div className="rounded-xl bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 p-3">
              <p className="text-xs font-bold text-[#8B5CF6] mb-1">💡 오늘의 꿀팁</p>
              <p className="text-sm text-[#333] leading-relaxed">{fortune.tip}</p>
            </div>
            {/* 다시 보기 */}
            <button onClick={() => setFortuneRevealed(false)} className="mt-3 w-full text-center text-xs text-[#999] py-2" style={{ minHeight: 32 }}>
              🔮 카드 다시 덮기
            </button>
          </div>
        )}
      </section>

      {/* ═══ FEED — 정렬 탭 ═══ */}
      <section className="mt-2 max-w-3xl mx-auto">
        {/* 정렬 탭 */}
        <div className="flex border-b border-gray-100">
          {feedTabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(i); if (i !== 3) setActiveRegion('all'); }}
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
        {/* 지역별 탭 선택 시에만 지역 필터 표시 */}
        {activeTab === 3 && (
          <div
            className="scrollbar-hide px-4 py-2 bg-gray-50/80"
            style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
              {regionLabels.map(r => (
                <button
                  key={r}
                  onClick={() => setActiveRegion(r === '전체' ? 'all' : r)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    (r === '전체' && activeRegion === 'all') || (r !== '전체' && activeRegion === r)
                      ? 'bg-[#8B5CF6] text-white shadow-sm'
                      : 'bg-white text-[#555] border border-gray-200'
                  }`}
                  style={{ minHeight: 32 }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ═══ VENUE FEED — 2 Column Cards ═══ */}
      <section className="px-4 py-4 max-w-3xl mx-auto">
        {/* 탭 라벨 */}
        {activeTab === 0 && <p className="text-xs font-medium text-[#8B5CF6] mb-3">평점 + 리뷰 수 기반 실시간 인기순</p>}
        {activeTab === 1 && <p className="text-xs font-medium text-[#8B5CF6] mb-3">최근 등록된 업소 순</p>}
        {activeTab === 2 && <p className="text-xs font-medium text-[#8B5CF6] mb-3">프리미엄 + 평점 높은 순 추천</p>}
        {activeTab === 3 && <p className="text-xs font-medium text-[#8B5CF6] mb-3">지역별로 한눈에 보기</p>}

        {/* 지역별 탭 — 지역 그룹 레이아웃 */}
        {activeTab === 3 && regionGroupedVenues ? (
          <div className="space-y-6">
            {regionGroupedVenues.map(([region, list]) => (
              <div key={region}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-[#111]">📍 {region}</h3>
                  <span className="text-xs text-[#999]">{list.length}곳</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {list.map(venue => (
                    <VenueCard key={venue.id} venue={venue} favorites={favorites} toggleFavorite={toggleFavorite} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 인기/신규/추천 — 일반 그리드 */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {feedVenues.map((venue, idx) => {
              const cards = [];

              cards.push(<VenueCard key={venue.id} venue={venue} favorites={favorites} toggleFavorite={toggleFavorite} rank={activeTab === 0 ? idx + 1 : undefined} />);

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
        )}

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
            { icon: '📖', title: '가이드', desc: '초보 필독', href: '/guide' },
            { icon: '🎰', title: '룰렛', desc: '행운 업소', href: '/roulette' },
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
