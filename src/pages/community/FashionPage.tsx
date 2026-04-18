import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { PostListSkeleton } from '@/components/ui/Skeleton';

const RichTextEditor = lazy(() => import('@/components/community/RichTextEditor'));
import WriteHeader from '@/components/community/WriteHeader';

interface StylePost {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  likes: number;
  date: string;
}

function postToStyle(post: Post): StylePost {
  return {
    id: post.id,
    title: post.title,
    author: post.users?.nickname || "익명",
    excerpt: post.content.length > 80 ? post.content.slice(0, 80) + "…" : post.content,
    likes: post.likes,
    date: post.created_at.slice(0, 10),
  };
}

/* 업종별 드레스코드 가이드 — 정적 콘텐츠로 첫 화면 임팩트 */
const DRESS_GUIDE = [
  { type: '클럽', ok: '깔끔한 셔츠, 슬랙스, 구두/운동화(깨끗한 것)', ng: '슬리퍼, 반바지, 트레이닝복', color: '#8B5CF6' },
  { type: '라운지', ok: '스마트 캐주얼, 깔끔한 원피스/재킷', ng: '후드티, 찢어진 청바지, 모자', color: '#10B981' },
  { type: '나이트', ok: '정장 또는 세미정장, 구두 필수', ng: '운동화, 청바지, 반팔티', color: '#F59E0B' },
  { type: '요정', ok: '깔끔한 사복 OK, 편안한 복장 가능', ng: '지나치게 캐주얼한 복장', color: '#EC4899' },
];

