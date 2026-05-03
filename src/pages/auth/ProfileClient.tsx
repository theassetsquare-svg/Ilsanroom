import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@/lib/supabase';
import { COLOR, SHADOW, RADIUS, TYPO, TOUCH } from '@/lib/design-tokens';
import { TemperatureBar } from '@/components/community/TemperatureBadge';
import { fetchUserTempProfile, markAttendance, getTemperatureLevel } from '@/lib/temperature';

type TabKey = 'posts' | 'comments' | 'favorites' | 'titles' | 'missions';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'posts',     label: '내 글',   icon: '✍️' },
  { key: 'comments',  label: '댓글',    icon: '💬' },
  { key: 'favorites', label: '찜',      icon: '❤️' },
  { key: 'titles',    label: '칭호',    icon: '🏆' },
  { key: 'missions',  label: '시즌',    icon: '📅' },
];

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

type TempProfile = {
  profile: {
    user_id: string;
    nickname: string | null;
    temperature: number;
    streak_days: number;
    active_title_id: number | null;
    best_post_count: number;
  } | null;
  titles: Array<{
    id: number;
    unlocked_at: string;
    titles: { id: number; code: string; name: string; emoji: string; description: string; rarity: string };
  }>;
  missions: Array<{
    mission_id: number;
    current_count: number;
    is_completed: boolean;
    season_missions: {
      id: number; name: string; description: string; goal_count: number;
      reward_temperature: number; reward_title_code: string | null;
      season_year: number; season_month: number;
    };
  }>;
};

