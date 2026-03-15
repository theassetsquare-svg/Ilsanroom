import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '입점 사례 연구 | 오늘밤어디 — 업주 성공 스토리',
  description: '오늘밤어디에 입점한 업주들의 온라인 노출 개선·신규 방문객 확보·브랜드 인지도 향상 사례를 확인하세요.',
};

const caseStudies = [
  {
    id: 'cs1',
    title: '일산명월관요정 — 프리미엄 등록 후 예약 문의 250% 증가',
    venue: '일산명월관요정',
    region: '일산',
    category: '요정',
    challenge: '오프라인 중심 운영으로 온라인 검색 노출이 부족해, 신규 고객 유입이 기존 소개에 한정되어 있었습니다.',
    solution: '오늘밤어디에 프리미엄 등록을 진행하고 "일산요정", "일산명월관" 등 핵심 검색어에서 상세 페이지가 노출되도록 구성했습니다. 한정식 코스 안내와 자주 묻는 질문을 포함하여 방문 전 궁금증을 해소할 수 있도록 설계했습니다.',
    result: '등록 3개월 후 전화 예약 문의가 250% 증가했습니다. 특히 비즈니스 접대 용도와 가족 기념일 목적의 신규 유입이 두드러졌습니다.',
    metric: '+250%',
    metricLabel: '예약 문의 상승',
  },
  {
    id: 'cs2',
    title: '수원찬스돔나이트 — 지역 검색 상위 노출로 주말 방문자 확대',
    venue: '수원찬스돔나이트',
    region: '수원',
    category: '나이트',
    challenge: '수원 지역에 여러 유흥 업소가 있지만, 온라인에서 해당 업소만의 차별점을 전달할 수 있는 채널이 부족했습니다.',
    solution: '돔 형태 인테리어, 최신 사운드 시스템 등 고유 특징을 부각한 단독 상세 페이지를 구성했습니다. 365일 운영이라는 장점을 전면에 배치하고, 담당자 연결 기능을 추가했습니다.',
    result: '"수원찬스돔나이트" 검색 시 오늘밤어디 상세 페이지가 상위에 노출되기 시작했고, 주말 방문객이 유의미하게 증가했습니다.',
    metric: '검색 상위',
    metricLabel: '수원 나이트 키워드',
  },
  {
    id: 'cs3',
    title: '강남클럽 레이스 — 독립 SEO 페이지로 테이블 예약 증가',
    venue: '강남클럽 레이스',
    region: '강남',
    category: '클럽',
    challenge: '강남 클럽 시장은 경쟁이 치열하여, 온라인에서 브랜드를 차별화하고 신규 고객에게 정보를 전달하는 것이 과제였습니다.',
    solution: '"강남클럽 레이스"를 독립 검색어로 최적화한 상세 페이지를 구성하고, EDM 파티홀로서의 정체성을 명확히 전달하는 콘텐츠를 제작했습니다.',
    result: '오늘밤어디를 통해 브랜드 인지도가 강화되었으며, 처음 방문하는 고객의 테이블 사전 문의 비율이 크게 늘었습니다.',
    metric: '+180%',
    metricLabel: '온라인 노출 개선',
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold text-neon-text mb-1">입점 사례 연구</h1>
      <p className="text-sm text-neon-text-muted mb-8">오늘밤어디 입점 후 달라진 업주들의 이야기</p>

      <div className="space-y-6">
        {caseStudies.map((cs) => (
          <article key={cs.id} className="rounded-2xl border border-neon-border bg-neon-surface p-5 sm:p-7">
            <div className="flex items-start justify-between mb-4 gap-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-neon-primary/10 px-3 py-1 text-xs text-neon-primary-light">{cs.category}</span>
                <span className="text-xs text-neon-text-muted">{cs.region}</span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl sm:text-2xl font-extrabold text-neon-green">{cs.metric}</p>
                <p className="text-[10px] text-neon-text-muted">{cs.metricLabel}</p>
              </div>
            </div>

            <h2 className="text-lg font-bold text-neon-text mb-5 leading-snug">{cs.title}</h2>

            <div className="grid gap-3 sm:grid-cols-3">
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
