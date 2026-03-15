import type { Metadata } from 'next';
import Link from 'next/link';
import { getPopularVenues } from '@/data/venues';

export const metadata: Metadata = {
  title: '404 - 업소를 못 찾겠어요 | 오늘밤어디',
  description: '요청하신 페이지를 찾을 수 없습니다. 인기 업소를 확인해 보세요.',
};

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
  const map: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
  return map[cat] || cat;
}

export default function NotFound() {
  const popularVenues = getPopularVenues(6);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neon-bg px-4 text-center">
      <div className="mb-8">
        <h1 className="mb-2 text-8xl font-black tracking-tighter">
          <span className="inline-block animate-pulse text-neon-primary/30">4</span>
          <span className="inline-block text-neon-accent/20">0</span>
          <span className="inline-block animate-pulse text-neon-primary/30" style={{ animationDelay: '0.5s' }}>4</span>
        </h1>
        <div className="mx-auto mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-neon-primary/50 to-transparent" />
      </div>

      <h2 className="mb-3 text-2xl font-bold text-neon-text">
        업소를 못 찾겠어요
      </h2>
      <p className="mb-2 text-neon-text-muted">
        네온사인이 꺼진 곳에 도착하셨습니다.
      </p>
      <p className="mb-8 text-sm text-neon-text-muted/60">
        찾으시는 페이지가 이동되었거나 존재하지 않는 주소입니다.
      </p>

      <div className="flex gap-4 mb-12">
        <Link
          href="/"
          className="rounded-xl bg-neon-primary px-6 py-3 font-medium text-white transition hover:bg-neon-primary-light"
        >
          홈으로 돌아가기
        </Link>
        <Link
          href="/map"
          className="rounded-xl border border-neon-border px-6 py-3 font-medium text-neon-text-muted transition hover:bg-neon-surface-2"
        >
          지도에서 찾기
        </Link>
      </div>

      {/* 인기 추천 */}
      <div className="w-full max-w-lg">
        <h3 className="mb-4 text-sm font-semibold text-neon-accent">인기 업소 추천</h3>
        <div className="grid grid-cols-2 gap-3">
          {popularVenues.map((v) => (
            <Link
              key={v.id}
              href={getCategoryHref(v.category, v.slug, v.region)}
              className="glass rounded-xl px-4 py-3 text-left transition-all card-hover"
            >
              <span className="text-xs text-neon-primary">{getCategoryLabel(v.category)}</span>
              <p className="text-sm font-medium text-neon-text">{v.nameKo}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-16 text-neon-text-muted/30">
        <p className="text-xs">오늘밤어디</p>
      </div>
    </div>
  );
}
