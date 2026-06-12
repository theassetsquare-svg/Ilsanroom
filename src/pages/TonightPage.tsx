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

export default function TonightPage() {
  useDocumentMeta(
    '오늘 밤 어디 갈까? — 지금 분위기 좋은 핫플 모음',
    '퇴근하고 나왔는데 어디 갈지 망설이는 사람? 오늘 밤 갈만한 곳 6업종에서 영업 확인된 곳만 추렸다. 클럽·나이트·라운지·룸 한 페이지에서 바로 확인.'
  );

  const dayOfWeek = new Date().getDay();
  const isWeekendNight = dayOfWeek === 5 || dayOfWeek === 6;

  const tonight = useMemo(() => {
    return venues
      .filter((v) => v.status !== 'closed_or_unclear')
      .sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0))
      .slice(0, 24);
  }, []);

  const byCategory = useMemo(() => {
    const groups: Record<string, Venue[]> = {};
    for (const v of tonight) {
      (groups[v.category] = groups[v.category] || []).push(v);
    }
    return groups;
  }, [tonight]);

  return (
    <div className="min-h-screen bg-neon-bg">
      <section className="px-4 py-8 md:py-12 max-w-5xl mx-auto">
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-neon-primary text-white text-sm font-bold rounded-full mb-3">
            {isWeekendNight ? '🔥 주말 밤' : '🌙 오늘 밤'}
          </span>
          <h1 className="text-2xl md:text-4xl font-bold text-neon-text mb-3">
            오늘 밤 어디 갈까 — 지금 가도 안 후회할 24곳
          </h1>
          <p className="text-neon-text-muted text-base md:text-lg">
            영업 확인된 6업종을 한 페이지에 모았다. 가기 전에 한 번 확인하고 가자.
          </p>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar" aria-label="카테고리 빠른 이동">
          {Object.keys(byCategory).map((cat) => (
            <a
              key={cat}
              href={`#cat-${cat}`}
              className="shrink-0 px-4 py-2 bg-neon-surface border border-neon-border rounded-full text-sm font-medium hover:bg-neon-surface-2"
            >
              {catLabel[cat]} {byCategory[cat].length}
            </a>
          ))}
        </nav>

        {Object.entries(byCategory).map(([cat, list]) => (
          <section key={cat} id={`cat-${cat}`} className="mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-neon-text mb-4">
              {catLabel[cat]} 오늘 밤 추천 {list.length}곳
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((v) => (
                <Link
                  key={v.id}
                  to={getHref(v)}
                  className="block bg-neon-surface border border-neon-border rounded-xl p-4 hover:border-neon-primary card-hover"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-base text-neon-text">{v.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-neon-surface-2 rounded text-neon-text-muted shrink-0">{catLabel[v.category]}</span>
                  </div>
                  <p className="text-sm text-neon-text-muted line-clamp-2">{v.address || v.region}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <nav className="mt-12 mb-6 p-5 bg-neon-surface border border-neon-border rounded-xl" aria-label="다른 큐레이션">
          <h2 className="text-base font-bold text-neon-text mb-3">오늘 말고 다른 자리 찾고 있어?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link to="/weekend" className="block px-4 py-3 bg-neon-surface-2 hover:bg-neon-bg rounded-lg text-sm text-neon-text">
              📅 이번 주말 핫플 30곳 →
            </Link>
            <Link to="/occasion" className="block px-4 py-3 bg-neon-surface-2 hover:bg-neon-bg rounded-lg text-sm text-neon-text">
              🎯 상황별 6가지 →
            </Link>
            <Link to="/budget" className="block px-4 py-3 bg-neon-surface-2 hover:bg-neon-bg rounded-lg text-sm text-neon-text">
              💼 예산별 코스 4개 →
            </Link>
          </div>
        </nav>

        <div className="p-6 bg-neon-surface-2 rounded-xl text-center">
          <p className="text-neon-text font-medium mb-3">고민되면 즉석 추천 한 번 돌려봐</p>
          <Link
            to="/roulette"
            className="inline-block px-6 py-3 bg-neon-primary text-white rounded-full font-bold hover:bg-neon-primary-light"
          >
            🎰 룰렛으로 결정하기
          </Link>
        </div>
      </section>
    </div>
  );
}
