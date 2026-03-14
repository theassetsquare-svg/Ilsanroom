import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '이 업소 몰랐지? 숨은 명소 | 일산룸포털',
  description: '매주 발굴하는 숨은 나이트라이프 명소. 다른 사이트에서 찾기 어려운 알짜 업소를 소개합니다.',
};

const hiddenGems = [
  {
    name: '일산명월관요정',
    region: '일산',
    category: '요정',
    hook: '15가지 한정식에 국악 라이브까지, 요정 문화의 끝판왕',
    reason: '전통 요정이 전국에 거의 남아있지 않은 상황에서, 일산명월관요정은 30개 프라이빗 룸과 정찰제 한정식을 유지하며 전통 문화를 이어가고 있습니다. 비즈니스 접대뿐 아니라 가족 기념일에도 활용되는 희소한 공간입니다.',
    href: '/yojeong/ilsan/ilsan-myeongwolgwan-yojeong',
    week: '2026년 3월 2주차',
  },
  {
    name: '파주야당스카이돔나이트',
    region: '파주',
    category: '나이트',
    hook: '경기 북부 유일의 대형 나이트, 높은 천장의 개방감',
    reason: '파주·일산·김포 지역에서 접근할 수 있는 대형 나이트클럽으로, 스카이돔이라는 이름에 걸맞은 높은 천장과 넓은 댄스 플로어가 특징입니다. 야당역 도보 접근 가능.',
    href: '/nights/paju-yadang-skydome-night',
    week: '2026년 3월 1주차',
  },
  {
    name: '울산챔피언나이트',
    region: '울산',
    category: '나이트',
    hook: '울산 공단 직장인들의 주말 해방구',
    reason: '울산 지역 나이트 문화의 중심. 춘자 실장의 친절한 운영으로 초보 방문객도 편안하게 즐길 수 있는 곳입니다.',
    href: '/nights/ulsan-champion-night',
    week: '2026년 2월 4주차',
  },
];

export default function HiddenPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-neon-text mb-2">이 업소 몰랐지?</h1>
      <p className="text-neon-text-muted mb-10">매주 발굴하는 숨은 나이트라이프 명소</p>

      <div className="space-y-6">
        {hiddenGems.map((gem) => (
          <Link key={gem.name} href={gem.href} target="_blank" rel="noopener noreferrer" className="block rounded-2xl border border-neon-border bg-neon-surface p-6 transition hover:border-neon-primary/40 card-hover">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-neon-accent/10 px-3 py-1 text-xs text-neon-accent">{gem.week}</span>
              <span className="text-xs text-neon-text-muted">{gem.region} · {gem.category}</span>
            </div>
            <h2 className="text-xl font-bold text-neon-text mb-1">{gem.name}</h2>
            <p className="text-sm font-medium text-neon-gold mb-3">{gem.hook}</p>
            <p className="text-sm text-neon-text-muted leading-relaxed">{gem.reason}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
