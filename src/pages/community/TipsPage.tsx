import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, deletePost, deleteComment, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';
import { useEngagementStore } from '@/lib/engagement-store';

type Category = "입문" | "절약" | "보호" | "예절";
type Difficulty = "쉬움" | "보통" | "고급";

const categoryIcons: Record<Category, string> = {
  "입문": "🌱",
  "절약": "💰",
  "보호": "🛡️",
  "예절": "🤝",
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

const sampleTipCards: TipCard[] = [
  {
    id: "sample-1",
    title: "첫 방문 전 확인해야 할 세 가지",
    category: "입문",
    difficulty: "쉬움",
    author: "길잡이",
    bookmarks: 312,
    summary: "영업시간, 위치, 복장 규정을 미리 파악하면 당황할 일이 없습니다. 홈페이지나 SNS에서 최신 정보 챙겨둬.",
  },
  {
    id: "sample-2",
    title: "음료비 아끼는 현명한 방법",
    category: "절약",
    difficulty: "쉬움",
    author: "스마트소비",
    bookmarks: 278,
    summary: "조기 입장 프로모션이나 플랫폼 제휴 할인을 활용하세요. 세트 메뉴가 단품보다 경제적인 경우가 많습니다.",
  },
  {
    id: "sample-3",
    title: "무사히 귀가하기 위한 사전 준비",
    category: "보호",
    difficulty: "쉬움",
    author: "세이프가드",
    bookmarks: 405,
    summary: "출발 전 대리운전 앱을 설치하고, 지인에게 위치를 공유해 두세요. 배터리 잔량도 충분히 확보해야 합니다.",
  },
  {
    id: "sample-4",
    title: "테이블 기본 룰",
    category: "예절",
    difficulty: "보통",
    author: "예절코치",
    bookmarks: 189,
    summary: "주변 테이블에 소음으로 불편을 주지 않도록 하고, 직원에게 정중하게 요청하는 것이 기본입니다.",
  },
  {
    id: "sample-5",
    title: "단체 예약 시 비용 분담 요령",
    category: "절약",
    difficulty: "보통",
    author: "모임장",
    bookmarks: 234,
    summary: "사전에 1인당 예산을 정하고 공용 계좌로 모은 뒤, 추가 주문은 개별 결제하면 정산이 깔끔합니다.",
  },
  {
    id: "sample-6",
    title: "분위기 파악하고 자연스럽게 즐기기",
    category: "입문",
    difficulty: "보통",
    author: "분위기메이커",
    bookmarks: 156,
    summary: "도착 후 30분은 관찰 시간으로 두세요. 음악 장르, 연령대, 큰 흐름을 파악하면 훨씬 편안해집니다.",
  },
  {
    id: "sample-7",
    title: "응급 상황 대처 가이드",
    category: "보호",
    difficulty: "고급",
    author: "응급매뉴얼",
    bookmarks: 367,
    summary: "과음으로 인한 응급 상황 발생 시 직원에게 즉시 알리고, 119 연락 및 구토 시 옆으로 눕히는 것이 중요합니다. 조심해서 나쁠 건 없습니다.",
  },
  {
    id: "sample-8",
    title: "VIP석 활용 노하우",
    category: "예절",
    difficulty: "고급",
    author: "VIP안내원",
    bookmarks: 201,
    summary: "VIP석 예약할 때 최소 주문 금액 알아둬. 담당 직원과 소통하며 원하는 서비스를 명확히 요청하는 것이 핵심입니다.",
  },
];

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
const catLabel: Record<string, string> = { "전체": "통합" };

export default function TipsPage() {
  useDocumentMeta('고수들이 풀어놓은 밤놀이 실전 꿀팁', '입장 타이밍, 자리 잡는 법, 안 당하는 법. 경험자만 아는 노하우.');
  const { user } = useAuth();
  const points = useEngagementStore((s) => s.points);
  const [activeCat, setActiveCat] = useState<Category | "전체">(ALL);
  const [tips, setTips] = useState<TipCard[]>(sampleTipCards);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await fetchPosts('tips');
      if (data.length > 0) {
        setTips(data.map(postToTip));
      }
      setLoading(false);
    })();
  }, []);

  const handleWriteClick = () => {
    if (!user) {
      window.location.href = '/login'; return;
    }
    if (points < 300) { alert("🔒 글쓰기는 🔥매니아(300P) 등급부터 가능합니다. 현재 " + points + "P"); return; }
    setShowWriteModal(true);
  };

  const handleSubmit = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    setSubmitting(true);
    const result = await createPost({
      category: 'tips',
      title: writeTitle,
      content: writeContent,
    });
    if (result.error) { alert("저장 실패: " + result.error); } else { alert("글이 저장되었습니다!");
      setShowWriteModal(false);
      setWriteTitle("");
      setWriteContent("");
      const { data } = await fetchPosts('tips');
      if (data.length > 0) {
        setTips(data.map(postToTip));
      }
    }
    setSubmitting(false);
  };

  const filtered = activeCat === ALL ? tips : tips.filter((t) => t.category === activeCat);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-5xl px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
            ← 커뮤니티
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">꿀팁</h1>
              <p className="mt-2 text-neon-text-muted">
                상황별로 정리된 핵심 요령을 카드 형태로 빠르게 훑어보세요
              </p>
            </div>
            <button
              onClick={handleWriteClick}
              className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-medium transition hover:bg-neon-primary-light"
            >
              글쓰기
            </button>
          </div>
        </div>

        {/* Auth Error Toast */}
        {authError && (
          <div className="mb-4 rounded-xl border border-neon-red/30 bg-neon-red/10 px-5 py-3 text-sm text-neon-red">
            로그인이 필요합니다
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition ${
                activeCat === cat
                  ? "bg-neon-primary text-neon-text"
                  : "border border-neon-border text-neon-text-muted hover:border-neon-primary/50"
              }`}
            >
              {cat !== ALL && <span>{categoryIcons[cat]}</span>}
              {catLabel[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
            불러오는 중...
          </div>
        )}

        {/* Card Grid */}
        {!loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tip) => (
              <div
                key={tip.id}
                className="flex flex-col rounded-2xl border border-neon-border bg-neon-surface p-5 transition hover:border-neon-primary/40 hover:shadow-lg hover:shadow-neon-primary/5"
              >
                {/* Icon + Category */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{categoryIcons[tip.category]}</span>
                    <span className="rounded-full bg-neon-primary-light/10 px-2.5 py-0.5 text-xs text-neon-primary-light">
                      {tip.category}
                    </span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColors[tip.difficulty]}`}>
                    {tip.difficulty}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mb-2 text-base font-bold leading-snug">{tip.title}</h3>

                {/* Summary */}
                <p className="mb-4 flex-1 text-sm leading-relaxed text-neon-text-muted">
                  {tip.summary}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-neon-border pt-3 text-xs text-neon-text-muted">
                  <span>{tip.author}</span>
                  <span>🔖 {tip.bookmarks}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
            아직 게시글이 없습니다
          </div>
        )}

        {/* Write Modal */}
        {showWriteModal && (
          <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
              <button onClick={() => setShowWriteModal(false)} className="text-sm font-medium" style={{ color: '#555', minHeight: 44 }}>취소</button>
              <h2 className="text-base font-bold" style={{ color: '#111' }}>글쓰기</h2>
              <div style={{ width: 44 }} />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
              <div className="mb-3">
                <label className="mb-1 block text-xs" style={{ color: '#555' }}>제목</label>
                <input value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} placeholder="팁 제목을 입력하세요"
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-xs" style={{ color: '#555' }}>내용</label>
                <textarea value={writeContent} onChange={(e) => setWriteContent(e.target.value)} placeholder="꿀팁 내용을 작성해주세요" 
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none resize-none" style={{ borderColor: '#E5E7EB', color: '#111', minHeight: '50vh', lineHeight: '1.8' }} />
              </div>
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
