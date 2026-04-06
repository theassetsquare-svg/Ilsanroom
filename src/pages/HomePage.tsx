
import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { venues as localVenues, getPopularVenues } from '@/data/venues';
import type { Venue } from '@/types';
import JsonLd from '@/components/seo/JsonLd';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useEngagementStore } from '@/lib/engagement-store';

const InfiniteDiscoveryFeed = lazy(() => import('@/components/engagement/InfiniteDiscoveryFeed'));
const NightFortune = lazy(() => import('@/components/engagement/NightFortune'));
const PointBenefits = lazy(() => import('@/components/engagement/PointBenefits'));
const LivePulse = lazy(() => import('@/components/engagement/LivePulse'));
const MysteryCard = lazy(() => import('@/components/engagement/MysteryCard'));
const MatchQuiz = lazy(() => import('@/components/engagement/MatchQuiz'));
const PriceHeatmap = lazy(() => import('@/components/engagement/PriceHeatmap'));
const NightTimeline = lazy(() => import('@/components/engagement/NightTimeline'));

import CountdownTimer from '@/components/engagement/CountdownTimer';
import SoundWavePreview from '@/components/engagement/SoundWavePreview';
import EmojiReaction from '@/components/engagement/EmojiReaction';
import KakaoShareButton from '@/components/engagement/KakaoShareButton';
const StoryMode = lazy(() => import('@/components/engagement/StoryMode'));
const WeeklyTop5Share = lazy(() => import('@/components/engagement/WeeklyTop5Share'));

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

function getMonthlyVisitors(): string {
  const d = new Date();
  const n = 2400 + (d.getMonth() * 137 + d.getDate() * 3);
  return n.toLocaleString('ko-KR');
}

/* ── Category icons for Naver-style ── */
const categoryIcons = [
  { icon: '🎵', label: '나이트', href: '/nights', gradient: 'from-pink-400 to-pink-600' },
  { icon: '🎤', label: '클럽', href: '/clubs', gradient: 'from-violet-400 to-violet-600' },
  { icon: '🍸', label: '라운지', href: '/lounges', gradient: 'from-amber-400 to-amber-600' },
  { icon: '💃', label: '룸', href: '/rooms', gradient: 'from-indigo-400 to-indigo-700' },
  { icon: '🎶', label: '요정', href: '/yojeong', gradient: 'from-emerald-400 to-emerald-600' },
  { icon: '🥂', label: '호빠', href: '/hoppa', gradient: 'from-red-400 to-red-600' },
  { icon: '🔥', label: '실시간', href: '/ranking', gradient: 'from-orange-400 to-orange-600' },
  { icon: '🆚', label: 'VS', href: '/vs', gradient: 'from-blue-400 to-blue-600' },
  { icon: '🏆', label: '랭킹', href: '/ranking', gradient: 'from-yellow-400 to-yellow-600' },
];

/* ── Region bubbles ── */
const regionBubbles = [
  { label: '전체', value: 'all' },
  { label: '강남', value: '강남' },
  { label: '홍대', value: '홍대' },
  { label: '이태원', value: '이태원' },
  { label: '부산', value: '부산' },
  { label: '수원', value: '수원' },
  { label: '일산', value: '일산' },
  { label: '대전', value: '대전' },
  { label: '울산', value: '울산' },
  { label: '인천', value: '인천' },
];

/* ── Banner slides ── */
const bannerSlides = [
  { text: '🔥 지금 실시간 1위: 강남클럽 레이스', href: '/clubs/gangnam/cheongdamrace', color: 'from-violet-600 to-purple-700' },
  { text: '🆚 아르쥬 vs 레이스 — 당신의 선택은?', href: '/vs', color: 'from-blue-600 to-indigo-700' },
  { text: '🎰 오늘의 운세: 당신의 밤은?', href: '/roulette', color: 'from-amber-500 to-orange-600' },
  { text: '📢 신규 입점: 일산명월관요정', href: '/yojeong/ilsan/ilsanmyeongwolgwanyojeong', color: 'from-emerald-500 to-teal-600' },
];

/* ── VS Polls for engagement cards ── */
const vsPolls = [
  { q: '강남클럽 레이스 vs 아르쥬 — 어디가 더 좋아?', a: '레이스', b: '아르쥬' },
  { q: '금요일 밤, 클럽 vs 라운지?', a: '클럽', b: '라운지' },
  { q: '부산 vs 강남 — 밤문화 어디가 더 핫해?', a: '부산', b: '강남' },
];

