import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';
import ShareButton from '@/components/ui/ShareButton';

interface CommentData {
  id: string;
  post_id: string;
  user_id: string | null;
  content: string;
  parent_id: string | null;
  created_at: string;
  users?: { nickname: string | null; avatar_url: string | null } | null;
}

export default function PostDetailPage() {
  useDocumentMeta('글 상세', '커뮤니티 게시글 상세 페이지');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const supabase = createClient();

  // 글 불러오기
  useEffect(() => {
    if (!id || !supabase) { setLoading(false); return; }

    supabase.from('posts').select('*, users!posts_user_id_fkey(nickname, avatar_url)').eq('id', id).single().then(({ data, error }) => {
      if (error) {
        supabase.from('posts').select('*').eq('id', id).single().then(({ data: d }) => {
          setPost(d);
          setLikeCount(d?.likes || 0);
          setLoading(false);
        });
      } else {
        setPost(data);
        setLikeCount(data?.likes || 0);
        setLoading(false);
      }
    });
  }, [id]);

  // 댓글 불러오기
  const fetchComments = useCallback(async () => {
    if (!supabase || !id) return;
    let { data, error } = await supabase
      .from('comments')
      .select('*, users!comments_user_id_fkey(nickname, avatar_url)')
      .eq('post_id', id)
      .order('created_at', { ascending: true });
    if (error) {
      const fallback = await supabase.from('comments').select('*').eq('post_id', id).order('created_at', { ascending: true });
      data = fallback.data;
    }
    setComments((data || []) as CommentData[]);
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

  // 댓글 작성 (최상위)
  const handleComment = async () => {
    if (!commentText.trim() || !user || !supabase) return;
    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      post_id: id,
      user_id: user.id,
      content: commentText.trim(),
      parent_id: null,
    });
    if (!error) { setCommentText(''); await fetchComments(); }
    setSubmitting(false);
  };

  // 대댓글 작성
  const handleReply = async () => {
    if (!replyText.trim() || !user || !supabase || !replyTo) return;
    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      post_id: id,
      user_id: user.id,
      content: replyText.trim(),
      parent_id: replyTo.id,
    });
    if (!error) { setReplyText(''); setReplyTo(null); await fetchComments(); }
    setSubmitting(false);
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    if (!supabase) return;
    await supabase.from('comments').delete().eq('id', commentId);
    await fetchComments();
  };

  // 조각모임 content JSON 파싱
  const parseJogakContent = (content: string) => {
    try { return JSON.parse(content); } catch { return null; }
  };

  // 댓글을 트리 구조로 정리
  const rootComments = comments.filter(c => !c.parent_id);
  const childComments = (parentId: string) => comments.filter(c => c.parent_id === parentId);

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
    const nickname = (comment.users as any)?.nickname || '사용자';
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

          {/* 답글 입력창 — 해당 댓글 바로 아래 */}
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

        {/* 자식 댓글 (대댓글) */}
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

      {/* 글 제목 */}
      <h1 className="text-2xl font-bold mb-3" style={{ color: '#111' }}>{post.title}</h1>

      {/* 작성자 + 날짜 + 삭제 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs" style={{ color: '#999' }}>
          <span style={{ color: '#555' }}>{(post.users as any)?.nickname || '사용자'}</span>
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
        <div className="flex gap-2">
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
        <Link to="/login" className="block text-center text-sm font-medium py-3" style={{ color: '#8B5CF6' }}>
          로그인하고 댓글 달기
        </Link>
      )}
    </div>
  );
}