export default function FashionPage() {
  useDocumentMeta('운동화 신고 가도 돼? 업종별 복장 가이드', '클럽·나이트·요정·라운지, 어디냐에 따라 옷이 다르다. 한눈에 정리.');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<StylePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await fetchPosts('tips');
      setPosts(data.map(postToStyle));
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
      setPosts(data.map(postToStyle));
    }
    setSubmitting(false);
  };

  // 시드 글 (DB 비어있을 때 사이트가 살아보이게)
  const seedPosts: StylePost[] = [
    { id: 'seed-1', title: '클럽 남자 코디 이거면 어디든 통과함', author: '패션고수형', excerpt: '검정 슬랙스 + 흰 셔츠 + 로퍼 조합이 진리임. 오버핏 절대 안 됨. 슬림핏으로 깔끔하게.', likes: 38, date: '2026-04-18' },
    { id: 'seed-2', title: '나이트 갈 때 여자 원피스 추천 리스트', author: '코디요정', excerpt: '미니원피스가 무난하고 힐은 5cm 이하 추천. 너무 짧으면 오히려 별로고 무릎 위 10cm 정도가 딱.', likes: 35, date: '2026-04-18' },
    { id: 'seed-3', title: '봄 클럽 코디 이렇게 입으면 핵인싸', author: '봄밤패션', excerpt: '얇은 니트에 슬랙스 조합 요즘 대세임. 자켓 하나 걸치면 라운지도 가능. 색은 네이비 추천.', likes: 31, date: '2026-04-18' },
    { id: 'seed-4', title: '호빠 갈 때 여자 옷 뭐 입어야됨?', author: '호빠패션녀', excerpt: '너무 꾸미면 오히려 부담스러움. 깔끔한 블라우스에 스커트면 충분. 향수는 은은하게.', likes: 29, date: '2026-04-17' },
    { id: 'seed-5', title: '라운지 드레스코드 실패한 썰', author: '라운지단골녀', excerpt: '후드티 입고 갔다가 입구에서 막힘 ㅋㅋ 그 뒤로 무조건 셔츠 입고 감. 캡모자도 안 됨.', likes: 27, date: '2026-04-17' },
    { id: 'seed-6', title: '나이트 운동화 신어도 되는 곳 정리', author: '운동화파', excerpt: '깨끗한 흰 운동화면 대부분 OK인데 등산화, 슬리퍼는 100% 컷. 나이키 에어포스가 무난.', likes: 24, date: '2026-04-17' },
    { id: 'seed-7', title: '클럽 악세사리 뭐 하고 가면 좋음?', author: '악세덕후', excerpt: '남자는 심플한 팔찌나 시계면 충분. 목걸이는 체인 하나만. 너무 많이 하면 촌스러움.', likes: 22, date: '2026-04-16' },
    { id: 'seed-8', title: '겨울 나이트 코트 맡기는 꿀팁', author: '겨울밤스타일', excerpt: '물품보관 있는 곳은 코트 맡기면 되니까 안에만 신경 쓰기. 패딩보다 울코트가 훨씬 나음.', likes: 20, date: '2026-04-16' },
    { id: 'seed-9', title: '향수 뭐 뿌리고 가면 반응 좋음?', author: '향수마니아', excerpt: '블루드샤넬 남자 무난하고 여자는 딥티크 도손 반응 좋았음. 너무 진한 건 역효과.', likes: 18, date: '2026-04-16' },
    { id: 'seed-10', title: '라운지 남자 구두 vs 로퍼 뭐가 나음', author: '신발고민남', excerpt: '로퍼가 편하고 분위기도 잡힘. 구두는 너무 딱딱해 보임. 갈색 로퍼 하나면 만능.', likes: 16, date: '2026-04-15' },
    { id: 'seed-11', title: '클럽 가방 들고 가면 귀찮음?', author: '짐많은여자', excerpt: '작은 크로스백이 답임. 클러치는 분실 위험 있고 백팩은 분위기 안 맞음. 폰+카드+립만 넣어.', likes: 14, date: '2026-04-15' },
    { id: 'seed-12', title: '나이트 셔츠 반팔 vs 긴팔 뭐가 나음', author: '셔츠고민', excerpt: '봄가을은 긴팔 롤업이 제일 멋있음. 여름에만 반팔 가능. 민소매는 절대 안 됨 ㅋㅋ', likes: 12, date: '2026-04-14' },
    { id: 'seed-13', title: '요정 갈 때 정장 필수임?', author: '요정초보', excerpt: '풀정장까진 아니어도 셔츠+슬랙스는 기본. 청바지는 분위기 안 맞음. 넥타이는 안 해도 됨.', likes: 10, date: '2026-04-13' },
    { id: 'seed-14', title: '비 오는 날 클럽 신발 뭐 신어', author: '우천코디', excerpt: '방수 로퍼가 최고임. 운동화 신으면 젖어서 냄새남. 여분 양말 챙기는 센스.', likes: 9, date: '2026-04-13' },
    { id: 'seed-15', title: '30대 남자 나이트 코디 현실 조언', author: '삼십대형', excerpt: '20대처럼 입으면 오히려 구림. 깔끔한 니트에 코트 걸치면 나이값 하면서 멋있음. 무채색 위주로.', likes: 8, date: '2026-04-12' },
  ];
  const displayPosts = posts.length > 0 ? posts : seedPosts;

  // 인기 스타일 글
  const hotPosts = [...displayPosts].sort((a, b) => b.likes - a.likes).slice(0, 3);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <div className="mb-8">
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">← 커뮤니티</Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">스타일 갤러리</h1>
              <p className="mt-2 text-sm font-bold" style={{ color: '#8B5CF6' }}>
                "입구에서 막힌 적 있으면 여기부터 읽어"
              </p>
              <div className="mt-2"><PageLiveCounter pageName="스타일 보는 중" baseCount={19} /></div>
            </div>
            <button onClick={handleWriteClick} className="rounded-xl px-5 py-2.5 text-sm font-bold transition"
              style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 44 }}>글쓰기</button>
          </div>
        </div>

        {/* 업종별 드레스코드 가이드 — 첫 화면에서 바로 유용한 정보 */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {DRESS_GUIDE.map((g) => (
            <div key={g.type} className="rounded-xl border p-4" style={{ borderColor: g.color + '30', backgroundColor: g.color + '08' }}>
              <h3 className="text-sm font-black mb-2" style={{ color: g.color }}>{g.type} 드레스코드</h3>
              <div className="space-y-1">
                <p className="text-xs leading-relaxed" style={{ color: '#333' }}>
                  <span className="font-bold" style={{ color: '#10B981' }}>OK</span> {g.ok}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#333' }}>
                  <span className="font-bold" style={{ color: '#EF4444' }}>NG</span> {g.ng}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 인기 스타일 글 */}
        {!loading && hotPosts.length > 0 && (
          <div className="mb-6 rounded-2xl border p-4 sm:p-5" style={{ borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.04)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">👔</span>
              <h2 className="text-sm font-black" style={{ color: '#111' }}>지금 뜨는 스타일 글</h2>
            </div>
            <div className="space-y-2">
              {hotPosts.map((p, idx) => (
                <button key={p.id} onClick={() => !p.id.startsWith('seed-') && navigate('/community/post/' + p.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white"
                  style={{ minHeight: 44 }}>
                  <span className="text-sm font-black shrink-0" style={{ color: idx === 0 ? '#EF4444' : '#F59E0B', width: 20 }}>{idx + 1}</span>
                  <span className="text-sm font-medium truncate flex-1" style={{ color: '#111' }}>{p.title}</span>
                  <span className="text-xs shrink-0" style={{ color: '#999' }}>♥{p.likes}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <PostListSkeleton />
        )}

        {!loading && displayPosts.length > 0 && (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {displayPosts.map((post) => (
              <button key={post.id} onClick={() => !post.id.startsWith('seed-') && navigate('/community/post/' + post.id)}
                className="mb-5 break-inside-avoid w-full text-left rounded-2xl border border-neon-border bg-neon-surface p-5 transition hover:border-neon-primary/40"
                style={{ minHeight: 48 }}>
                <h3 className="mb-2 text-sm font-bold leading-snug">{post.title}</h3>
                <p className="mb-3 text-sm leading-relaxed text-neon-text-muted">{post.excerpt}</p>
                <div className="flex items-center justify-between border-t border-neon-border pt-3 text-xs text-neon-text-muted">
                  <span>{post.author} · {post.date}</span>
                  <span>♥ {post.likes}</span>
                </div>
              </button>
            ))}
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
            { label: '💡 꿀팁', href: '/community/tips' },
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
            <WriteHeader onCancel={() => setShowWriteModal(false)} title="스타일 공유" />
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-2xl mx-auto w-full">
              <input value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} placeholder="제목 (예: 클럽 갈 때 추천 코디)"
                className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none" style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              <Suspense fallback={<div className="py-8 text-center text-sm" style={{ color: '#999' }}>에디터 로딩 중...</div>}>
                <RichTextEditor value={writeContent} onChange={setWriteContent} placeholder="스타일 팁을 공유해주세요. 이미지/동영상 첨부 가능!" minHeight={300} />
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
