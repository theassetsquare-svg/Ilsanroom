
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from '../components/ui/SafeLink';
import { Search } from 'lucide-react';
import { venues as allVenues } from '@/data/venues';
import type { Venue } from '@/types';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { escapeHtml } from '@/lib/sanitize-html';
import { trackEvent } from '@/lib/visitor-tracker';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { ReadFinishCount } from '@/components/engagement/ReadingEngagement';
import { hasVenueImage } from '@/data/venue-image-manifest';

/* ── 카테고리 설정 ── */
const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const catEmoji: Record<string, string> = { club: '🎵', night: '🌙', lounge: '🍸', room: '🚪', yojeong: '🏮', hoppa: '🥂' };
const fallbackGradient: Record<string, string> = {
  club: 'from-violet-500 to-indigo-700', night: 'from-blue-500 to-purple-700',
  lounge: 'from-amber-500 to-orange-700', room: 'from-rose-500 to-pink-700',
  yojeong: 'from-emerald-500 to-teal-700', hoppa: 'from-pink-500 to-rose-700',
};

const CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'club', label: '클럽' },
  { key: 'night', label: '나이트' },
  { key: 'lounge', label: '라운지' },
  { key: 'room', label: '룸' },
  { key: 'yojeong', label: '요정' },
  { key: 'hoppa', label: '호빠' },
];

const CATEGORY_KEYWORDS: Record<string, string> = {
  '클럽': 'club', '클럽스': 'club', '나이트': 'night', '나이트클럽': 'night',
  '라운지': 'lounge', '바': 'lounge', '룸': 'room',
  '요정': 'yojeong', '한정식': 'yojeong', '호빠': 'hoppa', '호스트바': 'hoppa',
  '고구려': 'night',
};

const REGION_SET = new Set(allVenues.map(v => v.regionKo));

function getCategoryPath(venue: Venue): string {
  const pathMap: Record<string, string> = {
    club: '/clubs', night: '/nights', lounge: '/lounges',
    room: '/rooms', yojeong: '/yojeong', hoppa: '/hoppa',
  };
  const base = pathMap[venue.category] || '/venues';
  if (['club', 'room', 'yojeong'].includes(venue.category)) {
    return `${base}/${venue.region}/${venue.slug}`;
  }
  return `${base}/${venue.slug}`;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '').replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
}

function smartSearch(query: string, categoryFilter: string): { results: Venue[]; total: number } {
  const q = query.trim();
  if (!q && categoryFilter === 'all') {
    const sorted = [...allVenues].filter(v => v.status !== 'closed_or_unclear')
      .sort((a, b) => (b.isPremium ? 50 : 0) + b.rating * 10 - ((a.isPremium ? 50 : 0) + a.rating * 10));
    return { results: sorted, total: sorted.length };
  }

  const qNorm = normalize(q);
  let detectedCategory = categoryFilter !== 'all' ? categoryFilter : '';
  let regionTokens: string[] = [];
  let remainingTokens: string[] = [];

  let residual = qNorm;
  for (const [keyword, catCode] of Object.entries(CATEGORY_KEYWORDS).sort((a, b) => b[0].length - a[0].length)) {
    const kNorm = normalize(keyword);
    if (residual.includes(kNorm)) {
      if (!detectedCategory) detectedCategory = catCode;
      residual = residual.replace(kNorm, '');
    }
  }

  if (residual) {
    for (const region of REGION_SET) {
      const rNorm = normalize(region);
      if (residual.includes(rNorm) || rNorm.includes(residual)) {
        regionTokens.push(rNorm);
      }
    }
    if (residual.length > 0) remainingTokens.push(residual);
  }

  const openVenues = allVenues.filter(v => v.status !== 'closed_or_unclear');

  const scored = openVenues.map(v => {
    let score = 0;
    const nameKo = normalize(v.nameKo || '');
    const nameEn = normalize(v.name || '');
    const rKo = normalize(v.regionKo || '');
    const allText = [nameKo, nameEn, rKo, ...((v.tags || []).map(normalize)), ...((v.features || []).map(normalize))].join(' ');

    if (nameKo === qNorm) score += 1000;
    else if (nameKo.startsWith(qNorm)) score += 600;
    else if (nameKo.includes(qNorm)) score += 300;
    if (nameEn.includes(qNorm)) score += 200;

    if (v.tags?.some(t => normalize(t) === qNorm)) score += 500;
    if (v.tags?.some(t => normalize(t).includes(qNorm))) score += 150;

    if (detectedCategory && v.category === detectedCategory) score += 200;

    if (regionTokens.length > 0) {
      if (regionTokens.some(rt => rKo === rt)) score += 300;
      else if (regionTokens.some(rt => rKo.includes(rt) || rt.includes(rKo))) score += 150;
    }

    for (const token of remainingTokens) {
      if (token.length < 1) continue;
      if (nameKo.includes(token)) score += 200;
      if (rKo.includes(token)) score += 150;
      if (allText.includes(token)) score += 50;
    }

    if (allText.includes(qNorm)) score += 30;

    if (qNorm.length >= 2) {
      for (let len = Math.min(qNorm.length, nameKo.length); len >= 2; len--) {
        for (let i = 0; i <= qNorm.length - len; i++) {
          const sub = qNorm.substring(i, i + len);
          if (nameKo.includes(sub)) {
            score += len * 20;
            break;
          }
        }
        if (score > 0) break;
      }
    }

    if (v.isPremium) score += 30;
    score += (v.rating || 0) * 3;

    return { venue: v, score };
  });

  let filtered = scored;
  if (categoryFilter !== 'all') {
    filtered = filtered.filter(s => s.venue.category === categoryFilter);
  }

  filtered = filtered.filter(s => s.score > 0).sort((a, b) => b.score - a.score);

  return { results: filtered.map(s => s.venue), total: filtered.length };
}

