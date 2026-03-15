import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '매거진 — 나이트라이프 트렌드·가이드 | 오늘밤어디',
  description: '업종별 문화 비교, 지역별 야간업소 특성, 방문 팁까지. 오늘밤어디 매거진에서 확인된 정보만 전합니다.',
};

const articles = [
  {
    id: 'a1',
    title: '강남 EDM 클럽 5곳 — 2026 현장 비교',
    excerpt: '강남클럽 레이스와 강남클럽 사운드를 포함해, 올해 강남에서 가장 주목받는 EDM 공연장 5곳의 음향 시스템·분위기·입장 조건을 현장 방문 기준으로 비교합니다.',
    tag: '비교',
    date: '2026-03-12',
    readMin: 5,
  },
  {
    id: 'a2',
    title: '일산명월관요정 완벽 가이드 — 한정식 코스부터 국악 공연까지',
    excerpt: '일산명월관요정은 30개 프라이빗 룸과 15가지 한정식 코스를 갖춘 일산 대표 전통 공간입니다. 비즈니스 접대·가족 모임·각종 기념일 활용법을 정리했습니다.',
    tag: '요정',
    date: '2026-03-10',
    readMin: 7,
  },
  {
    id: 'a3',
    title: 'EDM 파티홀 vs 소셜 댄스홀 — 완전히 다른 두 문화',
    excerpt: 'EDM 중심 파티홀과 트로트·사교댄스 중심 댄스홀은 이름이 비슷하지만 운영 방식, 연령대, 복장 규정이 완전히 다릅니다. 각 문화의 핵심 차이를 정리합니다.',
    tag: '가이드',
    date: '2026-03-08',
    readMin: 6,
  },
  {
    id: 'a4',
    title: '처음 댄스홀 방문하는 분을 위한 매너 핸드북',
    excerpt: '소셜 댄스홀 첫 방문이 걱정되시나요? 입장부터 퇴장까지 복장, 에티켓, 음료 주문 방법 등 모든 궁금증을 한 권으로 정리했습니다.',
    tag: '가이드',
    date: '2026-03-05',
    readMin: 8,
  },
  {
    id: 'a5',
    title: '홍대·이태원 — 서울 양대 파티 타운 비교',
    excerpt: '인디·힙합 중심의 홍대와 다문화·레게톤 중심의 이태원. 서울 대표 두 파티 타운의 문화·접근성·평균 소비를 비교합니다.',
    tag: '비교',
    date: '2026-03-03',
    readMin: 5,
  },
  {
    id: 'a6',
    title: '전국 소셜 댄스홀 지역별 특징 총정리',
    excerpt: '서울·부산·대구·대전·울산·수원·인천 등 전국 주요 도시별 댄스홀 문화를 정리합니다. 도시마다 다른 분위기와 추천 장소를 소개합니다.',
    tag: '정보',
    date: '2026-02-28',
    readMin: 10,
  },
];

export default function MagazinePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold text-neon-text mb-1">매거진</h1>
      <p className="text-sm text-neon-text-muted mb-8">나이트라이프 트렌드, 가이드, 비교 콘텐츠</p>

      {/* 피처드 */}
      <article className="mb-8 rounded-2xl border border-neon-primary/30 bg-gradient-to-br from-neon-primary/5 via-neon-surface to-neon-bg p-6 sm:p-8 card-hover">
        <span className="rounded-full bg-neon-primary/10 px-3 py-1 text-xs text-neon-primary-light">{articles[0].tag}</span>
        <h2 className="mt-3 text-xl sm:text-2xl font-bold text-neon-text leading-snug">{articles[0].title}</h2>
        <p className="mt-2 text-sm text-neon-text-muted leading-relaxed">{articles[0].excerpt}</p>
        <div className="mt-4 flex items-center gap-3 text-xs text-neon-text-muted">
          <span>{articles[0].date}</span><span>·</span><span>{articles[0].readMin}분 소요</span>
        </div>
      </article>

      {/* 그리드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.slice(1).map((a) => (
          <article key={a.id} className="rounded-2xl border border-neon-border bg-neon-surface p-5 card-hover" style={{ minHeight: 180 }}>
            <span className="rounded-full bg-neon-primary/10 px-2.5 py-0.5 text-[10px] text-neon-primary-light">{a.tag}</span>
            <h3 className="mt-3 text-sm font-bold text-neon-text leading-snug line-clamp-2">{a.title}</h3>
            <p className="mt-2 text-xs text-neon-text-muted line-clamp-3 leading-relaxed">{a.excerpt}</p>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-neon-text-muted/60">
              <span>{a.date}</span><span>·</span><span>{a.readMin}분 소요</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