export default function ProfileClient() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('posts');
  const [editingNick, setEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState('');
  const [nickError, setNickError] = useState('');
  const [nickSaving, setNickSaving] = useState(false);

  // 온도/칭호/시즌 통합 데이터
  const [tempData, setTempData] = useState<TempProfile | null>(null);
  const [attendanceMsg, setAttendanceMsg] = useState<string | null>(null);

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

  // 출석체크 + 온도/칭호/시즌 로드 (마이페이지 진입 시 자동 1회)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const att = await markAttendance(user.id);
        if (!cancelled && att && !att.already_today) {
          setAttendanceMsg(`출석체크! +${att.bonus}° (스트릭 ${att.streak}일)`);
          setTimeout(() => setAttendanceMsg(null), 4000);
        }
      } catch {}
      const tp = await fetchUserTempProfile(user.id);
      if (!cancelled) setTempData(tp as unknown as TempProfile);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const fetchTabData = useCallback(async (tab: TabKey, userId: string) => {
    if (tab === 'titles' || tab === 'missions') return;
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
          .from('user_favorites')
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

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    if (!supabase) return;
    const uid = user.id;

    Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('user_favorites').select('id', { count: 'exact', head: true }).eq('user_id', uid),
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

    try {
      const { data: existing } = await supabase
        .from('users').select('id').eq('nickname', trimmed).neq('id', user.id).limit(1);
      if (existing && existing.length > 0) {
        setNickError('이미 사용 중인 닉네임입니다');
        setNickSaving(false);
        return;
      }
    } catch {}

    const { error } = await supabase.auth.updateUser({ data: { nickname: trimmed } });
    if (error) { setNickError('저장 실패'); setNickSaving(false); return; }

    try {
      await supabase.from('users').upsert({ id: user.id, nickname: trimmed }, { onConflict: 'id' });
      await supabase.from('user_profiles').upsert({ user_id: user.id, nickname: trimmed }, { onConflict: 'user_id' });
    } catch {}

    setUser((prev: any) => ({ ...prev, user_metadata: { ...prev.user_metadata, nickname: trimmed } }));
    setEditingNick(false);
    setNickSaving(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.bg.base }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${COLOR.neon.pink}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ backgroundColor: COLOR.bg.base, minHeight: '60vh', textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ ...TYPO.h2, color: COLOR.text.primary, marginBottom: 16 }}>로그인이 필요합니다</p>
        <Link to="/login" style={{
          display: 'inline-block', padding: '14px 28px', borderRadius: RADIUS.md,
          background: COLOR.gradient.hot, color: '#FFF', fontWeight: 800, fontSize: 15,
          textDecoration: 'none', minHeight: TOUCH.comfortable, boxShadow: SHADOW.glow.pink,
        }}>
          로그인하기
        </Link>
      </div>
    );
  }

  const nickname = user.user_metadata?.nickname || user.user_metadata?.full_name || user.user_metadata?.name || '사용자';
  const avatar = user.user_metadata?.avatar_url || '';
  const temperature = tempData?.profile?.temperature ?? 36.5;
  const streak = tempData?.profile?.streak_days ?? 0;
  const level = getTemperatureLevel(temperature);
  const titles = tempData?.titles ?? [];
  const missions = tempData?.missions ?? [];
  const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '';

  // 활성 칭호 (현재 대표 칭호)
  const activeTitle = titles.find(t => t.titles.id === tempData?.profile?.active_title_id)?.titles;

  return (
    <div style={{ backgroundColor: COLOR.bg.base, minHeight: '100vh' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* ── 출석 토스트 ── */}
        {attendanceMsg && (
          <div style={{
            marginBottom: 12, padding: '12px 16px', borderRadius: RADIUS.md,
            background: COLOR.gradient.hot, color: '#FFF', fontSize: 13, fontWeight: 700,
            textAlign: 'center', boxShadow: SHADOW.glow.pink, animation: 'slideDown 0.4s ease-out',
          }}>
            🎉 {attendanceMsg}
          </div>
        )}

        {/* ── Hero: 프로필 + 온도계 ── */}
        <div style={{
          marginBottom: 16, padding: 20, borderRadius: RADIUS.lg,
          background: `linear-gradient(180deg, ${COLOR.bg.elevate} 0%, ${COLOR.bg.raised} 100%)`,
          border: `1px solid ${COLOR.bg.border}`,
          boxShadow: SHADOW.card,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            {avatar ? (
              <img src={avatar} alt="" loading="lazy" style={{ width: 64, height: 64, borderRadius: '50%', border: `2px solid ${level.color}`, boxShadow: level.glow ? `0 0 12px ${level.color}` : undefined }} />
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: COLOR.gradient.hot, color: '#FFF', fontSize: 26, fontWeight: 900,
                boxShadow: SHADOW.glow.pink,
              }}>
                {nickname.charAt(0)}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingNick ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="text" value={nickInput} onChange={(e) => setNickInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNickSave()} maxLength={12}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: RADIUS.sm, fontSize: 14,
                      backgroundColor: COLOR.bg.base, color: COLOR.text.primary,
                      border: `1px solid ${COLOR.neon.pink}`, outline: 'none',
                    }}
                    autoFocus
                  />
                  <button onClick={handleNickSave} disabled={nickSaving} style={{
                    padding: '8px 12px', borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 800,
                    background: COLOR.gradient.hot, color: '#FFF', border: 'none', cursor: 'pointer',
                    minHeight: 36,
                  }}>
                    {nickSaving ? '...' : '저장'}
                  </button>
                  <button onClick={() => { setEditingNick(false); setNickError(''); }} style={{
                    padding: '8px 12px', fontSize: 12, color: COLOR.text.tertiary,
                    background: 'transparent', border: 'none', cursor: 'pointer', minHeight: 36,
                  }}>
                    취소
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h1 style={{ ...TYPO.h1, color: COLOR.text.primary, margin: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {nickname}
                  </h1>
                  {activeTitle && (
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: RADIUS.pill,
                      backgroundColor: `${COLOR.neon.gold}20`, color: COLOR.neon.gold,
                      border: `1px solid ${COLOR.neon.gold}40`,
                    }}>
                      {activeTitle.emoji} {activeTitle.name}
                    </span>
                  )}
                  <button onClick={() => { setEditingNick(true); setNickInput(nickname); }} style={{
                    fontSize: 11, color: COLOR.text.tertiary, background: 'transparent',
                    border: 'none', cursor: 'pointer', padding: '4px 6px', minHeight: 28,
                  }}>
                    수정
                  </button>
                </div>
              )}
              {nickError && <p style={{ fontSize: 11, color: COLOR.neon.red, marginTop: 4 }}>{nickError}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 11, color: COLOR.text.tertiary }}>
                {streak > 0 && (
                  <span style={{ color: streak >= 7 ? COLOR.neon.gold : COLOR.text.secondary, fontWeight: 700 }}>
                    🔥 {streak}일 연속
                  </span>
                )}
                {joinDate && <span>· 가입 {joinDate}</span>}
              </div>
            </div>
          </div>

          {/* 온도계 (사이트 핵심 시각화) */}
          <TemperatureBar temperature={temperature} />
        </div>

        {/* ── Stats ── */}
        <div style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { key: 'posts' as TabKey, label: '글', value: stats.posts, color: COLOR.neon.pink },
            { key: 'comments' as TabKey, label: '댓글', value: stats.comments, color: COLOR.neon.cyan },
            { key: 'favorites' as TabKey, label: '찜', value: stats.favorites, color: COLOR.neon.gold },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setActiveTab(s.key)}
              style={{
                padding: '14px 8px', borderRadius: RADIUS.md, textAlign: 'center', cursor: 'pointer',
                backgroundColor: COLOR.bg.elevate,
                border: `1.5px solid ${activeTab === s.key ? s.color : COLOR.bg.border}`,
                boxShadow: activeTab === s.key ? `0 0 16px ${s.color}40` : 'none',
                transition: 'all 0.2s',
              }}
            >
              <p style={{ ...TYPO.h1, color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ ...TYPO.meta, color: COLOR.text.tertiary, margin: '2px 0 0' }}>{s.label}</p>
            </button>
          ))}
        </div>

        {/* ── Tabs (스크롤 가능) ── */}
        <div style={{
          marginBottom: 12, display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          paddingBottom: 4, scrollbarWidth: 'none',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flexShrink: 0, padding: '10px 16px', borderRadius: RADIUS.pill,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: TOUCH.min,
                backgroundColor: activeTab === tab.key ? COLOR.neon.pink : COLOR.bg.elevate,
                color: activeTab === tab.key ? '#FFF' : COLOR.text.secondary,
                border: `1px solid ${activeTab === tab.key ? COLOR.neon.pink : COLOR.bg.border}`,
                boxShadow: activeTab === tab.key ? SHADOW.glow.pink : 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div style={{
          marginBottom: 20, borderRadius: RADIUS.lg, overflow: 'hidden',
          backgroundColor: COLOR.bg.elevate, border: `1px solid ${COLOR.bg.border}`,
        }}>
          {tabLoading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ display: 'inline-block', width: 24, height: 24, border: `2px solid ${COLOR.neon.pink}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : activeTab === 'titles' ? (
            <TitlesTab titles={titles} activeTitleId={tempData?.profile?.active_title_id} userId={user.id} onUpdate={(tid) => {
              setTempData(prev => prev ? { ...prev, profile: prev.profile ? { ...prev.profile, active_title_id: tid } : null } : prev);
            }} />
          ) : activeTab === 'missions' ? (
            <MissionsTab missions={missions} />
          ) : activeTab === 'posts' ? (
            myPosts.length > 0 ? (
              <div>
                {myPosts.map((post, i) => (
                  <Link key={post.id} to={`/community/post/${post.id}`} style={{
                    display: 'flex', alignItems: 'center', padding: '14px 16px',
                    borderBottom: i !== myPosts.length - 1 ? `1px solid ${COLOR.bg.border}` : 'none',
                    minHeight: TOUCH.comfortable, textDecoration: 'none',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ ...TYPO.h3, color: COLOR.text.primary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {post.title}
                      </p>
                      <p style={{ ...TYPO.meta, color: COLOR.text.tertiary, margin: '4px 0 0' }}>
                        {timeAgo(post.created_at)} · ❤ {post.likes} · 👁 {post.views}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState text="아직 작성한 글이 없어요" ctaText="글 쓰러 가기" ctaTo="/community/free" />
            )
          ) : activeTab === 'comments' ? (
            myComments.length > 0 ? (
              <div>
                {myComments.map((c, i) => (
                  <Link key={c.id} to={`/community/post/${c.post_id}`} style={{
                    display: 'block', padding: '14px 16px',
                    borderBottom: i !== myComments.length - 1 ? `1px solid ${COLOR.bg.border}` : 'none',
                    minHeight: TOUCH.min, textDecoration: 'none',
                  }}>
                    <p style={{ ...TYPO.small, color: COLOR.text.primary, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                      {c.content}
                    </p>
                    <p style={{ ...TYPO.meta, color: COLOR.text.tertiary, margin: '4px 0 0' }}>
                      {timeAgo(c.created_at)} · ❤ {c.likes}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState text="아직 작성한 댓글이 없어요" />
            )
          ) : (
            myFavorites.length > 0 ? (
              <div>
                {myFavorites.map((fav, i) => (
                  <Link key={fav.venue_slug} to={`/search?q=${fav.venue_slug}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px',
                    borderBottom: i !== myFavorites.length - 1 ? `1px solid ${COLOR.bg.border}` : 'none',
                    minHeight: TOUCH.min, textDecoration: 'none',
                  }}>
                    <span style={{ ...TYPO.body, color: COLOR.text.primary, fontWeight: 600 }}>
                      ❤️ {fav.venue_slug}
                    </span>
                    <span style={{ ...TYPO.meta, color: COLOR.text.tertiary }}>{timeAgo(fav.created_at)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState text="아직 찜한 업소가 없어요" ctaText="업소 둘러보기" ctaTo="/clubs" />
            )
          )}
        </div>

        {/* ── Quick Links ── */}
        <div style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[
            { to: '/community',       icon: '💬', label: '커뮤니티' },
            { to: '/community/jogak', icon: '🧩', label: '조각 모집' },
            { to: '/gallery',         icon: '📸', label: '클립' },
            { to: '/ranking',         icon: '🏆', label: '랭킹' },
          ].map(q => (
            <Link key={q.to} to={q.to} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px',
              borderRadius: RADIUS.md, backgroundColor: COLOR.bg.elevate,
              border: `1px solid ${COLOR.bg.border}`, textDecoration: 'none',
              minHeight: TOUCH.comfortable,
            }}>
              <span style={{ fontSize: 18 }}>{q.icon}</span>
              <span style={{ ...TYPO.small, color: COLOR.text.primary, fontWeight: 600 }}>{q.label}</span>
            </Link>
          ))}
        </div>

        <button onClick={handleLogout} style={{
          width: '100%', padding: '14px', borderRadius: RADIUS.md, fontSize: 13, fontWeight: 600,
          backgroundColor: COLOR.bg.elevate, color: COLOR.text.secondary,
          border: `1px solid ${COLOR.bg.border}`, cursor: 'pointer', minHeight: TOUCH.comfortable,
        }}>
          로그아웃
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown { from { transform: translateY(-12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}

// ── 칭호 갤러리 탭 ──
function TitlesTab({ titles, activeTitleId, userId, onUpdate }: {
  titles: TempProfile['titles']; activeTitleId: number | null | undefined;
  userId: string; onUpdate: (id: number | null) => void;
}) {
  const setActive = async (titleId: number | null) => {
    const supabase = createClient();
    if (!supabase) return;
    onUpdate(titleId);
    await supabase.from('user_profiles').update({ active_title_id: titleId }).eq('user_id', userId);
  };

  if (titles.length === 0) {
    return <EmptyState text="아직 획득한 칭호가 없어요" ctaText="활동하러 가기" ctaTo="/community" />;
  }

  return (
    <div style={{ padding: 16 }}>
      <p style={{ ...TYPO.meta, color: COLOR.text.tertiary, marginBottom: 12 }}>
        대표 칭호 선택 · 글/댓글 옆에 표시됩니다
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
        <button onClick={() => setActive(null)} style={{
          padding: 12, borderRadius: RADIUS.md, cursor: 'pointer',
          backgroundColor: activeTitleId == null ? `${COLOR.neon.pink}20` : COLOR.bg.raised,
          border: `1.5px solid ${activeTitleId == null ? COLOR.neon.pink : COLOR.bg.border}`,
          textAlign: 'center', minHeight: 80,
        }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>🚫</div>
          <p style={{ ...TYPO.meta, color: COLOR.text.secondary, margin: 0, fontWeight: 700 }}>표시 안함</p>
        </button>
        {titles.map(t => {
          const isActive = t.titles.id === activeTitleId;
          const rare = t.titles.rarity;
          const rareColor = rare === 'legend' ? COLOR.neon.gold : rare === 'epic' ? COLOR.neon.purple : rare === 'rare' ? COLOR.neon.cyan : COLOR.text.secondary;
          return (
            <button key={t.id} onClick={() => setActive(t.titles.id)} style={{
              padding: 12, borderRadius: RADIUS.md, cursor: 'pointer',
              backgroundColor: isActive ? `${rareColor}20` : COLOR.bg.raised,
              border: `1.5px solid ${isActive ? rareColor : COLOR.bg.border}`,
              boxShadow: isActive ? `0 0 16px ${rareColor}50` : 'none',
              textAlign: 'center', minHeight: 80, transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{t.titles.emoji}</div>
              <p style={{ ...TYPO.meta, color: rareColor, margin: 0, fontWeight: 800 }}>{t.titles.name}</p>
              <p style={{ fontSize: 9, color: COLOR.text.tertiary, margin: '2px 0 0' }}>{t.titles.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── 시즌 미션 탭 ──
function MissionsTab({ missions }: { missions: TempProfile['missions'] }) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const active = missions.filter(m =>
    m.season_missions?.season_year === currentYear &&
    m.season_missions?.season_month === currentMonth
  );

  if (active.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ ...TYPO.body, color: COLOR.text.secondary, margin: 0 }}>이번 달 미션 데이터가 없어요</p>
        <p style={{ ...TYPO.meta, color: COLOR.text.tertiary, marginTop: 6 }}>활동을 시작하면 자동으로 진행도가 쌓입니다</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ ...TYPO.h3, color: COLOR.neon.gold }}>📅 {currentYear}년 {currentMonth}월 시즌</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {active.map(m => {
          const goal = m.season_missions.goal_count;
          const cur = Math.min(m.current_count, goal);
          const pct = (cur / goal) * 100;
          const done = m.is_completed;
          return (
            <div key={m.mission_id} style={{
              padding: 14, borderRadius: RADIUS.md,
              backgroundColor: COLOR.bg.raised,
              border: `1px solid ${done ? COLOR.neon.gold : COLOR.bg.border}`,
              boxShadow: done ? SHADOW.glow.gold : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ ...TYPO.h3, color: done ? COLOR.neon.gold : COLOR.text.primary, margin: 0 }}>
                  {done ? '✅ ' : ''}{m.season_missions.name}
                </p>
                <span style={{ ...TYPO.meta, color: COLOR.text.tertiary, fontWeight: 700 }}>
                  {cur} / {goal}
                </span>
              </div>
              <p style={{ ...TYPO.meta, color: COLOR.text.tertiary, margin: '0 0 8px' }}>
                {m.season_missions.description}
              </p>
              <div style={{ height: 8, borderRadius: 4, backgroundColor: COLOR.bg.base, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: done ? COLOR.gradient.legend : COLOR.gradient.hot,
                  transition: 'width 0.6s ease-out',
                  boxShadow: done ? `0 0 8px ${COLOR.neon.gold}` : undefined,
                }} />
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8, fontSize: 10 }}>
                <span style={{ color: COLOR.neon.pink, fontWeight: 700 }}>+{m.season_missions.reward_temperature}°</span>
                {m.season_missions.reward_title_code && (
                  <span style={{ color: COLOR.neon.gold, fontWeight: 700 }}>🏆 칭호 보상</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 빈 상태 ──
function EmptyState({ text, ctaText, ctaTo }: { text: string; ctaText?: string; ctaTo?: string }) {
  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <p style={{ ...TYPO.body, color: COLOR.text.secondary, margin: 0 }}>{text}</p>
      {ctaText && ctaTo && (
        <Link to={ctaTo} style={{
          display: 'inline-block', marginTop: 14, padding: '10px 18px', borderRadius: RADIUS.md,
          background: COLOR.gradient.hot, color: '#FFF', fontWeight: 800, fontSize: 13,
          textDecoration: 'none', minHeight: 40, boxShadow: SHADOW.glow.pink,
        }}>
          {ctaText}
        </Link>
      )}
    </div>
  );
}
