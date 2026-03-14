import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '매거진 | 일산룸포털 - 나이트라이프 트렌드와 가이드',
  description: '나이트라이프 문화, 트렌드, 업소 가이드, 인터뷰 등 다양한 콘텐츠를 일산룸포털 매거진에서 확인하세요.',
};

const articles = [
  {
    id: 'a1', title: '2026 강남 클럽 TOP5 — 올해 꼭 가봐야 할 곳',
    excerpt: '강남 지역에서 가장 인기 있는 EDM 클럽 5곳을 선정했습니다. 클럽 레이스, 클럽 사운드, 클럽 페이스 등 2026년 강남 클럽 씬을 이끄는 업소들의 특징과 차이점을 비교합니다.',
    tag: '클럽', date: '2026-03-12', readMin: 5,
  },
  {
    id: 'a2', title: '일산명월관요정 완벽 가이드: 접대부터 가족모임까지',
    excerpt: '일산명월관요정은 한정식 코스, 국악 라이브, 30개 프라이빗 룸을 갖춘 일산 대표 요정입니다. 비즈니스 접대부터 돌잔치까지, 일산명월관요정 이용 가이드를 총정리합니다.',
    tag: '요정', date: '2026-03-10', readMin: 7,
  },
  {
    id: 'a3', title: '클럽 vs 나이트 — 완전히 다른 두 문화',
    excerpt: '클럽과 나이트(나이트클럽)는 이름이 비슷하지만 완전히 다른 업종입니다. EDM 중심의 클럽과 소셜 댄스 중심의 나이트, 각 문화의 차이를 상세히 비교합니다.',
    tag: '가이드', date: '2026-03-08', readMin: 6,
  },
  {
    id: 'a4', title: '처음 나이트 가는 분을 위한 A to Z 매너 가이드',
    excerpt: '나이트클럽 첫 방문이 걱정되시나요? 입장부터 퇴장까지, 복장, 매너, 부킹 시스템, 주문 방법 등 처음 가는 분이 알아야 할 모든 것을 정리했습니다.',
    tag: '나이트', date: '2026-03-05', readMin: 8,
  },
  {
    id: 'a5', title: '홍대 vs 이태원 클럽 — 어디가 나에게 맞을까?',
    excerpt: '홍대 클럽은 인디·힙합 중심, 이태원 클럽은 다문화·레게톤 중심. 두 지역의 클럽 문화를 비교하고, 당신의 취향에 맞는 곳을 찾아봅니다.',
    tag: '비교', date: '2026-03-03', readMin: 5,
  },
  {
    id: 'a6', title: '전국 나이트클럽 지역별 특징 총정리',
    excerpt: '서울, 부산, 대구, 광주, 인천, 수원, 울산 등 전국 주요 도시의 나이트클럽 문화와 특징을 정리합니다. 각 지역만의 독특한 분위기와 추천 업소를 소개합니다.',
    tag: '정보', date: '2026-02-28', readMin: 10,
  },
];

export default function MagazinePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-neon-text mb-2">매거진</h1>
      <p className="text-neon-text-muted mb-10">나이트라이프 트렌드, 가이드, 비교 콘텐츠</p>

      {/* Featured article */}
      <div className="mb-10 rounded-2xl border border-neon-primary/30 bg-gradient-to-br from-neon-primary/5 via-neon-surface to-neon-bg p-8 card-hover">
        <span className="rounded-full bg-neon-primary/10 px-3 py-1 text-xs text-neon-primary-light">{articles[0].tag}</span>
        <h2 className="mt-3 text-2xl font-bold text-neon-text">{articles[0].title}</h2>
        <p className="mt-2 text-sm text-neon-text-muted">{articles[0].excerpt}</p>
        <div className="mt-4 flex items-center gap-3 text-xs text-neon-text-muted">
          <span>{articles[0].date}</span>
          <span>·</span>
          <span>{articles[0].readMin}분 읽기</span>
        </div>
      </div>

      {/* Article grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.slice(1).map((a) => (
          <div key={a.id} className="rounded-2xl border border-neon-border bg-neon-surface p-6 card-hover">
            <span className="rounded-full bg-neon-primary/10 px-2.5 py-0.5 text-xs text-neon-primary-light">{a.tag}</span>
            <h3 className="mt-3 text-sm font-bold text-neon-text leading-snug line-clamp-2">{a.title}</h3>
            <p className="mt-2 text-xs text-neon-text-muted line-clamp-3">{a.excerpt}</p>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-neon-text-muted/60">
              <span>{a.date}</span>
              <span>·</span>
              <span>{a.readMin}분 읽기</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
