import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { PostListSkeleton } from '@/components/ui/Skeleton';

const RichTextEditor = lazy(() => import('@/components/community/RichTextEditor'));
import WriteHeader from '@/components/community/WriteHeader';

type Category = "입문" | "절약" | "보호" | "예절" | "안전";
type Difficulty = "쉬움" | "보통" | "고급";

const categoryIcons: Record<Category, string> = {
  "입문": "🌱", "절약": "💰", "보호": "🛡️", "예절": "🤝", "안전": "⚠️",
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
    { id: 'seed-1', title: '게스트 등록으로 입장료 반값 만드는 법', category: '절약', difficulty: '쉬움', author: '절약의신', bookmarks: 52, summary: '인스타 팔로우하고 DM으로 게스트 신청하면 만원 이상 깎이는 곳 수두룩함. 모르면 호구됨 진짜.' },
    { id: 'seed-2', title: '웨이터한테 처음 왔다고 말하면 생기는 일', category: '입문', difficulty: '쉬움', author: '나이트5년차', bookmarks: 47, summary: '솔직히 처음이라고 하면 웨이터가 좋은 자리 잡아줌. 아는 척하면 구석으로 보내버림 ㅋㅋ' },
    { id: 'seed-3', title: '금토 줄 안 서고 바로 입장하는 시간대', category: '입문', difficulty: '보통', author: '타이밍장인', bookmarks: 41, summary: '10시 반~11시 사이가 골든타임. 12시 넘으면 30분은 기본으로 서야 됨. 새벽 2시 이후는 한산.' },
    { id: 'seed-4', title: '테이블 잡을 때 인원수별 최적 전략', category: '절약', difficulty: '고급', author: '테이블마스터', bookmarks: 39, summary: '4명 이상이면 테이블이 n빵하면 오히려 쌈. 2명이면 바 스탠딩이 답. 3명이 제일 애매함.' },
    { id: 'seed-5', title: '나이트 처음 가면 무조건 하는 실수 5가지', category: '입문', difficulty: '쉬움', author: '선배형', bookmarks: 55, summary: '입구에서 쭈뼛거리기, 핸드폰만 보기, 술 너무 빨리 마시기, 부킹 거절 못하기, 새벽에 택시 못잡기.' },
    { id: 'seed-6', title: '양주 브랜드별 가성비 랭킹 정리함', category: '절약', difficulty: '고급', author: '양주박사', bookmarks: 44, summary: '발렌타인17년 가성비 최고. 조니워커블랙도 괜찮음. 로얄살루트는 접대용. 혼자 먹을 거면 잭다니엘.' },
    { id: 'seed-7', title: '부킹 성공률 높이는 현실적인 방법', category: '입문', difficulty: '보통', author: '부킹달인', bookmarks: 36, summary: '웨이터한테 미리 말해두는 게 핵심. 테이블 분위기 좋게 유지하고 있으면 웨이터가 알아서 연결해줌.' },
    { id: 'seed-8', title: '호빠 처음 가는 여자들 필독 가이드', category: '입문', difficulty: '쉬움', author: '호빠선배언니', bookmarks: 48, summary: '선수 맘에 안 들면 바로 체인지 가능함. 눈치 볼 필요 없음. 시간 잘 체크하고 연장은 신중하게.' },
    { id: 'seed-9', title: '요정에서 초이스할 때 에티켓 정리', category: '예절', difficulty: '고급', author: '접대고수', bookmarks: 33, summary: '손가락으로 가리키면 안 됨. 눈짓이나 번호로 말하기. 아가씨한테 직접 물어보는 건 실례임.' },
    { id: 'seed-10', title: '취했을 때 택시 안전하게 잡는 꿀팁', category: '안전', difficulty: '쉬움', author: '안전귀가', bookmarks: 31, summary: '카카오택시 미리 예약 걸어놓기. 대리운전 번호 저장해두기. 친구한테 위치 공유 필수.' },
    { id: 'seed-11', title: '라운지에서 자연스럽게 대화 거는 법', category: '입문', difficulty: '보통', author: '라운지단골', bookmarks: 28, summary: '옆 테이블 건배 제안이 제일 자연스러움. 갑자기 말 걸면 경계함. 분위기 읽는 게 먼저.' },
    { id: 'seed-12', title: '클럽에서 소지품 안 잃어버리는 방법', category: '안전', difficulty: '쉬움', author: '폰분실3회', bookmarks: 25, summary: '주머니 지퍼 달린 바지 입기. 가방은 락커에. 핸드폰 분실방지 줄 강추. 경험에서 나온 팁임 ㅠ' },
    { id: 'seed-13', title: '웨이터 팁 문화 어디까지가 적당한지', category: '예절', difficulty: '보통', author: '팁줄까말까', bookmarks: 22, summary: '잘 해주면 만원 정도 주면 다음에 VIP 대우 받음. 안 줘도 상관없긴 한데 단골 되려면 좀 챙겨.' },
    { id: 'seed-14', title: '혼술족 클럽 가는 현실적 후기', category: '입문', difficulty: '보통', author: '혼놀러', bookmarks: 19, summary: '바 카운터 앉으면 바텐더가 말 걸어줌. 의외로 혼자 온 사람 많음. 어색한 건 처음 10분만.' },
    { id: 'seed-15', title: '나이트 2차 갈 때 주의사항', category: '안전', difficulty: '보통', author: '안전제일', bookmarks: 15, summary: '처음 본 사람이랑 2차는 위험. 친구한테 위치 공유하고 가기. 현금 많이 들고 다니지 말 것.' },
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
