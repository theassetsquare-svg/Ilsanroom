import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { venues } from '@/data/venues';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';

const CAT_LABELS: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

interface Post {
  id: string;
  userName: string;
  venueName: string;
  category: string;
  region: string;
  caption: string;
  imageUrl: string;
  likes: number;
  liked: boolean;
  comments: { name: string; text: string }[];
  timeAgo: string;
}

// 초기 피드 데이터 (실제 업소 기반)
const openVenues = venues.filter(v => v.status !== 'closed_or_unclear');
const NAMES = ['김**', '이**', '박**', '최**', '정**', '강**', '조**', '윤**'];
const CAPTIONS = [
  '분위기 진짜 미쳤다 여기',
  '오늘 밤 여기 강추! 실장님 서비스 최고',
  '친구들이랑 왔는데 다음에 또 올 예정',
  '인테리어 새로 했나 더 깔끔해짐',
  '주말인데 대기 없이 바로 들어감 럭키',
  '사운드 시스템 업그레이드 됐음 ㄹㅇ',
  '여기 처음 왔는데 단골 될 듯',
  '금요일 밤 분위기 최고였다',
];
const COMMENTS_POOL = [
  { name: '밤탐험가', text: '여기 어디야? 나도 가보고 싶다' },
  { name: '파티러버', text: '분위기 대박이네' },
  { name: '일산주민', text: '여기 자주 가는데 진짜 좋음' },
  { name: '강남출몰', text: '다음에 같이 가자!' },
  { name: '클럽마니아', text: '사진 더 찍어줘' },
];
const TIMES = ['방금', '3분 전', '12분 전', '1시간 전', '3시간 전', '5시간 전', '어제', '2일 전'];

const initialPosts: Post[] = openVenues.slice(0, 12).map((v, i) => ({
  id: `post-${v.slug}`,
  userName: NAMES[i % NAMES.length],
  venueName: v.nameKo,
  category: v.category,
  region: v.regionKo,
  caption: CAPTIONS[i % CAPTIONS.length],
  imageUrl: `/venues/${v.slug}-1.jpg`,
  likes: Math.floor(Math.random() * 200) + 20,
  liked: false,
  comments: [COMMENTS_POOL[i % COMMENTS_POOL.length], COMMENTS_POOL[(i + 2) % COMMENTS_POOL.length]],
  timeAgo: TIMES[i % TIMES.length],
}));

