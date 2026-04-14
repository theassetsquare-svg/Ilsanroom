
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';

/* ── Types ── */
interface Clip {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  likes: number;
  liked: boolean;
  created_at: string;
  author: string;
  avatar_url: string | null;
  comments: ClipComment[];
  comment_count: number;
}

interface ClipComment {
  id: string;
  user_id: string;
  content: string;
  author: string;
  created_at: string;
}

/* ── Helpers ── */
function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

/* ══════════════════════════════════════════ */
/*           CLIP PAGE — 인스타 스타일          */
/* ══════════════════════════════════════════ */
export default function GalleryPage() {
  useDocumentMeta('클립 — 실시간 나이트라이프 포토 피드', '손님들이 직접 올리는 현장 사진. 지금 가장 핫한 곳을 사진으로 먼저 확인.');
  const { user } = useAuth();
  const navigate = useNavigate();
  const supabase = createClient();
  const requireLogin = () => { if (!user) { navigate('/login'); return false; } return true; };

  /* ── State ── */
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  /* ── 피드 불러오기 ── */
  const fetchClips = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, users!posts_user_id_fkey(nickname, avatar_url)')
        .eq('category', 'clip')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        // fallback without join
        const { data: fb } = await supabase
          .from('posts')
          .select('*')
          .eq('category', 'clip')
          .order('created_at', { ascending: false })
          .limit(30);
        if (fb) setClips(fb.map((p: any) => mapClip(p)));
      } else if (data) {
        // 각 클립의 댓글도 가져오기
        const clipIds = data.map((p: any) => p.id);
        let commentsMap: Record<string, ClipComment[]> = {};
        if (clipIds.length > 0) {
          const { data: allComments } = await supabase
            .from('comments')
            .select('*, users!comments_user_id_fkey(nickname)')
            .in('post_id', clipIds)
            .order('created_at', { ascending: true });
          if (allComments) {
            for (const c of allComments as any[]) {
              if (!commentsMap[c.post_id]) commentsMap[c.post_id] = [];
              commentsMap[c.post_id].push({
                id: c.id,
                user_id: c.user_id || '',
                content: c.content,
                author: c.users?.nickname || '사용자',
                created_at: c.created_at,
              });
            }
          }
        }
        setClips(data.map((p: any) => ({ ...mapClip(p), comments: commentsMap[p.id] || [] })));
      }
    } catch {} finally { setLoading(false); }
  }, []);

  function mapClip(p: any): Clip {
    let imageUrl = '';
    let caption = p.title || '';
    try {
      const parsed = JSON.parse(p.content);
      imageUrl = parsed.imageUrl || '';
      caption = parsed.caption || p.title || '';
    } catch {
      imageUrl = p.content || '';
    }
    return {
      id: p.id,
      user_id: p.user_id || '',
      image_url: imageUrl,
      caption,
      likes: p.likes || 0,
      liked: false,
      created_at: p.created_at,
      author: (p.users as any)?.nickname || '사용자',
      avatar_url: (p.users as any)?.avatar_url || null,
      comments: [],
      comment_count: p.comment_count || 0,
    };
  }

  useEffect(() => { fetchClips(); }, [fetchClips]);

  /* ── 좋아요 ── */
  const toggleLike = async (clipId: string) => {
    if (!requireLogin()) return;
    if (!supabase) return;
    setClips(prev => prev.map(c =>
      c.id === clipId ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c
    ));
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      const newLikes = clip.liked ? clip.likes - 1 : clip.likes + 1;
      await supabase.from('posts').update({ likes: Math.max(0, newLikes) }).eq('id', clipId);
    }
  };

  /* ── 댓글 달기 ── */
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const addComment = async (clipId: string) => {
    if (!requireLogin()) return;
    if (!supabase) return;
    const text = commentInputs[clipId]?.trim();
    if (!text) return;

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: clipId, user_id: user.id, content: text } as any)
      .select('*')
      .single();

    if (!error && data) {
      const newComment: ClipComment = {
        id: (data as any).id,
        user_id: user.id,
        content: text,
        author: (user.user_metadata?.name as string) || '나',
        created_at: new Date().toISOString(),
      };
      setClips(prev => prev.map(c =>
        c.id === clipId ? { ...c, comments: [...c.comments, newComment], comment_count: c.comment_count + 1 } : c
      ));
      setCommentInputs(prev => ({ ...prev, [clipId]: '' }));
    }
  };

  /* ── 댓글 삭제 ── */
  const deleteComment = async (clipId: string, commentId: string) => {
    if (!supabase) return;
    await supabase.from('comments').delete().eq('id', commentId);
    setClips(prev => prev.map(c =>
      c.id === clipId ? { ...c, comments: c.comments.filter(cm => cm.id !== commentId), comment_count: Math.max(0, c.comment_count - 1) } : c
    ));
  };

  /* ── 게시물 삭제 ── */
  const deleteClip = async (clipId: string) => {
        if (!supabase) return;
    await supabase.from('posts').delete().eq('id', clipId);
    setClips(prev => prev.filter(c => c.id !== clipId));
  };

  /* ── 댓글 펼침 ── */
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  return (
    <div className="mx-auto max-w-lg bg-white min-h-screen">

      {/* ═══ 스토리 바 (인스타 스타일) ═══ */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 overflow-x-auto scrollbar-hide">
        {/* 내 스토리 (업로드 버튼) */}
        <button
          onClick={() => requireLogin() && setShowUpload(true)}
          className="flex flex-col items-center gap-1 shrink-0"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#8B5CF6] text-white text-xs font-bold border-2 border-white">+</span>
          </div>
          <span className="text-[10px] text-[#555]">내 클립</span>
        </button>
      </div>

      {/* ═══ 업로드 모달 — 인스타 스타일 전체화면 ═══ */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onPosted={fetchClips} />}

      {/* ═══ 피드 ═══ */}
      {loading ? (
        <div className="space-y-6 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gray-200" />
                <div className="h-3 w-24 rounded bg-gray-200" />
              </div>
              <div className="w-full aspect-square rounded-lg bg-gray-200" />
              <div className="h-3 w-32 rounded bg-gray-200 mt-3" />
            </div>
          ))}
        </div>
      ) : clips.length === 0 ? (
        <div className="py-20 text-center px-4">
          <p className="text-5xl mb-4">📸</p>
          <h3 className="text-lg font-bold text-[#111] mb-1">아직 클립이 없습니다</h3>
          <p className="text-sm text-[#555] mb-6">첫 번째 클립을 올려보세요!</p>
          <button
            onClick={() => requireLogin() && setShowUpload(true)}
            className="rounded-xl px-6 py-3 text-sm font-bold text-white"
            style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}
          >
            클립 올리기
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {clips.map(clip => {
            const isExpanded = expandedComments.has(clip.id);
            const isMine = user?.id === clip.user_id;
            return (
              <article key={clip.id}>
                {/* 헤더: 프로필 + 이름 + 더보기 */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] p-[2px]">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {clip.avatar_url ? (
                        <img src={clip.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-[#8B5CF6]">{clip.author.charAt(0)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#111]">{clip.author}</p>
                  </div>
                  {isMine && (
                    <button onClick={() => deleteClip(clip.id)} className="p-2" style={{ minHeight: 44 }}>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="6" r="1" fill="currentColor" />
                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                        <circle cx="12" cy="18" r="1" fill="currentColor" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* 이미지 — 1:1 정사각형 (인스타 스타일) */}
                <div className="w-full aspect-square bg-gray-100 overflow-hidden">
                  {clip.image_url ? (
                    <img
                      src={clip.image_url}
                      alt={clip.caption}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-700">
                      <span className="text-6xl">📷</span>
                    </div>
                  )}
                </div>

                {/* 액션 버튼: 좋아요 + 댓글 + 공유 */}
                <div className="flex items-center gap-4 px-4 pt-3 pb-1">
                  <button onClick={() => toggleLike(clip.id)} style={{ minHeight: 44 }}>
                    <svg className="w-7 h-7" fill={clip.liked ? '#EF4444' : 'none'} stroke={clip.liked ? '#EF4444' : '#111'} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <button onClick={() => document.getElementById(`comment-${clip.id}`)?.focus()} style={{ minHeight: 44 }}>
                    <svg className="w-7 h-7" fill="none" stroke="#111" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                  <button onClick={() => { if (navigator.share) navigator.share({ text: clip.caption, url: window.location.href }); }} style={{ minHeight: 44 }}>
                    <svg className="w-7 h-7" fill="none" stroke="#111" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19V5m0 0l-4 4m4-4l4 4" />
                    </svg>
                  </button>
                </div>

                {/* 좋아요 수 */}
                {clip.likes > 0 && (
                  <p className="px-4 text-sm font-bold text-[#111]">좋아요 {clip.likes.toLocaleString()}개</p>
                )}

                {/* 캡션 */}
                {clip.caption && (
                  <p className="px-4 mt-1 text-sm text-[#111] leading-relaxed">
                    <span className="font-bold">{clip.author}</span>{' '}{clip.caption}
                  </p>
                )}

                {/* 시간 */}
                <p className="px-4 mt-1 text-[11px] text-[#999]">{timeAgo(clip.created_at)}</p>

                {/* 댓글 */}
                <div className="px-4 mt-2">
                  {clip.comments.length > 2 && !isExpanded && (
                    <button onClick={() => setExpandedComments(prev => { const n = new Set(prev); n.add(clip.id); return n; })}
                      className="text-xs mb-1" style={{ color: '#999' }}>
                      댓글 {clip.comments.length}개 모두 보기
                    </button>
                  )}
                  {(isExpanded ? clip.comments : clip.comments.slice(-2)).map(c => (
                    <div key={c.id} className="flex items-start gap-1 mb-1">
                      <p className="text-sm flex-1 text-[#111]">
                        <span className="font-bold">{c.author}</span>{' '}{c.content}
                      </p>
                      {user?.id === c.user_id && (
                        <button onClick={() => deleteComment(clip.id, c.id)} className="text-[10px] shrink-0 text-gray-400 pt-0.5" style={{ minHeight: 28 }}>삭제</button>
                      )}
                    </div>
                  ))}
                </div>

                {/* 댓글 입력 */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
                  <input
                    id={`comment-${clip.id}`}
                    type="text"
                    value={commentInputs[clip.id] || ''}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [clip.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') addComment(clip.id); }}
                    onFocus={() => { if (!user) navigate('/login'); }}
                    placeholder="댓글 달기..."
                    className="flex-1 text-sm py-2 outline-none bg-transparent text-[#111]"
                    style={{ minHeight: 40 }}
                  />
                  {commentInputs[clip.id]?.trim() && (
                    <button onClick={() => addComment(clip.id)} className="text-sm font-bold text-[#8B5CF6]" style={{ minHeight: 40 }}>
                      게시
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ═══ 하단 업로드 FAB ═══ */}
      {!showUpload && (
        <button
          onClick={() => requireLogin() && setShowUpload(true)}
          className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#8B5CF6] text-white shadow-xl shadow-purple-300 active:scale-90 transition"
          aria-label="클립 올리기"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13" r="3" strokeWidth={2} />
          </svg>
        </button>
      )}

    </div>
  );
}


/* ══════════════════════════════════════════ */
/*         UPLOAD MODAL — 인스타 스타일         */
/* ══════════════════════════════════════════ */
function UploadModal({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const { user } = useAuth();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'select' | 'edit' | 'posting'>('select');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  /* 사진 선택 또는 카메라 촬영 */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError('10MB 이하의 사진만 올릴 수 있습니다'); return; }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStep('edit');
    setError('');
  };

  /* 게시하기 — Supabase Storage + DB 저장 */
  const handlePost = async () => {
    if (!file || !supabase || !user) return;
    setUploading(true);
    setError('');

    try {
      // 1. 이미지 업로드 → Supabase Storage
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `clips/${user.id}/${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('post-media')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadErr) {
        setError('사진 업로드 실패: ' + uploadErr.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(uploadData.path);
      const imageUrl = urlData.publicUrl;

      // 2. DB 저장 — posts 테이블 (category: 'clip')
      const content = JSON.stringify({ imageUrl, caption: caption.trim() });
      const { error: dbErr } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          category: 'clip' as any,
          title: caption.trim() || '클립',
          content,
          likes: 0,
          views: 0,
          is_pinned: false,
        } as any);

      if (dbErr) {
        setError('저장 실패: ' + dbErr.message);
        setUploading(false);
        return;
      }

      // 성공
      onPosted();
      onClose();
    } catch (err: any) {
      setError('오류 발생: ' + (err?.message || '알 수 없는 오류'));
    } finally {
      setUploading(false);
    }
  };

  // cleanup
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-white">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 border-b border-gray-100" style={{ height: 52 }}>
        <button onClick={onClose} className="text-sm font-medium text-[#555]" style={{ minHeight: 44 }}>
          {step === 'edit' ? (
            <span onClick={(e) => { e.stopPropagation(); setStep('select'); setPreviewUrl(null); setFile(null); }}>←</span>
          ) : '취소'}
        </button>
        <h2 className="text-base font-bold text-[#111]">
          {step === 'select' ? '새 게시물' : step === 'edit' ? '새 게시물' : '게시 중...'}
        </h2>
        {step === 'edit' ? (
          <button
            onClick={handlePost}
            disabled={uploading}
            className="text-sm font-bold text-[#8B5CF6] disabled:opacity-40"
            style={{ minHeight: 44 }}
          >
            {uploading ? '게시 중...' : '공유'}
          </button>
        ) : (
          <div style={{ width: 44 }} />
        )}
      </div>

      {/* ── STEP 1: 사진 선택 ── */}
      {step === 'select' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />

          <div className="text-center mb-8">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-50">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" strokeWidth={1.5} />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#111] mb-1">사진을 올려보세요</h3>
            <p className="text-sm text-[#555]">지금 이 순간을 공유하세요</p>
          </div>

          {/* 카메라 촬영 */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full max-w-xs rounded-xl py-4 text-base font-bold text-white mb-3"
            style={{ backgroundColor: '#8B5CF6', minHeight: 52 }}
          >
            📷 사진 찍기 / 앨범에서 선택
          </button>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>
      )}

      {/* ── STEP 2: 편집 (미리보기 + 캡션) ── */}
      {step === 'edit' && (
        <div className="flex-1 overflow-y-auto">
          {/* 사진 미리보기 — 1:1 크롭 */}
          {previewUrl && (
            <div className="w-full aspect-square bg-black overflow-hidden">
              <img src={previewUrl} alt="미리보기" className="w-full h-full object-cover" />
            </div>
          )}

          {/* 프로필 + 캡션 입력 (인스타 스타일) */}
          <div className="flex items-start gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white text-sm font-bold shrink-0">
              {(user?.user_metadata?.name as string)?.charAt(0) || '나'}
            </div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="문구 입력..."
              rows={5}
              maxLength={2200}
              className="flex-1 text-[16px] outline-none resize-none bg-transparent text-[#111]"
              style={{ lineHeight: '1.7' }}
              autoFocus
            />
          </div>

          {/* 글자수 */}
          <div className="px-4 pb-2">
            <span className="text-xs text-[#999]">{caption.length}/2,200</span>
          </div>

          {/* 해시태그 추천 */}
          <div className="px-4 pb-4">
            <p className="text-xs text-[#999] mb-2">추천 태그</p>
            <div className="flex flex-wrap gap-2">
              {['#오늘밤', '#나이트라이프', '#클럽', '#분위기맛집', '#놀쿨'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setCaption(prev => prev.endsWith(' ') ? prev + tag : prev + ' ' + tag)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{ backgroundColor: '#F3F0FF', color: '#8B5CF6', minHeight: 32 }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 에러 */}
          {error && <p className="px-4 pb-4 text-sm text-red-500">{error}</p>}

          {/* 업로딩 오버레이 */}
          {uploading && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80">
              <div className="text-center">
                <div className="h-10 w-10 mx-auto mb-3 animate-spin rounded-full border-3 border-[#8B5CF6] border-t-transparent" />
                <p className="text-sm font-bold text-[#111]">게시 중...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
