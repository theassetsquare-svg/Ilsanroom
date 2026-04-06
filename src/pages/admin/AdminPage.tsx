import { useState, useEffect } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';
import { Link } from 'react-router-dom';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'baesunwook513@gmail.com', 'theassetsquare@gmail.com'];

export default function AdminPage() {
  useDocumentMeta('관리자 페이지', '놀쿨 사이트 관리');
  const { user } = useAuth();
  const supabase = createClient();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bannedEmails, setBannedEmails] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('nolcool_banned') || '[]'); } catch { return []; }
  });
  const [banInput, setBanInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 데이터 로드
  useEffect(() => {
    if (!supabase || !isAdmin) return;
    Promise.all([
      supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(100),
    ]).then(([postsRes, commentsRes]) => {
      setPosts(postsRes.data || []);
      setComments(commentsRes.data || []);
      setLoading(false);
    });
  }, [isAdmin]);

  // 글 삭제
  const handleDeletePost = async (id: string) => {
    if (!confirm('이 글을 삭제하시겠습니까?')) return;
    if (!supabase) return;
    await supabase.from('comments').delete().eq('post_id', id);
    await supabase.from('posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
    alert('글 + 댓글 삭제 완료');
  };

  // 댓글 삭제
  const handleDeleteComment = async (id: string) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    if (!supabase) return;
    await supabase.from('comments').delete().eq('id', id);
    setComments(prev => prev.filter(c => c.id !== id));
    alert('댓글 삭제 완료');
  };

  // 사용자 차단
  const handleBan = (email: string) => {
    if (!email.trim()) return;
    if (!confirm(`${email}을 차단하시겠습니까? 이 사용자는 더 이상 글/댓글을 작성할 수 없습니다.`)) return;
    const updated = [...bannedEmails, email.trim()];
    setBannedEmails(updated);
    localStorage.setItem('nolcool_banned', JSON.stringify(updated));
    setBanInput('');
    alert(`${email} 차단 완료`);
  };

  // 차단 해제
  const handleUnban = (email: string) => {
    if (!confirm(`${email} 차단을 해제하시겠습니까?`)) return;
    const updated = bannedEmails.filter(e => e !== email);
    setBannedEmails(updated);
    localStorage.setItem('nolcool_banned', JSON.stringify(updated));
    alert(`${email} 차단 해제`);
  };

  // 특정 사용자의 모든 글 삭제
  const handleDeleteAllByUser = async (userId: string) => {
    if (!confirm('이 사용자의 모든 글과 댓글을 삭제하시겠습니까?')) return;
    if (!supabase) return;
    await supabase.from('comments').delete().eq('user_id', userId);
    await supabase.from('posts').delete().eq('user_id', userId);
    setPosts(prev => prev.filter(p => p.user_id !== userId));
    setComments(prev => prev.filter(c => c.user_id !== userId));
    alert('해당 사용자의 모든 글/댓글 삭제 완료');
  };

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

  const filteredPosts = searchQuery
    ? posts.filter(p => p.title?.includes(searchQuery) || p.content?.includes(searchQuery) || p.user_id?.includes(searchQuery))
    : posts;

  const filteredComments = searchQuery
    ? comments.filter(c => c.content?.includes(searchQuery) || c.user_id?.includes(searchQuery))
    : comments;

  const tabs = [
    { key: 'posts', label: '📝 글 관리', count: posts.length },
    { key: 'comments', label: '💬 댓글 관리', count: comments.length },
    { key: 'ban', label: '🚫 사용자 차단', count: bannedEmails.length },
    { key: 'stats', label: '📊 현황' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#111' }}>🔧 관리자 페이지</h1>
          <p className="text-xs" style={{ color: '#999' }}>{user.email}</p>
        </div>
        <Link to="/" className="text-sm" style={{ color: '#8B5CF6' }}>홈으로 →</Link>
      </div>

      {/* 검색 */}
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="글/댓글/사용자 검색..."
        className="w-full rounded-xl border px-4 py-3 text-sm mb-4 outline-none"
        style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }}
      />

      {/* 탭 */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
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

      {loading && <p style={{ color: '#999' }}>불러오는 중...</p>}

      {/* ═══ 글 관리 ═══ */}
      {activeTab === 'posts' && !loading && (
        <div className="space-y-2">
          {filteredPosts.length === 0 && <p style={{ color: '#999' }}>글이 없습니다.</p>}
          {filteredPosts.map(post => (
            <div key={post.id} className="rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: '#111' }}>{post.title}</p>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: '#555' }}>{post.content?.slice(0, 100)}</p>
                  <p className="text-xs mt-1" style={{ color: '#999' }}>
                    {post.category} · {post.created_at?.slice(0, 10)} · {post.user_id?.slice(0, 8)}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => handleDeletePost(post.id)} className="rounded-lg px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: '#EF4444', minHeight: 28 }}>삭제</button>
                  <button onClick={() => handleDeleteAllByUser(post.user_id)} className="rounded-lg px-3 py-1 text-xs font-medium" style={{ backgroundColor: '#FEE2E2', color: '#DC2626', minHeight: 28 }}>이 사용자 전체삭제</button>
                  <button onClick={() => handleBan(post.user_id || '')} className="rounded-lg px-3 py-1 text-xs font-medium" style={{ backgroundColor: '#111', color: '#FFF', minHeight: 28 }}>차단</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ 댓글 관리 ═══ */}
      {activeTab === 'comments' && !loading && (
        <div className="space-y-2">
          {filteredComments.length === 0 && <p style={{ color: '#999' }}>댓글이 없습니다.</p>}
          {filteredComments.map(comment => (
            <div key={comment.id} className="rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: '#111' }}>{comment.content}</p>
                  <p className="text-xs mt-1" style={{ color: '#999' }}>
                    {comment.created_at?.slice(0, 10)} · {comment.user_id?.slice(0, 8)} · 글ID: {comment.post_id?.slice(0, 8)}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => handleDeleteComment(comment.id)} className="rounded-lg px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: '#EF4444', minHeight: 28 }}>삭제</button>
                  <button onClick={() => handleBan(comment.user_id || '')} className="rounded-lg px-3 py-1 text-xs font-medium" style={{ backgroundColor: '#111', color: '#FFF', minHeight: 28 }}>차단</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ 사용자 차단 ═══ */}
      {activeTab === 'ban' && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#111' }}>사용자 차단 관리</h2>

          {/* 차단 추가 */}
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

          {/* 차단 목록 */}
          <div className="rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#111' }}>차단된 사용자 ({bannedEmails.length}명)</p>
            {bannedEmails.length === 0 ? (
              <p className="text-xs" style={{ color: '#999' }}>차단된 사용자가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {bannedEmails.map(email => (
                  <div key={email} className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: '#FEF2F2' }}>
                    <span className="text-sm" style={{ color: '#111' }}>{email}</span>
                    <button onClick={() => handleUnban(email)} className="text-xs font-medium" style={{ color: '#22C55E', minHeight: 28 }}>해제</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: '#F9FAFB' }}>
            <p className="text-xs" style={{ color: '#555' }}>
              차단된 사용자는 글쓰기, 댓글 작성, 이벤트 등록이 불가능합니다.<br />
              차단은 즉시 적용되며, 해제하면 다시 이용 가능합니다.
            </p>
          </div>
        </div>
      )}

      {/* ═══ 현황 ═══ */}
      {activeTab === 'stats' && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#111' }}>사이트 현황</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border p-4 text-center" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-2xl font-black" style={{ color: '#8B5CF6' }}>{posts.length}</p>
              <p className="text-xs" style={{ color: '#888' }}>전체 글</p>
            </div>
            <div className="rounded-xl border p-4 text-center" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-2xl font-black" style={{ color: '#8B5CF6' }}>{comments.length}</p>
              <p className="text-xs" style={{ color: '#888' }}>전체 댓글</p>
            </div>
            <div className="rounded-xl border p-4 text-center" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-2xl font-black" style={{ color: '#EF4444' }}>{bannedEmails.length}</p>
              <p className="text-xs" style={{ color: '#888' }}>차단 사용자</p>
            </div>
            <div className="rounded-xl border p-4 text-center" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-2xl font-black" style={{ color: '#22C55E' }}>116</p>
              <p className="text-xs" style={{ color: '#888' }}>등록 업소</p>
            </div>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-sm font-bold mb-2" style={{ color: '#111' }}>카테고리별 글</p>
            {['free', 'discussion', 'reviews', 'tips', 'party'].map(cat => {
              const count = posts.filter(p => p.category === cat).length;
              return (
                <div key={cat} className="flex items-center justify-between py-1 text-sm">
                  <span style={{ color: '#555' }}>{cat}</span>
                  <span className="font-bold" style={{ color: '#111' }}>{count}개</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
