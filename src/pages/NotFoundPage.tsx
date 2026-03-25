import { Link } from 'react-router-dom';
import { getPopularVenues } from '@/data/venues';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

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

function getCategoryLabel(cat: string) {
  const map: Record<string, string> = { club: 'CLUB', night: 'NIGHT', lounge: 'LOUNGE', room: 'ROOM', yojeong: '한식주점', hoppa: 'HOPPA' };
  return map[cat] || cat;
}

export default function NotFound() {
  useDocumentMeta('페이지를 찾을 수 없습니다 | 밤키', '찾는 페이지가 없지만 지금 핫한 곳을 안내합니다.');
  const popularVenues = getPopularVenues(6);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neon-bg px-4 text-center">
      <div className="mb-8">
        <h1 className="mb-2 text-8xl font-black tracking-tighter text-neon-primary/30">
          404
        </h1>
        <div className="mx-auto mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-neon-primary/30 to-transparent" />
      </div>

      <h2 className="mb-3 text-2xl font-bold text-neon-text">
        페이지를 찾을 수 없습니다
      </h2>
      <p className="mb-2 text-neon-text-muted">
        요청한 주소가 이동되었거나 더 이상 존재하지 않습니다.
      </p>

      <div className="flex gap-4 mb-12 mt-6">
        <Link target="_blank" rel="noopener noreferrer"
          to="/"
          className="rounded-xl bg-neon-primary px-6 py-3 font-medium text-white transition hover:bg-neon-primary-light"
        >
          홈으로 돌아가기
        </Link>
        <Link target="_blank" rel="noopener noreferrer"
          to="/map"
          className="rounded-xl border border-neon-border px-6 py-3 font-medium text-neon-text-muted transition hover:bg-neon-surface-2"
        >
          지도 탐색
        </Link>
      </div>

      {/* 인기 추천 — DB에서 가져옴 */}
      <div className="w-full max-w-lg">
        <h3 className="mb-4 text-sm font-semibold text-neon-primary">지금 핫한 곳</h3>
        <div className="grid grid-cols-2 gap-3">
          {popularVenues.map((v) => (
            <Link target="_blank" rel="noopener noreferrer"
              key={v.id}
              to={getCategoryHref(v.category, v.slug, v.region)}
              className="rounded-xl border border-neon-border bg-white px-4 py-3 text-left transition-all card-hover"
            >
              <span className="text-xs text-neon-primary">{getCategoryLabel(v.category)}</span>
              <p className="text-sm font-medium text-neon-text">{v.nameKo}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-16 text-neon-text-subtle">
        <p className="text-xs">밤키</p>
      </div>
    </div>
  );
}
