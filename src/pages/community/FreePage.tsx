import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';

const RichTextEditor = lazy(() => import('@/components/community/RichTextEditor'));
import WriteHeader from '@/components/community/WriteHeader';

interface SimplePost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  comments: number;
}

function postToSimple(post: Post): SimplePost {
  const u = post.users as any;
  return {
    id: post.id,
    title: post.title,
    content: post.content || '',
    author: u?.nickname || '사용자',
    date: post.created_at.slice(0, 10),
    comments: post.comment_count || 0,
  };
}

export default function FreeBoardPage() {
  useDocumentMeta('자유게시판 — 주제 제한 없이 솔직하게 떠드는 곳', '뭐든 써도 되는 게시판. 궁금한 거, 꿀팁, 후기 뭐든 OK.');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentPosts, setRecentPosts] = useState<SimplePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
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

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">← 커뮤니티</Link>
            <h1 className="text-3xl font-bold">자유게시판</h1>
            <p className="mt-2 text-neon-text-muted">주제 제한 없이 자유롭게 소통하는 공간</p>
          </div>
          <button onClick={handleWriteClick} className="rounded-xl px-5 py-2.5 text-sm font-bold transition"
            style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 44 }}>글쓰기</button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">불러오는 중...</div>
        )}

        {!loading && (
          <section>
            <h2 className="mb-4 text-lg font-bold">최근 글</h2>
            <div className="overflow-hidden rounded-xl border border-neon-border">
              {recentPosts.map((post, i) => (
                <button key={post.id} onClick={() => navigate('/community/post/' + post.id)}
                  className={`flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-neon-surface-2 ${i !== recentPosts.length - 1 ? "border-b border-neon-border/50" : ""}`}
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

              {recentPosts.length === 0 && (
                <div className="px-5 py-12 text-center text-neon-text-muted">아직 게시글이 없습니다. 첫 번째 글을 작성해보세요!</div>
              )}
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
