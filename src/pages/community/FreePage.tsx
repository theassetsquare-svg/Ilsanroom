import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from '../../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';
import { useFilteredPosts } from '@/hooks/useFilteredPosts';
import { useDraftAutosave } from '@/hooks/useDraftAutosave';
// ↑ useDocumentMeta 페이지: 임시저장 (영역 L-9)
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
    author: u?.nickname || '익명',
    date: post.created_at.slice(0, 10),
    comments: post.comment_count || 0,
    likes: post.likes || 0,
  };
}

export default function FreeBoardPage() {
  useDocumentMeta('자유게시판 — 주제 제한 없이 솔직하게 떠드는 곳이다', '오늘 뭐 떠들고 싶어? 잡담 질문 자랑 푸념 황당썰 추천음악 맛집 해장정보 다 OK. 익명 보장, 규칙 1개만 지키면 자유. 나이트라이프 입문자도 바로 환영.');
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
  // useDocumentMeta 페이지 임시저장 — L-9 (시즌39)
  const { clearDraft } = useDraftAutosave({
    key: 'free',
    isOpen: showWriteModal,
    title: writeTitle,
    content: writeContent,
    setTitle: setWriteTitle,
    setContent: setWriteContent,
  });

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
      // useDocumentMeta L-9: 제출 성공 시 임시저장 삭제
      clearDraft();
      setShowWriteModal(false); setWriteTitle(""); setWriteContent("");
      navigate('/community/post/' + (result.data?.id || ''));
    }
    setSubmitting(false);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / postsPerPage));
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1);

  const displayPosts = useFilteredPosts(recentPosts);
  // ↑ useDocumentMeta 페이지 차단 필터 적용 (진짜 DB 글만 — 가짜 시드 0)

  // 인기글 (좋아요 또는 댓글 많은 순)
  const hotPosts = [...displayPosts].sort((a, b) => (b.likes + b.comments * 2) - (a.likes + a.comments * 2)).slice(0, 3);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        {/* 헤더 */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <Link to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">← 커뮤니티</Link>
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

        {!loading && displayPosts.length === 0 && (
          <section className="rounded-2xl border border-neon-border py-14 text-center" style={{ backgroundColor: 'rgba(139,92,246,0.03)' }}>
            <p className="text-base font-bold" style={{ color: '#111' }}>아직 글이 없어요</p>
            <p className="mt-2 text-sm" style={{ color: '#888' }}>이 게시판의 첫 글을 남겨보세요. 잡담이든 질문이든 환영이에요.</p>
            <button onClick={handleWriteClick} className="mt-5 rounded-xl px-6 py-3 text-sm font-bold transition"
              style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 44 }}>첫 글 쓰기</button>
          </section>
        )}

        {!loading && displayPosts.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-bold">최근 글</h2>
            <div className="overflow-hidden rounded-xl border border-neon-border">
              {displayPosts.map((post, i) => (
                <button key={post.id} onClick={() => navigate('/community/post/' + post.id)}
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
                    className={`flex h-11 w-11 items-center justify-center rounded-lg text-sm transition ${page === currentPage ? "bg-neon-primary text-neon-text" : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"}`}>
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

        {/* 처음 온 사람용 안내 — 체류·진입장벽 낮추기 */}
        <section className="mt-10 rounded-2xl border p-5 sm:p-6 space-y-3" style={{ borderColor: '#E5E7EB', backgroundColor: 'rgba(139,92,246,0.03)' }}>
          <h2 className="text-base font-bold" style={{ color: '#111' }}>여기 처음이면 — 이렇게 쓰면 돼요</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
            자유게시판은 말 그대로 주제 안 가립니다. 어젯밤 갔던 데 어땠는지, 다음 주말 어디 갈지 고민이라든지, 그냥 오늘 하루 푸념이라도 다 올려도 돼요.
            잘 쓸 필요 없습니다. 한 줄짜리 질문이 의외로 댓글 제일 많이 달려요.
          </p>
          <ul className="space-y-1.5 text-sm" style={{ color: '#555' }}>
            <li>· <b>잡담·푸념</b> — "오늘 진짜 별로였다" 같은 한 줄도 환영. 공감 댓글 금방 붙습니다</li>
            <li>· <b>질문</b> — "이 동네 처음인데 어디부터?" 물어보면 먼저 가본 사람이 답해줘요</li>
            <li>· <b>자랑·썰</b> — 어젯밤 황당했던 일, 우연히 만난 사람 얘기까지 다 풀어도 됩니다</li>
          </ul>
          <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
            닉네임은 익명이라 부담 없이 솔직하게 적으면 됩니다. 딱 하나, 다른 사람 헐뜯거나 연락처 막 뿌리는 건 안 돼요.
            그거 빼면 진짜 자유. 글 남기면 그 글이 위 목록에 바로 올라가고, 반응 오면 알림으로 알려드립니다.
          </p>
        </section>

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
