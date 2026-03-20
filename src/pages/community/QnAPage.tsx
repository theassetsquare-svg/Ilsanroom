import { useState } from "react";
import { Link } from "react-router-dom";

const faqItems = [
  {
    question: "입장 시 신분증이 반드시 필요한가요?",
    answer: "네, 만 19세 이상을 확인하기 위해 주민등록증, 운전면허증 등 공식 신분증이 필수입니다. 여권이나 모바일 신분증도 가능합니다.",
  },
  {
    question: "예약 없이 방문해도 되나요?",
    answer: "대부분의 장소는 워크인이 가능하지만, 주말이나 특별 이벤트가 있는 날에는 사전 예약을 강력 권장합니다. 예약 시 대기 시간을 줄이고 원하는 좌석을 확보할 수 있습니다.",
  },
  {
    question: "드레스코드 기준이 궁금해요",
    answer: "장소 유형에 따라 다릅니다. 라운지는 스마트 캐주얼, 나이트는 세미포멀 이상이 일반적입니다. 슬리퍼, 반바지, 운동복은 대부분 입장이 제한됩니다.",
  },
  {
    question: "주차 가능한 곳이 있나요?",
    answer: "일부 대형 업소는 발렛파킹 서비스를 제공하며, 인근 유료 주차장을 안내하는 곳도 있습니다. 음주 예정이라면 대중교통이나 대리운전을 권장합니다.",
  },
  {
    question: "연령 제한이 어떻게 되나요?",
    answer: "일반적으로 만 19세 이상 입장 가능합니다. 일부 프리미엄 라운지는 만 25세 이상으로 제한하는 경우도 있으니 사전 확인이 필요합니다.",
  },
];

const categoryFilters = ["전체", "입장", "예약", "드레스코드", "가격", "교통"] as const;

const userQuestions = [
  {
    id: 1,
    title: "일산 라페스타 근처 분위기 좋은 라운지 추천받고 싶어요",
    author: "라운지탐방러",
    date: "2026-03-18",
    answers: 6,
    likes: 38,
    solved: true,
    category: "예약" as const,
  },
  {
    id: 2,
    title: "주말 나이트 입장료가 평일보다 비싼 이유가 있나요?",
    author: "가격비교중",
    date: "2026-03-17",
    answers: 4,
    likes: 52,
    solved: true,
    category: "가격" as const,
  },
  {
    id: 3,
    title: "일산에서 강남까지 새벽에 택시비 얼마 정도 나오나요?",
    author: "귀가걱정",
    date: "2026-03-16",
    answers: 9,
    likes: 71,
    solved: true,
    category: "교통" as const,
  },
  {
    id: 4,
    title: "청바지에 셔츠면 나이트 입장 가능할까요?",
    author: "옷장고민",
    date: "2026-03-15",
    answers: 7,
    likes: 29,
    solved: true,
    category: "드레스코드" as const,
  },
  {
    id: 5,
    title: "혼자 방문해도 어색하지 않은 곳 있을까요?",
    author: "솔로방문자",
    date: "2026-03-14",
    answers: 11,
    likes: 84,
    solved: false,
    category: "입장" as const,
  },
  {
    id: 6,
    title: "발렛파킹 되는 라운지가 있나요? 일산 지역으로요",
    author: "차량이용자",
    date: "2026-03-13",
    answers: 3,
    likes: 17,
    solved: false,
    category: "교통" as const,
  },
];

export default function QnAPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("전체");

  const filtered = activeCategory === "전체"
    ? userQuestions
    : userQuestions.filter((q) => q.category === activeCategory);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
            ← 커뮤니티
          </Link>
          <h1 className="text-3xl font-bold">궁금한 건 여기서 해결하세요</h1>
          <p className="mt-2 text-neon-text-muted">
            자주 올라오는 질문을 먼저 확인하고, 원하는 답이 없으면 직접 물어보세요
          </p>
        </div>

        {/* FAQ Accordion */}
        <section className="mb-12">
          <h2 className="mb-5 text-xl font-bold text-neon-primary-light">자주 묻는 질문</h2>
          <div className="space-y-2">
            {faqItems.map((faq, i) => (
              <div key={i} className="rounded-xl border border-neon-border bg-neon-surface overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-neon-surface-2"
                >
                  <span className="text-sm font-semibold">{faq.question}</span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-neon-text-muted transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="border-t border-neon-border bg-neon-bg/50 px-5 py-4">
                    <p className="text-sm leading-relaxed text-neon-text-muted">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* User Questions */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">회원 질문 목록</h2>
            <button className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-medium transition hover:bg-neon-primary-light">
              질문 올리기
            </button>
          </div>

          {/* Category Filter Tags */}
          <div className="mb-6 flex flex-wrap gap-2">
            {categoryFilters.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  activeCategory === cat
                    ? "bg-neon-primary text-neon-text"
                    : "border border-neon-border bg-transparent text-neon-text-muted hover:border-neon-primary/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((q) => (
              <div
                key={q.id}
                className="flex items-center gap-4 rounded-2xl border border-neon-border bg-neon-surface p-5 transition hover:border-neon-primary/30"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-xs ${
                    q.solved
                      ? "bg-neon-green/10 text-neon-green"
                      : "bg-neon-surface-2 text-neon-text-muted"
                  }`}
                >
                  <span className="text-lg font-bold">{q.answers}</span>
                  <span>답변</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold hover:text-neon-primary-light">
                    {q.solved && (
                      <span className="mr-2 text-xs text-neon-green">[해결]</span>
                    )}
                    {q.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-neon-primary-light/10 px-2 py-0.5 text-xs text-neon-primary-light">
                      {q.category}
                    </span>
                    <span className="text-xs text-neon-text-muted">{q.author}</span>
                    <span className="text-xs text-neon-text-muted">{q.date}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-neon-text-muted">
                  <div>♥ {q.likes}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