export default function GalleryPage() {
  useDocumentMeta('클립 — 실시간 나이트라이프 포토 피드', '손님들이 직접 올리는 현장 사진. 지금 가장 핫한 곳을 사진으로 먼저 확인.');
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = () => {
    if (!previewUrl || !caption.trim()) return;
    const userName = (user?.user_metadata?.name as string) || '나';
    const newPost: Post = {
      id: `user-${Date.now()}`,
      userName,
      venueName: userName,
      category: 'club',
      region: '',
      caption: caption.trim(),
      imageUrl: previewUrl,
      likes: 0,
      liked: false,
      comments: [],
      timeAgo: '방금',
    };
    setPosts([newPost, ...posts]);
    setShowUpload(false);
    setCaption('');
    setPreviewUrl(null);
  };

  const [loginPrompt, setLoginPrompt] = useState(false);

  const requireLogin = (): boolean => {
    if (user) return true;
    setLoginPrompt(true);
    return false;
  };

  const toggleLike = (id: string) => {
    if (!requireLogin()) return;
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const addComment = (postId: string) => {
    if (!requireLogin()) return;
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    const name = (user?.user_metadata?.name as string) || '나';
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, { name, text }] } : p
    ));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="mx-auto max-w-lg px-0 sm:px-4 py-0 sm:py-6">
      {/* 헤더 */}
      <div className="sticky top-14 z-[90] flex items-center justify-between px-4 py-3 border-b border-neon-border" style={{ backgroundColor: '#F5F5F5' }}>
        <h1 className="text-lg font-bold" style={{ color: '#111' }}>클립</h1>
        {user ? (
          <button
            onClick={() => setShowUpload(true)}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: '#8B5CF6', minHeight: 44 }}
          >
            + 사진 올리기
          </button>
        ) : (
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: '#8B5CF6', minHeight: 44 }}
          >
            로그인하고 올리기
          </Link>
        )}
      </div>

      {/* 업로드 — 전체 화면 */}
      {showUpload && (
        <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
          {/* 상단 바 */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
            <button onClick={() => setShowUpload(false)} className="text-sm font-medium" style={{ color: '#555', minHeight: 44 }}>취소</button>
            <h2 className="text-base font-bold" style={{ color: '#111' }}>새 게시물</h2>
            <button
              onClick={handleUpload}
              disabled={!previewUrl || !caption.trim()}
              className="text-sm font-bold disabled:opacity-30"
              style={{ color: '#8B5CF6', minHeight: 44 }}
            >
              공유
            </button>
          </div>

          {/* 본문 — 스크롤 가능 */}
          <div className="flex-1 overflow-y-auto">
            {/* 사진 */}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="미리보기" className="w-full object-cover" style={{ maxHeight: '40vh' }} />
                <button
                  onClick={() => { setPreviewUrl(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold"
                  style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', minHeight: 32 }}
                >
                  변경
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full p-12 text-center"
                style={{ backgroundColor: '#F9FAFB', minHeight: 200 }}
              >
                <p className="text-5xl mb-3">📷</p>
                <p className="text-sm font-medium" style={{ color: '#555' }}>탭해서 사진 선택</p>
              </button>
            )}

            {/* 글쓰기 */}
            <div className="px-4 py-4">
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="문구 입력..."
                rows={6}
                className="w-full text-base outline-none resize-none"
                style={{ color: '#111', lineHeight: '1.7' }}
                autoFocus={!!previewUrl}
              />
            </div>

            {/* 해시태그 추천 */}
            <div className="px-4 pb-4">
              <p className="text-xs mb-2" style={{ color: '#999' }}>추천 태그</p>
              <div className="flex flex-wrap gap-2">
                {['#나이트라이프', '#클럽', '#라운지', '#오늘밤', '#놀쿨'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setCaption(prev => prev + ' ' + tag)}
                    className="rounded-full px-3 py-1 text-xs"
                    style={{ backgroundColor: '#F3F0FF', color: '#8B5CF6', minHeight: 32 }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 피드 */}
      <div className="divide-y divide-neon-border">
        {posts.map(post => {
          const isExpanded = expandedComments.has(post.id);
          return (
            <article key={post.id} className="pb-4" style={{ backgroundColor: '#FFFFFF' }}>
              {/* 헤더 */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6' }}>
                  {post.userName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: '#111' }}>{post.userName}</p>
                  <p className="text-xs" style={{ color: '#555' }}>{post.venueName} · {post.region}</p>
                </div>
                <span className="text-xs" style={{ color: '#999' }}>{post.timeAgo}</span>
              </div>

              {/* 이미지 */}
              <div className="w-full bg-neon-surface-2" style={{ minHeight: 300 }}>
                <img
                  src={post.imageUrl}
                  alt={post.venueName}
                  className="w-full object-cover"
                  style={{ maxHeight: 500 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="flex items-center justify-center h-64 text-center"><p style="color:#999;font-size:14px">📷 ${post.venueName} 현장 사진</p></div>`;
                  }}
                />
              </div>

              {/* 액션 버튼 */}
              <div className="flex items-center gap-4 px-4 pt-3 pb-1">
                <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1" style={{ minHeight: 44 }}>
                  <svg className="w-6 h-6" fill={post.liked ? '#EF4444' : 'none'} stroke={post.liked ? '#EF4444' : '#111'} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button onClick={() => {
                  setExpandedComments(prev => { const s = new Set(prev); s.has(post.id) ? s.delete(post.id) : s.add(post.id); return s; });
                }} style={{ minHeight: 44 }}>
                  <svg className="w-6 h-6" fill="none" stroke="#111" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
                <button onClick={() => {
                  if (navigator.share) navigator.share({ title: post.venueName, text: post.caption });
                }} style={{ minHeight: 44 }}>
                  <svg className="w-6 h-6" fill="none" stroke="#111" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>

              {/* 좋아요 수 */}
              <p className="px-4 text-sm font-bold" style={{ color: '#111' }}>좋아요 {post.likes}개</p>

              {/* 캡션 */}
              <p className="px-4 mt-1 text-sm" style={{ color: '#111' }}>
                <span className="font-bold">{post.userName}</span>{' '}{post.caption}
              </p>

              {/* 카테고리 태그 */}
              <div className="px-4 mt-1">
                <span className="text-xs font-medium" style={{ color: '#8B5CF6' }}>#{CAT_LABELS[post.category] || post.category} #{post.region}</span>
              </div>

              {/* 댓글 */}
              {post.comments.length > 0 && (
                <div className="px-4 mt-2">
                  {!isExpanded && post.comments.length > 1 && (
                    <button onClick={() => setExpandedComments(prev => new Set(prev).add(post.id))}
                      className="text-xs mb-1" style={{ color: '#999' }}>
                      댓글 {post.comments.length}개 모두 보기
                    </button>
                  )}
                  {(isExpanded ? post.comments : post.comments.slice(-1)).map((c, i) => (
                    <p key={i} className="text-sm" style={{ color: '#111' }}>
                      <span className="font-bold">{c.name}</span>{' '}{c.text}
                    </p>
                  ))}
                </div>
              )}

              {/* 댓글 입력 */}
              {user && (
                <div className="flex items-center gap-2 px-4 mt-2">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') addComment(post.id); }}
                    placeholder="댓글 달기..."
                    className="flex-1 text-sm py-2 outline-none border-b"
                    style={{ color: '#111', borderColor: '#E5E7EB', minHeight: 40, backgroundColor: 'transparent' }}
                  />
                  <button onClick={() => addComment(post.id)} className="text-sm font-bold" style={{ color: '#8B5CF6', minHeight: 40 }}>
                    게시
                  </button>
                </div>
              )}
              {!user && (
                <Link to="/login" className="block px-4 mt-2 text-xs" style={{ color: '#8B5CF6' }}>
                  로그인하고 댓글 달기
                </Link>
              )}
            </article>
          );
        })}
      </div>

      {/* 로그인 안내 팝업 */}
      {loginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setLoginPrompt(false)}>
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} />
          <div className="relative rounded-2xl p-6 mx-4 max-w-sm w-full text-center" style={{ backgroundColor: '#1a1a2e', color: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
            <p className="text-3xl mb-3">🔒</p>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#FFFFFF' }}>로그인이 필요합니다</h3>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.7)' }}>좋아요, 댓글, 사진 올리기는 로그인 후 이용 가능합니다</p>
            <div className="flex gap-2">
              <button onClick={() => setLoginPrompt(false)} className="flex-1 rounded-xl py-3 text-sm font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', minHeight: 48 }}>
                닫기
              </button>
              <Link to="/login" className="flex-1 rounded-xl py-3 text-sm font-bold text-center text-white" style={{ backgroundColor: '#8B5CF6', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                로그인하기
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
