import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { fetchPosts, createPost, fetchComments, createComment, deletePost, deleteComment, type Post, type Comment } from '@/lib/community-api';

// 로그인만 필요, 포인트 제한 없음

const samplePosts = [
  { id: 's1', title: '토요일 강남 클럽 같이 가실 분!', author: '파티킹', date: '03-30', comments: 5 },
  { id: 's2', title: '부산 여행 왔는데 밤에 같이 놀 사람', author: '해운대러버', date: '03-30', comments: 3 },
  { id: 's3', title: '수원 나이트 초보 여자분 같이 가요', author: '수원새내기', date: '03-29', comments: 8 },
  { id: 's4', title: '홍대 클럽 투어 같이 돌 멤버 모집', author: '홍대프로', date: '03-29', comments: 11 },
  { id: 's5', title: '일산 금요일 저녁 같이 놀 사람', author: '일산직장인', date: '03-28', comments: 2 },
  { id: 's6', title: '이태원 금토 같이 다닐 친구 구해요', author: '이태원단골', date: '03-28', comments: 7 },
  { id: 's7', title: '대전 주말에 나이트 갈 사람 있나요', author: '대전거주', date: '03-27', comments: 4 },
  { id: 's8', title: '강남 호빠 처음인데 같이 가실 분', author: '호빠궁금', date: '03-27', comments: 9 },
  { id: 's9', title: '인천 아라비안 오늘 밤 동행 구합니다', author: '인천사람', date: '03-26', comments: 6 },
  { id: 's10', title: '압구정 라운지 같이 갈 분 모집', author: '압구정러버', date: '03-26', comments: 3 },
];

const sampleContents: Record<string, string> = {
  's1': '강남 레이스 가는데 같이 갈 사람 구해요! 테이블 잡아놨고 인원 나눠서 갈 예정. 처음이어도 괜찮아요 분위기 좋게 놀아요. 25~35세 남녀 상관없어요.',
  's2': '서울에서 부산 여행 왔어요. 오늘 밤에 같이 놀 현지인이나 여행자 구합니다! 연산동 나이트 가보고 싶어요.',
  's3': '나이트 처음인데 혼자 무서워서 같이 갈 여자분 구해요ㅠ 수원찬스돔나이트 강호동 실장님이 초보도 편하게 안내해준다고 했어요!',
  's4': '홍대 클럽 3곳 투어 갑니다! 버뮤다에서 시작해서 퍼시픽, 도깨비 순서로 돌 예정. 토요일 밤 10시 홍대입구역 집합.',
  's5': '일산룸 가는데 다른 분들도 합류 환영! 신실장님한테 미리 얘기해놨어요. 8시쯤 도착 예정.',
};

const sampleComments: Record<string, { author: string; text: string; date: string }[]> = {
  's1': [
    { author: '클럽초보', text: '저도 가고 싶어요! 몇 시에 만나나요?', date: '03-30' },
    { author: '강남거주', text: '레이스 단골인데 같이 가요~', date: '03-30' },
  ],
  's3': [
    { author: '수원여자', text: '저도 처음이에요! 같이 가요ㅎㅎ', date: '03-29' },
    { author: '경기권', text: '강호동 실장님 진짜 친절해요 걱정 마세요', date: '03-29' },
  ],
};

