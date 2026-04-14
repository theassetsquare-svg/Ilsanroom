import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';

const faqItems = [
  { question: "입장 시 신분증이 반드시 필요한가요?", answer: "무조건 필요해. 주민등록증, 운전면허증 같은 공식 신분증 없으면 입장 자체가 안 돼. 여권이나 모바일 신분증도 통하긴 해." },
  { question: "예약 없이 방문해도 되나요?", answer: "그냥 가도 되긴 하는데, 금토나 행사 있는 날은 줄 서다 지칠 수 있어. 예약 한 번 해놓으면 기다릴 필요 없고 좋은 자리도 잡힘." },
  { question: "드레스코드 기준이 궁금해요", answer: "곳마다 다른데 대충 정리하면 이래. 라운지는 깔끔한 사복이면 OK, 나이트는 좀 더 신경 써야 해. 슬리퍼, 반바지, 트레이닝복은 어디든 못 들어간다고 보면 돼." },
  { question: "주차 가능한 곳이 있나요?", answer: "큰 곳은 발렛파킹 되는 데도 있고, 근처 유료 주차장 알려주는 곳도 있어. 근데 솔직히 술 마실 거면 차 가져가지 마. 대리 부르거나 택시 타는 게 속 편해." },
  { question: "연령 제한이 어떻게 되나요?", answer: "기본적으로 만 19세 이상이면 돼. 근데 몇몇 라운지는 만 25세 이상만 받는 데도 있으니까, 가기 전에 전화 한 통 해봐." },
];

interface QuestionItem {
  id: string;
  title: string;
  author: string;
  date: string;
  answers: number;
  likes: number;
  solved: boolean;
  category: string;
}

function postToQuestion(post: Post): QuestionItem {
  return {
    id: post.id,
    title: post.title,
    author: post.users?.nickname || "익명",
    date: post.created_at.slice(0, 10),
    answers: post.comment_count || 0,
    likes: post.likes,
    solved: false,
    category: "전체",
  };
}

const categoryFilters = ["전체", "입장", "예약", "드레스코드", "가격", "교통"] as const;

export default function QnAPage() {
  useDocumentMeta('오늘 밤 어디 가냐고? 여기서 추천받아', '갈 곳 못 정한 사람들이 모여서 서로 추천해주는 게시판.');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("전체");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await fetchPosts('discussion');
      setQuestions(data.map(postToQuestion));
      setLoading(false);
    })();
  }, []);

  const handleWriteClick = () => {
    if (!user) { navigate('/login'); return; }
    setShowWriteModal(true);
  };

  const handleSubmit = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    setSubmitting(true);
    const result = await createPost({ category: 'discussion', title: writeTitle, content: writeContent });
    if (result.error) {
      alert("저장 실패: " + result.error);
    } else {
      alert("글이 저장되었습니다!");
      setShowWriteModal(false); setWriteTitle(""); setWriteContent("");
      const { data } = await fetchPosts('discussion');
      setQuestions(data.map(postToQuestion));
    }
    setSubmitting(false);
  };

  const filtered = activeCategory === "전체" ? questions : questions.filter((q) => q.category === activeCategory);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-10">
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">← 커뮤니티</Link>
          <h1 className="text-3xl font-bold">오늘어디갈까</h1>
          <p className="mt-2 text-neon-text-muted">오늘 밤 어디 갈지 추천받고, 같이 고민하는 곳</p>
        </div>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-5 text-xl font-bold text-neon-primary-light">자주 묻는 질문 FAQ</h2>
          <div className="space-y-2">
            {faqItems.map((faq, i) => (
              <div key={i} className="rounded-xl border border-neon-border bg-neon-surface overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-neon-surface-2">
                  <span className="text-sm font-semibold">{faq.question}</span>
                  <svg className={`h-5 w-5 shrink-0 text-neon-text-muted transition-transform ${openFaq === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <h2 className="text-xl font-bold">오늘어디갈까 게시글</h2>
            <button onClick={handleWriteClick} className="rounded-xl px-5 py-2.5 text-sm font-bold transition"
              style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 44 }}>글쓰기</button>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {categoryFilters.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm transition ${activeCategory === cat ? "bg-neon-primary text-neon-text" : "border border-neon-border bg-transparent text-neon-text-muted hover:border-neon-primary/50"}`}>
                {cat}
              </button>
            ))}
          </div>

          {loading && (
            <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">불러오는 중...</div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((q) => (
                <button key={q.id} onClick={() => navigate('/community/post/' + q.id)}
                  className="w-full text-left flex items-center gap-4 rounded-2xl border border-neon-border bg-neon-surface p-5 transition hover:border-neon-primary/30" style={{ minHeight: 48 }}>
                  <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-xs ${q.solved ? "bg-neon-green/10 text-neon-green" : "bg-neon-surface-2 text-neon-text-muted"}`}>
                    <span className="text-lg font-bold">{q.answers}</span>
                    <span>답변</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">
                      {q.solved && <span className="mr-2 text-xs text-neon-green">[해결]</span>}
                      {q.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-neon-text-muted">{q.author}</span>
                      <span className="text-xs text-neon-text-muted">{q.date}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-neon-text-muted">♥ {q.likes}</div>
                </button>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
              아직 게시글이 없습니다. 궁금한 게 있으면 물어보세요!
            </div>
          )}
        </section>

        {showWriteModal && (
          <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
              <button onClick={() => setShowWriteModal(false)} className="text-sm font-medium" style={{ color: '#555', minHeight: 44 }}>취소</button>
              <h2 className="text-base font-bold" style={{ color: '#111' }}>글쓰기</h2>
              <div style={{ width: 44 }} />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-2xl mx-auto w-full">
              <input value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} placeholder="제목을 입력하세요"
                className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none" style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              <textarea value={writeContent} onChange={(e) => setWriteContent(e.target.value)} placeholder="궁금한 내용을 작성해주세요"
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none resize-none" style={{ borderColor: '#E5E7EB', color: '#111', minHeight: '50vh', lineHeight: '1.8' }} />
            </div>
            <div className="fixed bottom-0 left-0 right-0 px-4 py-4 border-t" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <button onClick={handleSubmit} disabled={submitting || !writeTitle.trim() || !writeContent.trim()}
                className="w-full rounded-xl py-4 text-base font-bold transition active:scale-[0.98] disabled:opacity-30"
                style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 56 }}>
                {submitting ? "등록 중..." : "글 저장"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
