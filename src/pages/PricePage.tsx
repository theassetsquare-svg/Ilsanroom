

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { venues } from '@/data/venues';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

type CategoryFilter = 'all' | 'club' | 'night' | 'lounge' | 'room' | 'yojeong' | 'hoppa';

const categoryLabels: Record<string, string> = {
  all: '전체', club: '클럽', night: '나이트', lounge: '라운지',
  room: '룸', yojeong: '요정', hoppa: '호빠',
};

function getCategoryHref(category: string, slug: string, region: string) {
  const pathMap: Record<string, string> = {
    club: `/clubs/${region}/${slug}`, night: `/nights/${slug}`, lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`, yojeong: `/yojeong/${region}/${slug}`, hoppa: `/hoppa/${slug}`,
  };
  return pathMap[category] || `/${category}/${slug}`;
}

export default function PricePage() {
  useDocumentMeta('양주·부스·룸 한눈에 보기', '업종별 양주 라인업, 부스 구성, 룸 타입까지. 가기 전에 미리 확인해봐.');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    return venues
      .filter((v) => v.status !== 'closed_or_unclear')
      .filter((v) => category === 'all' || v.category === category)
      .sort((a, b) => {
        if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
        return b.rating - a.rating;
      });
  }, [category]);

  const displayed = showAll ? filtered : filtered.slice(0, 8);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold text-neon-text mb-2">양주·부스·룸 한눈에 보기</h1>
      <p className="text-neon-text-muted mb-8">각 매장의 양주 라인업, 부스 구성, 룸 타입을 확인하세요.</p>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(categoryLabels) as CategoryFilter[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              category === cat
                ? 'bg-neon-primary text-white'
                : 'border border-neon-border bg-neon-surface text-neon-text-muted hover:text-neon-text'
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Venue Info Table */}
      {filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-neon-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neon-border bg-neon-surface-2">
                <th className="px-4 py-3 text-left font-semibold text-neon-text">매장명</th>
                <th className="px-4 py-3 text-left font-semibold text-neon-text">권역</th>
                <th className="px-4 py-3 text-left font-semibold text-neon-text">양주</th>
                {(category === 'all' || category === 'night') && <th className="px-4 py-3 text-left font-semibold text-neon-text">부스</th>}
                {(category === 'all' || ['night', 'room', 'yojeong', 'hoppa'].includes(category)) && <th className="px-4 py-3 text-left font-semibold text-neon-text">룸</th>}
                {['club', 'lounge'].includes(category) && <th className="px-4 py-3 text-left font-semibold text-neon-text">{category === 'club' ? '테이블' : '좌석'}</th>}
                <th className="px-4 py-3 text-left font-semibold text-neon-text">별점</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((v) => (
                <tr key={v.id} className="border-b border-neon-border/50 hover:bg-neon-surface-2/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link target="_blank" rel="noopener noreferrer" to={getCategoryHref(v.category, v.slug, v.region)}
                      className="font-medium text-neon-primary-light hover:text-neon-primary hover:underline"
                    >
                      {v.nameKo}
                    </Link>
                    {v.isPremium && <span className="ml-2 text-xs text-neon-gold">PREMIUM</span>}
                  </td>
                  <td className="px-4 py-3 text-neon-text-muted">{v.regionKo}</td>
                  <td className="px-4 py-3 text-neon-text">{v.liquorInfo || '매장 문의'}</td>
                  {(category === 'all' || category === 'night') && <td className="px-4 py-3 text-neon-text">{v.category === 'night' ? (v.boothInfo || '매장 문의') : '-'}</td>}
                  {(category === 'all' || ['night', 'room', 'yojeong', 'hoppa'].includes(category)) && <td className="px-4 py-3 text-neon-text">{['night', 'room', 'yojeong', 'hoppa'].includes(v.category) ? (v.roomInfo || '매장 문의') : '-'}</td>}
                  {['club', 'lounge'].includes(category) && <td className="px-4 py-3 text-neon-text">{v.roomInfo || '매장 문의'}</td>}
                  <td className="px-4 py-3 text-neon-gold">★ {v.rating.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-20 text-center text-neon-text-muted">등록된 매장이 없습니다.</p>
      )}

      {!showAll && filtered.length > 8 && (
        <button onClick={() => setShowAll(true)} className="mt-4 w-full rounded-xl border border-neon-border py-3 text-sm text-neon-primary-light hover:bg-neon-surface transition">
          전체 {filtered.length}개 매장 보기
        </button>
      )}
      <p className="mt-6 text-xs text-neon-text-subtle">
        ※ 상세 정보는 매장 사정에 따라 변동될 수 있습니다. 방문 전 해당 매장에 직접 확인하세요.
      </p>
    </div>
  );
}