function getSuggestions(query: string): string[] {
  if (!query.trim() || query.length < 1) return [];
  const q = normalize(query);
  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const v of allVenues) {
    if (suggestions.length >= 8) break;
    const nk = normalize(v.nameKo);
    if (nk.includes(q) || q.split('').every(c => nk.includes(c))) {
      if (!seen.has(v.nameKo)) {
        seen.add(v.nameKo);
        suggestions.push(v.nameKo);
      }
    }
  }

  for (const region of REGION_SET) {
    if (suggestions.length >= 8) break;
    const rn = normalize(region);
    if (rn.includes(q) || q.includes(rn)) {
      for (const [label] of Object.entries(catLabel)) {
        const combo = `${region}${catLabel[label]}`;
        if (!seen.has(combo)) {
          seen.add(combo);
          suggestions.push(combo);
          if (suggestions.length >= 8) break;
        }
      }
    }
  }

  for (const v of allVenues) {
    if (suggestions.length >= 8) break;
    for (const tag of v.tags || []) {
      if (suggestions.length >= 8) break;
      if (normalize(tag).includes(q) && !seen.has(tag)) {
        seen.add(tag);
        suggestions.push(tag);
      }
    }
  }

  return suggestions.slice(0, 8);
}

/* ── 인기 검색어 ── */
const TRENDING = ['강남클럽', '일산룸', '홍대나이트', '해운대클럽', '강남라운지', '부산호빠', '이태원', '압구정'];

