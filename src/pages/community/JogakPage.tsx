import { useState, useRef, useEffect } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { useEngagementStore } from '@/lib/engagement-store';
import { fetchPosts, createPost, fetchComments, createComment, type Post, type Comment } from '@/lib/community-api';

const MIN_POINTS = 100;

export default function JogakPage() {
  useDocumentMeta('조각 모집 — 같이 놀러갈 사람', '혼자 가기 심심할 때 같이 갈 사람을 구해보세요. 포인트 100P 이상이면 글 작성 가능.');

  const { user } = useAuth();
  const points = useEngagementStore((s) => s.points);
  const canPost = !!user && points >= MIN_POINTS;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // 글쓰기
  const [showWrite, setShowWrite] = useState(false);
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 댓글
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // 포인트 부족 알림
  const [pointAlert, setPointAlert] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  // 글 불러오기
  useEffect(() => {
    fetchPosts('party', 50).then(({ data }) => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  // 글쓰기 버튼
  const handleWriteClick = () => {
    if (!user) { alert('로그인이 필요합니다'); return; }
    if (points < MIN_POINTS) {
      setPointAlert(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setPointAlert(false), 4000);
      return;
    }
    setShowWrite(true);
  };

  // 글 등록
  const handleSubmit = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    setSubmitting(true);
    const { data, error } = await createPost({
      category: 'party',
      title: writeTitle.trim(),
      content: writeContent.trim(),
    });
    if (data) {
      setPosts(prev => [data as unknown as Post, ...prev]);
      setWriteTitle('');
      setWriteContent('');
      setShowWrite(false);
    }
    if (error) alert(error);
    setSubmitting(false);
  };

  // 댓글 열기
  const handleOpenComments = async (postId: string) => {
    if (openComments === postId) { setOpenComments(null); return; }
    setOpenComments(postId);
    setCommentLoading(true);
    const data = await fetchComments(postId);
    setComments(data);
    setCommentLoading(false);
  };

  // 댓글 등록
  const handleCommentSubmit = async (postId: string) => {
    if (!commentText.trim()) return;
    if (!user) { alert('로그인이 필요합니다'); return; }
    const { data, error } = await createComment(postId, commentText.trim());
    if (data) {
      setComments(prev => [...prev, data]);
      setCommentText('');
    }
    if (error) alert(error);
  };

  // 샘플 데이터 (Supabase에 데이터 없을 때)
  const samplePosts: Post[] = [
    { id: 's1', user_id: null, category: 'party', title: '이번 주 토요일 강남 클럽 같이 가실 분!', content: '레이스 가는데 테이블 잡아놨어요. 같이 갈 사람 3명 구합니다. 25~35세 남녀 상관없어요. 비용은 N빵!', venue_slug: 'gangnamclub-race', likes: 12, views: 89, is_pinned: false, created_at: '2026-03-30T18:00:00Z', updated_at: '2026-03-30T18:00:00Z', users: { nickname: '파티킹', avatar_url: null }, comment_count: 5 },
    { id: 's2', user_id: null, category: 'party', title: '부산 여행 왔는데 밤에 같이 놀 사람 🌊', content: '서울에서 부산 여행 왔어요. 오늘 밤에 같이 놀 현지인이나 여행자 구합니다! 부산연산동물나이트 가보고 싶은데 혼자 가기 좀 그래서요.', venue_slug: 'busanyeonsandongmulnight', likes: 8, views: 67, is_pinned: false, created_at: '2026-03-30T15:00:00Z', updated_at: '2026-03-30T15:00:00Z', users: { nickname: '해운대러버', avatar_url: null }, comment_count: 3 },
    { id: 's3', user_id: null, category: 'party', title: '수원 나이트 초보 여자분 같이 가요', content: '나이트 처음인데 혼자 무서워서ㅠ 같이 갈 여자분 구해요! 수원찬스돔나이트 강호동 실장님이 초보도 편하게 안내해준다고 했어요.', venue_slug: 'suwonchancenight', likes: 15, views: 120, is_pinned: false, created_at: '2026-03-29T20:00:00Z', updated_at: '2026-03-29T20:00:00Z', users: { nickname: '수원새내기', avatar_url: null }, comment_count: 8 },
    { id: 's4', user_id: null, category: 'party', title: '홍대 클럽 투어 같이 돌 멤버 모집', content: '버뮤다 → 퍼시픽 → 도깨비 순서로 돌 예정! 각 1시간씩. 클럽 처음이어도 괜찮아요. 토요일 밤 10시 홍대입구역 집합.', venue_slug: 'hongdaeclub-bermuda', likes: 22, views: 156, is_pinned: false, created_at: '2026-03-29T14:00:00Z', updated_at: '2026-03-29T14:00:00Z', users: { nickname: '홍대프로', avatar_url: null }, comment_count: 11 },
    { id: 's5', user_id: null, category: 'party', title: '일산 금요일 저녁 같이 놀 사람', content: '일산룸 가는데 다른 분들도 합류 환영! 신실장님한테 미리 얘기해놨어요. 8시쯤 도착 예정.', venue_slug: 'ilsanroom', likes: 6, views: 45, is_pinned: false, created_at: '2026-03-28T12:00:00Z', updated_at: '2026-03-28T12:00:00Z', users: { nickname: '일산직장인', avatar_url: null }, comment_count: 2 },
  ];

  const displayPosts = posts.length > 0 ? posts : samplePosts;

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: '#111' }}>🧩 조각 모집</h1>
        <p className="mt-1 text-sm" style={{ color: '#555' }}>
          같이 놀러갈 사람을 구하세요. <strong style={{ color: '#8B5CF6' }}>{MIN_POINTS}P</strong> 이상이면 글 작성 가능!
        </p>
      </div>

      {/* 글쓰기 버튼 + 포인트 */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={handleWriteClick}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white min-h-[44px] transition active:scale-95"
          style={{ backgroundColor: canPost ? '#8B5CF6' : '#9CA3AF' }}
        >
          글쓰기
        </button>
        <span className="text-sm font-bold" style={{ color: '#8B5CF6' }}>내 포인트: {points}P</span>
        {!user && <span className="text-xs" style={{ color: '#EF4444' }}>로그인 필요</span>}
      </div>

      {/* 포인트 부족 알림 */}
      {pointAlert && (
        <div className="mb-4 rounded-xl px-4 py-3" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}>
          <p className="text-sm font-bold" style={{ color: '#DC2626' }}>
            포인트가 부족해요! ({points}P / {MIN_POINTS}P 필요)
          </p>
          <p className="text-xs mt-1" style={{ color: '#991B1B' }}>
            사이트를 둘러보면 포인트가 쌓여요. 스크롤, 투표, 퀴즈 참여하면 금방 모입니다!
          </p>
        </div>
      )}

      {/* 글쓰기 모달 */}
      {showWrite && (
        <div className="mb-6 rounded-2xl border bg-white p-5" style={{ borderColor: '#E5E7EB' }}>
          <input
            type="text"
            placeholder="제목 (예: 토요일 강남 클럽 같이 가실 분)"
            value={writeTitle}
            onChange={(e) => setWriteTitle(e.target.value)}
            className="w-full rounded-lg border px-4 py-3 text-sm mb-3 min-h-[44px]"
            style={{ borderColor: '#D1D5DB', color: '#111' }}
          />
          <textarea
            placeholder="내용을 적어주세요 (어디, 언제, 몇 명, 조건 등)"
            value={writeContent}
            onChange={(e) => setWriteContent(e.target.value)}
            rows={5}
            className="w-full rounded-lg border px-4 py-3 text-sm mb-3 resize-none"
            style={{ borderColor: '#D1D5DB', color: '#111', lineHeight: '1.7' }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !writeTitle.trim() || !writeContent.trim()}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-white min-h-[44px]"
              style={{ backgroundColor: submitting ? '#9CA3AF' : '#8B5CF6' }}
            >
              {submitting ? '등록 중...' : '등록'}
            </button>
            <button
              onClick={() => setShowWrite(false)}
              className="rounded-xl px-5 py-2.5 text-sm font-medium min-h-[44px]"
              style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 글 목록 */}
      {loading ? (
        <div className="py-20 text-center text-sm" style={{ color: '#9CA3AF' }}>불러오는 중...</div>
      ) : (
        <div className="space-y-4">
          {displayPosts.map((post) => (
            <div key={post.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: '#E5E7EB' }}>
              {/* 글 */}
              <h3 className="text-base font-bold mb-2" style={{ color: '#111' }}>{post.title}</h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: '#555', whiteSpace: 'pre-wrap' }}>{post.content}</p>
              <div className="flex items-center gap-3 text-xs" style={{ color: '#9CA3AF' }}>
                <span style={{ color: '#374151' }}>{post.users?.nickname || '익명'}</span>
                <span>👍 {post.likes}</span>
                <span>👁 {post.views}</span>
                <button
                  onClick={() => handleOpenComments(post.id)}
                  className="font-medium min-h-[44px] px-2"
                  style={{ color: '#8B5CF6' }}
                >
                  💬 댓글 {post.comment_count || 0}
                </button>
              </div>

              {/* 댓글 영역 */}
              {openComments === post.id && (
                <div className="mt-4 border-t pt-4" style={{ borderColor: '#F3F4F6' }}>
                  {commentLoading ? (
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>댓글 불러오는 중...</p>
                  ) : (
                    <>
                      {/* 댓글 목록 */}
                      {comments.length > 0 ? (
                        <div className="space-y-3 mb-4">
                          {comments.map((c) => (
                            <div key={c.id} className="rounded-lg px-3 py-2" style={{ backgroundColor: '#F9FAFB' }}>
                              <p className="text-sm" style={{ color: '#111' }}>{c.content}</p>
                              <span className="text-xs" style={{ color: '#9CA3AF' }}>
                                {c.users?.nickname || '익명'} · {new Date(c.created_at).toLocaleDateString('ko')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>아직 댓글이 없어요. 첫 댓글을 달아보세요!</p>
                      )}

                      {/* 댓글 입력 */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={user ? '댓글을 입력하세요' : '로그인 후 댓글 작성 가능'}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(post.id); }}
                          className="flex-1 rounded-lg border px-3 py-2 text-sm min-h-[44px]"
                          style={{ borderColor: '#D1D5DB', color: '#111' }}
                          disabled={!user}
                        />
                        <button
                          onClick={() => handleCommentSubmit(post.id)}
                          className="rounded-lg px-4 py-2 text-sm font-bold text-white min-h-[44px]"
                          style={{ backgroundColor: '#8B5CF6' }}
                          disabled={!user}
                        >
                          등록
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
