import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';

const faqItems = [
  {
    question: "입장 시 신분증이 반드시 필요한가요?",
    answer: "무조건 필요해. 주민등록증, 운전면허증 같은 공식 신분증 없으면 입장 자체가 안 돼. 여권이나 모바일 신분증도 통하긴 해.",
  },
  {
    question: "예약 없이 방문해도 되나요?",
    answer: "그냥 가도 되긴 하는데, 금토나 행사 있는 날은 줄 서다 지칠 수 있어. 예약 한 번 해놓으면 기다릴 필요 없고 좋은 자리도 잡힘.",
  },
  {
    question: "드레스코드 기준이 궁금해요",
    answer: "곳마다 다른데 대충 정리하면 이래. 라운지는 깔끔한 사복이면 OK, 나이트는 좀 더 신경 써야 해. 슬리퍼, 반바지, 트레이닝복은 어디든 못 들어간다고 보면 돼.",
  },
  {
    question: "주차 가능한 곳이 있나요?",
    answer: "큰 곳은 발렛파킹 되는 데도 있고, 근처 유료 주차장 알려주는 곳도 있어. 근데 솔직히 술 마실 거면 차 가져가지 마. 대리 부르거나 택시 타는 게 속 편해.",
  },
  {
    question: "연령 제한이 어떻게 되나요?",
    answer: "기본적으로 만 19세 이상이면 돼. 근데 몇몇 라운지는 만 25세 이상만 받는 데도 있으니까, 가기 전에 전화 한 통 해봐.",
  },
];

const categoryFilters = ["전체", "입장", "예약", "드레스코드", "가격", "교통"] as const;

const sampleUserQuestions = [
  {
    id: "sample-1",
    title: "일산 라페스타 근처 분위기 좋은 라운지 추천받고 싶어요",
    author: "라운지탐방러",
    date: "2026-03-18",
    answers: 6,
    likes: 38,
    solved: true,
    category: "예약" as const,
  },
  {
    id: "sample-2",
    title: "주말 나이트 입장료가 평일보다 비싼 이유가 있나요?",
    author: "가격비교중",
    date: "2026-03-17",
    answers: 4,
    likes: 52,
    solved: true,
    category: "가격" as const,
  },
  {
    id: "sample-3",
    title: "일산에서 강남까지 새벽에 택시비 얼마 정도 나오나요?",
    author: "귀가걱정",
    date: "2026-03-16",
    answers: 9,
    likes: 71,
    solved: true,
    category: "교통" as const,
  },
  {
    id: "sample-4",
    title: "청바지에 셔츠면 나이트 입장 가능할까요?",
    author: "옷장고민",
    date: "2026-03-15",
    answers: 7,
    likes: 29,
    solved: true,
    category: "드레스코드" as const,
  },
  {
    id: "sample-5",
    title: "혼자 방문해도 어색하지 않은 곳 있을까요?",
    author: "솔로방문자",
    date: "2026-03-14",
    answers: 11,
    likes: 84,
    solved: false,
    category: "입장" as const,
  },
  {
    id: "sample-6",
    title: "발렛파킹 되는 라운지가 있나요? 일산 지역으로요",
    author: "차량이용자",
    date: "2026-03-13",
    answers: 3,
    likes: 17,
    solved: false,
    category: "교통" as const,
  },
];

function postToQuestion(post: Post) {
  return {
    id: post.id,
    title: post.title,
    author: post.users?.nickname || "익명",
    date: post.created_at.slice(0, 10),
    answers: post.comment_count || 0,
    likes: post.likes,
    solved: false,
    category: "전체" as const,
  };
}

export default function QnAPage() {
  useDocumentMeta('자주 묻는 질문 Q&A', '혼자 가도 되나요? 뭐 입고 가요? 신규 방문자 필독 Q&A.');
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("전체");
  const [questions, setQuestions] = useState(sampleUserQuestions);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await fetchPosts('discussion');
      if (data.length > 0) {
        setQuestions(data.map(postToQuestion));
      }
      setLoading(false);
    })();
  }, []);

  const handleWriteClick = () => {
    if (!user) {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 3000);
      return;
    }
    setShowWriteModal(true);
  };

  const handleSubmit = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    setSubmitting(true);
    const result = await createPost({
      category: 'discussion',
      title: writeTitle,
      content: writeContent,
    });
    if (!result.error) {
      setShowWriteModal(false);
      setWriteTitle("");
      setWriteContent("");
      const { data } = await fetchPosts('discussion');
      if (data.length > 0) {
        setQuestions(data.map(postToQuestion));
      }
    }
    setSubmitting(false);
  };

  const filtered = activeCategory === "전체"
    ? questions
    : questions.filter((q) => q.category === activeCategory);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
            ← 커뮤니티
          </Link>
          <h1 className="text-3xl font-bold">궁금한 건 여기서 해결하세요</h1>
          <p className="mt-2 text-neon-text-muted">
            자주 올라오는 질문을 먼저 확인하고, 원하는 답이 없으면 직접 물어보세요
          </p>
        </div>

        {/* Auth Error Toast */}
        {authError && (
          <div className="mb-4 rounded-xl border border-neon-red/30 bg-neon-red/10 px-5 py-3 text-sm text-neon-red">
            로그인이 필요합니다
          </div>
        )}

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
            <button
              onClick={handleWriteClick}
              className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-medium transition hover:bg-neon-primary-light"
            >
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

          {loading && (
            <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
              불러오는 중...
            </div>
          )}

          {!loading && (
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

              {filtered.length === 0 && (
                <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
                  아직 게시글이 없습니다
                </div>
              )}
            </div>
          )}
        </section>

        {/* Write Modal */}
        {showWriteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-neon-border bg-neon-surface p-6">
              <h2 className="mb-4 text-lg font-bold">질문 올리기</h2>
              <div className="mb-3">
                <label className="mb-1 block text-xs text-neon-text-muted">제목</label>
                <input value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} placeholder="질문 제목을 입력하세요"
                  className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary" />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-xs text-neon-text-muted">내용</label>
                <textarea value={writeContent} onChange={(e) => setWriteContent(e.target.value)} placeholder="궁금한 내용을 작성해주세요" rows={5}
                  className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowWriteModal(false)} className="rounded-lg px-4 py-2 text-sm text-neon-text-muted hover:bg-neon-surface-2">취소</button>
                <button onClick={handleSubmit} disabled={submitting || !writeTitle.trim() || !writeContent.trim()}
                  className="rounded-lg bg-neon-primary px-5 py-2 text-sm font-medium transition hover:bg-neon-primary-light disabled:opacity-50">
                  {submitting ? "등록 중..." : "등록"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
