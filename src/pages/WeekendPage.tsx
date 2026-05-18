import { useMemo } from 'react';
import { Link } from '../components/ui/SafeLink';
import { venues } from '@/data/venues';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import type { Venue } from '@/types';

function getHref(v: Venue) {
  const map: Record<string, string> = {
    club: `/clubs/${v.region}/${v.slug}`,
    night: `/nights/${v.slug}`,
    lounge: `/lounges/${v.slug}`,
    room: `/rooms/${v.region}/${v.slug}`,
    yojeong: `/yojeong/${v.region}/${v.slug}`,
    hoppa: `/hoppa/${v.slug}`,
  };
  return map[v.category] || `/${v.category}/${v.slug}`;
}

const catLabel: Record<string, string> = {
  club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠',
};

export default function WeekendPage() {
  useDocumentMeta(
    '이번 주말 어디 갈래? — 금토일 갈만한 핫플 큐레이션',
    '주말은 시간 아까운 거 알지? 금토일 사람 몰리는 핫플과 평일보다 더 좋은 숨은 코스 한 번에 모았다. 6업종 평점 4.2 이상만, 바로 확인.'
  );

  const weekend = useMemo(() => {
    return venues
      .filter((v) => v.status !== 'closed_or_unclear' && v.rating >= 4.2)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 30);
  }, []);

  const top10 = weekend.slice(0, 10);
  const rest = weekend.slice(10);

  return (
    <div className="min-h-screen bg-neon-bg">
      <section className="px-4 py-8 md:py-12 max-w-5xl mx-auto">
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-neon-pink-bright text-white text-sm font-bold rounded-full mb-3">
            📅 이번 주말 큐레이션
          </span>
          <h1 className="text-2xl md:text-4xl font-bold text-neon-text mb-3">
            금토일 갈만한 30곳 — 어디가 진짜 핫한지 알려준다
          </h1>
          <p className="text-neon-text-muted text-base md:text-lg">
            평점 4.2 이상 큐레이션. 주말 헛걸음 0번 만들자.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-neon-text mb-4">
            ★ 이번 주말 TOP 10 ★
          </h2>
          <ol className="space-y-3">
            {top10.map((v, i) => (
              <li key={v.id}>
                <Link
                  to={getHref(v)}
                  className="flex items-center gap-4 bg-neon-surface border border-neon-border rounded-xl p-4 hover:border-neon-primary card-hover"
                >
                  <span className="text-2xl font-bold text-neon-primary w-10 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-neon-surface-2 rounded text-neon-text-muted">
                        {catLabel[v.category]}
                      </span>
                      <h3 className="font-bold text-base text-neon-text truncate">{v.name}</h3>
                    </div>
                    <p className="text-sm text-neon-text-muted truncate">{v.address || v.region}</p>
                  </div>
                  <span className="text-sm font-bold text-neon-pink-bright shrink-0">★ {v.rating.toFixed(1)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-neon-text mb-4">
            그 외 가볼만한 곳 {rest.length}곳
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rest.map((v) => (
              <Link
                key={v.id}
                to={getHref(v)}
                className="block bg-neon-surface border border-neon-border rounded-lg p-3 hover:border-neon-primary"
              >
                <div className="text-xs text-neon-text-muted mb-1">{catLabel[v.category]} · {v.region}</div>
                <div className="font-bold text-sm text-neon-text">{v.name}</div>
                <div className="text-xs text-neon-pink-bright mt-1">★ {v.rating.toFixed(1)}</div>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-8 p-6 bg-neon-surface-2 rounded-xl">
          <p className="text-neon-text font-medium mb-2">📌 주말 가기 전 꿀팁</p>
          <ul className="text-sm text-neon-text-muted space-y-1">
            <li>· 금토 밤 11시 이후 사람 폭증 — 10시 전 입장 권장</li>
            <li>· 일요일은 평일 분위기 — 조용히 마시기 좋다</li>
            <li>· 예약 가능 곳은 매장 상세에서 바로 전화</li>
          </ul>
        </div>

        <nav className="mt-6 p-5 bg-neon-surface border border-neon-border rounded-xl" aria-label="다른 큐레이션">
          <h2 className="text-base font-bold text-neon-text mb-3">주말 말고 다른 자리 찾고 있어?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link to="/tonight" className="block px-4 py-3 bg-neon-surface-2 hover:bg-neon-bg rounded-lg text-sm text-neon-text">
              🌙 오늘 밤 추천 24곳 →
            </Link>
            <Link to="/occasion" className="block px-4 py-3 bg-neon-surface-2 hover:bg-neon-bg rounded-lg text-sm text-neon-text">
              🎯 상황별 6가지 →
            </Link>
            <Link to="/budget" className="block px-4 py-3 bg-neon-surface-2 hover:bg-neon-bg rounded-lg text-sm text-neon-text">
              💼 예산별 코스 4개 →
            </Link>
          </div>
        </nav>
      </section>
    </div>
  );
}
