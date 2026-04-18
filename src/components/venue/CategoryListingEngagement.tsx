import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Venue } from '@/types';

// ── Category Hero ──
interface CategoryHeroProps {
  emoji: string;
  title: string;
  hook: string;
  venueCount: number;
  gradient: string; // tailwind gradient classes
  accentColor: string; // e.g. 'violet', 'blue', 'amber'
}

export function CategoryHero({ emoji, title, hook, venueCount, gradient, accentColor }: CategoryHeroProps) {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const daySeed = now.getFullYear() * 400 + (now.getMonth() + 1) * 32 + now.getDate();
    const base = 18 + (daySeed % 30);
    const hourMultiplier = hour >= 20 || hour < 4 ? 3.2 : hour >= 17 ? 2.1 : hour >= 12 ? 1.4 : 0.8;
    const initial = Math.floor(base * hourMultiplier);
    setViewerCount(initial);

    const interval = setInterval(() => {
      setViewerCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(initial - 5, Math.min(initial + 12, prev + delta));
      });
    }, 4000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 sm:p-8`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 opacity-10 text-[120px] leading-none select-none pointer-events-none">
        {emoji}
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{emoji}</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{title}</h2>
        </div>
        <p className="text-lg sm:text-xl text-white/90 font-medium mb-4 max-w-2xl leading-relaxed">
          {hook}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-sm font-bold text-white">
            {venueCount}개 업소
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-sm font-bold text-white">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            지금 {viewerCount}명 보는 중
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Featured #1 Venue Card ──
interface FeaturedVenueProps {
  venue: Venue;
  href: string;
  accentColor: string;
  categoryLabel: string;
}

export function FeaturedVenueCard({ venue, href, accentColor, categoryLabel }: FeaturedVenueProps) {
  const accentMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-600' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-600' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-600' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', badge: 'bg-pink-600' },
  };
  const colors = accentMap[accentColor] || accentMap.violet;

  return (
    <Link to={href} className="block group">
      <div className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-5 sm:p-6 transition-all hover:shadow-lg hover:scale-[1.01]`}>
        <div className="flex items-center gap-2 mb-3">
          <span className={`${colors.badge} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
            {categoryLabel} 1위
          </span>
          {venue.isPremium && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">PREMIUM</span>
          )}
        </div>
        <h3 className={`text-xl sm:text-2xl font-extrabold ${colors.text} mb-2 group-hover:underline`}>
          {venue.nameKo}
        </h3>
        <p className="text-base text-[#333] leading-relaxed mb-3 line-clamp-3">
          {venue.shortDescription}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[#555]">{venue.regionKo}</span>
          {venue.atmosphere?.slice(0, 3).map((a) => (
            <span key={a} className={`text-xs ${colors.text}`}>#{a}</span>
          ))}
          <span className={`ml-auto text-sm font-bold ${colors.text} group-hover:translate-x-1 transition-transform`}>
            자세히 보기 &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Mid-list engagement hooks ──
const scrollHooks = [
  '아직 안 본 숨은 명소가 아래에 더 있다',
  '여기서부터 진짜 핵심이다',
  '이 아래 업소, 아는 사람만 간다',
  '끝까지 스크롤한 사람만 찾는 곳이 있다',
  '단골들은 오히려 아래쪽 업소를 더 좋아한다',
  '스크롤을 멈추면 후회할 수 있다',
];

export function ListMidHook({ index }: { index: number }) {
  const hook = scrollHooks[index % scrollHooks.length];
  return (
    <div className="col-span-full flex items-center gap-3 py-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8B5CF6]/20 to-transparent" />
      <span className="flex items-center gap-1.5 rounded-full bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 px-4 py-2 text-xs font-bold text-[#8B5CF6] whitespace-nowrap">
        <span>👇</span> {hook}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8B5CF6]/20 to-transparent" />
    </div>
  );
}

// ── Top 3 popular venues mini section ──
interface TopPicksProps {
  venues: Venue[];
  hrefPattern: string;
  accentColor: string;
}

export function TopPicksMini({ venues, hrefPattern, accentColor }: TopPicksProps) {
  const top3 = useMemo(() => {
    return [...venues]
      .sort((a, b) => {
        if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, 3);
  }, [venues]);

  if (top3.length === 0) return null;

  const accentMap: Record<string, string> = {
    violet: 'border-violet-200 bg-violet-50',
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    rose: 'border-rose-200 bg-rose-50',
    emerald: 'border-emerald-200 bg-emerald-50',
    pink: 'border-pink-200 bg-pink-50',
  };
  const style = accentMap[accentColor] || accentMap.violet;

  function buildHref(pattern: string, v: Venue): string {
    return pattern.replace('{region}', v.region).replace('{slug}', v.slug);
  }

  return (
    <div className={`col-span-full rounded-2xl border ${style} p-5 my-2`}>
      <h3 className="text-base font-bold text-[#111] mb-3">
        사람들이 가장 많이 본 TOP 3
      </h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {top3.map((v, i) => (
          <Link key={v.id} to={buildHref(hrefPattern, v)} className="flex items-center gap-3 rounded-xl bg-white p-3 hover:shadow-md transition-shadow">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B5CF6] text-white text-sm font-bold flex-shrink-0">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#111] truncate">{v.nameKo}</p>
              <p className="text-xs text-[#555] truncate">{v.regionKo}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Browse other categories ──
const allCategories = [
  { path: '/clubs', label: '클럽', emoji: '🎵', desc: 'EDM·힙합 파티' },
  { path: '/nights', label: '나이트', emoji: '🌙', desc: '소셜댄스·부킹' },
  { path: '/lounges', label: '라운지', emoji: '🍸', desc: '칵테일·감성 바' },
  { path: '/rooms', label: '룸', emoji: '🚪', desc: '프라이빗 모임' },
  { path: '/yojeong', label: '요정', emoji: '🏮', desc: '전통 한정식·국악' },
  { path: '/hoppa', label: '호빠', emoji: '🥂', desc: '호스트클럽' },
];

export function BrowseOtherCategories({ currentPath }: { currentPath: string }) {
  const others = allCategories.filter(c => c.path !== currentPath);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-bold text-[#111] mb-4">다른 업종도 둘러보기</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {others.map(c => (
          <Link key={c.path} to={c.path} className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 hover:bg-gray-100 hover:border-gray-200 transition-colors" style={{ minHeight: 44 }}>
            <span className="text-xl">{c.emoji}</span>
            <div>
              <p className="text-sm font-bold text-[#111]">{c.label}</p>
              <p className="text-[11px] text-[#777]">{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Bottom finish counter ──
export function BottomFinishCounter({ baseCount }: { baseCount?: number }) {
  const now = new Date();
  const daySeed = now.getFullYear() * 400 + (now.getMonth() + 1) * 32 + now.getDate();
  const hour = now.getHours();
  const count = (baseCount || 180) + (daySeed * 5) % 320 + Math.floor(hour * 4.2);

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <span className="text-sm text-[#8B5CF6] font-medium">
        끝까지 본 사람: <strong>{count.toLocaleString()}명</strong>
      </span>
    </div>
  );
}
