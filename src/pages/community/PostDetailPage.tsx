import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';
import ShareButton from '@/components/ui/ShareButton';
import ReportButton from '@/components/moderation/ReportButton';
import { getSeedNickname } from '@/lib/fake-users';
import { NextPostInline } from '@/components/community/NextPostInline';

interface CommentData {
  id: string;
  post_id: string;
  user_id: string | null;
  content: string;
  parent_id: string | null;
  created_at: string;
  users?: { nickname: string | null; avatar_url: string | null } | null;
}

/* 날짜 시드 기반 뷰 카운트 시뮬레이션 */
function useViewCount(postId: string | undefined): number {
  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!postId) return;
    // 포스트 ID 해시 기반으로 안정적인 초기값
    let hash = 0;
    for (let i = 0; i < postId.length; i++) {
      hash = ((hash << 5) - hash + postId.charCodeAt(i)) | 0;
    }
    const base = Math.abs(hash % 200) + 30;
    const h = new Date().getHours();
    const mult = (h >= 20 || h < 3) ? 1.5 : (h >= 15) ? 1.0 : 0.7;
    setCount(Math.floor(base * mult));
    timerRef.current = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 3));
    }, 12000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [postId]);
  return count;
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<any>(null);

  // 동적 SEO: 글 제목 + 본문 첫 100자
  const dynamicTitle = post?.title
    ? `${post.title} — 커뮤니티 실시간 토론`
    : '커뮤니티 글 상세 — 솔직한 후기와 실시간 토론';
  const dynamicDesc = post?.content
    ? `${String(post.content).replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140)} — 강남 홍대 이태원 일산 부산 클럽·나이트·룸·라운지·요정·호빠 회원 실시간 토론.`
    : '클럽·나이트·룸·호빠 실제 이용자 후기와 댓글. 가기 전에 꼭 확인하세요. 강남 홍대 이태원 일산 부산 회원 실시간 의견 정리.';
  useDocumentMeta(dynamicTitle, dynamicDesc);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);

  const viewCount = useViewCount(id);
  const supabase = createClient();

  // 글 불러오기
  useEffect(() => {
    if (!id || !supabase) { setLoading(false); return; }

    supabase.from('posts').select('*, users!left(nickname, avatar_url)').eq('id', id).single().then(({ data, error }) => {
      if (error) {
        supabase.from('posts').select('*').eq('id', id).single().then(({ data: d }) => {
          setPost(d);
          setLikeCount(d?.likes || 0);
          setLoading(false);
          if (d?.category) loadRelatedPosts(d.category, d.id);
        });
      } else {
        setPost(data);
        setLikeCount(data?.likes || 0);
        setLoading(false);
        if (data?.title) document.title = `${data.title} — 커뮤니티 실시간 토론`;
        if (data?.category) loadRelatedPosts(data.category, data.id);
      }
    });
  }, [id]);

  // 관련 글 로드
  const loadRelatedPosts = async (category: string, currentId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from('posts')
      .select('id, title, category, likes, comment_count, created_at')
      .eq('category', category)
      .neq('id', currentId)
      .order('likes', { ascending: false })
      .limit(5);
    if (data) setRelatedPosts(data);
  };

  // 댓글 불러오기
  const fetchComments = useCallback(async () => {
    if (!supabase || !id) return;

    let { data, error } = await supabase
      .from('comments')
      .select('*, users!left(nickname, avatar_url)')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (!error && data) { setComments(data as CommentData[]); return; }

    const { data: d3 } = await supabase
      .from('comments')
      .select('id, post_id, user_id, content, created_at, parent_id')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    setComments((d3 || []).map((c: any) => ({ ...c, users: null })) as CommentData[]);
  }, [id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // 글 삭제
  const handleDelete = async () => {
    if (!supabase) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) return;
    navigate('/community');
  };

  // 좋아요
  const handleLike = async () => {
    if (!supabase || !id) return;
    const newCount = liked ? likeCount - 1 : likeCount + 1;
    setLiked(!liked);
    setLikeCount(newCount);
    await supabase.from('posts').update({ likes: newCount }).eq('id', id);
  };

  // 댓글 작성 헬퍼
  const insertComment = async (content: string, parentId?: string | null) => {
    if (!supabase) return { error: 'no client' };
    const insertData: any = { post_id: id, user_id: user!.id, content };
    if (parentId) insertData.parent_id = parentId;

    const { error } = await supabase.from('comments').insert(insertData);
    if (!error) return { error: null };

    if (error.message?.includes('parent_id') || error.code === '42703') {
      const { error: e2 } = await supabase.from('comments').insert({ post_id: id, user_id: user!.id, content });
      return { error: e2?.message || null };
    }
    return { error: error.message };
  };

  const handleComment = async () => {
    if (!commentText.trim() || !user || !supabase) return;
    setSubmitting(true);
    const { error } = await insertComment(commentText.trim());
    if (!error) { setCommentText(''); await fetchComments(); }
    setSubmitting(false);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !user || !supabase || !replyTo) return;
    setSubmitting(true);
    const { error } = await insertComment(replyText.trim(), replyTo.id);
    if (!error) { setReplyText(''); setReplyTo(null); await fetchComments(); }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!supabase) return;
    await supabase.from('comments').delete().eq('id', commentId);
    await fetchComments();
  };

  const parseJogakContent = (content: string) => {
    try { return JSON.parse(content); } catch { return null; }
  };

  const rootComments = comments.filter(c => !c.parent_id);
  const childComments = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  const catLabel: Record<string, string> = { reviews: '후기', discussion: 'Q&A', party: '모집', tips: '꿀팁', free: '자유' };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-primary border-t-transparent" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-bold mb-4" style={{ color: '#111' }}>글을 찾을 수 없습니다</p>
        <Link to="/community" className="text-sm" style={{ color: '#8B5CF6' }}>커뮤니티로 돌아가기</Link>
      </div>
    );
  }

  const jogakData = post.category === 'party' ? parseJogakContent(post.content) : null;

  const CommentItem = ({ comment, depth = 0 }: { comment: CommentData; depth?: number }) => {
    const nickname = (comment.users as any)?.nickname || getSeedNickname(comment.id);
    const children = childComments(comment.id);
    const isReplyTarget = replyTo?.id === comment.id;

    return (
      <>
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: depth > 0 ? '#F9FAFB' : '#F3F4F6',
            marginLeft: depth > 0 ? Math.min(depth * 24, 48) : 0,
            borderLeft: depth > 0 ? '3px solid #8B5CF6' : 'none',
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {depth > 0 && comment.parent_id && (
                <span className="text-xs font-medium mr-1" style={{ color: '#8B5CF6' }}>↳</span>
              )}
              <p className="text-sm leading-relaxed inline" style={{ color: '#111' }}>{comment.content}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium" style={{ color: '#555' }}>{nickname}</span>
                <span className="text-xs" style={{ color: '#999' }}>{comment.created_at?.slice(0, 10)}</span>
                {user && (
                  <button
                    onClick={() => {
                      if (isReplyTarget) { setReplyTo(null); setReplyText(''); }
                      else { setReplyTo({ id: comment.id, nickname }); setReplyText(''); }
                    }}
                    className="text-xs font-medium"
                    style={{ color: '#8B5CF6', minHeight: 24 }}
                  >
                    {isReplyTarget ? '취소' : '답글'}
                  </button>
                )}
              </div>
            </div>
            {user?.id === comment.user_id && (
              <button onClick={() => handleDeleteComment(comment.id)} className="text-xs shrink-0 ml-2" style={{ color: '#EF4444', minHeight: 28 }}>삭제</button>
            )}
          </div>

          {isReplyTarget && (
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleReply(); }}
                placeholder={`${nickname}에게 답글...`}
                className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: '#D1D5DB', color: '#111', minHeight: 40 }}
                autoFocus
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || submitting}
                className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ backgroundColor: '#8B5CF6', minHeight: 40 }}
              >
                {submitting ? '...' : '등록'}
              </button>
            </div>
          )}
        </div>

        {children.map(child => (
          <CommentItem key={child.id} comment={child} depth={depth + 1} />
        ))}
      </>
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* 뒤로가기 */}
      <button onClick={() => navigate(-1)} className="text-sm mb-4" style={{ color: '#555', minHeight: 44 }}>← 뒤로</button>

      {/* 조회수 배너 */}
      <div className="flex items-center gap-3 mb-4 rounded-lg px-4 py-2.5" style={{ backgroundColor: '#F3F0FF' }}>
        <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
        <span className="text-xs font-bold" style={{ color: '#8B5CF6' }}>
          이 글을 {viewCount}명이 읽었어요
        </span>
        {comments.length > 0 && (
          <span className="text-xs" style={{ color: '#999' }}>· 댓글 {comments.length}개</span>
        )}
      </div>

      {/* 글 제목 */}
      <h1 className="text-2xl font-bold mb-3" style={{ color: '#111' }}>{post.title}</h1>

      {/* 작성자 + 날짜 + 삭제 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs" style={{ color: '#999' }}>
          <span style={{ color: '#555' }}>{(post.users as any)?.nickname || getSeedNickname(post.id)}</span>
          <span>·</span>
          <span>{post.created_at?.slice(0, 10)}</span>
          <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: '#F3F0FF', color: '#8B5CF6' }}>{post.category}</span>
        </div>
        {user?.id === post.user_id && (
          <button onClick={handleDelete} className="text-sm font-medium" style={{ color: '#EF4444', minHeight: 44 }}>삭제</button>
        )}
      </div>

      {/* 조각모임 구조화 정보 */}
      {jogakData && (
        <div className="rounded-xl border p-4 mb-4" style={{ borderColor: '#E5E7EB', backgroundColor: '#FAFAFA' }}>
          <div className="flex flex-wrap gap-2 mb-3">
            {jogakData.region && <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: '#F3F0FF', color: '#8B5CF6' }}>📍 {jogakData.region}</span>}
            {jogakData.venue && <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>🏢 {jogakData.venue}</span>}
            {jogakData.meetDate && <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>📅 {jogakData.meetDate} {jogakData.meetTime || ''}</span>}
            {jogakData.maxPeople && <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>👥 {jogakData.currentPeople || 1}/{jogakData.maxPeople}명</span>}
            {jogakData.genderPref && <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: '#FCE7F3', color: '#9D174D' }}>{jogakData.genderPref}</span>}
            {jogakData.costSplit && <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>💰 {jogakData.costSplit}</span>}
            {jogakData.ageRange && <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>🎂 {jogakData.ageRange}</span>}
          </div>
          {jogakData.desc && (
            <p className="text-sm leading-relaxed" style={{ color: '#333', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{jogakData.desc}</p>
          )}
        </div>
      )}

      {/* 글 내용 (일반 글) */}
      {!jogakData && (
        <div className="rounded-xl p-5 mb-4" style={{ backgroundColor: '#F9FAFB', minHeight: 150 }}>
          {post.content?.startsWith('<') ? (
            <div className="rich-content text-base leading-relaxed" style={{ color: '#333', lineHeight: '1.8' }}
              dangerouslySetInnerHTML={{ __html: post.content }} />
          ) : (
            <p className="text-base leading-relaxed" style={{ color: '#333', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
              {post.content}
            </p>
          )}
        </div>
      )}

      {/* 좋아요 + 공유 */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={handleLike}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition"
          style={{
            backgroundColor: liked ? '#FEE2E2' : '#F3F4F6',
            color: liked ? '#DC2626' : '#555',
            minHeight: 40,
          }}>
          {liked ? '❤️' : '🤍'} 좋아요 {likeCount > 0 && likeCount}
        </button>
        <ShareButton title={post.title} text={post.title} />
        <ReportButton targetType="post" targetId={post.id} />
      </div>

      {/* 구분선 */}
      <div className="border-t mb-6" style={{ borderColor: '#E5E7EB' }} />

      {/* 댓글 */}
      <h3 className="text-base font-bold mb-4" style={{ color: '#111' }}>💬 댓글 {comments.length}개</h3>

      {comments.length > 0 ? (
        <div className="space-y-3 mb-6">
          {rootComments.map((c) => (
            <CommentItem key={c.id} comment={c} depth={0} />
          ))}
        </div>
      ) : (
        <p className="text-sm mb-6" style={{ color: '#999' }}>아직 댓글이 없습니다.</p>
      )}

      {/* 댓글 입력 */}
      {user ? (
        <div className="flex gap-2 mb-8">
          <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleComment(); }}
            placeholder="댓글을 입력하세요..."
            className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none"
            style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
          <button onClick={handleComment} disabled={!commentText.trim() || submitting}
            className="rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}>
            {submitting ? '...' : '등록'}
          </button>
        </div>
      ) : (
        <Link to="/login" className="block text-center text-sm font-medium py-3 mb-8" style={{ color: '#8B5CF6' }}>
          로그인하고 댓글 달기
        </Link>
      )}

      {/* ══════ 다음글 자동 인라인 — 도파민 스크롤 루프 ══════ */}
      {relatedPosts.length > 0 && relatedPosts[0]?.id && (
        <NextPostInline nextPostId={relatedPosts[0].id} />
      )}

      {/* ══════ 관련 글 — 사이트 이탈 방지 ══════ */}
      {relatedPosts.length > 0 && (
        <div className="border-t pt-6 mb-6" style={{ borderColor: '#E5E7EB' }}>
          <h3 className="text-base font-black mb-4" style={{ color: '#111' }}>
            이 글을 읽은 사람들이 다음에 본 글
          </h3>
          <div className="space-y-2">
            {relatedPosts.map((rp) => (
              <Link
                key={rp.id}
                to={`/community/post/${rp.id}`}
                className="flex items-center justify-between rounded-xl border px-4 py-3 transition hover:border-violet-300 hover:bg-violet-50/30"
                style={{ borderColor: '#E5E7EB', minHeight: 48 }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: '#F3F0FF', color: '#8B5CF6' }}>
                    {catLabel[rp.category] || rp.category}
                  </span>
                  <span className="text-sm font-medium truncate" style={{ color: '#111' }}>{rp.title}</span>
                </div>
                <div className="flex shrink-0 gap-2 ml-3 text-xs" style={{ color: '#999' }}>
                  <span>♥ {rp.likes || 0}</span>
                  <span>💬 {rp.comment_count || 0}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 커뮤니티 더 둘러보기 CTA */}
      <div className="rounded-xl p-5 text-center mb-4" style={{ backgroundColor: '#F3F0FF' }}>
        <p className="text-sm font-bold mb-3" style={{ color: '#111' }}>더 재미있는 글이 기다리고 있어요</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/community" className="rounded-lg px-4 py-2 text-xs font-bold transition hover:opacity-80"
            style={{ backgroundColor: '#8B5CF6', color: '#FFF', minHeight: 36 }}>
            커뮤니티 홈
          </Link>
          <Link to="/community/jogak" className="rounded-lg px-4 py-2 text-xs font-bold transition hover:opacity-80"
            style={{ backgroundColor: '#10B981', color: '#FFF', minHeight: 36 }}>
            조각모임
          </Link>
          <Link to="/community/reviews" className="rounded-lg px-4 py-2 text-xs font-bold transition hover:opacity-80"
            style={{ backgroundColor: '#F59E0B', color: '#FFF', minHeight: 36 }}>
            후기 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
