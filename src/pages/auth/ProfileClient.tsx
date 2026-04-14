import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@/lib/supabase';

type TabKey = 'posts' | 'comments' | 'favorites';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'posts', label: '내 글', icon: '✍️' },
  { key: 'comments', label: '내 댓글', icon: '💬' },
  { key: 'favorites', label: '찜한 업소', icon: '❤️' },
];

function getLevelBadge(xp: number) {
  if (xp >= 5000) return { name: '레전드', icon: '🔥', color: '#DC2626' };
  if (xp >= 2000) return { name: 'VIP', icon: '👑', color: '#D97706' };
  if (xp >= 500) return { name: '파티피플', icon: '🎉', color: '#7C3AED' };
  if (xp >= 100) return { name: '클러버', icon: '🎵', color: '#2563EB' };
  return { name: '뉴비', icon: '🌱', color: '#6B7280' };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return dateStr.slice(0, 10);
}

export default function ProfileClient() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('posts');
  const [editingNick, setEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState('');
  const [nickError, setNickError] = useState('');
  const [nickSaving, setNickSaving] = useState(false);

  // Tab data
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myComments, setMyComments] = useState<any[]>([]);
  const [myFavorites, setMyFavorites] = useState<any[]>([]);
  const [stats, setStats] = useState({ posts: 0, comments: 0, favorites: 0 });
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
  }, []);

  const fetchTabData = useCallback(async (tab: TabKey, userId: string) => {
    const supabase = createClient();
    if (!supabase) return;
    setTabLoading(true);

    try {
      if (tab === 'posts') {
        const { data, count } = await supabase
          .from('posts')
          .select('id, title, category, created_at, likes, views', { count: 'exact' })
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);
        setMyPosts(data || []);
        setStats(s => ({ ...s, posts: count || 0 }));
      } else if (tab === 'comments') {
        const { data, count } = await supabase
          .from('comments')
          .select('id, content, post_id, created_at, likes', { count: 'exact' })
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);
        setMyComments(data || []);
        setStats(s => ({ ...s, comments: count || 0 }));
      } else if (tab === 'favorites') {
        const { data, count } = await supabase
          .from('favorites')
          .select('venue_slug, created_at', { count: 'exact' })
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);
        setMyFavorites(data || []);
        setStats(s => ({ ...s, favorites: count || 0 }));
      }
    } catch {}
    setTabLoading(false);
  }, []);

  // Fetch initial stats counts
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    if (!supabase) return;
    const uid = user.id;

    Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', uid),
    ]).then(([posts, comments, favs]) => {
      setStats({
        posts: posts.count || 0,
        comments: comments.count || 0,
        favorites: favs.count || 0,
      });
    }).catch(() => {});

    fetchTabData('posts', uid);
  }, [user, fetchTabData]);

  useEffect(() => {
    if (!user) return;
    fetchTabData(activeTab, user.id);
  }, [activeTab, user, fetchTabData]);

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleNickSave = async () => {
    const trimmed = nickInput.trim();
    if (trimmed.length < 2 || trimmed.length > 12) {
      setNickError('닉네임은 2~12자로 입력해주세요');
      return;
    }
    setNickSaving(true);
    setNickError('');

    const supabase = createClient();
    if (!supabase) { setNickSaving(false); return; }

    // Check duplicate
    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', trimmed)
        .neq('id', user.id)
        .limit(1);
      if (existing && existing.length > 0) {
        setNickError('이미 사용 중인 닉네임입니다');
        setNickSaving(false);
        return;
      }
    } catch {}

    // Save to auth metadata
    const { error } = await supabase.auth.updateUser({ data: { nickname: trimmed } });
    if (error) {
      setNickError('저장 실패');
      setNickSaving(false);
      return;
    }

    // Sync to users table
    try {
      await supabase.from('users').upsert({ id: user.id, nickname: trimmed }, { onConflict: 'id' });
    } catch {}

    // Update local state
    setUser((prev: any) => ({
      ...prev,
      user_metadata: { ...prev.user_metadata, nickname: trimmed },
    }));
    setEditingNick(false);
    setNickSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8B5CF6] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-bold mb-4" style={{ color: '#111' }}>로그인이 필요합니다</p>
        <Link to="/login" className="inline-block rounded-xl px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}>
          로그인하기
        </Link>
      </div>
    );
  }

  const nickname = user.user_metadata?.nickname || user.user_metadata?.full_name || user.user_metadata?.name || '사용자';
  const avatar = user.user_metadata?.avatar_url || '';
  // XP = 글 20점 + 댓글 5점 + 찜 10점 (활동 기반 자동 계산)
  const xp = (stats.posts * 20) + (stats.comments * 5) + (stats.favorites * 10);
  const level = getLevelBadge(xp);
  const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '';

  return (
    <div className="mx-auto max-w-[600px] px-4 py-6">
      {/* ── Profile Header ── */}
      <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
        <div className="flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt="" loading="lazy" className="h-16 w-16 rounded-full" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#8B5CF6] text-2xl font-bold text-white">
              {nickname.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {editingNick ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nickInput}
                  onChange={(e) => setNickInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNickSave()}
                  maxLength={12}
                  className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 36 }}
                  autoFocus
                />
                <button onClick={handleNickSave} disabled={nickSaving} className="rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: '#8B5CF6', minHeight: 36 }}>
                  {nickSaving ? '...' : '저장'}
                </button>
                <button onClick={() => { setEditingNick(false); setNickError(''); }} className="rounded-lg px-3 py-1.5 text-xs" style={{ color: '#999', minHeight: 36 }}>
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold truncate" style={{ color: '#111' }}>{nickname}</h1>
                <button onClick={() => { setEditingNick(true); setNickInput(nickname); }} className="text-xs" style={{ color: '#999', minHeight: 32, padding: '4px 8px' }}>
                  수정
                </button>
              </div>
            )}
            {nickError && <p className="text-xs text-red-500 mt-1">{nickError}</p>}
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: `${level.color}15`, color: level.color }}>
                {level.icon} {level.name}
              </span>
              <span className="text-xs font-bold" style={{ color: level.color }}>{xp} XP</span>
              {joinDate && <span className="text-xs" style={{ color: '#BBB' }}>· 가입 {joinDate}</span>}
            </div>
            {/* XP 진행 바 */}
            {(() => {
              const thresholds = [0, 100, 500, 2000, 5000];
              const names = ['클러버', '파티피플', 'VIP', '레전드'];
              let nextIdx = thresholds.findIndex(t => t > xp);
              if (nextIdx === -1) return null;
              const prevT = thresholds[nextIdx - 1] || 0;
              const nextT = thresholds[nextIdx];
              const pct = Math.min(100, ((xp - prevT) / (nextT - prevT)) * 100);
              return (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] mb-0.5" style={{ color: '#999' }}>
                    <span>다음 등급: {names[nextIdx - 1]}</span>
                    <span>{xp}/{nextT} XP</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: level.color }} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <button onClick={() => setActiveTab('posts')} className="rounded-xl bg-white p-3 text-center shadow-sm transition active:scale-[0.98]" style={{ border: activeTab === 'posts' ? '2px solid #8B5CF6' : '1px solid #E5E7EB' }}>
          <p className="text-xl font-black" style={{ color: '#8B5CF6' }}>{stats.posts}</p>
          <p className="text-xs" style={{ color: '#888' }}>글</p>
        </button>
        <button onClick={() => setActiveTab('comments')} className="rounded-xl bg-white p-3 text-center shadow-sm transition active:scale-[0.98]" style={{ border: activeTab === 'comments' ? '2px solid #8B5CF6' : '1px solid #E5E7EB' }}>
          <p className="text-xl font-black" style={{ color: '#F97316' }}>{stats.comments}</p>
          <p className="text-xs" style={{ color: '#888' }}>댓글</p>
        </button>
        <button onClick={() => setActiveTab('favorites')} className="rounded-xl bg-white p-3 text-center shadow-sm transition active:scale-[0.98]" style={{ border: activeTab === 'favorites' ? '2px solid #8B5CF6' : '1px solid #E5E7EB' }}>
          <p className="text-xl font-black" style={{ color: '#EF4444' }}>{stats.favorites}</p>
          <p className="text-xs" style={{ color: '#888' }}>찜</p>
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="mb-4 flex rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-3 text-sm font-medium transition"
            style={{
              backgroundColor: activeTab === tab.key ? '#8B5CF6' : '#FFF',
              color: activeTab === tab.key ? '#FFF' : '#555',
              minHeight: 44,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="mb-6 rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        {tabLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8B5CF6] border-t-transparent" />
          </div>
        ) : activeTab === 'posts' ? (
          myPosts.length > 0 ? (
            <div>
              {myPosts.map((post, i) => (
                <Link
                  key={post.id}
                  to={`/community/post/${post.id}`}
                  className={`flex items-center justify-between px-4 py-3.5 transition hover:bg-gray-50 ${i !== myPosts.length - 1 ? 'border-b border-gray-100' : ''}`}
                  style={{ minHeight: 52 }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: '#111' }}>{post.title}</p>
                    <p className="mt-0.5 text-xs" style={{ color: '#999' }}>
                      {timeAgo(post.created_at)} · 좋아요 {post.likes} · 조회 {post.views}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: '#999' }}>아직 작성한 글이 없어요</p>
              <Link to="/community/free" className="mt-3 inline-block rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6', minHeight: 40 }}>
                글 쓰러 가기
              </Link>
            </div>
          )
        ) : activeTab === 'comments' ? (
          myComments.length > 0 ? (
            <div>
              {myComments.map((c, i) => (
                <Link
                  key={c.id}
                  to={`/community/post/${c.post_id}`}
                  className={`block px-4 py-3.5 transition hover:bg-gray-50 ${i !== myComments.length - 1 ? 'border-b border-gray-100' : ''}`}
                  style={{ minHeight: 48 }}
                >
                  <p className="text-sm line-clamp-2" style={{ color: '#111' }}>{c.content}</p>
                  <p className="mt-0.5 text-xs" style={{ color: '#999' }}>
                    {timeAgo(c.created_at)} · 좋아요 {c.likes}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: '#999' }}>아직 작성한 댓글이 없어요</p>
            </div>
          )
        ) : (
          myFavorites.length > 0 ? (
            <div>
              {myFavorites.map((fav, i) => (
                <Link
                  key={fav.venue_slug}
                  to={`/search?q=${fav.venue_slug}`}
                  className={`flex items-center justify-between px-4 py-3.5 transition hover:bg-gray-50 ${i !== myFavorites.length - 1 ? 'border-b border-gray-100' : ''}`}
                  style={{ minHeight: 48 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">❤️</span>
                    <span className="text-sm font-medium" style={{ color: '#111' }}>{fav.venue_slug}</span>
                  </div>
                  <span className="text-xs" style={{ color: '#999' }}>{timeAgo(fav.created_at)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: '#999' }}>아직 찜한 업소가 없어요</p>
              <Link to="/clubs" className="mt-3 inline-block rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6', minHeight: 40 }}>
                업소 둘러보기
              </Link>
            </div>
          )
        )}
      </div>

      {/* ── Quick Links ── */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <Link to="/community" className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm transition active:scale-[0.98]" style={{ border: '1px solid #E5E7EB', minHeight: 48 }}>
          <span>💬</span>
          <span className="text-sm font-medium" style={{ color: '#111' }}>커뮤니티</span>
        </Link>
        <Link to="/community/jogak" className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm transition active:scale-[0.98]" style={{ border: '1px solid #E5E7EB', minHeight: 48 }}>
          <span>🧩</span>
          <span className="text-sm font-medium" style={{ color: '#111' }}>조각 모집</span>
        </Link>
        <Link to="/gallery" className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm transition active:scale-[0.98]" style={{ border: '1px solid #E5E7EB', minHeight: 48 }}>
          <span>📸</span>
          <span className="text-sm font-medium" style={{ color: '#111' }}>클립</span>
        </Link>
        <Link to="/ranking" className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm transition active:scale-[0.98]" style={{ border: '1px solid #E5E7EB', minHeight: 48 }}>
          <span>🏆</span>
          <span className="text-sm font-medium" style={{ color: '#111' }}>랭킹</span>
        </Link>
      </div>

      {/* ── Logout ── */}
      <button
        onClick={handleLogout}
        className="mb-4 w-full rounded-xl bg-white py-3 text-sm font-medium transition active:scale-[0.98] shadow-sm"
        style={{ border: '1px solid #E5E7EB', color: '#555', minHeight: 48 }}
      >
        로그아웃
      </button>
    </div>
  );
}
