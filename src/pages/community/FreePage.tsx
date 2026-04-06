import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, fetchComments, createComment, deletePost, deleteComment, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';

const sampleHotPosts = [
  { id: "hot-1", title: "일산 밤문화 입문기 — 3개월 차 솔직 소감", author: "야행성루키", date: "2026-03-19", content: "", comments: 74 },
  { id: "hot-2", title: "라운지 vs 나이트, 결국 취향 차이더라", author: "취향존중", date: "2026-03-18", content: "", comments: 61 },
  { id: "hot-3", title: "혼자 다니는 분들 의외로 많더라고요", author: "솔로탐험가", date: "2026-03-17", content: "", comments: 53 },
];

const sampleRecentPosts = [
  { id: "sample-1", title: "주엽역 근처 분위기 좋은 곳 알려주세요", author: "주엽사람", date: "2026-03-20", content: "", comments: 8 },
  { id: "sample-2", title: "금요일 vs 토요일, 언제가 더 나을까요?", author: "요일고민", date: "2026-03-20", content: "", comments: 23 },
  { id: "sample-3", title: "라페스타 쪽 새로 생긴 바 가보신 분?", author: "신상궁금", date: "2026-03-19", content: "", comments: 15 },
  { id: "sample-4", title: "회식 장소로 괜찮은 곳 추천 부탁드립니다", author: "직장인모임", date: "2026-03-19", content: "", comments: 31 },
  { id: "sample-5", title: "여름 되면 루프탑 바 오픈하는 곳 있나요", author: "루프탑기대", date: "2026-03-18", content: "", comments: 12 },
  { id: "sample-6", title: "대리운전 앱 뭐가 제일 빠른지 공유해요", author: "귀가전문", date: "2026-03-18", content: "", comments: 27 },
  { id: "sample-7", title: "일산에서 칵테일 잘하는 곳 정보 공유", author: "칵테일러버", date: "2026-03-17", content: "", comments: 19 },
  { id: "sample-8", title: "백석동 쪽 늦은 밤 갈 만한 곳?", author: "백석주민", date: "2026-03-17", content: "", comments: 6 },
  { id: "sample-9", title: "주말 나이트 예약 필수인가요?", author: "예약궁금", date: "2026-03-16", content: "", comments: 14 },
  { id: "sample-10", title: "비 오는 날 실내 놀거리 추천", author: "우중산책", date: "2026-03-16", content: "", comments: 9 },
];

interface SimplePost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  comments: number;
}

function postToSimple(post: Post): SimplePost {
  return {
    id: post.id,
    title: post.title,
    content: post.content || '',
    author: '사용자',
    date: post.created_at.slice(0, 10),
    comments: post.comment_count || 0,
  };
}

