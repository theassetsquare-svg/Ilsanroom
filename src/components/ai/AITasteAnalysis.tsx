import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { venues } from '@/data/venues';
import type { Venue } from '@/types';

function getCategoryLabel(cat: string) {
  const map: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
  return map[cat] || cat;
}

function getHref(v: Venue) {
  const map: Record<string, string> = {
    club: `/clubs/${v.region}/${v.slug}`, night: `/nights/${v.slug}`,
    lounge: `/lounges/${v.slug}`, room: `/rooms/${v.region}/${v.slug}`,
    yojeong: `/yojeong/${v.region}/${v.slug}`, hoppa: `/hoppa/${v.slug}`,
  };
  return map[v.category] || `/${v.category}/${v.slug}`;
}

interface TasteProfile {
  topCategory: string;
  topRegion: string;
  keywords: string[];
  recommendations: Venue[];
}

function analyzeTaste(viewedSlugs: string[]): TasteProfile | null {
  if (viewedSlugs.length < 2) return null;

  const viewed = viewedSlugs.map(s => venues.find(v => v.slug === s)).filter(Boolean) as Venue[];
  if (viewed.length < 2) return null;

  // Count categories & regions
  const catCount: Record<string, number> = {};
  const regCount: Record<string, number> = {};
  const allTags: string[] = [];

  for (const v of viewed) {
    catCount[v.category] = (catCount[v.category] || 0) + 1;
    regCount[v.regionKo] = (regCount[v.regionKo] || 0) + 1;
    allTags.push(...v.tags, ...v.features);
  }

  const topCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0][0];
  const topRegion = Object.entries(regCount).sort((a, b) => b[1] - a[1])[0][0];

  // Top keywords
  const tagCount: Record<string, number> = {};
  for (const t of allTags) { tagCount[t] = (tagCount[t] || 0) + 1; }
  const keywords = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

  // Recommend similar venues not yet viewed
  const viewedSet = new Set(viewedSlugs);
  const recommendations = venues
    .filter(v => !viewedSet.has(v.slug) && v.status !== 'closed_or_unclear')
    .map(v => {
      let score = 0;
      if (v.category === topCategory) score += 30;
      if (v.regionKo === topRegion) score += 20;
      for (const k of keywords) {
        if (v.tags.includes(k) || v.features.includes(k)) score += 10;
      }
      score += v.rating * 5;
      if (v.isPremium) score += 15;
      return { venue: v, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(x => x.venue);

  return { topCategory, topRegion, keywords, recommendations };
}

export default function AITasteAnalysis() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = () => {
    setLoading(true);
    setTimeout(() => {
      // Get viewed venues from localStorage
      const key = user ? `viewed_venues_${user.id}` : 'viewed_venues_guest';
      let viewedSlugs: string[] = JSON.parse(localStorage.getItem(key) || '[]');

      // If not enough data, use demo data
      if (viewedSlugs.length < 3) {
        const demoVenues = venues.filter(v => v.status !== 'closed_or_unclear').slice(0, 5);
        viewedSlugs = demoVenues.map(v => v.slug);
      }

      const result = analyzeTaste(viewedSlugs);
      setProfile(result);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-xl">🧠</span>
        <div>
          <h3 className="text-lg font-bold text-neon-text">AI 취향 분석</h3>
          <p className="text-xs text-neon-text-muted">과거 조회한 업소 기반으로 취향을 파악합니다</p>
        </div>
      </div>

      {!profile && !loading && (
        <div className="text-center py-4">
          <p className="text-sm text-neon-text-muted mb-4">
            {user ? '최근 본 업소를 분석해서 맞춤 추천을 드립니다' : '로그인하면 더 정확한 분석이 가능합니다'}
          </p>
          <button
            onClick={handleAnalyze}
            className="rounded-xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-700"
          >
            내 취향 분석하기
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <span className="text-sm text-cyan-600">취향을 분석하고 있습니다...</span>
        </div>
      )}

      {profile && !loading && (
        <div className="space-y-4">
          {/* Taste summary */}
          <div className="rounded-xl bg-cyan-50 p-4">
            <p className="text-sm font-semibold text-cyan-800 mb-2">당신의 취향 프로필</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700">
                선호 카테고리: {getCategoryLabel(profile.topCategory)}
              </span>
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700">
                자주 찾는 지역: {profile.topRegion}
              </span>
            </div>
            {profile.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.keywords.map(k => (
                  <span key={k} className="rounded bg-white px-2 py-0.5 text-[11px] text-cyan-600 border border-cyan-200">#{k}</span>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <p className="text-sm font-semibold text-cyan-700">이런 곳은 어때요?</p>
          {profile.recommendations.map((v) => (
            <Link key={v.id} to={getHref(v)} className="flex items-center gap-3 rounded-xl border border-cyan-100 bg-white p-3 transition hover:shadow-md hover:border-cyan-300">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-neon-text truncate">{v.nameKo}</h4>
                <p className="text-xs text-neon-text-muted">{v.regionKo} · {getCategoryLabel(v.category)} · ★ {v.rating}</p>
              </div>
              <span className="text-xs text-cyan-600">→</span>
            </Link>
          ))}

          <button
            onClick={handleAnalyze}
            className="w-full rounded-lg border border-cyan-200 py-2 text-xs text-cyan-600 transition hover:bg-cyan-50"
          >
            다시 분석하기
          </button>
        </div>
      )}
    </div>
  );
}
