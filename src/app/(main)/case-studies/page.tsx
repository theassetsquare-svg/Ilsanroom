import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '사례 연구 | 오늘밤어디 - 업주 성공 스토리',
  description: '오늘밤어디에 입점한 업주들의 매출 상승, 방문자 증가, 브랜드 인지도 향상 사례를 확인하세요.',
};

const caseStudies = [
  {
    id: 'cs1',
    title: '일산명월관요정 — 온라인 노출 후 예약 문의 250% 증가',
    venue: '일산명월관요정',
    region: '일산',
    category: '요정',
    challenge: '오프라인 중심으로 운영하던 일산명월관요정은 온라인 검색에서 노출이 부족하여 신규 고객 유입이 제한적이었습니다.',
    solution: '오늘밤어디에 프리미엄 등록 후, "일산요정", "일산명월관" 등 핵심 키워드에서 검색 상위 노출을 달성했습니다. 상세 정보 페이지, FAQ, 한정식 코스 안내를 통해 방문 전 정보 탐색이 용이해졌습니다.',
    result: '등록 3개월 후 전화 예약 문의 250% 증가. 특히 비즈니스 접대 고객과 가족 기념일 고객의 신규 유입이 크게 늘었습니다.',
    metric: '+250%',
    metricLabel: '예약 문의 증가',
  },
  {
    id: 'cs2',
    title: '수원찬스돔나이트 — 지역 검색 1위로 신규 방문객 확보',
    venue: '수원찬스돔나이트',
    region: '수원',
    category: '나이트',
    challenge: '수원 지역에 여러 나이트가 있지만, 온라인에서 "수원 나이트" 검색 시 차별화된 정보가 부족했습니다.',
    solution: '오늘밤어디에 업소 정보를 등록하고, 365일 운영이라는 차별점을 강조한 상세 페이지를 구성했습니다. 강호동 실장의 담당 정보와 전화 연결 기능이 포함되었습니다.',
    result: '"수원찬스돔나이트" 검색 시 오늘밤어디 상세 페이지가 상위에 노출되며, 주말 방문객이 이전 대비 크게 증가했습니다.',
    metric: '검색 1위',
    metricLabel: '수원 나이트 검색',
  },
  {
    id: 'cs3',
    title: '강남클럽레이스 — 브랜드 인지도 강화 및 테이블 예약 증가',
    venue: '강남클럽레이스',
    region: '강남',
    category: '클럽',
    challenge: '강남 클럽 시장은 경쟁이 치열하여, 온라인에서의 브랜드 차별화가 중요한 과제였습니다.',
    solution: '오늘밤어디에서 "강남클럽레이스"를 독립적인 SEO 키워드로 최적화하고, EDM 클럽으로서의 정체성을 명확히 하는 상세 페이지를 구성했습니다.',
    result: '오늘밤어디을 통해 클럽레이스의 브랜드 인지도가 강화되었으며, 특히 처음 방문하는 고객의 테이블 사전 예약 비율이 증가했습니다.',
    metric: '+180%',
    metricLabel: '온라인 노출 증가',
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-neon-text mb-2">사례 연구</h1>
      <p className="text-neon-text-muted mb-10">오늘밤어디 입점 업주들의 성공 스토리</p>

      <div className="space-y-8">
        {caseStudies.map((cs) => (
          <article key={cs.id} className="rounded-2xl border border-neon-border bg-neon-surface p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="rounded-full bg-neon-primary/10 px-3 py-1 text-xs text-neon-primary-light">{cs.category}</span>
                <span className="ml-2 text-xs text-neon-text-muted">{cs.region}</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-neon-green">{cs.metric}</p>
                <p className="text-xs text-neon-text-muted">{cs.metricLabel}</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-neon-text mb-6">{cs.title}</h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-neon-border bg-neon-bg p-4">
                <h3 className="text-xs font-bold text-neon-pink mb-2">과제</h3>
                <p className="text-xs text-neon-text-muted leading-relaxed">{cs.challenge}</p>
              </div>
              <div className="rounded-xl border border-neon-border bg-neon-bg p-4">
                <h3 className="text-xs font-bold text-neon-accent mb-2">솔루션</h3>
                <p className="text-xs text-neon-text-muted leading-relaxed">{cs.solution}</p>
              </div>
              <div className="rounded-xl border border-neon-border bg-neon-bg p-4">
                <h3 className="text-xs font-bold text-neon-green mb-2">결과</h3>
                <p className="text-xs text-neon-text-muted leading-relaxed">{cs.result}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
