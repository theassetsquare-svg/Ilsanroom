import { useState, useEffect, useCallback } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { fetchReports, resolveReport, getReasonLabel, type Report } from '@/lib/report-api';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'baesunwook513@gmail.com', 'theassetsquare@gmail.com'];

const CATEGORY_LABELS: Record<string, string> = {
  free: '자유',
  reviews: '후기',
  tips: '꿀팁',
  qna: 'Q&A',
  party: '벙개/파티',
  fashion: '패션',
  jogak: '조각모임',
  discussion: '토론',
  clip: '갤러리 클립',
};

const ADMIN_PIN = 'nolcool2026';

export default function AdminPage() {
  useDocumentMeta('관리자 페이지 — 회원·매장·신고 관리', '놀쿨 사이트 운영 관리자 전용. 회원 관리, 매장 등록 심사, 신고 처리, 차단/삭제 결정, 알림 설정, 프리미엄 결제 모니터링까지 한곳에서.');
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  // 관리자 인증 게이트
  const [adminAuthed, setAdminAuthed] = useState(() => {
    try {
      const saved = sessionStorage.getItem('nolcool_admin_auth');
      return saved === 'true';
    } catch { return false; }
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handlePinSubmit = () => {
    if (pinInput === ADMIN_PIN) {
      setAdminAuthed(true);
      sessionStorage.setItem('nolcool_admin_auth', 'true');
      setPinError('');
    } else {
      setPinError('비밀번호가 틀립니다');
      setPinInput('');
    }
  };

  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [clips, setClips] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [bannedEmails, setBannedEmails] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('nolcool_banned') || '[]'); } catch { return []; }
  });
  const [banInput, setBanInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [filterWords, setFilterWords] = useState<any[]>([]);
  const [newFilterWord, setNewFilterWord] = useState('');

  // 데이터 로드
  const loadData = useCallback(async () => {
    if (!supabase || !isAdmin) return;
    setLoading(true);
    const [postsRes, commentsRes] = await Promise.all([
      supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    const allPosts = postsRes.data || [];
    setPosts(allPosts.filter(p => p.category !== 'clip'));
    setClips(allPosts.filter(p => p.category === 'clip'));
    setComments(commentsRes.data || []);

    // 신고 목록 로드
    try {
      const reps = await fetchReports();
      setReports(reps);
    } catch { /* reports 테이블 없을 수 있음 */ }

    // 필터 키워드 로드
    try {
      const { data: fw } = await supabase.from('filter_words').select('*').order('created_at', { ascending: false });
      setFilterWords(fw || []);
    } catch { /* filter_words 테이블 없을 수 있음 */ }

    setLoading(false);
  }, [isAdmin]);

  useEffect(() => { loadData(); }, [loadData]);

  // 클립 이미지 URL 추출
  const getClipImage = (clip: any): string | null => {
    try {
      const parsed = JSON.parse(clip.content);
      return parsed.imageUrl || null;
    } catch { return null; }
  };

  // 클립 캡션 추출
  const getClipCaption = (clip: any): string => {
    try {
      const parsed = JSON.parse(clip.content);
      return parsed.caption || '';
    } catch { return clip.title || ''; }
  };

  // Storage에서 이미지 경로 추출
  const getStoragePath = (imageUrl: string): string | null => {
    // URL: .../storage/v1/object/public/post-media/clips/userId/timestamp.ext
    const match = imageUrl.match(/post-media\/(.+)$/);
    return match ? match[1] : null;
  };

  // 글 삭제
  const handleDeletePost = async (id: string) => {
    if (!confirm('이 글을 삭제하시겠습니까?')) return;
    if (!supabase) return;
    setDeleting(id);
    await supabase.from('comments').delete().eq('post_id', id);
    await supabase.from('posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
    setDeleting(null);
  };

  // 클립 삭제 (이미지도 Storage에서 삭제)
  const handleDeleteClip = async (clip: any) => {
    if (!confirm('이 클립과 이미지를 삭제하시겠습니까?')) return;
    if (!supabase) return;
    setDeleting(clip.id);

    // Storage 이미지 삭제
    const imageUrl = getClipImage(clip);
    if (imageUrl) {
      const path = getStoragePath(imageUrl);
      if (path) {
        await supabase.storage.from('post-media').remove([path]);
      }
    }

    // DB 삭제
    await supabase.from('comments').delete().eq('post_id', clip.id);
    await supabase.from('posts').delete().eq('id', clip.id);
    setClips(prev => prev.filter(c => c.id !== clip.id));
    setDeleting(null);
  };

  // 댓글 삭제
  const handleDeleteComment = async (id: string) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    if (!supabase) return;
    setDeleting(id);
    await supabase.from('comments').delete().eq('id', id);
    setComments(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  };

  // 사용자 차단
  const handleBan = (identifier: string) => {
    if (!identifier.trim()) return;
    if (!confirm(`${identifier}을(를) 차단하시겠습니까?`)) return;
    const updated = [...new Set([...bannedEmails, identifier.trim()])];
    setBannedEmails(updated);
    localStorage.setItem('nolcool_banned', JSON.stringify(updated));
    setBanInput('');
  };

  // 차단 해제
  const handleUnban = (email: string) => {
    if (!confirm(`${email} 차단을 해제하시겠습니까?`)) return;
    const updated = bannedEmails.filter(e => e !== email);
    setBannedEmails(updated);
    localStorage.setItem('nolcool_banned', JSON.stringify(updated));
  };

  // 특정 사용자의 모든 글 삭제
  const handleDeleteAllByUser = async (userId: string) => {
    if (!confirm('이 사용자의 모든 글/댓글/클립을 삭제하시겠습니까?\n(Storage 이미지도 함께 삭제됩니다)')) return;
    if (!supabase) return;
    setDeleting(userId);

    // 해당 유저의 클립 이미지 Storage 삭제
    const userClips = clips.filter(c => c.user_id === userId);
    for (const clip of userClips) {
      const imageUrl = getClipImage(clip);
      if (imageUrl) {
        const path = getStoragePath(imageUrl);
        if (path) await supabase.storage.from('post-media').remove([path]);
      }
    }

    await supabase.from('comments').delete().eq('user_id', userId);
    await supabase.from('posts').delete().eq('user_id', userId);
    setPosts(prev => prev.filter(p => p.user_id !== userId));
    setClips(prev => prev.filter(c => c.user_id !== userId));
    setComments(prev => prev.filter(c => c.user_id !== userId));
    setDeleting(null);
  };

  // 글 고정/해제
  const handleTogglePin = async (post: any) => {
    if (!supabase) return;
    const newVal = !post.is_pinned;
    await supabase.from('posts').update({ is_pinned: newVal }).eq('id', post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_pinned: newVal } : p));
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8B5CF6] border-t-transparent" />
      </div>
    );
  }

  // 관리자 비밀번호 입력 게이트
  if (!adminAuthed) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border p-8 text-center" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFF' }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#F3F4F6' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-lg font-bold mb-1" style={{ color: '#111' }}>관리자 인증</h1>
            <p className="text-sm mb-6" style={{ color: '#999' }}>관리자 비밀번호를 입력하세요</p>
            <form onSubmit={e => { e.preventDefault(); handlePinSubmit(); }}>
              <input
                type="password"
                value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError(''); }}
                placeholder="비밀번호"
                autoFocus
                className="w-full rounded-xl border px-4 py-3 text-center text-sm outline-none mb-3"
                style={{ borderColor: pinError ? '#EF4444' : '#E5E7EB', color: '#111', minHeight: 48 }}
              />
              {pinError && <p className="text-xs mb-3" style={{ color: '#EF4444' }}>{pinError}</p>}
              <button
                type="submit"
                disabled={!pinInput.trim()}
                className="w-full rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-40"
                style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}
              >
                확인
              </button>
            </form>
            <Link to="/" className="mt-4 inline-block text-xs" style={{ color: '#999' }}>홈으로 돌아가기</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-bold mb-4" style={{ color: '#111' }}>로그인이 필요합니다</p>
        <Link to="/login" className="inline-block rounded-xl px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}>로그인</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-bold mb-2" style={{ color: '#111' }}>접근 권한이 없습니다</p>
        <Link to="/" className="inline-block rounded-xl px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}>홈으로</Link>
      </div>
    );
  }

  const q = searchQuery.toLowerCase();
  const filteredPosts = posts.filter(p => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (!q) return true;
    return p.title?.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q) || p.user_id?.includes(q);
  });

  const filteredClips = clips.filter(c => {
    if (!q) return true;
    const caption = getClipCaption(c);
    return caption.toLowerCase().includes(q) || c.user_id?.includes(q);
  });

  const filteredComments = comments.filter(c => {
    if (!q) return true;
    return c.content?.toLowerCase().includes(q) || c.user_id?.includes(q);
  });

  // 신고 처리
  const handleResolveReport = async (reportId: string, action: 'resolved' | 'dismissed') => {
    const res = await resolveReport(reportId, action);
    if (!res.error) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: action } : r));
    }
  };

  // 필터 키워드 추가
  const handleAddFilterWord = async () => {
    if (!newFilterWord.trim() || !supabase) return;
    const { data, error } = await supabase.from('filter_words').insert({
      word: newFilterWord.trim(),
      type: 'profanity',
      severity: 'high',
      action: 'mask',
    }).select().single();
    if (!error && data) {
      setFilterWords(prev => [data, ...prev]);
      setNewFilterWord('');
    }
  };

  // 필터 키워드 삭제
  const handleDeleteFilterWord = async (id: string) => {
    if (!supabase) return;
    await supabase.from('filter_words').delete().eq('id', id);
    setFilterWords(prev => prev.filter(w => w.id !== id));
  };

  const pendingReports = reports.filter(r => r.status === 'pending');

  const tabs = [
    { key: 'posts', label: '글 관리', count: posts.length },
    { key: 'clips', label: '클립/이미지', count: clips.length },
    { key: 'comments', label: '댓글 관리', count: comments.length },
    { key: 'reports', label: '신고', count: pendingReports.length },
    { key: 'keywords', label: '차단키워드', count: filterWords.length },
    { key: 'ban', label: '차단 관리', count: bannedEmails.length },
    { key: 'stats', label: '현황' },
  ];

  const allCategories = [...new Set(posts.map(p => p.category).filter(Boolean))];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#111' }}>관리자 페이지</h1>
          <p className="text-xs" style={{ color: '#999' }}>{user.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="rounded-xl px-4 py-2 text-sm font-bold"
            style={{ backgroundColor: '#F3F4F6', color: '#555', minHeight: 40 }}
          >
            새로고침
          </button>
          <Link to="/" className="rounded-xl px-4 py-2 text-sm font-bold flex items-center" style={{ backgroundColor: '#8B5CF6', color: '#FFF', minHeight: 40 }}>
            홈
          </Link>
        </div>
      </div>

      {/* 검색 */}
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="글/댓글/사용자ID 검색..."
        className="w-full rounded-xl border px-4 py-3 text-sm mb-4 outline-none"
        style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }}
      />

      {/* 탭 */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="shrink-0 px-4 py-3 text-sm font-medium rounded-xl transition"
            style={{
              backgroundColor: activeTab === tab.key ? '#8B5CF6' : '#F3F4F6',
              color: activeTab === tab.key ? '#FFF' : '#555',
              minHeight: 44,
            }}
          >
            {tab.label} {tab.count !== undefined && `(${tab.count})`}
          </button>
        ))}
      </div>

      {loading && <p className="py-8 text-center" style={{ color: '#999' }}>불러오는 중...</p>}

      {/* ═══ 글 관리 ═══ */}
      {activeTab === 'posts' && !loading && (
        <div>
          {/* 카테고리 필터 */}
          <div className="flex gap-1 mb-4 overflow-x-auto">
            <button
              onClick={() => setCategoryFilter('all')}
              className="shrink-0 px-3 py-2 text-xs font-medium rounded-lg"
              style={{
                backgroundColor: categoryFilter === 'all' ? '#111' : '#F3F4F6',
                color: categoryFilter === 'all' ? '#FFF' : '#555',
                minHeight: 32,
              }}
            >
              전체
            </button>
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="shrink-0 px-3 py-2 text-xs font-medium rounded-lg"
                style={{
                  backgroundColor: categoryFilter === cat ? '#111' : '#F3F4F6',
                  color: categoryFilter === cat ? '#FFF' : '#555',
                  minHeight: 32,
                }}
              >
                {CATEGORY_LABELS[cat] || cat} ({posts.filter(p => p.category === cat).length})
              </button>
            ))}
          </div>

          <p className="text-xs mb-2" style={{ color: '#999' }}>
            {filteredPosts.length}개 표시 중
          </p>

          <div className="space-y-2">
            {filteredPosts.length === 0 && <p style={{ color: '#999' }}>글이 없습니다.</p>}
            {filteredPosts.map(post => (
              <div key={post.id} className="rounded-xl border p-4" style={{ borderColor: post.is_pinned ? '#8B5CF6' : '#E5E7EB', backgroundColor: post.is_pinned ? '#F5F3FF' : '#FFF' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {post.is_pinned && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#8B5CF6', color: '#FFF' }}>고정</span>}
                      <p className="text-sm font-bold truncate" style={{ color: '#111' }}>{post.title}</p>
                    </div>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: '#555' }}>{post.content?.slice(0, 120)}</p>
                    <p className="text-xs mt-1" style={{ color: '#999' }}>
                      {CATEGORY_LABELS[post.category] || post.category} · {post.created_at?.slice(0, 10)} · 좋아요 {post.likes || 0} · 조회 {post.views || 0}
                    </p>
                    <p className="text-xs" style={{ color: '#BBB' }}>ID: {post.user_id?.slice(0, 12)}...</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deleting === post.id}
                      className="rounded-lg px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                      style={{ backgroundColor: '#EF4444', minHeight: 28 }}
                    >
                      {deleting === post.id ? '...' : '삭제'}
                    </button>
                    <button
                      onClick={() => handleTogglePin(post)}
                      className="rounded-lg px-3 py-1 text-xs font-medium"
                      style={{ backgroundColor: post.is_pinned ? '#E5E7EB' : '#EDE9FE', color: post.is_pinned ? '#555' : '#7C3AED', minHeight: 28 }}
                    >
                      {post.is_pinned ? '고정해제' : '고정'}
                    </button>
                    <button
                      onClick={() => handleDeleteAllByUser(post.user_id)}
                      className="rounded-lg px-3 py-1 text-xs font-medium"
                      style={{ backgroundColor: '#FEE2E2', color: '#DC2626', minHeight: 28 }}
                    >
                      유저 전체삭제
                    </button>
                    <button
                      onClick={() => handleBan(post.user_id || '')}
                      className="rounded-lg px-3 py-1 text-xs font-medium"
                      style={{ backgroundColor: '#111', color: '#FFF', minHeight: 28 }}
                    >
                      차단
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ 클립/이미지 관리 ═══ */}
      {activeTab === 'clips' && !loading && (
        <div>
          <p className="text-xs mb-3" style={{ color: '#999' }}>
            갤러리 클립 {filteredClips.length}개 · 이미지를 삭제하면 Storage에서도 함께 삭제됩니다
          </p>

          {filteredClips.length === 0 && <p style={{ color: '#999' }}>클립이 없습니다.</p>}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredClips.map(clip => {
              const imageUrl = getClipImage(clip);
              const caption = getClipCaption(clip);
              return (
                <div key={clip.id} className="rounded-xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
                  {/* 이미지 미리보기 */}
                  {imageUrl ? (
                    <div className="relative" style={{ paddingTop: '100%' }}>
                      <img
                        src={imageUrl}
                        alt={caption}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).alt = '이미지 로드 실패'; }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center" style={{ paddingTop: '100%', position: 'relative' }}>
                      <span className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: '#999', backgroundColor: '#F3F4F6' }}>이미지 없음</span>
                    </div>
                  )}

                  {/* 정보 */}
                  <div className="p-3">
                    {caption && <p className="text-xs font-medium truncate mb-1" style={{ color: '#111' }}>{caption}</p>}
                    <p className="text-xs" style={{ color: '#999' }}>
                      {clip.created_at?.slice(0, 10)}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#BBB' }}>
                      {clip.user_id?.slice(0, 10)}...
                    </p>

                    {/* 버튼들 */}
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => handleDeleteClip(clip)}
                        disabled={deleting === clip.id}
                        className="flex-1 rounded-lg px-2 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                        style={{ backgroundColor: '#EF4444', minHeight: 28 }}
                      >
                        {deleting === clip.id ? '삭제중...' : '삭제'}
                      </button>
                      <button
                        onClick={() => handleBan(clip.user_id || '')}
                        className="rounded-lg px-2 py-1.5 text-xs font-medium"
                        style={{ backgroundColor: '#111', color: '#FFF', minHeight: 28 }}
                      >
                        차단
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ 댓글 관리 ═══ */}
      {activeTab === 'comments' && !loading && (
        <div>
          <p className="text-xs mb-2" style={{ color: '#999' }}>
            {filteredComments.length}개 표시 중
          </p>
          <div className="space-y-2">
            {filteredComments.length === 0 && <p style={{ color: '#999' }}>댓글이 없습니다.</p>}
            {filteredComments.map(comment => (
              <div key={comment.id} className="rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: '#111' }}>{comment.content}</p>
                    <p className="text-xs mt-1" style={{ color: '#999' }}>
                      {comment.created_at?.slice(0, 10)} · 좋아요 {comment.likes || 0}
                    </p>
                    <p className="text-xs" style={{ color: '#BBB' }}>
                      유저: {comment.user_id?.slice(0, 12)}... · 글: {comment.post_id?.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deleting === comment.id}
                      className="rounded-lg px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                      style={{ backgroundColor: '#EF4444', minHeight: 28 }}
                    >
                      {deleting === comment.id ? '...' : '삭제'}
                    </button>
                    <button
                      onClick={() => handleDeleteAllByUser(comment.user_id)}
                      className="rounded-lg px-3 py-1 text-xs font-medium"
                      style={{ backgroundColor: '#FEE2E2', color: '#DC2626', minHeight: 28 }}
                    >
                      유저 전체삭제
                    </button>
                    <button
                      onClick={() => handleBan(comment.user_id || '')}
                      className="rounded-lg px-3 py-1 text-xs font-medium"
                      style={{ backgroundColor: '#111', color: '#FFF', minHeight: 28 }}
                    >
                      차단
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ 신고 관리 ═══ */}
      {activeTab === 'reports' && !loading && (
        <div>
          <p className="text-xs mb-3" style={{ color: '#999' }}>
            대기 중 {pendingReports.length}건 / 전체 {reports.length}건
          </p>
          {reports.length === 0 && <p style={{ color: '#999' }}>신고가 없습니다.</p>}
          <div className="space-y-2">
            {reports.map(report => (
              <div key={report.id} className="rounded-xl border p-4" style={{ borderColor: report.status === 'pending' ? '#FCD34D' : '#E5E7EB', backgroundColor: report.status === 'pending' ? '#FFFBEB' : '#FFF' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{
                        backgroundColor: report.status === 'pending' ? '#FEF3C7' : report.status === 'resolved' ? '#D1FAE5' : '#F3F4F6',
                        color: report.status === 'pending' ? '#92400E' : report.status === 'resolved' ? '#065F46' : '#555',
                      }}>
                        {report.status === 'pending' ? '대기' : report.status === 'resolved' ? '처리' : '기각'}
                      </span>
                      <span className="text-xs font-bold" style={{ color: '#111' }}>{getReasonLabel(report.reason)}</span>
                    </div>
                    <p className="text-xs" style={{ color: '#555' }}>
                      {report.target_type === 'post' ? '글' : report.target_type === 'comment' ? '댓글' : '사용자'} 신고
                    </p>
                    {report.description && <p className="text-xs mt-1" style={{ color: '#888' }}>{report.description}</p>}
                    <p className="text-xs mt-1" style={{ color: '#BBB' }}>
                      {report.created_at?.slice(0, 16)} · 대상: {report.target_id?.slice(0, 12)}...
                    </p>
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => handleResolveReport(report.id, 'resolved')}
                        className="rounded-lg px-3 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: '#22C55E', minHeight: 28 }}
                      >
                        처리
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, 'dismissed')}
                        className="rounded-lg px-3 py-1 text-xs font-medium"
                        style={{ backgroundColor: '#F3F4F6', color: '#555', minHeight: 28 }}
                      >
                        기각
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ 차단 키워드 관리 ═══ */}
      {activeTab === 'keywords' && !loading && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#111' }}>차단 키워드 관리</h2>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newFilterWord}
              onChange={e => setNewFilterWord(e.target.value)}
              placeholder="새 차단 키워드 추가"
              className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none"
              style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }}
              onKeyDown={e => e.key === 'Enter' && handleAddFilterWord()}
            />
            <button
              onClick={handleAddFilterWord}
              disabled={!newFilterWord.trim()}
              className="rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}
            >
              추가
            </button>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#111' }}>등록된 키워드 ({filterWords.length}개)</p>
            {filterWords.length === 0 ? (
              <p className="text-xs" style={{ color: '#999' }}>등록된 키워드가 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filterWords.map(fw => (
                  <div key={fw.id} className="flex items-center gap-1 rounded-full px-3 py-1.5" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <span className="text-xs font-medium" style={{ color: '#DC2626' }}>{fw.word}</span>
                    <span className="text-[10px]" style={{ color: '#999' }}>({fw.type})</span>
                    <button
                      onClick={() => handleDeleteFilterWord(fw.id)}
                      className="ml-1 text-xs font-bold"
                      style={{ color: '#999' }}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ 사용자 차단 ═══ */}
      {activeTab === 'ban' && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#111' }}>사용자 차단 관리</h2>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={banInput}
              onChange={e => setBanInput(e.target.value)}
              placeholder="차단할 사용자 ID 또는 이메일"
              className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none"
              style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }}
            />
            <button
              onClick={() => handleBan(banInput)}
              disabled={!banInput.trim()}
              className="rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ backgroundColor: '#EF4444', minHeight: 48 }}
            >
              차단
            </button>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#111' }}>차단된 사용자 ({bannedEmails.length}명)</p>
            {bannedEmails.length === 0 ? (
              <p className="text-xs" style={{ color: '#999' }}>차단된 사용자가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {bannedEmails.map(email => (
                  <div key={email} className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: '#FEF2F2' }}>
                    <span className="text-sm truncate" style={{ color: '#111' }}>{email}</span>
                    <button onClick={() => handleUnban(email)} className="shrink-0 text-xs font-bold px-3 py-1 rounded-lg" style={{ color: '#22C55E', backgroundColor: '#F0FDF4', minHeight: 28 }}>해제</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: '#F9FAFB' }}>
            <p className="text-xs" style={{ color: '#555' }}>
              차단된 사용자는 글쓰기, 댓글 작성이 불가능합니다.<br />
              차단은 즉시 적용되며, 해제하면 다시 이용 가능합니다.
            </p>
          </div>
        </div>
      )}

      {/* ═══ 현황 ═══ */}
      {activeTab === 'stats' && !loading && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#111' }}>사이트 현황</h2>

          {/* 주요 지표 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: '전체 글', count: posts.length, color: '#8B5CF6' },
              { label: '갤러리 클립', count: clips.length, color: '#F59E0B' },
              { label: '전체 댓글', count: comments.length, color: '#3B82F6' },
              { label: '차단 사용자', count: bannedEmails.length, color: '#EF4444' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border p-4 text-center" style={{ borderColor: '#E5E7EB' }}>
                <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.count}</p>
                <p className="text-xs" style={{ color: '#888' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* 카테고리별 */}
          <div className="rounded-xl border p-4 mb-4" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#111' }}>카테고리별 글 수</p>
            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
              const count = cat === 'clip' ? clips.length : posts.filter(p => p.category === cat).length;
              if (count === 0) return null;
              return (
                <div key={cat} className="flex items-center justify-between py-1.5 text-sm">
                  <span style={{ color: '#555' }}>{label}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full" style={{ width: Math.max(20, count * 3), backgroundColor: '#8B5CF6', opacity: 0.3 }} />
                    <span className="font-bold text-xs" style={{ color: '#111', minWidth: 30, textAlign: 'right' }}>{count}개</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 최근 활동 유저 */}
          <div className="rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#111' }}>최근 활동 사용자 (글 기준)</p>
            {(() => {
              const userCounts: Record<string, number> = {};
              [...posts, ...clips].forEach(p => {
                if (p.user_id) userCounts[p.user_id] = (userCounts[p.user_id] || 0) + 1;
              });
              return Object.entries(userCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([uid, count]) => (
                  <div key={uid} className="flex items-center justify-between py-1 text-xs">
                    <span style={{ color: '#555' }}>{uid.slice(0, 16)}...</span>
                    <span className="font-bold" style={{ color: '#111' }}>{count}개</span>
                  </div>
                ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