/* ── 검색박스 placeholder 회전 — 막막함 → 영감 ── */
const PLACEHOLDER_HINTS = [
  '오늘 강남 갈만한 곳',
  '혼자 가도 되는 라운지',
  '주말 사람 많은 클럽',
  '일산 양주 라인업 좋은 룸',
  '홍대 새벽까지 영업하는 곳',
  '분위기 좋은 압구정 라운지',
  '부산 해운대 핫스팟',
  '강남 단골 많은 곳',
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'all';

  const [inputValue, setInputValue] = useState(queryParam);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLFormElement>(null);

  useDocumentMeta(
    queryParam ? `"${queryParam}" 검색 결과 — 지금 뜨는 곳 총정리` : '이름만 치면 바로 나온다, 통합 검색',
    queryParam
      ? `'${queryParam}' 관련 강남 홍대 이태원 일산 부산 핫스팟 검색 결과. 업종·지역·분위기 비교까지 한눈에 확인.`
      : '지역·업종·이름·분위기 아무거나 입력하면 120곳 중 딱 맞는 곳. 자동완성·오타 보정·인기 검색어 추천까지 통합 검색 엔진.'
  );

  const { results, total } = useMemo(() => smartSearch(queryParam, categoryParam), [queryParam, categoryParam]);
  const suggestions = useMemo(() => getSuggestions(inputValue), [inputValue]);

  /* 실제 검색(URL 확정 쿼리)을 GA4로 전달 — 무엇을 찾는지/무엇이 없어서 못 찾는지 수집.
   * search_no_result = 사용자가 원하는데 사이트에 없는 페이지 = 만들어야 할 1순위 신호. */
  useEffect(() => {
    const q = queryParam.trim();
    if (!q) return;
    trackEvent('search', { search_term: q, results: total });
    if (total === 0) trackEvent('search_no_result', { search_term: q });
  }, [queryParam, total]);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  useEffect(() => {
    try { setRecentSearches(JSON.parse(localStorage.getItem('recentSearches') || '[]')); } catch {}
  }, []);

  /* placeholder 회전 — 4초마다 다음 힌트, 입력값 있으면 정지 */
  const [hintIdx, setHintIdx] = useState(0);
  useEffect(() => {
    if (inputValue) return;
    const id = setInterval(() => {
      setHintIdx((i) => (i + 1) % PLACEHOLDER_HINTS.length);
    }, 4000);
    return () => clearInterval(id);
  }, [inputValue]);

  useEffect(() => { setInputValue(queryParam); }, [queryParam]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = (q: string, cat?: string) => {
    const trimmed = q.trim();
    setShowSuggestions(false);
    if (trimmed) {
      setSearchParams({ q: trimmed, category: cat || categoryParam });
      try {
        const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 8);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
        setRecentSearches(updated);
      } catch {}
    } else {
      setSearchParams({ category: cat || categoryParam });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(inputValue);
  };

  const removeRecent = (term: string) => {
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    try { localStorage.setItem('recentSearches', JSON.stringify(updated)); } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ═══ HERO — 검색 강조 ═══ */}
      <div className="bg-gradient-to-b from-[#0A0118] via-[#1a0a2e] to-[#0f0720] pb-6">
        <div className="mx-auto max-w-3xl px-4 pt-10 pb-4 text-center">
          <h1 className="text-2xl font-black text-white mb-2">어디 찾고 있어?</h1>
          <p className="text-sm text-white/50 mb-4" style={{ lineHeight: '1.7' }}>
            업소명, 지역, 키워드 아무거나 입력해봐
          </p>
          <div className="flex items-center justify-center gap-3">
            <PageLiveCounter pageName="검색 중" baseCount={52} className="text-white/60 [&_strong]:text-white" />
          </div>
        </div>
      </div>

      {/* ── 검색 바 (sticky) ── */}
      <div className="sticky top-[92px] md:top-[56px] z-40 bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <form onSubmit={handleSubmit} role="search" className="relative" ref={suggestRef}>
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="search"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={`예: ${PLACEHOLDER_HINTS[hintIdx]}`}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-10 text-[16px] outline-none transition-all focus:border-[#8B5CF6] focus:bg-white focus:ring-4 focus:ring-[#8B5CF6]/10 [&::-webkit-search-cancel-button]:hidden"
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                />
                {inputValue && (
                  <button type="button" onClick={() => { setInputValue(''); inputRef.current?.focus(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button type="submit" className="h-12 shrink-0 rounded-xl bg-[#8B5CF6] px-5 text-sm font-bold text-white shadow-lg shadow-purple-200 active:scale-95" style={{ minHeight: 48 }}>
                검색
              </button>
            </div>

            {/* ── 자동완성 드롭다운 ── */}
            {showSuggestions && (inputValue.trim() ? suggestions.length > 0 : (recentSearches.length > 0)) && (
              <div className="absolute left-0 right-0 top-full mt-1 rounded-xl bg-white shadow-2xl border border-gray-100 overflow-hidden z-50">
                {inputValue.trim() ? (
                  <>
                    <div className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase">추천 검색어</div>
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => { setInputValue(s); doSearch(s); }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-sm text-gray-700"
                        style={{ minHeight: 44 }}>
                        <Search className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                        <span dangerouslySetInnerHTML={{ __html: highlightMatch(s, inputValue) }} />
                      </button>
                    ))}
                  </>
                ) : recentSearches.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-[11px] font-bold text-gray-400 uppercase">최근 검색어</span>
                      <button onClick={() => { setRecentSearches([]); try { localStorage.removeItem('recentSearches'); } catch {} }}
                        className="text-[11px] text-gray-400 hover:text-gray-600" style={{ minHeight: 44 }}>전체삭제</button>
                    </div>
                    {recentSearches.map((s, i) => (
                      <div key={i} className="flex items-center hover:bg-gray-50 transition">
                        <button onClick={() => { setInputValue(s); doSearch(s); }}
                          className="flex-1 text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700"
                          style={{ minHeight: 44 }}>
                          <svg className="h-3.5 w-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {s}
                        </button>
                        <button onClick={() => removeRecent(s)} className="px-3 py-2 text-gray-300 hover:text-gray-500" style={{ minHeight: 44 }}>
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </>
                ) : null}
              </div>
            )}
          </form>

          {/* ── 카테고리 탭 ── */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => doSearch(queryParam, cat.key)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  categoryParam === cat.key
                    ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={{ minHeight: 44 }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* 검색 결과 헤더 */}
        {queryParam && (
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              <span className="text-[#8B5CF6]">"{queryParam}"</span> 검색 결과
            </h2>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-xs text-gray-500">총 {total}개</span>
            </div>
          </div>
        )}

        {/* ── 검색 결과 그리드 ── */}
        {results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.map((venue) => (
              <Link key={venue.id || venue.slug} to={getCategoryPath(venue)} className="block">
                <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform hover:scale-[1.02]">
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1/1' }}>
                    {hasVenueImage(venue.slug) && (
                      <img src={`/venues/${venue.slug}-1.webp?v3`} alt={venue.nameKo} loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover z-[1]"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${fallbackGradient[venue.category] || 'from-gray-500 to-gray-700'}`}>
                      <span className="text-3xl">{catEmoji[venue.category] || '🎵'}</span>
                      <span className="mt-1 text-xs font-bold text-white/80">{venue.nameKo.slice(0, 4)}</span>
                    </div>
                    {venue.isPremium && (
                      <span className="absolute top-2 left-2 z-[2] rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-sm">PREMIUM</span>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 z-[2] bg-black/75 px-2.5 py-2">
                      <h3 className="text-sm font-bold text-white leading-tight truncate">{venue.nameKo}</h3>
                      <p className="text-[11px] text-white/90 truncate">{catLabel[venue.category] || venue.category} · {venue.regionKo}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : queryParam ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">"{queryParam}" 결과가 없네</h3>
            <p className="mt-1 text-sm text-gray-500">못 찾으면 큐레이션부터 둘러봐 — 4가지 추천</p>
            <div className="mt-6 grid grid-cols-2 gap-2 max-w-md mx-auto">
              <Link to="/tonight" className="flex items-center justify-center gap-2 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-3 py-3 text-sm font-bold text-[#111] active:scale-95">
                🌙 오늘 밤
              </Link>
              <Link to="/weekend" className="flex items-center justify-center gap-2 rounded-xl bg-[#EC4899]/10 border border-[#EC4899]/20 px-3 py-3 text-sm font-bold text-[#111] active:scale-95">
                📅 이번 주말
              </Link>
              <Link to="/occasion" className="flex items-center justify-center gap-2 rounded-xl bg-[#FCD34D]/10 border border-[#FCD34D]/30 px-3 py-3 text-sm font-bold text-[#111] active:scale-95">
                🎯 상황별
              </Link>
              <Link to="/budget" className="flex items-center justify-center gap-2 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-3 text-sm font-bold text-[#111] active:scale-95">
                💼 예산별
              </Link>
            </div>
            <button onClick={() => { setInputValue(''); setSearchParams({}); }}
              className="mt-6 text-sm text-gray-400 underline" style={{ minHeight: 44 }}>
              아니면 전체 업소 보기
            </button>
          </div>
        ) : null}

        {/* ── 검색 전 화면 ── */}
        {!queryParam && (
          <>
            {/* 인기 검색어 — 강조 */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🔥</span>
                <h3 className="text-sm font-bold text-gray-900">실시간 인기 검색어</h3>
                <span className="ml-auto text-[10px] text-[#8B5CF6] font-medium">지금 뜨는 키워드</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TRENDING.map((tag, i) => (
                  <button key={tag} onClick={() => { setInputValue(tag); doSearch(tag); }}
                    className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 text-left transition-all hover:bg-gray-100 active:scale-[0.98]"
                    style={{ minHeight: 44 }}>
                    <span className={`text-xs font-bold w-5 text-center ${i < 3 ? 'text-[#8B5CF6]' : 'text-gray-400'}`}>{i + 1}</span>
                    <span className="text-sm font-medium text-gray-800">{tag}</span>
                    {i < 3 && <span className="ml-auto text-[10px] text-red-400 font-bold">HOT</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 카테고리 바로가기 */}
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
              <h3 className="mb-3 text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>📂</span> 카테고리별 찾기
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {CATEGORIES.filter(c => c.key !== 'all').map(cat => (
                  <button key={cat.key} onClick={() => doSearch('', cat.key)}
                    className="flex flex-col items-center gap-1.5 rounded-xl bg-gray-50 py-4 transition hover:bg-gray-100 active:scale-95"
                    style={{ minHeight: 80 }}>
                    <span className="text-2xl">{catEmoji[cat.key]}</span>
                    <span className="text-xs font-bold text-gray-700">{cat.label}</span>
                    <span className="text-[10px] text-gray-400">{allVenues.filter(v => v.category === cat.key).length}개</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 하단 */}
            <div className="mt-8 text-center">
              <ReadFinishCount pageName="검색 페이지" baseCount={200} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function highlightMatch(text: string, query: string): string {
  const safe = escapeHtml(text);
  if (!query.trim()) return safe;
  const escaped = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${escaped})`, 'gi'), '<strong class="text-[#8B5CF6]">$1</strong>');
}
