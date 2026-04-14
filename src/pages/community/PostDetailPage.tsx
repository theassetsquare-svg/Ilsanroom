import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';
import { getAllPosts } from '@/lib/community-data';

export default function PostDetailPage() {
  useDocumentMeta('글 상세', '커뮤니티 게시글 상세 페이지');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const [isSeedPost, setIsSeedPost] = useState(false);

  // 글 불러오기
  useEffect(() => {
    if (!id) return;

    // seed-xxx 형태의 ID는 시드 데이터에서 찾기
    if (id.startsWith('seed-')) {
      const seedId = id.replace('seed-', '');
      const seedPost = getAllPosts().find(p => p.id === seedId);
      if (seedPost) {
        setPost({
          id: `seed-${seedPost.id}`,
          title: seedPost.title,
          content: seedPost.content,
          category: seedPost.board,
          created_at: seedPost.createdAt,
          likes: seedPost.likes,
          views: seedPost.views,
          user_id: seedPost.author.id,
          users: { nickname: seedPost.author.nickname },
          _seedComments: seedPost.comments,
        });
        // 시드 댓글 세팅
        const flatComments = seedPost.comments.flatMap(c => {
          const result: any[] = [{
            id: c.id,
            content: c.content,
            created_at: c.createdAt,
            likes: c.likes,
            user_id: c.author.id,
            users: { nickname: c.author.nickname },
          }];
          if (c.replies) {
            c.replies.forEach(r => {
              result.push({
                id: r.id,
                content: r.content,
                created_at: r.createdAt,
                likes: r.likes,
                user_id: r.author.id,
                users: { nickname: r.author.nickname },
              });
            });
          }
          return result;
        });
        setComments(flatComments);
        setIsSeedPost(true);
      }
      setLoading(false);
      return;
    }

    if (!supabase) { setLoading(false); return; }
    supabase.from('posts').select('*, users!posts_user_id_fkey(nickname, avatar_url)').eq('id', id).single().then(({ data, error }) => {
      if (error) {
        supabase.from('posts').select('*').eq('id', id).single().then(({ data: d }) => {
          setPost(d);
          setLoading(false);
        });
      } else {
        setPost(data);
        setLoading(false);
      }
    });
  }, [id]);

  // 댓글 불러오기
  const fetchComments = async () => {
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
    setComments(data || []);
  };

  useEffect(() => { if (!isSeedPost) fetchComments(); }, [id, isSeedPost]);

  // 글 삭제
  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    if (!supabase) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) { alert('삭제 실패: ' + error.message); return; }
    alert('삭제되었습니다');
    navigate('/community');
  };

  // 댓글 작성
  const handleComment = async () => {
    if (!commentText.trim() || !user || !supabase) return;
    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      post_id: id,
      user_id: user.id,
      content: commentText.trim(),
    });
    if (error) { alert('댓글 실패: ' + error.message); }
    else { setCommentText(''); await fetchComments(); }
    setSubmitting(false);
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    if (!supabase) return;
    await supabase.from('comments').delete().eq('id', commentId);
    await fetchComments();
  };

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

      {/* 글 내용 */}
      <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: '#F9FAFB', minHeight: 150 }}>
        <p className="text-base leading-relaxed" style={{ color: '#333', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
          {post.content}
        </p>
      </div>

      {/* 구분선 */}
      <div className="border-t mb-6" style={{ borderColor: '#E5E7EB' }} />

      {/* 댓글 */}
      <h3 className="text-base font-bold mb-4" style={{ color: '#111' }}>💬 댓글 {comments.length}개</h3>

      {comments.length > 0 ? (
        <div className="space-y-3 mb-6">
          {comments.map((c: any) => (
            <div key={c.id} className="flex items-start justify-between rounded-xl p-4" style={{ backgroundColor: '#F3F4F6' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed" style={{ color: '#111' }}>{c.content}</p>
                <span className="text-xs" style={{ color: '#999' }}>{c.users?.nickname || '사용자'} · {c.created_at?.slice(0, 10)}</span>
              </div>
              {user?.id === c.user_id && (
                <button onClick={() => handleDeleteComment(c.id)} className="text-xs shrink-0 ml-2" style={{ color: '#EF4444', minHeight: 28 }}>삭제</button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm mb-6" style={{ color: '#999' }}>아직 댓글이 없습니다.</p>
      )}

      {/* 댓글 입력 */}
      {user ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleComment(); }}
            placeholder="댓글을 입력하세요..."
            className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none"
            style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }}
          />
          <button
            onClick={handleComment}
            disabled={!commentText.trim() || submitting}
            className="rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}
          >
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
