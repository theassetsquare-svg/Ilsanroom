import { useRef } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { MidContentHook, ReadFinishCount, ReadCompletionReward, MidContentQuiz, ReadingMilestone } from '@/components/engagement/ReadingEngagement';
import { Link } from 'react-router-dom';

const testimonials = [
  {
    name: "이** 대표",
    venue: "일산명월관요정",
    category: "요정",
    region: "일산",
    rating: 5,
    text: "전통 한정식 공간이라 디지털 마케팅이 어려울 줄 알았는데, 놀쿨에 등록한 뒤 40~60대 비즈니스 고객 예약이 늘었습니다. 사장님 답변 기능으로 리뷰 관리도 수월해졌고요.",
    plan: "프리미엄",
    since: "2025년 7월",
    highlight: "비즈니스 고객 예약 증가",
  },
  {
    name: "김** 대표",
    venue: "일산룸",
    category: "룸",
    region: "일산",
    rating: 5,
    text: "놀쿨 대시보드로 방문자 패턴을 분석하고 비수기 프로모션을 설계했더니 매출이 안정되었습니다. QR코드 기능도 명함에 활용 중입니다.",
    plan: "프로",
    since: "2025년 9월",
    highlight: "비수기 매출 안정화",
  },
  {
    name: "박** 대표",
    venue: "수원찬스돔나이트",
    category: "나이트",
    region: "수원",
    rating: 5,
    text: "수원 지역에서 온라인 홍보가 어려운 업종인데, 놀쿨 덕분에 신규 고객이 많이 유입되었습니다. 이벤트 등록 기능이 특히 유용합니다.",
    plan: "프로",
    since: "2025년 11월",
    highlight: "신규 고객 유입 증가",
  },
  {
    name: "최** 매니저",
    venue: "강남청담클럽 레이스",
    category: "클럽",
    region: "강남",
    rating: 5,
    text: "API 연동으로 DJ 스케줄과 이벤트가 자동 동기화됩니다. 예약 전환율이 기존 채널 대비 높아졌어요.",
    plan: "프로",
    since: "2025년 3월",
    highlight: "예약 전환율 상승",
  },
  {
    name: "한** 사장",
    venue: "압구정라운지 디엠",
    category: "라운지",
    region: "압구정",
    rating: 5,
    text: "인증 배지 달고 나니까 라운지 격이 달라 보이더라고요. VIP 손님이 먼저 찾아옵니다.",
    plan: "프리미엄",
    since: "2025년 5월",
    highlight: "VIP 고객 자연 유입",
  },
  {
    name: "정** 대표",
    venue: "강남호빠 로얄",
    category: "호빠",
    region: "강남",
    rating: 4,
    text: "처음에는 반신반의했는데, 등록 첫 달부터 문의가 2배로 늘었습니다. 무료 플랜으로 시작해서 부담도 없었어요.",
    plan: "베이직",
    since: "2025년 12월",
    highlight: "문의 2배 증가",
  },
];

function getPlanStyle(plan: string): React.CSSProperties {
  const styles: Record<string, React.CSSProperties> = {
    "프리미엄": { backgroundColor: '#EDE9FE', color: '#6D28D9', borderColor: '#DDD6FE' },
    "프로": { backgroundColor: '#DBEAFE', color: '#1D4ED8', borderColor: '#BFDBFE' },
    "엔터프라이즈": { backgroundColor: '#FEF3C7', color: '#B45309', borderColor: '#FDE68A' },
    "베이직": { backgroundColor: '#F3F4F6', color: '#4B5563', borderColor: '#E5E7EB' },
  };
  return styles[plan] || { backgroundColor: '#F3F4F6', color: '#4B5563', borderColor: '#E5E7EB' };
}

