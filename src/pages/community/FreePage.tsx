import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from '../../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';
import { getSeedNickname } from '@/lib/fake-users';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { PostListSkeleton } from '@/components/ui/Skeleton';

const RichTextEditor = lazy(() => import('@/components/community/RichTextEditor'));
import WriteHeader from '@/components/community/WriteHeader';

interface SimplePost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  comments: number;
  likes: number;
}

function postToSimple(post: Post): SimplePost {
  const u = post.users as any;
  return {
    id: post.id,
    title: post.title,
    content: post.content || '',
    author: u?.nickname || getSeedNickname(post.id),
    date: post.created_at.slice(0, 10),
    comments: post.comment_count || 0,
    likes: post.likes || 0,
  };
}

export default function FreeBoardPage() {
  useDocumentMeta('자유게시판 — 주제 제한 없이 솔직하게 떠드는 곳', '잡담 질문 자랑 푸념 황당썰 추천음악 맛집 해장정보 다 OK. 익명 보장, 규칙만 지키면 뭐든 자유롭게 쓸 수 있는 자유게시판. 밤문화 입문자 환영.');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [recentPosts, setRecentPosts] = useState<SimplePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);

  useEffect(() => {
    if (searchParams.get('write') === 'true') {
      if (!user) { window.location.href = '/login'; return; }
      setShowWriteModal(true);
    }
  }, [searchParams, user]);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const postsPerPage = 10;

  const loadPosts = async (page: number) => {
    setLoading(true);
    const offset = (page - 1) * postsPerPage;
    const { data, count } = await fetchPosts('free', postsPerPage, offset);
    setRecentPosts(data.map(postToSimple));
    setTotalCount(count);
    setLoading(false);
  };

  useEffect(() => {
    loadPosts(currentPage);
  }, [currentPage]);

  const handleWriteClick = () => {
    if (!user) { window.location.href = '/login'; return; }
    setShowWriteModal(true);
  };

  const handleSubmit = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    setSubmitting(true);
    const result = await createPost({ category: 'free', title: writeTitle, content: writeContent });
    if (result.error) {
      setSubmitting(false);
      return;
    } else {
      setShowWriteModal(false); setWriteTitle(""); setWriteContent("");
      navigate('/community/post/' + (result.data?.id || ''));
    }
    setSubmitting(false);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / postsPerPage));
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1);

  // 시드 글 (DB 비어있을 때 사이트가 살아보이게)
  const seedPosts: SimplePost[] = [
    { id: 'seed-1', title: '어젯밤 일 아직도 술깸ㅋㅋㅋㅋ', content: '', author: '새벽감성러', date: '2026-04-18', comments: 14, likes: 32 },
    { id: 'seed-2', title: '형들 혼자 가면 진짜 어색해??', content: '', author: '혼놀족지망', date: '2026-04-18', comments: 23, likes: 19 },
    { id: 'seed-3', title: '택시비가 술값보다 많이 나온 사람 나만?ㅠ', content: '', author: '일산살이', date: '2026-04-18', comments: 11, likes: 41 },
    { id: 'seed-4', title: '첫 나이트 갔는데 부킹 당함 ㄷㄷ 떨려서 죽는줄', content: '', author: '심장폭발남', date: '2026-04-18', comments: 18, likes: 27 },
    { id: 'seed-5', title: '금토 아니고 수요일에 가봤는데 오히려 좋음', content: '', author: '수요일파', date: '2026-04-17', comments: 9, likes: 22 },
    { id: 'seed-6', title: '드레스코드 때문에 입구컷 당한 썰 풉니다', content: '', author: '패션테러리스트', date: '2026-04-17', comments: 16, likes: 35 },
    { id: 'seed-7', title: '웨이터한테 팁 얼마나 줘요? 진심 모르겟음', content: '', author: '사회초년생', date: '2026-04-17', comments: 21, likes: 14 },
    { id: 'seed-8', title: '여친이랑 클럽 같이 간 후기..결론:헤어짐', content: '', author: '솔로복귀', date: '2026-04-17', comments: 31, likes: 53 },
    { id: 'seed-9', title: '나이트에서 만나서 결혼까지 간 사람 있음?', content: '', author: '로맨티스트', date: '2026-04-16', comments: 12, likes: 18 },
    { id: 'seed-10', title: '요즘 일산쪽 분위기 어떰?? 오랜만에 가려고', content: '', author: '복귀러', date: '2026-04-16', comments: 7, likes: 11 },
    { id: 'seed-11', title: '라운지 vs 클럽 뭐가 더 만남 잘돼?', content: '', author: '효율주의자', date: '2026-04-16', comments: 19, likes: 28 },
    { id: 'seed-12', title: '새벽3시에 라면먹고싶어서 나왔는데 후회중ㅋㅋ', content: '', author: '야식은진리', date: '2026-04-16', comments: 8, likes: 24 },
    { id: 'seed-13', title: '30대 중반인데 아직 다녀도 되나요..ㅎ', content: '', author: '아재인정', date: '2026-04-15', comments: 25, likes: 37 },
    { id: 'seed-14', title: '어제 고구려 갔다가 양주 3병 까버림 ㅎㄷㄷ', content: '', author: '간이두개', date: '2026-04-15', comments: 13, likes: 20 },
    { id: 'seed-15', title: '부킹 성공률 높이는 법 아는사람?? 급함', content: '', author: '절박한형', date: '2026-04-14', comments: 17, likes: 15 },
    { id: 'seed-16', title: '술 못마시는데 나이트 가도 재밌나', content: '', author: '음료수파', date: '2026-04-13', comments: 10, likes: 13 },
    { id: 'seed-17', title: '친구가 호빠 가자는데 남자도 갈수있음??', content: '', author: '궁금한토끼', date: '2026-04-13', comments: 14, likes: 9 },
    { id: 'seed-18', title: '레이스 웨이팅 1시간 기다린 사람 여기여기', content: '', author: '인내심테스트', date: '2026-04-12', comments: 6, likes: 31 },
  ];
  const displayPosts = recentPosts.length > 0 ? recentPosts : seedPosts;

  // 인기글 (좋아요 또는 댓글 많은 순)
  const hotPosts = [...displayPosts].sort((a, b) => (b.likes + b.comments * 2) - (a.likes + a.comments * 2)).slice(0, 3);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        {/* 헤더 */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">← 커뮤니티</Link>
            <h1 className="text-3xl font-bold">자유게시판</h1>
            <p className="mt-2 text-sm font-bold" style={{ color: '#8B5CF6' }}>
              "어젯밤 얘기 여기서 풀어. 읽다 보면 시간 녹는다."
            </p>
            <div className="mt-2"><PageLiveCounter pageName="이 게시판" baseCount={35} /></div>
          </div>
          <button onClick={handleWriteClick} className="rounded-xl px-5 py-2.5 text-sm font-bold transition"
            style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 44 }}>글쓰기</button>
        </div>

        {/* 이 게시판에서 지금 뜨는 글 */}
        {!loading && hotPosts.length > 0 && (
          <div className="mb-6 rounded-2xl border p-4 sm:p-5" style={{ borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.04)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🔥</span>
              <h2 className="text-sm font-black" style={{ color: '#111' }}>이 게시판에서 지금 뜨는 글</h2>
            </div>
            <div className="space-y-2">
              {hotPosts.map((post, idx) => (
                <button key={post.id} onClick={() => navigate('/community/post/' + post.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white"
                  style={{ minHeight: 44 }}>
                  <span className="text-sm font-black shrink-0" style={{ color: idx === 0 ? '#EF4444' : '#F59E0B', width: 20 }}>{idx + 1}</span>
                  <span className="text-sm font-medium truncate flex-1" style={{ color: '#111' }}>{post.title}</span>
                  <span className="text-xs shrink-0" style={{ color: '#999' }}>♥{post.likes} 💬{post.comments}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <PostListSkeleton />}

        {!loading && (
          <section>
            <h2 className="mb-4 text-lg font-bold">최근 글</h2>
            <div className="overflow-hidden rounded-xl border border-neon-border">
              {displayPosts.map((post, i) => (
                <button key={post.id} onClick={() => !post.id.startsWith('seed-') && navigate('/community/post/' + post.id)}
                  className={`flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-neon-surface-2 ${i !== displayPosts.length - 1 ? "border-b border-neon-border/50" : ""}`}
                  style={{ minHeight: 52 }}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: '#111' }}>
                      {post.title}
                      {post.comments > 0 && <span className="ml-2 text-xs" style={{ color: '#8B5CF6' }}>[{post.comments}]</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-3 ml-4 text-xs" style={{ color: '#999' }}>
                    <span>{post.author}</span>
                    <span>{post.date.slice(5)}</span>
                  </div>
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {pageNumbers.map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${page === currentPage ? "bg-neon-primary text-neon-text" : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"}`}>
                    {page}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 다른 게시판 순환 */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <span className="shrink-0 text-xs" style={{ color: '#999' }}>다른 게시판</span>
          {[
            { label: '⭐ 후기', href: '/community/reviews' },
            { label: '🗺️ 오늘어디', href: '/community/qna' },
            { label: '🧩 조각모임', href: '/community/jogak' },
            { label: '💡 꿀팁', href: '/community/tips' },
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
            <WriteHeader onCancel={() => setShowWriteModal(false)} title="자유게시판 글쓰기" />
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-2xl mx-auto w-full">
              <input value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} placeholder="제목을 입력하세요"
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none mb-3"
                style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              <Suspense fallback={<div className="py-8 text-center text-sm" style={{ color: '#999' }}>에디터 로딩 중...</div>}>
                <RichTextEditor
                  value={writeContent}
                  onChange={setWriteContent}
                  placeholder="자유롭게 작성해주세요. 이미지/동영상도 첨부 가능합니다."
                  minHeight={300}
                />
              </Suspense>
            </div>
            <div className="fixed bottom-14 md:bottom-0 left-0 right-0 px-4 py-4 border-t z-40" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
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