export default function JogakPage() {
  useDocumentMeta('급하게 한 명 구한다, 조각 모집', '자리 하나 남았을 때, 바로 올리고 바로 구한다. 100P 이상 작성 가능.');

  const { user } = useAuth();
  const canPost = !!user;

  // 글 목록
  const [posts, setPosts] = useState<{ id: string; title: string; content: string; author: string; date: string; comments: number }[]>(
    samplePosts.map(p => ({ ...p, content: sampleContents[p.id] || '' }))
  );
  const [loading, setLoading] = useState(true);

  // 글 상세
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<{ author: string; text: string; date: string }[]>([]);
  const [commentText, setCommentText] = useState('');

  // 글쓰기 모달
  const [showWrite, setShowWrite] = useState(false);
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 포인트 부족
  const [pointAlert, setPointAlert] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  // Supabase에서 글 불러오기
  useEffect(() => {
    fetchPosts('party', 20).then(({ data }) => {
      if (data.length > 0) {
        setPosts(data.map(p => ({
          id: p.id,
          title: p.title,
          content: p.content || '',
          author: '사용자',
          date: p.created_at.slice(5, 10),
          comments: p.comment_count || 0,
        })));
      }
      setLoading(false);
    });
  }, []);

  // 글 클릭
  const handlePostClick = (postId: string) => {
    if (selectedPost === postId) { setSelectedPost(null); return; }
    setSelectedPost(postId);
    setCommentText('');
    // 샘플 댓글 또는 Supabase 댓글
    if (sampleComments[postId]) {
      setComments(sampleComments[postId]);
    } else {
      setComments([]);
      fetchComments(postId).then(data => {
        if (data.length > 0) {
          setComments(data.map(c => ({
            author: c.users?.nickname || '익명',
            text: c.content,
            date: c.created_at.slice(5, 10),
          })));
        }
      });
    }
  };

  // 글쓰기 버튼
  const handleWriteClick = () => {
    if (!user) { window.location.href = '/login'; return; }
    setShowWrite(true);
  };

  // 글 등록
  const handleSubmit = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    setSubmitting(true);
    const result = await createPost({ category: 'party', title: writeTitle.trim(), content: writeContent.trim() });
    if (result.error) {
      alert('저장 실패: ' + result.error);
    } else if (result.data) {
      alert('글이 저장되었습니다!');
      setPosts(prev => [{ id: result.data.id, title: writeTitle.trim(), content: writeContent.trim(), author: user?.user_metadata?.name || '나', date: new Date().toISOString().slice(5, 10), comments: 0 }, ...prev]);
      setWriteTitle(''); setWriteContent(''); setShowWrite(false);
    }
    setSubmitting(false);
  };

  // 댓글 등록
  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !user || !selectedPost) return;
    const { data, error } = await createComment(selectedPost, commentText.trim());
    if (data) {
      setComments(prev => [...prev, { author: user.user_metadata?.name || '나', text: commentText.trim(), date: new Date().toISOString().slice(5, 10) }]);
      setCommentText('');
    }
    if (error) alert(error);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-16">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">← 커뮤니티</Link>
          <h1 className="text-3xl font-bold" style={{ color: '#111' }}>🧩 조각 모집</h1>
          <p className="mt-2 text-sm" style={{ color: '#555' }}>같이 놀러갈 사람을 구하는 게시판</p>
        </div>
        <button
          onClick={handleWriteClick}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-white min-h-[44px]"
          style={{ backgroundColor: canPost ? '#8B5CF6' : '#9CA3AF' }}
        >
          글쓰기
        </button>
      </div>

      {/* 로그인 안내 */}
      {pointAlert && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626' }}>
          로그인이 필요합니다
        </div>
      )}

      {/* 글 목록 — 게시판 테이블 */}
      {loading ? (
        <div className="py-20 text-center text-sm" style={{ color: '#9CA3AF' }}>불러오는 중...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: '#E5E7EB' }}>
          {posts.map((post, i) => (
            <div key={post.id}>
              {/* 글 행 */}
              <div
                onClick={() => handlePostClick(post.id)}
                className="flex cursor-pointer items-center justify-between px-5 py-3.5 transition hover:bg-gray-50"
                style={{ borderBottom: i !== posts.length - 1 && selectedPost !== post.id ? '1px solid #F3F4F6' : 'none' }}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm truncate" style={{ color: '#111' }}>
                    {post.title}
                    {post.comments > 0 && (
                      <span className="ml-2 text-xs" style={{ color: '#8B5CF6' }}>[{post.comments}]</span>
                    )}
                  </span>
                </div>
                <div className="flex shrink-0 gap-4 ml-4 text-xs" style={{ color: '#9CA3AF' }}>
                  <span>{post.author}</span>
                  <span>{post.date}</span>
                </div>
              </div>

              {/* 글 상세 + 댓글 (펼침) */}
              {selectedPost === post.id && (
                <div className="px-5 pb-5 pt-2" style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                  {/* 삭제 버튼 */}
                  {user && (
                    <button
                      onClick={async () => {
                        if (!confirm('글을 삭제하시겠습니까?')) return;
                        const result = await deletePost(post.id);
                        if (result.error) { alert('삭제 실패: ' + result.error); return; }
                        alert('삭제되었습니다');
                        setSelectedPost(null);
                        setPosts(prev => prev.filter(p => p.id !== post.id));
                      }}
                      className="text-xs mb-3" style={{ color: '#EF4444', minHeight: 32 }}>
                      글 삭제
                    </button>
                  )}

                  {/* 본문 */}
                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#333', whiteSpace: 'pre-wrap' }}>
                    {post.content || sampleContents[post.id] || '내용이 없습니다.'}
                  </p>

                  {/* 댓글 목록 */}
                  <div className="border-t pt-3 mb-3" style={{ borderColor: '#E5E7EB' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: '#555' }}>댓글 {comments.length}개</p>
                    {comments.length > 0 ? (
                      <div className="space-y-2">
                        {comments.map((c, ci) => (
                          <div key={ci} className="rounded-lg px-3 py-2" style={{ backgroundColor: '#F3F4F6' }}>
                            <p className="text-sm" style={{ color: '#111' }}>{c.text}</p>
                            <span className="text-xs" style={{ color: '#9CA3AF' }}>{c.author} · {c.date}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>아직 댓글이 없어요</p>
                    )}
                  </div>

                  {/* 댓글 입력 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={user ? '댓글 입력' : '로그인 후 댓글 작성'}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(); }}
                      className="flex-1 rounded-lg border px-3 py-2 text-sm min-h-[44px]"
                      style={{ borderColor: '#D1D5DB', color: '#111' }}
                      disabled={!user}
                    />
                    <button
                      onClick={handleCommentSubmit}
                      disabled={!user || !commentText.trim()}
                      className="rounded-lg px-4 py-2 text-sm font-bold text-white min-h-[44px]"
                      style={{ backgroundColor: user ? '#8B5CF6' : '#9CA3AF' }}
                    >
                      등록
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {posts.length === 0 && (
            <div className="px-5 py-12 text-center text-sm" style={{ color: '#9CA3AF' }}>아직 글이 없습니다</div>
          )}
        </div>
      )}

      {/* 글쓰기 모달 */}
      {showWrite && (
        <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
            <button onClick={() => setShowWrite(false)} className="text-sm font-medium" style={{ color: '#555', minHeight: 44 }}>취소</button>
            <h2 className="text-base font-bold" style={{ color: '#111' }}>글쓰기</h2>
            <div style={{ width: 44 }} />
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-2xl mx-auto w-full">
            <input
              value={writeTitle}
              onChange={(e) => setWriteTitle(e.target.value)}
              placeholder="제목 (예: 토요일 강남 클럽 같이 가실 분)"
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none"
              style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }}
            />
            <textarea
              value={writeContent}
              onChange={(e) => setWriteContent(e.target.value)}
              placeholder="어디, 언제, 몇 명, 조건 등 자유롭게 적어주세요"
              
              className="w-full rounded-lg border px-4 py-3 text-sm mb-4 outline-none resize-none"
              style={{ borderColor: '#E5E7EB', color: '#111', lineHeight: '1.7' }}
            />
          </div>
          <div className="fixed bottom-0 left-0 right-0 px-4 py-4 border-t"  style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <button
              onClick={handleSubmit}
              disabled={submitting || !writeTitle.trim() || !writeContent.trim()}
              className="w-full rounded-xl py-4 text-base font-bold transition active:scale-[0.98] disabled:opacity-30"
              style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 56 }}>
              {submitting ? '등록 중...' : '글 저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