export default function TestimonialsPage() {
  useDocumentMeta('현직 사장님 5명이 직접 말한다', '"반신반의했는데 전화가 쏟아졌다." 입점 6개월차 업주들의 생생 인터뷰. 매출 변화, 광고 비교, 리뷰 효과, 검색 노출까지 숫자로 증명한 입점 후기 5건 정리.');
  const containerRef = useRef<HTMLDivElement>(null);

  // 하이라이트 수치
  const totalTestimonials = testimonials.length;
  const avgRating = (testimonials.reduce((a, t) => a + t.rating, 0) / totalTestimonials).toFixed(1);

  return (
    <div ref={containerRef}>
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0118] via-[#1a0a2e] to-[#0f0720]">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #F59E0B 0%, transparent 50%)' }} />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-6 border border-white/10">
            <PageLiveCounter pageName="후기 보는 중" baseCount={19} className="text-white/80 [&_strong]:text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            현직 사장님들이<br />
            <span style={{ color: '#F59E0B' }}>직접 말한다</span>
          </h1>
          <p className="text-base mb-6" style={{ lineHeight: '1.7', color: 'rgba(255,255,255,0.6)' }}>
            "반신반의했는데 전화가 쏟아졌다."<br />
            입점 업주 생생 인터뷰.
          </p>

          {/* 핵심 수치 */}
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: '#FFFFFF' }}>{totalTestimonials}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>업주 후기</p>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: '#FBBF24' }}>★ {avgRating}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>평균 만족도</p>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: '#34D399' }}>100%</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>재등록률</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TESTIMONIALS ═══ */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((t, idx) => (
            <div key={idx}>
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#8B5CF6]/20">
                {/* 하이라이트 배지 */}
                <div className="mb-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 px-3 py-2">
                  <p className="text-xs font-bold" style={{ color: '#B45309' }}>핵심: {t.highlight}</p>
                </div>

                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] text-sm font-bold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#111]">{t.name}</span>
                      <span className="rounded-full border px-2 py-0.5 text-xs font-medium" style={getPlanStyle(t.plan)}>
                        {t.plan}
                      </span>
                    </div>
                    <p className="text-sm text-[#555]">
                      {t.venue} · {t.region}
                    </p>
                  </div>
                </div>

                {/* 별점 */}
                <div className="mb-3 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-sm" style={{ color: i < t.rating ? '#FBBF24' : '#E5E7EB' }}>★</span>
                  ))}
                </div>

                <p className="mb-4 text-sm leading-relaxed text-[#555]" style={{ lineHeight: '1.7' }}>
                  &ldquo;{t.text}&rdquo;
                </p>

                <p className="text-xs text-[#999]">
                  이용 시작: {t.since}
                </p>
              </div>

              {idx === 2 && <MidContentHook seed="testimonials-mid" variant={6} />}
            </div>
          ))}
        </div>

        {/* 퀴즈 */}
        <MidContentQuiz
          question="업소 홍보할 때 뭐가 제일 중요할까?"
          options={['검색 상위노출이 전부다', '사진이 잘 나와야 한다', '후기 관리가 핵심이다', '가격 경쟁력이 우선이다']}
          seed="testimonials-quiz"
        />

        {/* ═══ BOTTOM ═══ */}
        <ReadCompletionReward teaser="입점하면 어떤 게 달라지는지">
          <div className="space-y-2">
            <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>
              프리미엄 입점 시 <strong>상위 노출, 인증 배지, 대시보드 분석, QR 명함</strong>이 제공된다.
              무료 베이직부터 시작할 수 있으니 부담 없이 시작해봐.
            </p>
            <Link to="/business" className="inline-flex items-center gap-1 text-sm font-bold text-[#8B5CF6] hover:text-[#7C3AED] mt-2">
              입점 안내 보기 →
            </Link>
          </div>
        </ReadCompletionReward>

        <div className="text-center mt-6">
          <ReadFinishCount pageName="업주 후기" baseCount={80} />
        </div>
      </div>

      <ReadingMilestone containerRef={containerRef} />
    </div>
  );
}