/* ── Tabs ── */
const feedTabs = ['🔥실시간인기', '🆕오늘의신규', '⭐에디터추천', '📍내주변'] as const;

/* ══════════════════════════════════════════════════════ */
/*                    HOMEPAGE                            */
/* ══════════════════════════════════════════════════════ */

export default function HomePage() {
  useDocumentMeta('놀쿨 — 오늘 밤 어디 갈지, 여기서 정해진다', '클럽·나이트·룸·요정·호빠 전국 117곳 실시간 비교. 지역별 시세, 빈 자리, 솔직 후기까지 한 곳에.');

  // All open venues
  const openVenues = useMemo(() => localVenues.filter(v => v.status !== 'closed_or_unclear'), []);
  const popularVenues = getPopularVenues(20);

  // === SEARCH STATE ===
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Venue[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const engSearch = useEngagementStore((s) => s.search);

  const doSearch = useCallback((q: string) => {
    if (!q.trim()) { setSearchResults([]); setShowSearchResults(false); return; }
    engSearch();
    const lower = q.toLowerCase();
    const found = localVenues.filter(v => {
      if (v.status === 'closed_or_unclear') return false;
      return v.nameKo.toLowerCase().includes(lower) ||
        v.regionKo.toLowerCase().includes(lower) ||
        v.tags.some(t => t.toLowerCase().includes(lower));
    });
    setSearchResults(found.slice(0, 8));
    setShowSearchResults(true);
  }, [engSearch]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchResults(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // === BANNER STATE ===
  const [bannerIdx, setBannerIdx] = useState(0);
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    bannerTimerRef.current = setInterval(() => {
      setBannerIdx(prev => (prev + 1) % bannerSlides.length);
    }, 4000);
    return () => { if (bannerTimerRef.current) clearInterval(bannerTimerRef.current); };
  }, []);

  // === REGION FILTER ===
  const [activeRegion, setActiveRegion] = useState('all');

  // === TAB STATE ===
  const [activeTab, setActiveTab] = useState(0);

  // === STICKY STATES ===
  const [searchSticky, setSearchSticky] = useState(false);
  const searchSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setSearchSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (searchSentinelRef.current) observer.observe(searchSentinelRef.current);
    return () => observer.disconnect();
  }, []);

  // === FEED DATA ===
  const filteredVenues = useMemo(() => {
    let list = openVenues;
    if (activeRegion !== 'all') {
      list = list.filter(v => v.regionKo.includes(activeRegion));
    }
    return list;
  }, [openVenues, activeRegion]);

  const feedVenues = useMemo(() => {
    if (activeTab === 0) return filteredVenues.slice(0, 30); // 실시간인기
    if (activeTab === 1) return [...filteredVenues].reverse().slice(0, 30); // 오늘의신규
    if (activeTab === 2) return filteredVenues.filter(v => v.isPremium).concat(filteredVenues.filter(v => !v.isPremium)).slice(0, 30); // 에디터추천
    return filteredVenues.slice(0, 30); // 내주변
  }, [filteredVenues, activeTab]);

  // === VS Vote state ===
  const [vsVotes, setVsVotes] = useState<Record<number, string>>({});

  // === Viewer count (fake real-time) ===
  const viewerCounts = useRef<Record<string, number>>({});
  const getViewerCount = (id: string) => {
    if (!viewerCounts.current[id]) viewerCounts.current[id] = Math.floor(Math.random() * 40) + 5;
    return viewerCounts.current[id];
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

  // === Story Mode ===
  const [storyVenue, setStoryVenue] = useState<string | null>(null);

  // === Lucky Roulette ===
  const [rouletteResult, setRouletteResult] = useState<Venue | null>(null);
  const [rouletteSpinning, setRouletteSpinning] = useState(false);

  const spinRoulette = () => {
    if (rouletteSpinning) return;
    setRouletteSpinning(true);
    setRouletteResult(null);
    // Simulate spin for 1.5s then show result
    const timer = setTimeout(() => {
      const randomVenue = openVenues[Math.floor(Math.random() * openVenues.length)];
      setRouletteResult(randomVenue);
      setRouletteSpinning(false);
    }, 1500);
    // Cleanup handled by component unmount
    return () => clearTimeout(timer);
  };

  const monthlyVisitors = getMonthlyVisitors();

  return (
    <div className="bg-white min-h-screen">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'WebSite', name: '놀쿨',
        url: 'https://nolcool.com',
        potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: 'https://nolcool.com/map?q={search_term_string}' }, 'query-input': 'required name=search_term_string' },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'ItemList', name: '인기 매장',
        itemListElement: popularVenues.slice(0, 10).map((v, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'LocalBusiness', name: v.nameKo, address: v.address } })),
      }} />

      {/* ═══════ GREETING — Time-based ═══════ */}
      <section className="px-4 pt-6 pb-1 text-center max-w-2xl mx-auto">
        <p className="text-base text-[#555]">
          {(() => {
            const h = new Date().getHours();
            if (h >= 18 && h < 21) return '오늘 밤, 어디로 갈까? 🌙';
            if (h >= 21 || h < 4) return '지금이 딱 좋은 시간 🔥';
            if (h >= 4 && h < 12) return '오늘 밤을 미리 준비하자 ☀️';
            return '저녁이 기다려지는 시간 🌆';
          })()}
        </p>
      </section>

      {/* ═══════ HERO — SELL RESULTS, not features ═══════ */}
      <section className="px-4 pt-4 pb-3 text-center max-w-2xl mx-auto">
        <h1 className="text-[28px] font-black text-[#111] leading-[1.3] tracking-tight">
          오늘 밤, 3초 만에 정한다
        </h1>
        <p className="mt-2 text-base text-[#555]" style={{ lineHeight: 1.7 }}>
          매주 {(Math.floor(openVenues.length * 820)).toLocaleString('ko-KR')}명이 여기서 밤을 시작한다
        </p>
        <p className="mt-1 text-sm text-[#8B5CF6] font-medium">
          광고 리뷰 0건. 직접 가본 후기만.
        </p>
        <button
          onClick={() => searchInputRef.current?.focus()}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#8B5CF6] px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-200 transition-all hover:bg-[#7C3AED] active:scale-[0.97]"
          style={{ minHeight: 48 }}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          오늘 밤 갈 곳 찾기
        </button>
      </section>

      {/* ═══════ [1] LIVE PULSE — FOMO counter ═══════ */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <LivePulse />
        </Suspense>
      </ErrorBoundary>

      {/* ═══════ SOCIAL PROOF ═══════ */}
      <div className="flex flex-wrap justify-center gap-2 px-4 pb-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F0FF] px-3 py-1.5 text-xs font-medium text-[#8B5CF6]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          이번 달 {monthlyVisitors}명이 여기서 시작했다
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7ED] px-3 py-1.5 text-xs font-medium text-amber-700">
          만족도 4.7
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] px-3 py-1.5 text-xs font-medium text-green-700">
          실패율 3%
        </span>
      </div>

      {/* ═══════ PAIN → SOLUTION (Before/After) ═══════ */}
      <div className="px-4 pb-3 max-w-md mx-auto space-y-2">
        {/* BEFORE — Pain */}
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
          <p className="text-xs font-bold text-red-400 mb-2">BEFORE</p>
          <div className="space-y-1.5">
            <p className="text-sm text-[#767676] line-through">어디 가지? 30분 검색... 결국 별로</p>
            <p className="text-sm text-[#767676] line-through">후기 봤는데 다 광고. 진짜 어딘지 모름</p>
            <p className="text-sm text-[#767676] line-through">갔다가 분위기 최악. 시간·돈 낭비</p>
          </div>
        </div>
        {/* AFTER — Solution */}
        <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-white border border-violet-200 p-4">
          <p className="text-xs font-bold text-[#8B5CF6] mb-2">AFTER — 놀쿨에서 고르면</p>
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-[#111]">3초 만에 결정. 고민 끝.</p>
            <p className="text-sm font-bold text-[#111]">직접 가본 사람 후기만. 광고 0건.</p>
            <p className="text-sm font-bold text-[#111]">한번 가면 단골. 실패율 3%.</p>
          </div>
        </div>
      </div>

      {/* ═══════ SEARCH BAR (becomes sticky) ═══════ */}
      <div ref={searchSentinelRef} />
      <div
        ref={searchRef}
        className={`px-4 py-2 z-40 transition-all ${searchSticky ? 'fixed top-14 left-0 right-0 bg-white shadow-sm border-b border-gray-100' : ''}`}
      >
        <div className="relative max-w-2xl mx-auto">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery.trim()) setShowSearchResults(true); }}
            placeholder="어디서 놀까? 가게이름, 지역 검색"
            className="w-full rounded-3xl border-2 border-[#8B5CF6] bg-white py-3 pl-11 pr-4 text-base text-[#111] placeholder-[#888] outline-none"
            style={{ height: 48, WebkitAppearance: 'none' }}
          />

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
              {searchResults.map(v => (
                <Link
                  key={v.id}
                  to={getCategoryHref(v.category, v.slug, v.region)}
                  onClick={() => { setShowSearchResults(false); setSearchQuery(''); }}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 active:bg-gray-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F0FF] text-sm font-bold text-[#8B5CF6]">
                    {v.nameKo.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#111] truncate">{v.nameKo}</p>
                    <p className="text-xs text-[#555]">{v.regionKo} · {catLabel[v.category]}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {showSearchResults && searchQuery.trim() && searchResults.length === 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-xl">
              <p className="text-sm text-[#555]">검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ AUTO-SLIDE BANNER ═══════ */}
      <section className="px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <Link
            to={bannerSlides[bannerIdx].href}
            className={`block rounded-2xl bg-gradient-to-r ${bannerSlides[bannerIdx].color} px-5 py-4 transition-all`}
          >
            <p className="text-sm font-bold text-white">{bannerSlides[bannerIdx].text}</p>
          </Link>
          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-2">
            {bannerSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? 'w-4 bg-[#8B5CF6]' : 'w-1.5 bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ RESULT CARDS — 3 key values ═══════ */}
      <section className="px-4 py-3 max-w-2xl mx-auto">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '🔍', title: '비교', desc: '시세·서비스 한눈에', href: '/compare' },
            { icon: '📍', title: '내 근처', desc: '지금 갈 수 있는 곳', href: '/map' },
            { icon: '🏆', title: '실시간 순위', desc: '오늘 TOP 10', href: '/ranking' },
          ].map(card => (
            <Link
              key={card.title}
              to={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
              style={{ minHeight: 44 }}
            >
              <span className="text-xl">{card.icon}</span>
              <span className="text-sm font-bold text-[#111]">{card.title}</span>
              <span className="text-xs text-[#555]">{card.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ CATEGORY ICONS — Horizontal scroll ═══════ */}
      <section className="py-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4" style={{ minWidth: 'max-content' }}>
          {categoryIcons.map(cat => (
            <Link target="_blank" rel="noopener noreferrer" key={cat.label} to={cat.href} className="flex flex-col items-center gap-1.5 min-w-[56px]">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.gradient} text-2xl shadow-sm`}>
                {cat.icon}
              </div>
              <span className="text-xs font-semibold text-[#333]">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ REGION BUBBLES — Horizontal scroll ═══════ */}
      <section className="py-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-4" style={{ minWidth: 'max-content' }}>
          {regionBubbles.map(r => (
            <button
              key={r.value}
              onClick={() => setActiveRegion(r.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                activeRegion === r.value
                  ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-200'
                  : 'border border-gray-300 bg-white text-[#555]'
              }`}
              style={{ minHeight: 36 }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>

      {/* ═══════ TAB SECTION ═══════ */}
      <section className="border-b border-gray-100 mt-1">
        <div className="flex">
          {feedTabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-3 text-center text-sm font-medium transition-all relative ${
                activeTab === i ? 'text-[#8B5CF6] font-bold' : 'text-[#555]'
              }`}
              style={{ minHeight: 44 }}
            >
              {tab}
              {activeTab === i && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-[3px] rounded-full bg-[#8B5CF6]" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ═══════ HOME FEED — 2 Column Card Grid (PC: 3-4col) ═══════ */}
      <section className="px-4 py-4 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {feedVenues.map((venue, idx) => {
            const cards = [];

            // Regular venue card
            cards.push(
              <div key={venue.id} className="relative">
                <Link target="_blank" rel="noopener noreferrer" to={getCategoryHref(venue.category, venue.slug, venue.region)} className="block">
                  <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform hover:scale-[1.02]">
                    {/* Photo — 모든 카드 100% 동일 크기 */}
                    <div className="relative w-full bg-gray-200" style={{ aspectRatio: '4/3' }}>
                      <img
                        src={`/venues/${venue.slug}-1.jpg`}
                        alt={venue.nameKo}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                      />
                      {/* 이미지 로드 실패 시 가게이름 표시 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-400">{venue.nameKo.charAt(0)}</span>
                      </div>
                      {/* Region badge */}
                      <span className="absolute top-2 left-2 z-10 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#111] shadow-sm">
                        {venue.regionKo}
                      </span>
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-base font-bold text-[#111] leading-tight line-clamp-1">{venue.nameKo}</h3>
                      <p className="mt-1 text-xs text-[#555] line-clamp-1">{venue.shortDescription}</p>
                      {/* Real-time viewer + Sound Wave [5] */}
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                          </span>
                          <span className="text-xs text-red-500 font-medium">지금 {getViewerCount(venue.id)}명 보는 중</span>
                        </div>
                        <SoundWavePreview category={venue.category} />
                      </div>
                      {/* [3] Countdown Timer — on popular venues */}
                      {venue.isPremium && <div className="mt-1.5"><CountdownTimer venueName={venue.nameKo} /></div>}
                      {/* [9] Emoji Reactions */}
                      <EmojiReaction venueId={venue.id} />
                      {/* VIRAL — KakaoShare + Story */}
                      <div className="mt-1.5 flex items-center justify-between">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStoryVenue(venue.nameKo); }}
                          className="flex items-center gap-1 text-[10px] text-[#8B5CF6] font-medium hover:underline"
                          style={{ minHeight: 24 }}
                        >
                          📸 스토리
                        </button>
                        <KakaoShareButton
                          compact
                          venueName={venue.nameKo}
                          venueHref={getCategoryHref(venue.category, venue.slug, venue.region)}
                          description={venue.shortDescription}
                        />
                      </div>
                      {/* Zeigarnik — curiosity gap */}
                      <p className="mt-1 text-[10px] text-[#8B5CF6] font-medium truncate">
                        이 업소의 비밀은...
                      </p>
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

            // Every 5th card — VS VOTE
            if ((idx + 1) % 5 === 0) {
              const poll = vsPolls[Math.floor(idx / 5) % vsPolls.length];
              const voted = vsVotes[idx];
              cards.push(
                <div key={`eng-${idx}`} className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-xl bg-gradient-to-r from-[#EEF2FF] to-[#F3F0FF] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  <p className="text-xs font-bold text-[#8B5CF6] mb-2">🆚 VS 투표</p>
                  <p className="text-sm font-bold text-[#111] mb-3">{poll.q}</p>
                  <div className="grid grid-cols-2 gap-2 max-w-md">
                    {[poll.a, poll.b].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setVsVotes(prev => ({ ...prev, [idx]: opt }))}
                        disabled={!!voted}
                        className={`rounded-xl py-3 text-sm font-bold transition-all ${
                          voted === opt ? 'bg-[#8B5CF6] text-white' :
                          voted ? 'bg-white/60 text-[#999]' :
                          'bg-white text-[#333] hover:bg-[#8B5CF6] hover:text-white active:bg-[#8B5CF6] active:text-white'
                        }`}
                        style={{ minHeight: 44 }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {voted && (
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-[#8B5CF6]">
                        {Math.floor(Math.random() * 30 + 35)}% vs {Math.floor(Math.random() * 30 + 35)}% — 참여 완료!
                      </p>
                    </div>
                  )}
                </div>
              );
            }

            // Every 7th card — [2] MYSTERY CARD
            if ((idx + 1) % 7 === 0) {
              cards.push(
                <ErrorBoundary key={`mystery-${idx}`}>
                  <Suspense fallback={null}>
                    <MysteryCard />
                  </Suspense>
                </ErrorBoundary>
              );
            }

            // Every 8th card — FORTUNE 운세 (밝은 배경 + 어두운 글자)
            if ((idx + 1) % 8 === 0) {
              cards.push(
                <div key={`fortune-${idx}`} className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  <p className="text-xs font-bold text-amber-700 mb-2">🔮 오늘 밤 운세</p>
                  <p className="text-sm font-bold text-[#111] mb-3">별들이 당신의 밤을 예고합니다...</p>
                  <Link target="_blank" rel="noopener noreferrer" to="/roulette" className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 active:bg-amber-600" style={{ minHeight: 44 }}>
                    운세 보기 →
                  </Link>
                </div>
              );
            }

            // Every 12th card — EDITORIAL
            if ((idx + 1) % 12 === 0) {
              cards.push(
                <div key={`editorial-${idx}`} className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-xl bg-gradient-to-r from-violet-50 to-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  <p className="text-xs font-bold text-[#8B5CF6] mb-2">🔥 에디터 Pick</p>
                  <p className="text-sm font-bold text-[#111]">이번주 TOP5 변동</p>
                  <div className="mt-2 space-y-1">
                    {popularVenues.slice(0, 5).map((v, i) => (
                      <Link target="_blank" rel="noopener noreferrer" key={v.id} to={getCategoryHref(v.category, v.slug, v.region)} className="flex items-center gap-2 py-1">
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

        {/* Skeleton / Loading indicator */}
        {feedVenues.length === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl bg-gray-100 animate-pulse">
                <div className="aspect-[4/3]" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══════ [10] NIGHT TIMELINE ═══════ */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <NightTimeline />
        </Suspense>
      </ErrorBoundary>

      {/* ═══════ [8] PRICE HEATMAP ═══════ */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <PriceHeatmap />
        </Suspense>
      </ErrorBoundary>

      {/* ═══════ LUCKY ROULETTE ═══════ */}
      <section className="px-4 py-6 max-w-[1200px] mx-auto">
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 p-6 text-center overflow-hidden relative">
          <div className="relative">
            <p className="text-2xl mb-1">🎰</p>
            <h2 className="text-lg font-bold text-[#111] mb-1">Lucky Roulette</h2>
            <p className="text-sm text-[#555] mb-4">오늘 밤 여기 어때? 탭해서 돌려봐!</p>
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
              <>
                <Link
                  to={getCategoryHref(rouletteResult.category, rouletteResult.slug, rouletteResult.region)}
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
                  <p className="mt-2 text-sm text-[#555] line-clamp-1">{rouletteResult.shortDescription}</p>
                </Link>
                <div className="mt-3">
                  <KakaoShareButton
                    venueName={rouletteResult.nameKo}
                    venueHref={getCategoryHref(rouletteResult.category, rouletteResult.slug, rouletteResult.region)}
                    description="놀쿨 룰렛에서 뽑힌 곳! 오늘 밤 여기 어때?"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ═══════ VIRAL — Weekly TOP5 Share ═══════ */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <WeeklyTop5Share />
        </Suspense>
      </ErrorBoundary>

      {/* ═══════ INFINITE DISCOVERY FEED ═══════ */}
      <ErrorBoundary>
        <Suspense fallback={<div className="px-4 py-8"><div className="h-48 animate-pulse rounded-2xl bg-gray-100" /></div>}>
          <InfiniteDiscoveryFeed />
        </Suspense>
      </ErrorBoundary>

      {/* ═══════ NIGHT FORTUNE ═══════ */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <NightFortune />
        </Suspense>
      </ErrorBoundary>

      {/* ═══════ POINT BENEFITS ═══════ */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <PointBenefits />
        </Suspense>
      </ErrorBoundary>

      {/* ═══════ GOOGLE/AI CTA ═══════ */}
      <section className="px-4 py-6 max-w-[1200px] mx-auto">
        <div className="rounded-2xl bg-violet-50 border border-violet-200 px-6 py-5 text-center">
          <p className="text-sm font-bold text-[#111]">
            구글 · ChatGPT · Gemini에서 <span className="text-lg font-black text-[#8B5CF6]">"놀쿨"</span> 검색하세요
          </p>
        </div>
      </section>

      {/* ═══════ SEO TEXT ═══════ */}
      <section className="px-4 pb-8 max-w-[1200px] mx-auto">
        <div className="rounded-2xl border border-gray-100 bg-[#F5F5F5] p-6">
          <h2 className="mb-3 text-base font-bold text-[#111]">카테고리별 특징과 이용 팁</h2>
          <div className="space-y-3 text-sm leading-relaxed text-[#555]">
            <p>
              고양시 중심가에서 프라이빗한 모임 공간을 찾는 분들에게 인기 있는 곳부터,
              장항로에 위치한 전통 한정식 문화 공간까지 비즈니스 접대와 기념일 행사에 적합한 곳이 모여 있습니다.
            </p>
            <p>
              EDM 중심의 댄스홀과 소셜 댄스 기반의 사교장은 완전히 다른 업종입니다.
              전자는 DJ 세트에 맞춰 자유롭게 즐기는 공간이고,
              후자는 밴드 라이브와 파트너 댄스 문화가 중심인 사교 공간입니다.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════ [6] MATCH QUIZ — floating button ═══════ */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <MatchQuiz />
        </Suspense>
      </ErrorBoundary>

      {/* ═══════ [7] STORY MODE — full screen overlay ═══════ */}
      {storyVenue && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <StoryMode venueName={storyVenue} onClose={() => setStoryVenue(null)} />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
