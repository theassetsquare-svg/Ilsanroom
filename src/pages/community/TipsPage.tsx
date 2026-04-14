import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';

type Category = "입문" | "절약" | "보호" | "예절";
type Difficulty = "쉬움" | "보통" | "고급";

const categoryIcons: Record<Category, string> = {
  "입문": "🌱", "절약": "💰", "보호": "🛡️", "예절": "🤝",
};

const difficultyColors: Record<Difficulty, string> = {
  "쉬움": "bg-neon-green/15 text-neon-green",
  "보통": "bg-neon-gold/15 text-neon-gold",
  "고급": "bg-neon-red/15 text-neon-red",
};

interface TipCard {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  author: string;
  bookmarks: number;
  summary: string;
}

function postToTip(post: Post): TipCard {
  return {
    id: post.id,
    title: post.title,
    category: "입문",
    difficulty: "보통",
    author: post.users?.nickname || "익명",
    bookmarks: post.likes,
    summary: post.content.length > 100 ? post.content.slice(0, 100) + "…" : post.content,
  };
}

const ALL = "전체" as const;
const categories: Array<Category | typeof ALL> = [ALL, "입문", "절약", "보호", "예절"];

export default function TipsPage() {
  useDocumentMeta('고수들이 풀어놓은 밤놀이 실전 꿀팁', '입장 타이밍, 자리 잡는 법, 안 당하는 법. 경험자만 아는 노하우.');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState<Category | "전체">(ALL);
  const [tips, setTips] = useState<TipCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await fetchPosts('tips');
      setTips(data.map(postToTip));
      setLoading(false);
    })();
  }, []);

  const handleWriteClick = () => {
    if (!user) { window.location.href = '/login'; return; }
    setShowWriteModal(true);
  };

  const handleSubmit = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    setSubmitting(true);
    const result = await createPost({ category: 'tips', title: writeTitle, content: writeContent });
    if (result.error) { alert("저장 실패: " + result.error); } else {
      alert("글이 저장되었습니다!");
      setShowWriteModal(false); setWriteTitle(""); setWriteContent("");
      const { data } = await fetchPosts('tips');
      setTips(data.map(postToTip));
    }
    setSubmitting(false);
  };

  const filtered = activeCat === ALL ? tips : tips.filter((t) => t.category === activeCat);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-10">
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">← 커뮤니티</Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">꿀팁</h1>
              <p className="mt-2 text-neon-text-muted">상황별로 정리된 핵심 요령을 카드 형태로 빠르게 훑어보세요</p>
            </div>
            <button onClick={handleWriteClick} className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-medium transition hover:bg-neon-primary-light">글쓰기</button>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition ${activeCat === cat ? "bg-neon-primary text-neon-text" : "border border-neon-border text-neon-text-muted hover:border-neon-primary/50"}`}>
              {cat !== ALL && <span>{categoryIcons[cat]}</span>}
              {cat}
            </button>
          ))}
        </div>

        {loading && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">불러오는 중...</div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tip) => (
              <button key={tip.id} onClick={() => navigate('/community/post/' + tip.id)}
                className="flex flex-col text-left rounded-2xl border border-neon-border bg-neon-surface p-5 transition hover:border-neon-primary/40 hover:shadow-lg hover:shadow-neon-primary/5" style={{ minHeight: 48 }}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{categoryIcons[tip.category]}</span>
                    <span className="rounded-full bg-neon-primary-light/10 px-2.5 py-0.5 text-xs text-neon-primary-light">{tip.category}</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColors[tip.difficulty]}`}>{tip.difficulty}</span>
                </div>
                <h3 className="mb-2 text-base font-bold leading-snug">{tip.title}</h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-neon-text-muted">{tip.summary}</p>
                <div className="flex items-center justify-between border-t border-neon-border pt-3 text-xs text-neon-text-muted">
                  <span>{tip.author}</span>
                  <span>🔖 {tip.bookmarks}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
            아직 꿀팁이 없습니다. 첫 번째 꿀팁을 공유해보세요!
          </div>
        )}

        {showWriteModal && (
          <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
              <button onClick={() => setShowWriteModal(false)} className="text-sm font-medium" style={{ color: '#555', minHeight: 44 }}>취소</button>
              <h2 className="text-base font-bold" style={{ color: '#111' }}>꿀팁 작성</h2>
              <div style={{ width: 44 }} />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-2xl mx-auto w-full">
              <input value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} placeholder="팁 제목을 입력하세요"
                className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none" style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              <textarea value={writeContent} onChange={(e) => setWriteContent(e.target.value)} placeholder="꿀팁 내용을 작성해주세요"
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
