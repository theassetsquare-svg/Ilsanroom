import { useState } from 'react';
import { Link } from 'react-router-dom';
import { venues } from '@/data/venues';
import type { Venue } from '@/types';

const exampleQueries = [
  '강남 4명 추천',
  '홍대 클럽 2명',
  '일산 룸 6명',
  '부산 나이트 3명',
  '이태원 라운지 소규모',
];

function parseQuery(query: string): { region?: string; count?: number; category?: string } {
  const regionMap: Record<string, string> = {
    '강남': 'gangnam', '홍대': 'hongdae', '이태원': 'itaewon', '일산': 'ilsan',
    '부산': 'busan', '해운대': 'busan-haeundae', '대구': 'daegu', '인천': 'incheon',
    '수원': 'suwon', '대전': 'daejeon', '광주': 'gwangju', '울산': 'ulsan', '제주': 'jeju',
  };
  const categoryMap: Record<string, string> = {
    '클럽': 'club', '나이트': 'night', '라운지': 'lounge', '룸': 'room', '요정': 'yojeong', '호빠': 'hoppa',
  };

  let region: string | undefined;
  let category: string | undefined;
  let count: number | undefined;

  for (const [ko, en] of Object.entries(regionMap)) {
    if (query.includes(ko)) { region = en; break; }
  }
  for (const [ko, en] of Object.entries(categoryMap)) {
    if (query.includes(ko)) { category = en; break; }
  }
  const numMatch = query.match(/(\d+)\s*명/);
  if (numMatch) count = parseInt(numMatch[1]);

  return { region, count, category };
}

function getHref(v: Venue) {
  const map: Record<string, string> = {
    club: `/clubs/${v.region}/${v.slug}`, night: `/nights/${v.slug}`,
    lounge: `/lounges/${v.slug}`, room: `/rooms/${v.region}/${v.slug}`,
    yojeong: `/yojeong/${v.region}/${v.slug}`, hoppa: `/hoppa/${v.slug}`,
  };
  return map[v.category] || `/${v.category}/${v.slug}`;
}

function getCategoryLabel(cat: string) {
  const map: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
  return map[cat] || cat;
}

export default function AIRecommend() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    setTimeout(() => {
      const { region, count, category } = parseQuery(query);
      let filtered = venues.filter(v => v.status !== 'closed_or_unclear');

      if (region) filtered = filtered.filter(v => v.region.includes(region));
      if (category) filtered = filtered.filter(v => v.category === category);

      // Score by relevance
      filtered.sort((a, b) => {
        let scoreA = a.rating * 10 + a.reviewCount;
        let scoreB = b.rating * 10 + b.reviewCount;
        if (a.isPremium) scoreA += 50;
        if (b.isPremium) scoreB += 50;
        if (count && count >= 6 && a.category === 'room') scoreA += 30;
        if (count && count >= 6 && b.category === 'room') scoreB += 30;
        if (count && count <= 3 && (a.category === 'lounge' || a.category === 'hoppa')) scoreA += 20;
        if (count && count <= 3 && (b.category === 'lounge' || b.category === 'hoppa')) scoreB += 20;
        return scoreB - scoreA;
      });

      setResults(filtered.slice(0, 3));
      setLoading(false);
    }, 800);
  };

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-xl">🤖</span>
        <div>
          <h3 className="text-lg font-bold text-neon-text">AI 맞춤 추천</h3>
          <p className="text-xs text-neon-text-muted">지역이랑 인원 던져봐. 3초면 골라줌</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="지역 + 인원 + 카테고리"
          className="flex-1 rounded-xl border border-neon-border bg-white px-4 py-3 text-sm text-neon-text outline-none focus:border-violet-400 transition"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="shrink-0 rounded-xl bg-neon-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-neon-primary-light disabled:opacity-50"
        >
          {loading ? '분석중...' : '추천받기'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {exampleQueries.map((eq) => (
          <button
            key={eq}
            onClick={() => { setQuery(eq); }}
            className="rounded-lg bg-violet-100/60 px-3 py-1 text-xs text-violet-700 transition hover:bg-violet-200"
          >
            {eq}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-6 flex items-center justify-center gap-2 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
          <span className="text-sm text-violet-600">딱 맞는 곳 찾는 중...</span>
        </div>
      )}

      {!loading && searched && results.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-violet-700">추천 결과 {results.length}곳</p>
          {results.map((v, i) => (
            <Link key={v.id} to={getHref(v)} className="flex items-start gap-4 rounded-xl border border-violet-100 bg-white p-4 transition hover:shadow-md hover:border-violet-300">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-neon-text truncate">{v.nameKo}</h4>
                  {v.isPremium && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">PREMIUM</span>}
                </div>
                <p className="mt-1 text-xs text-neon-text-muted line-clamp-1">{v.shortDescription}</p>
                <div className="mt-2 flex gap-2 text-[11px] text-neon-text-muted">
                  <span className="rounded bg-violet-50 px-2 py-0.5">{v.regionKo}</span>
                  <span className="rounded bg-violet-50 px-2 py-0.5">{getCategoryLabel(v.category)}</span>
                  <span className="text-amber-600">★ {v.rating}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="mt-6 rounded-xl bg-violet-50 p-6 text-center">
          <p className="text-sm text-violet-600">조건에 맞는 업소를 찾지 못했습니다. 다른 조건으로 시도해보세요.</p>
        </div>
      )}
    </div>
  );
}