export default function FreeBoardPage() {
  useDocumentMeta('자유게시판 — 아무 말 대잔치', '잡담, 궁금한 거, 웃긴 얘기 다 OK. 규칙만 지키면 뭐든 써.');
  const { user } = useAuth();
  const [recentPosts, setRecentPosts] = useState<SimplePost[]>(sampleRecentPosts);
  const [hotPosts, setHotPosts] = useState<SimplePost[]>(sampleHotPosts);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const postsPerPage = 10;

  const loadPosts = async (page: number) => {
    setLoading(true);
    const offset = (page - 1) * postsPerPage;
    const { data, count } = await fetchPosts('free', postsPerPage, offset);
    if (data.length > 0) {
      setRecentPosts(data.map(postToSimple));
      setTotalCount(count);
      // Use top 3 by views/likes as hot posts
      const sorted = [...data].sort((a, b) => (b.likes + b.views) - (a.likes + a.views));
      if (sorted.length >= 3) {
        setHotPosts(sorted.slice(0, 3).map(postToSimple));
      }
    } else {
      setTotalCount(sampleRecentPosts.length);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts(currentPage);
  }, [currentPage]);


  const [viewingPost, setViewingPost] = useState<SimplePost | null>(null);
  const [postComments, setPostComments] = useState<{ author: string; text: string; date: string }[]>([]);
  const [commentText, setCommentText] = useState('');

  const sampleCommentPool = [
    { author: '밤탐험가', text: '공감합니다 ㅋㅋ', date: '03-30' },
    { author: '클럽매니아', text: '좋은 정보 감사해요', date: '03-29' },
  ];

  const openPost = (post: SimplePost) => {
    setViewingPost(post);
    setCommentText('');
    setPostComments([]);
    // local ID면 댓글 불러오기 스킵
    if (!post.id.startsWith('new-') && !post.id.startsWith('local-')) {
      fetchComments(post.id).then(data => {
        if (data.length > 0) {
          setPostComments(data.map(c => ({ author: '사용자', text: c.content, date: c.created_at?.slice(5, 10) || '' })));
        }
      }).catch(() => {});
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('글을 삭제하시겠습니까?')) return;
    const result = await deletePost(postId);
    if (result.error) { alert('삭제 실패: ' + result.error); return; }
    alert('삭제되었습니다');
    setViewingPost(null);
    setRecentPosts(prev => prev.filter(p => p.id !== postId));
  };

  const submitComment = async () => {
    if (!commentText.trim() || !user || !viewingPost) return;
    const { data, error } = await createComment(viewingPost.id, commentText.trim());
    if (data) {
      setPostComments(prev => [...prev, { author: user.user_metadata?.name || '나', text: commentText.trim(), date: new Date().toISOString().slice(5, 10) }]);
      setCommentText('');
    }
  };

  const handleWriteClick = () => {
    if (!user) {
      window.location.href = '/login'; return;
    }
    setShowWriteModal(true);
  };

  const handleSubmit = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    setSubmitting(true);
    const result = await createPost({
      category: 'free',
      title: writeTitle,
      content: writeContent,
    });
    if (result.error) {
      alert('저장 실패: ' + result.error);
    } else {
      alert('글이 저장되었습니다!');
      // 새 글을 목록 맨 위에 바로 추가
      const newPost: SimplePost = {
        id: result.data?.id || `new-${Date.now()}`,
        title: writeTitle.trim(),
        content: writeContent.trim(),
        author: user?.user_metadata?.name || '나',
        date: new Date().toISOString().slice(0, 10),
        comments: 0,
      };
      setRecentPosts(prev => [newPost, ...prev]);
      setShowWriteModal(false);
      setWriteTitle("");
      setWriteContent("");
    }
    setSubmitting(false);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / postsPerPage));
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
              ← 커뮤니티
            </Link>
            <h1 className="text-3xl font-bold">잡담 광장</h1>
            <p className="mt-2 text-neon-text-muted">
              주제 제한 없이 편하게 수다 떠는 곳
            </p>
          </div>
          <button
            onClick={handleWriteClick}
            className="rounded-xl px-5 py-2.5 text-sm font-bold transition"
            style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 44 }}
          >
            글쓰기
          </button>
        </div>

        {/* Auth Error Toast */}
        {authError && (
          <div className="mb-4 rounded-xl border border-neon-red/30 bg-neon-red/10 px-5 py-3 text-sm text-neon-red">
            로그인이 필요합니다
          </div>
        )}

        {/* Hot Posts */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <span className="text-xl">🔥</span> 인기글
          </h2>
          <div className="rounded-xl border border-neon-gold/30 bg-neon-surface overflow-hidden">
            {hotPosts.map((post, i) => (
              <button
                key={post.id}
                onClick={() => openPost(post)}
                className={`flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-neon-surface-2 ${
                  i !== hotPosts.length - 1 ? "border-b border-neon-border/50" : ""
                }`}
                style={{ minHeight: 48 }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm">🔥</span>
                  <span className="truncate text-sm font-semibold" style={{ color: '#111' }}>{post.title}</span>
                </div>
                <span className="shrink-0 ml-3 text-xs text-neon-gold">[{post.comments}]</span>
              </button>
            ))}
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
            불러오는 중...
          </div>
        )}

        {/* Recent Posts — simple forum table */}
        {!loading && (
          <section>
            <h2 className="mb-4 text-lg font-bold">최근 글</h2>
            <div className="overflow-hidden rounded-xl border border-neon-border">
              {recentPosts.map((post, i) => (
                <button
                  key={post.id}
                  onClick={() => openPost(post)}
                  className={`flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-neon-surface-2 ${
                    i !== recentPosts.length - 1 ? "border-b border-neon-border/50" : ""
                  }`}
                  style={{ minHeight: 52 }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: '#111' }}>
                      {post.title}
                      {post.comments > 0 && (
                        <span className="ml-2 text-xs" style={{ color: '#8B5CF6' }}>[{post.comments}]</span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-3 ml-4 text-xs" style={{ color: '#999' }}>
                    <span>{post.author}</span>
                    <span>{post.date.slice(5)}</span>
                  </div>
                </button>
              ))}

              {recentPosts.length === 0 && (
                <div className="px-5 py-12 text-center text-neon-text-muted">
                  아직 게시글이 없습니다
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-center gap-2">
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
                    page === currentPage
                      ? "bg-neon-primary text-neon-text"
                      : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Write Modal */}
        {showWriteModal && (
          <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
              <button onClick={() => setShowWriteModal(false)} className="text-sm font-medium" style={{ color: '#555', minHeight: 44 }}>취소</button>
              <h2 className="text-base font-bold" style={{ color: '#111' }}>글쓰기</h2>
              <div style={{ width: 44 }} />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-2xl mx-auto w-full">
              <input value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} placeholder="제목을 입력하세요"
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none mb-3"
                style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              <textarea value={writeContent} onChange={(e) => setWriteContent(e.target.value)} placeholder="자유롭게 작성해주세요" 
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none resize-none"
                style={{ borderColor: '#E5E7EB', color: '#111', minHeight: '50vh', lineHeight: '1.8' }} />
            </div>
            <div className="fixed bottom-0 left-0 right-0 px-4 py-4 border-t"  style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <button onClick={handleSubmit} disabled={submitting || !writeTitle.trim() || !writeContent.trim()}
                className="w-full rounded-xl py-4 text-base font-bold transition active:scale-[0.98] disabled:opacity-30"
                style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 56 }}>
                {submitting ? "등록 중..." : "글 저장"}
              </button>
            </div>
          </div>
        )}

        {/* Post Detail — 전체화면 */}
        {viewingPost && (
          <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
              <button onClick={() => setViewingPost(null)} className="text-sm font-medium" style={{ color: '#555', minHeight: 44 }}>← 뒤로</button>
              <h2 className="text-base font-bold" style={{ color: '#111' }}>글 상세</h2>
              {user && (
                <button onClick={() => handleDeletePost(viewingPost.id)} className="text-sm font-medium" style={{ color: '#EF4444', minHeight: 44 }}>삭제</button>
              )}
              {!user && <div style={{ width: 44 }} />}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full">
              <div className="flex items-center gap-2 text-xs mb-3" style={{ color: '#999' }}>
                <span className="font-medium" style={{ color: '#555' }}>{viewingPost.author}</span>
                <span>·</span>
                <span>{viewingPost.date}</span>
              </div>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#111' }}>{viewingPost.title}</h2>
              <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: '#F9FAFB', color: '#333', minHeight: 120 }}>
                <p className="text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{viewingPost.content || '내용이 없습니다.'}</p>
              </div>

              {/* 댓글 목록 */}
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                <p className="text-sm font-bold mb-3" style={{ color: '#111' }}>💬 댓글 {postComments.length}개</p>
                {postComments.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {postComments.map((c, i) => (
                      <div key={i} className="flex items-start justify-between rounded-lg px-3 py-2" style={{ backgroundColor: '#F3F4F6' }}>
                        <div className="flex-1">
                          <p className="text-sm" style={{ color: '#111' }}>{c.text}</p>
                          <span className="text-xs" style={{ color: '#999' }}>{c.author} · {c.date}</span>
                        </div>
                        {user && (
                          <button
                            onClick={async () => {
                              if (!confirm('댓글을 삭제하시겠습니까?')) return;
                              await deleteComment((c as any).id || '');
                              setPostComments(prev => prev.filter((_, ci) => ci !== i));
                            }}
                            className="text-xs shrink-0 ml-2" style={{ color: '#EF4444', minHeight: 28 }}>
                            삭제
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs mb-4" style={{ color: '#999' }}>아직 댓글이 없어요</p>
                )}

                {/* 댓글 입력 */}
                {user ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') submitComment(); }}
                      placeholder="댓글을 입력하세요..."
                      className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
                      style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 44 }}
                    />
                    <button onClick={submitComment} disabled={!commentText.trim()}
                      className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                      style={{ backgroundColor: '#8B5CF6', minHeight: 44 }}>
                      등록
                    </button>
                  </div>
                ) : (
                  <Link to="/login" className="block text-center text-sm font-medium py-2" style={{ color: '#8B5CF6' }}>
                    로그인하고 댓글 달기
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
