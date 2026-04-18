import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { PostListSkeleton } from '@/components/ui/Skeleton';

const RichTextEditor = lazy(() => import('@/components/community/RichTextEditor'));
import WriteHeader from '@/components/community/WriteHeader';

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
    if (result.error) { setSubmitting(false); return; } else {
      setShowWriteModal(false); setWriteTitle(""); setWriteContent("");
      const { data } = await fetchPosts('tips');
      setTips(data.map(postToTip));
    }
    setSubmitting(false);
  };

  // 시드 글 (DB 비어있을 때 사이트가 살아보이게)
  const seedPosts: TipCard[] = [
    { id: 'seed-1', title: '입장료 할인 받는 확실한 방법', category: '절약', difficulty: '쉬움', author: '절약의신', bookmarks: 42, summary: '게스트 등록 미리 해두면 만원 이상 아끼는 곳 많아. 인스타 팔로우만 해도 할인되는 데도 있음.' },
    { id: 'seed-2', title: '첫 방문 시 웨이터한테 이거 꼭 말해라', category: '입문', difficulty: '쉬움', author: '나이트경력5년', bookmarks: 38, summary: '처음 왔다고 솔직하게 말하면 웨이터가 알아서 자리 잡아주고 시스템도 설명해줌. 아는 척 하면 오히려 손해.' },
    { id: 'seed-3', title: '금토 피크시간 피하는 꿀팁', category: '입문', difficulty: '보통', author: '타이밍장인', bookmarks: 31, summary: '12시~1시가 제일 붐빔. 10시 반에 가면 줄 안 서고 바로 입장됨. 새벽 2시 이후도 한산해서 좋음.' },
    { id: 'seed-4', title: '드레스코드 무난하게 맞추는 법', category: '예절', difficulty: '쉬움', author: '패션센스제로', bookmarks: 25, summary: '검정 슬랙스에 깔끔한 셔츠면 어디든 통과. 운동화는 깨끗한 거면 대부분 OK. 슬리퍼만 아니면 됨.' },
    { id: 'seed-5', title: '테이블 vs 일반입장 뭐가 나은지', category: '절약', difficulty: '고급', author: '테이블마스터', bookmarks: 29, summary: '4명 이상이면 테이블이 오히려 싸게 먹힘. 2~3명이면 일반입장 후 바에서 마시는 게 경제적.' },
  ];
  const displayTips = tips.length > 0 ? tips : seedPosts;

  const filtered = activeCat === ALL ? displayTips : displayTips.filter((t) => t.category === activeCat);

  // 인기 팁 TOP 3
  const hotTips = [...displayTips].sort((a, b) => b.bookmarks - a.bookmarks).slice(0, 3);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <div className="mb-8">
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">← 커뮤니티</Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">꿀팁</h1>
              <p className="mt-2 text-sm font-bold" style={{ color: '#8B5CF6' }}>
                "이거 모르고 갔다가 후회한 사람 한둘이 아님"
              </p>
              <div className="mt-2"><PageLiveCounter pageName="꿀팁 읽는 중" baseCount={22} /></div>
            </div>
            <button onClick={handleWriteClick} className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-medium transition hover:bg-neon-primary-light"
              style={{ minHeight: 44 }}>글쓰기</button>
          </div>
        </div>

        {/* 인기 팁 하이라이트 */}
        {!loading && hotTips.length > 0 && (
          <div className="mb-6 rounded-2xl border p-4 sm:p-5" style={{ borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.04)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">💡</span>
              <h2 className="text-sm font-black" style={{ color: '#111' }}>이 게시판에서 가장 많이 저장된 팁</h2>
            </div>
            <div className="space-y-2">
              {hotTips.map((tip, idx) => (
                <button key={tip.id} onClick={() => !tip.id.startsWith('seed-') && navigate('/community/post/' + tip.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white"
                  style={{ minHeight: 44 }}>
                  <span className="text-sm font-black shrink-0" style={{ color: idx === 0 ? '#EF4444' : '#F59E0B', width: 20 }}>{idx + 1}</span>
                  <span className="text-sm font-medium truncate flex-1" style={{ color: '#111' }}>{tip.title}</span>
                  <span className="text-xs shrink-0" style={{ color: '#999' }}>🔖{tip.bookmarks}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition ${activeCat === cat ? "bg-neon-primary text-neon-text" : "border border-neon-border text-neon-text-muted hover:border-neon-primary/50"}`}
              style={{ minHeight: 36 }}>
              {cat !== ALL && <span>{categoryIcons[cat]}</span>}
              {cat}
            </button>
          ))}
        </div>

        {loading && (
          <PostListSkeleton />
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tip) => (
              <button key={tip.id} onClick={() => !tip.id.startsWith('seed-') && navigate('/community/post/' + tip.id)}
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

        {!loading && filtered.length === 0 && activeCat !== ALL && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
            해당 카테고리의 팁이 없습니다. 다른 카테고리를 선택해보세요!
          </div>
        )}

        {/* 다른 게시판 순환 */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <span className="shrink-0 text-xs" style={{ color: '#999' }}>다른 게시판</span>
          {[
            { label: '💬 자유', href: '/community/free' },
            { label: '⭐ 후기', href: '/community/reviews' },
            { label: '🗺️ 오늘어디', href: '/community/qna' },
            { label: '🧩 조각모임', href: '/community/jogak' },
            { label: '👗 패션', href: '/community/fashion' },
            { label: '🎉 파티', href: '/community/party' },
          ].map(b => (
            <Link key={b.label} to={b.href} className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:border-[#8B5CF6]/40 whitespace-nowrap"
              style={{ borderColor: '#E5E7EB', color: '#555' }}>
              {b.label}
            </Link>
          ))}
        </div>

        {showWriteModal && (
          <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
            <WriteHeader onCancel={() => setShowWriteModal(false)} title="꿀팁 작성" />
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-2xl mx-auto w-full">
              <input value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} placeholder="팁 제목을 입력하세요"
                className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none" style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              <Suspense fallback={<div className="py-8 text-center text-sm" style={{ color: '#999' }}>에디터 로딩 중...</div>}>
                <RichTextEditor value={writeContent} onChange={setWriteContent} placeholder="꿀팁을 작성해주세요. 이미지/동영상 첨부 가능!" minHeight={300} />
              </Suspense>
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
