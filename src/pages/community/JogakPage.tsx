import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import WriteHeader from '@/components/community/WriteHeader';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { fetchPosts, createPost, fetchComments, createComment, deletePost, type Post } from '@/lib/community-api';
import { getSeedNickname } from '@/lib/fake-users';
import { PostListSkeleton } from '@/components/ui/Skeleton';

/* ══════════════════════════════════════════════
   카테고리 & 지역 설정
   ══════════════════════════════════════════════ */

const CATEGORIES = [
  { id: 'all', label: '전체', icon: '🔥', color: '#8B5CF6' },
  { id: 'female', label: '여성조각', icon: '👩', color: '#EC4899' },
  { id: 'male', label: '남성조각', icon: '👨', color: '#3B82F6' },
  { id: 'partner', label: '제휴조각', icon: '🏷️', color: '#F59E0B' },
  { id: 'club_lounge', label: '클럽&라운지', icon: '🎵', color: '#10B981' },
  { id: 'bungae', label: '벙개', icon: '⚡', color: '#EF4444' },
] as const;

const JOGAK_TYPES = ['테이블', '헌팅', '혼합', '룸', '부스'];
const GENDER_OPTIONS = ['누구나', '남성만', '여성만', '남녀 혼성'];
const COST_OPTIONS = ['모든비용 엔빵', '주대만 엔빵', '각자 부담', '방장 초대'];
const CONTACT_OPTIONS = ['놀쿨 쪽지', '놀쿨 댓글', '전화'];
const PHOTO_OPTIONS = ['사진교환 필수', '사진교환 선택', '사진교환 안 함'];

/* ══════════════════════════════════════════════
   조각모임 규칙
   ══════════════════════════════════════════════ */
const JOGAK_RULES = [
  { icon: '📝', title: '양식 필수', desc: '장소·날짜·시간·인원·비용 미기재 시 무통보 삭제.' },
  { icon: '🏷️', title: '말머리 필수', desc: '지역과 조각 성향(테이블/헌팅) 반드시 선택.' },
  { icon: '🪑', title: '테이블 미예약 = 헌팅조각', desc: '테이블을 잡지 않은 클럽/라운지 조각은 헌팅조각으로 분류.' },
  { icon: '👤', title: '제휴 = 광고주 전용', desc: '제휴조각은 놀쿨 광고주만 등록 가능합니다. 담당 MD/웨이터 이름 필수.' },
  { icon: '🚫', title: '오픈카톡 금지', desc: '사기 방지. 놀쿨 쪽지/댓글만 허용.' },
  { icon: '💰', title: '수고비 안내', desc: '홍대: 평균 1만 / 최대 2만. 그 외: 평균 3만 / 최대 5만. 엔빵 8만원 이하 = 수고비 없음.' },
  { icon: '🔞', title: '만 19세 이상', desc: '미성년자는 참여할 수 없습니다.' },
  { icon: '⚠️', title: '노쇼 = 활동 정지', desc: '약속 불이행 시 경고 없이 활동 정지.' },
];

/* ══════════════════════════════════════════════
   파싱 & 유틸
   ══════════════════════════════════════════════ */

interface JogakPost {
  id: string;
  authorId: string | null;
  title: string;
  author: string;
  date: string;
  comments: number;
  region?: string;
  jogakType?: string;
  venue?: string;
  meetDate?: string;
  meetTime?: string;
  maxPeople?: number;
  currentPeople?: number;
  genderPref?: string;
  ageRange?: string;
  costSplit?: string;
  tableCost?: string;
  perPerson?: string;
  mdName?: string;
  contactMethod?: string;
  photoExchange?: string;
  message?: string;
  jogakCategory?: string; // female, male, partner, club_lounge, room_booth, bungae
  venueType?: string;
  isPartner?: boolean;
}

function parseJogakPost(post: Post): JogakPost {
  const u = post.users as any;
  let p: any = {};
  try { p = JSON.parse(post.content); } catch { p = { message: post.content }; }

  return {
    id: post.id,
    authorId: post.user_id,
    title: post.title,
    author: u?.nickname || getSeedNickname(post.id),
    date: post.created_at.slice(0, 10),
    comments: (post as any).comment_count || 0,
    region: p.region,
    jogakType: p.jogakType,
    venue: p.venue,
    meetDate: p.meetDate,
    meetTime: p.meetTime,
    maxPeople: p.maxPeople,
    currentPeople: p.currentPeople || 1,
    genderPref: p.genderPref,
    ageRange: p.ageRange,
    costSplit: p.costSplit,
    tableCost: p.tableCost,
    perPerson: p.perPerson,
    mdName: p.mdName,
    contactMethod: p.contactMethod,
    photoExchange: p.photoExchange,
    message: p.message || p.desc,
    jogakCategory: p.jogakCategory || 'all',
    venueType: p.venueType,
    isPartner: !!p.mdName,
  };
}

/* getRegionGroup removed — 지역은 조각글 카드 안에서만 표시 */

function getTimeUntil(meetDate?: string, meetTime?: string): string | null {
  if (!meetDate) return null;
  const now = new Date();
  const target = new Date(`${meetDate}T${meetTime || '22:00'}:00`);
  const diff = target.getTime() - now.getTime();
  if (diff < 0) return '마감';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}일 후`;
  if (hours > 0) return `${hours}시간 ${mins}분 후`;
  return `${mins}분 후`;
}

function SectionHeader({ title }: { title: string }) {
  return <div className="flex items-center gap-2 mb-2 mt-5 first:mt-0"><div className="h-px flex-1 bg-gray-200" /><span className="text-xs font-bold px-2" style={{ color: '#8B5CF6' }}>{title}</span><div className="h-px flex-1 bg-gray-200" /></div>;
}

/* ══════════════════════════════════════════════
   실시간 카운터 (접속자 수 시뮬레이션)
   ══════════════════════════════════════════════ */
function LiveCounter() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    setCount(Math.floor(Math.random() * 30) + 15);
    intervalRef.current = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: '#10B981' }}>
      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      {count}명 접속 중
    </span>
  );
}

/* ══════════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════════ */

export default function JogakPage() {
  useDocumentMeta(
    '조각모임 — 같이 갈 사람 바로 구하기',
    '클럽·나이트·라운지·룸·부스 같이 갈 사람을 모집하세요. 여성조각, 남성조각, 제휴조각, 벙개까지 실시간 모집.'
  );

  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOwner = (user as any)?.user_metadata?.role === 'owner' || (user as any)?.app_metadata?.role === 'owner';

  // 필터 상태
  const [activeCategory, setActiveCategory] = useState(searchParams.get('cat') || 'all');
  const [sortBy, setSortBy] = useState<'latest' | 'soon'>('latest');

  // 데이터
  const [posts, setPosts] = useState<JogakPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);

  // 글 상세
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null);
  const [replyText, setReplyText] = useState('');

  // 글쓰기
  const [showWrite, setShowWrite] = useState(false);

  // 홈에서 ?write=true로 오면 글쓰기 자동 오픈
  useEffect(() => {
    if (searchParams.get('write') === 'true') {
      if (!user) { window.location.href = '/login'; return; }
      setShowWrite(true);
    }
  }, [searchParams, user]);
  const [submitting, setSubmitting] = useState(false);

  // 폼 필드
  const [f, setF] = useState({
    title: '', region: '', jogakType: '테이블', venue: '', date: '', time: '',
    maxPeople: '4', gender: '누구나', ageRange: '', cost: '모든비용 엔빵',
    tableCost: '', perPerson: '', mdName: '', contact: '놀쿨 댓글',
    photo: '사진교환 선택', message: '', jogakCategory: 'female' as string,
    venueType: '',
  });
  const setField = (key: string, value: string) => setF(prev => ({ ...prev, [key]: value }));

  // DB 로드
  useEffect(() => {
    (async () => {
      const { data } = await fetchPosts('party', 100);
      setPosts(data.map(parseJogakPost));
      setLoading(false);
    })();
  }, []);

  // 카테고리 변경 시 URL 업데이트
  const handleCategoryChange = useCallback((cat: string) => {
    setActiveCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'all') newParams.delete('cat'); else newParams.set('cat', cat);
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadComments = async (postId: string) => {
    const data = await fetchComments(postId);
    setComments(data);
  };

  const handlePostClick = (postId: string) => {
    if (selectedPost === postId) { setSelectedPost(null); return; }
    setSelectedPost(postId);
    setCommentText(''); setReplyTo(null); setReplyText('');
    setComments([]);
    loadComments(postId);
  };

  const handleWriteClick = () => {
    if (!user) { window.location.href = '/login'; return; }
    // 제휴조각은 광고주(owner)만 가능
    if (activeCategory === 'partner' && !isOwner) {
      return;
    }
    setShowWrite(true);
    // 현재 선택된 카테고리를 폼에 반영
    if (activeCategory !== 'all') {
      setField('jogakCategory', activeCategory);
    }
  };

  const handleSubmit = async () => {
    if (!f.title.trim() || !f.region || !f.date || !f.time || !f.maxPeople || !f.cost) return;
    setSubmitting(true);

    const contentJson = JSON.stringify({
      region: f.region, jogakType: f.jogakType, venue: f.venue.trim(),
      meetDate: f.date, meetTime: f.time, maxPeople: Number(f.maxPeople) || 4,
      currentPeople: 1, genderPref: f.gender, ageRange: f.ageRange.trim(),
      costSplit: f.cost, tableCost: f.tableCost.trim(), perPerson: f.perPerson.trim(),
      mdName: f.mdName.trim(), contactMethod: f.contact, photoExchange: f.photo,
      message: f.message.trim(), jogakCategory: f.jogakCategory, venueType: f.venueType,
    });

    const result = await createPost({ category: 'party', title: f.title.trim(), content: contentJson });
    if (!result.error) {
      setShowWrite(false);
      setF({ title: '', region: '', jogakType: '테이블', venue: '', date: '', time: '', maxPeople: '4', gender: '누구나', ageRange: '', cost: '모든비용 엔빵', tableCost: '', perPerson: '', mdName: '', contact: '놀쿨 댓글', photo: '사진교환 선택', message: '', jogakCategory: 'female', venueType: '' });
      const { data } = await fetchPosts('party', 100);
      setPosts(data.map(parseJogakPost));
    }
    setSubmitting(false);
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !user || !selectedPost) return;
    const { error } = await createComment(selectedPost, commentText.trim());
    if (!error) { setCommentText(''); await loadComments(selectedPost); }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !user || !selectedPost || !replyTo) return;
    const { error } = await createComment(selectedPost, replyText.trim(), replyTo.id);
    if (!error) { setReplyText(''); setReplyTo(null); await loadComments(selectedPost); }
  };

  // 필터링
  let filtered = posts;
  if (activeCategory !== 'all') {
    filtered = filtered.filter(p => {
      if (activeCategory === 'partner') return p.isPartner || p.jogakCategory === 'partner';
      if (activeCategory === 'female') return p.jogakCategory === 'female' || p.genderPref === '여성만';
      if (activeCategory === 'male') return p.jogakCategory === 'male' || p.genderPref === '남성만';
      if (activeCategory === 'bungae') return p.jogakCategory === 'bungae';
      if (activeCategory === 'club_lounge') return p.jogakCategory === 'club_lounge';
      return true;
    });
  }
  if (sortBy === 'soon') {
    filtered = [...filtered].sort((a, b) => {
      const tA = a.meetDate ? new Date(`${a.meetDate}T${a.meetTime || '22:00'}`).getTime() : Infinity;
      const tB = b.meetDate ? new Date(`${b.meetDate}T${b.meetTime || '22:00'}`).getTime() : Infinity;
      return tA - tB;
    });
  }

  // 현재 카테고리별 모집 글 카운트
  const categoryCounts: Record<string, number> = {};
  CATEGORIES.forEach(cat => {
    if (cat.id === 'all') { categoryCounts.all = posts.length; return; }
    categoryCounts[cat.id] = posts.filter(p => {
      if (cat.id === 'partner') return p.isPartner || p.jogakCategory === 'partner';
      if (cat.id === 'female') return p.jogakCategory === 'female' || p.genderPref === '여성만';
      if (cat.id === 'male') return p.jogakCategory === 'male' || p.genderPref === '남성만';
      if (cat.id === 'bungae') return p.jogakCategory === 'bungae';
      return p.jogakCategory === cat.id;
    }).length;
  });

  // 마감 임박 조각 (24시간 이내)
  const urgentPosts = filtered.filter(p => {
    const tu = getTimeUntil(p.meetDate, p.meetTime);
    return tu && tu !== '마감' && !tu.includes('일');
  }).slice(0, 5);

  // 방금 참여 알림용 (최근 글)
  const recentJoinTexts = [
    '방금 1명이 참여 신청했어요',
    '2분 전 새 조각이 올라왔어요',
    '지금 3명이 조각을 찾고 있어요',
    '5분 전 참여 확정됐어요',
  ];
  const [joinNotifIdx, setJoinNotifIdx] = useState(0);
  const joinTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    joinTimerRef.current = setInterval(() => {
      setJoinNotifIdx(prev => (prev + 1) % recentJoinTexts.length);
    }, 5000);
    return () => { if (joinTimerRef.current) clearInterval(joinTimerRef.current); };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      {/* ═══ 헤더 ═══ */}
      <div className="mb-5">
        <Link to="/community" className="mb-1 inline-block text-xs" style={{ color: '#999' }}>← 커뮤니티</Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ color: '#111' }}>조각 모임</h1>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-sm font-bold" style={{ color: '#8B5CF6' }}>
                "오늘 밤 같이 갈 사람, 지금 바로 구해"
              </p>
              <LiveCounter />
            </div>
          </div>
          {activeCategory === 'partner' && !isOwner ? (
            <div className="rounded-xl px-4 py-2.5 text-sm font-bold text-white opacity-50 cursor-not-allowed"
              style={{ backgroundColor: '#F59E0B', minHeight: 44 }}
              title="놀쿨 광고주만 제휴조각을 등록할 수 있습니다">
              광고주 전용
            </div>
          ) : (
            <button onClick={handleWriteClick} className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition active:scale-[0.97]"
              style={{ backgroundColor: '#8B5CF6', minHeight: 44 }}>
              + 조각 올리기
            </button>
          )}
        </div>
      </div>

      {/* ═══ 카테고리 탭 ═══ */}
      <div className="overflow-x-auto scrollbar-hide mb-3 -mx-4 px-4">
        <div className="flex gap-1.5">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all"
                style={{
                  backgroundColor: isActive ? cat.color : '#F3F4F6',
                  color: isActive ? '#FFF' : '#555',
                  minHeight: 36,
                  boxShadow: isActive ? `0 2px 8px ${cat.color}40` : 'none',
                }}
              >
                <span>{cat.icon}</span>
                {cat.label}
                {count > 0 && <span className="rounded-full px-1.5 py-0.5 text-[10px]"
                  style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#E5E7EB' }}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ 제휴조각 안내 배너 ═══ */}
      {activeCategory === 'partner' && (
        <div className="mb-3 rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏷️</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#92400E' }}>제휴조각은 놀쿨 광고주 전용입니다</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#78350F' }}>
                놀쿨 광고주는 자사 업소에서 조각모임을 직접 모집할 수 있습니다.
                MD/웨이터가 직접 운영하여 안전하고 믿을 수 있는 조각입니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 벙개 안내 배너 ═══ */}
      {activeCategory === 'bungae' && (
        <div className="mb-3 rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #FEE2E2, #FECACA)' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#991B1B' }}>벙개 = 즉석 모임</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#7F1D1D' }}>
                지금 당장 갈 사람 구하는 긴급 모집. 보통 1~3시간 내 출발.
                망설이면 자리 없어요!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 지역 필터 제거 — 조각글 카드 안에 지역 태그로 표시 */}

      {/* ═══ 실시간 참여 알림 ═══ */}
      <div className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#F0FDF4' }}>
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium" style={{ color: '#059669' }}>{recentJoinTexts[joinNotifIdx]}</span>
      </div>

      {/* ═══ 마감 임박 조각 ═══ */}
      {!loading && urgentPosts.length > 0 && (
        <div className="mb-4 rounded-xl border-2 p-4" style={{ borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.04)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm animate-pulse">🚨</span>
            <h2 className="text-sm font-black" style={{ color: '#DC2626' }}>마감 임박! 서두르세요</h2>
          </div>
          <div className="space-y-2">
            {urgentPosts.map((p) => {
              const tu = getTimeUntil(p.meetDate, p.meetTime);
              return (
                <div key={p.id} onClick={() => handlePostClick(p.id)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition hover:bg-white"
                  style={{ minHeight: 44 }}>
                  <span className="shrink-0 rounded px-2 py-0.5 text-[10px] font-black animate-pulse"
                    style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                    {tu}
                  </span>
                  {p.region && <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: '#8B5CF6' }}>{p.region}</span>}
                  <span className="text-sm font-bold truncate flex-1" style={{ color: '#111' }}>{p.title}</span>
                  {p.maxPeople && (
                    <span className="shrink-0 text-xs font-bold" style={{ color: '#D97706' }}>
                      {p.currentPeople || 1}/{p.maxPeople}명
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ 정렬 & 규칙 ═══ */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <button onClick={() => setSortBy('latest')}
            className="text-xs font-medium transition"
            style={{ color: sortBy === 'latest' ? '#8B5CF6' : '#999' }}>
            최신순
          </button>
          <span className="text-xs text-gray-300">|</span>
          <button onClick={() => setSortBy('soon')}
            className="text-xs font-medium transition"
            style={{ color: sortBy === 'soon' ? '#8B5CF6' : '#999' }}>
            임박순
          </button>
        </div>
        <button onClick={() => setShowRules(!showRules)}
          className="text-xs font-medium transition"
          style={{ color: '#F59E0B' }}>
          ⚠️ 규칙 {showRules ? '접기' : '보기'}
        </button>
      </div>

      {/* ═══ 규칙 (접이식) ═══ */}
      {showRules && (
        <div className="mb-4 rounded-xl border overflow-hidden" style={{ borderColor: '#FCD34D' }}>
          <div className="px-4 py-3 space-y-3" style={{ backgroundColor: '#FFFBEB' }}>
            {JOGAK_RULES.map((rule, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-sm shrink-0">{rule.icon}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#111' }}>{rule.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#555' }}>{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ 글 목록 ═══ */}
      {loading ? (
        <PostListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center" style={{ borderColor: '#D1D5DB' }}>
          <p className="text-4xl mb-3">
            {activeCategory === 'bungae' ? '⚡' : activeCategory === 'partner' ? '🏷️' : '🧩'}
          </p>
          <p className="text-base font-bold mb-1" style={{ color: '#111' }}>
            {activeCategory === 'partner' ? '아직 제휴조각이 없습니다' : '아직 모집글이 없습니다'}
          </p>
          <p className="text-sm mb-4" style={{ color: '#999' }}>
            {activeCategory === 'partner' && !isOwner
              ? '광고주가 조각을 올리면 여기에 표시됩니다'
              : '첫 번째 조각을 올려보세요!'}
          </p>
          {(activeCategory !== 'partner' || isOwner) && (
            <button onClick={handleWriteClick} className="rounded-xl px-6 py-3 text-sm font-bold text-white transition active:scale-[0.97]"
              style={{ backgroundColor: '#8B5CF6', minHeight: 44 }}>조각 올리기</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const timeUntil = getTimeUntil(post.meetDate, post.meetTime);
            const isUrgent = timeUntil && !timeUntil.includes('일') && timeUntil !== '마감';
            const isClosed = timeUntil === '마감';
            const fillRate = post.maxPeople ? ((post.currentPeople || 1) / post.maxPeople) * 100 : 0;
            const isAlmostFull = fillRate >= 75;

            return (
              <div key={post.id} className={`rounded-xl border overflow-hidden bg-white transition ${isClosed ? 'opacity-60' : ''}`}
                style={{ borderColor: isUrgent ? '#EF4444' : isAlmostFull ? '#F59E0B' : '#E5E7EB' }}>

                {/* 긴급/마감 배지 */}
                {(isUrgent || isClosed || isAlmostFull) && (
                  <div className="flex items-center gap-2 px-4 pt-2">
                    {isUrgent && <span className="rounded px-2 py-0.5 text-[10px] font-bold animate-pulse"
                      style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                      {timeUntil} 출발
                    </span>}
                    {isClosed && <span className="rounded px-2 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>마감</span>}
                    {isAlmostFull && !isClosed && <span className="rounded px-2 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>마감임박</span>}
                  </div>
                )}

                {/* 카드 헤더 — 말머리 */}
                <div className="flex items-center gap-2 px-4 pt-2.5 pb-1 flex-wrap">
                  {post.region && <span className="rounded px-2 py-0.5 text-[11px] font-bold"
                    style={{ backgroundColor: '#8B5CF6', color: '#FFF' }}>{post.region}</span>}
                  {post.jogakType && <span className="rounded px-2 py-0.5 text-[11px] font-bold"
                    style={{ backgroundColor: post.jogakType === '헌팅' ? '#F59E0B' : '#10B981', color: '#FFF' }}>{post.jogakType}</span>}
                  {post.isPartner && <span className="rounded px-2 py-0.5 text-[11px] font-bold"
                    style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>제휴</span>}
                  {post.meetDate && <span className="text-[11px]" style={{ color: '#999' }}>{post.meetDate} {post.meetTime}</span>}
                </div>

                {/* 카드 본문 */}
                <div onClick={() => handlePostClick(post.id)} className="cursor-pointer px-4 py-2 transition hover:bg-gray-50">
                  <h3 className="text-sm font-bold mb-2" style={{ color: '#111' }}>{post.title}</h3>

                  {/* 핵심 정보 그리드 */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                    {post.venue && <div className="flex items-center gap-1"><span className="text-xs" style={{ color: '#999' }}>장소</span><span className="text-xs font-bold" style={{ color: '#111' }}>{post.venue}</span></div>}
                    {post.maxPeople && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs" style={{ color: '#999' }}>인원</span>
                        <span className="text-xs font-bold" style={{ color: isAlmostFull ? '#D97706' : '#111' }}>
                          {post.currentPeople || 1}/{post.maxPeople}명
                        </span>
                        {/* 인원 바 */}
                        <div className="h-1.5 w-12 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{
                            width: `${fillRate}%`,
                            backgroundColor: isAlmostFull ? '#F59E0B' : '#8B5CF6'
                          }} />
                        </div>
                      </div>
                    )}
                    {post.costSplit && <div className="flex items-center gap-1"><span className="text-xs" style={{ color: '#999' }}>비용</span><span className="text-xs font-bold" style={{ color: '#111' }}>{post.costSplit}</span></div>}
                    {post.genderPref && <div className="flex items-center gap-1"><span className="text-xs" style={{ color: '#999' }}>성별</span><span className="text-xs font-bold" style={{ color: '#111' }}>{post.genderPref}</span></div>}
                    {post.ageRange && <div className="flex items-center gap-1"><span className="text-xs" style={{ color: '#999' }}>연령</span><span className="text-xs font-bold" style={{ color: '#111' }}>{post.ageRange}</span></div>}
                    {post.mdName && <div className="flex items-center gap-1"><span className="text-xs" style={{ color: '#999' }}>담당</span><span className="text-xs font-bold" style={{ color: '#F59E0B' }}>{post.mdName}</span></div>}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs" style={{ color: '#9CA3AF' }}>
                      <span>{post.author}</span>
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.comments > 0 && <span className="text-xs font-bold" style={{ color: '#8B5CF6' }}>댓글 {post.comments}</span>}
                    </div>
                  </div>
                </div>

                {/* ═══ 상세 + 댓글 ═══ */}
                {selectedPost === post.id && (
                  <div className="px-4 pb-4 pt-2" style={{ backgroundColor: '#FAFAFA', borderTop: '1px solid #E5E7EB' }}>
                    {/* 상세 정보 카드 */}
                    <div className="rounded-lg border p-3 mb-3 bg-white" style={{ borderColor: '#E5E7EB' }}>
                      <div className="space-y-1.5 text-sm">
                        {post.venue && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>조각장소</span><span style={{ color: '#111' }}>{post.region} {post.venue}</span></div>}
                        {post.meetDate && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>날짜/시간</span><span style={{ color: '#111' }}>{post.meetDate} {post.meetTime}</span></div>}
                        {post.ageRange && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>모집연령</span><span style={{ color: '#111' }}>{post.ageRange}</span></div>}
                        {post.photoExchange && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>사진교환</span><span style={{ color: '#111' }}>{post.photoExchange}</span></div>}
                        {post.tableCost && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>주대내역</span><span style={{ color: '#111' }}>{post.tableCost}</span></div>}
                        {post.maxPeople && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>인원</span><span style={{ color: '#111' }}>{post.currentPeople || 1}/{post.maxPeople}명</span></div>}
                        {post.perPerson && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>1인당</span><span style={{ color: '#111' }}>{post.perPerson}</span></div>}
                        {post.costSplit && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>비용분담</span><span style={{ color: '#111' }}>{post.costSplit}</span></div>}
                        {post.mdName && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>담당MD</span><span style={{ color: '#F59E0B' }}>{post.mdName}</span></div>}
                        {post.contactMethod && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>연락방법</span><span style={{ color: '#111' }}>{post.contactMethod}</span></div>}
                      </div>
                    </div>

                    {/* 한마디 */}
                    {post.message && (
                      <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: '#F3F0FF' }}>
                        <p className="text-xs font-bold mb-1" style={{ color: '#8B5CF6' }}>조각에게 한마디</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#333', whiteSpace: 'pre-wrap' }}>{post.message}</p>
                      </div>
                    )}

                    {/* 참여 + 쪽지 버튼 */}
                    {!isClosed && user && (
                      <div className="flex gap-2 mb-3">
                        <button className="flex-1 rounded-lg py-2.5 text-sm font-bold text-white transition active:scale-[0.98]"
                          style={{ backgroundColor: '#8B5CF6' }}
                          onClick={() => { setCommentText('참여 신청합니다!'); }}>
                          참여 신청하기
                        </button>
                        {post.authorId && post.authorId !== user.id && (
                          <Link
                            to={`/messages?to=${post.authorId}&name=${encodeURIComponent(post.author)}`}
                            className="flex items-center justify-center rounded-lg py-2.5 px-4 text-sm font-bold border-2 transition active:scale-[0.98]"
                            style={{ borderColor: '#8B5CF6', color: '#8B5CF6' }}
                          >
                            쪽지
                          </Link>
                        )}
                      </div>
                    )}

                    {/* 삭제 */}
                    {user && (
                      <button onClick={async () => {
                        const result = await deletePost(post.id);
                        if (!result.error) { setSelectedPost(null); setPosts(prev => prev.filter(p => p.id !== post.id)); }
                      }} className="text-xs mb-3" style={{ color: '#EF4444', minHeight: 32 }}>글 삭제</button>
                    )}

                    {/* 댓글 */}
                    <div className="border-t pt-3 mb-3" style={{ borderColor: '#E5E7EB' }}>
                      <p className="text-xs font-bold mb-2" style={{ color: '#555' }}>댓글 {comments.length}개</p>
                      {comments.length > 0 ? (
                        <div className="space-y-2">
                          {comments.filter(c => !c.parent_id).map((c: any) => {
                            const nickname = c.users?.nickname || '익명';
                            const children = comments.filter((ch: any) => ch.parent_id === c.id);
                            return (
                              <div key={c.id}>
                                <div className="rounded-lg px-3 py-2" style={{ backgroundColor: '#F3F4F6' }}>
                                  <p className="text-sm" style={{ color: '#111' }}>{c.content}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{nickname} · {c.created_at?.slice(5, 10)}</span>
                                    {user && (
                                      <button onClick={() => { setReplyTo(replyTo?.id === c.id ? null : { id: c.id, nickname }); setReplyText(''); }}
                                        className="text-xs font-medium" style={{ color: '#8B5CF6' }}>
                                        {replyTo?.id === c.id ? '취소' : '답글'}
                                      </button>
                                    )}
                                  </div>
                                  {replyTo?.id === c.id && (
                                    <div className="flex gap-2 mt-2">
                                      <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleReplySubmit(); }}
                                        placeholder={`${nickname}에게 답글...`}
                                        className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
                                        style={{ borderColor: '#D1D5DB', color: '#111', minHeight: 40 }} autoFocus />
                                      <button onClick={handleReplySubmit} disabled={!replyText.trim()}
                                        className="rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-40"
                                        style={{ backgroundColor: '#8B5CF6', minHeight: 40 }}>등록</button>
                                    </div>
                                  )}
                                </div>
                                {children.map((ch: any) => (
                                  <div key={ch.id} className="rounded-lg px-3 py-2 ml-6 mt-1" style={{ backgroundColor: '#F9FAFB', borderLeft: '3px solid #8B5CF6' }}>
                                    <p className="text-sm" style={{ color: '#111' }}><span className="text-xs font-medium mr-1" style={{ color: '#8B5CF6' }}>↳</span>{ch.content}</p>
                                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{ch.users?.nickname || '익명'} · {ch.created_at?.slice(5, 10)}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>참여 의사를 댓글로 남겨보세요!</p>
                      )}
                    </div>

                    {/* 댓글 입력 */}
                    <div className="flex gap-2">
                      <input type="text" placeholder={user ? '참여 의사나 질문을 남겨보세요' : '로그인 후 댓글 작성'}
                        value={commentText} onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(); }}
                        className="flex-1 rounded-lg border px-3 py-2 text-sm"
                        style={{ borderColor: '#D1D5DB', color: '#111', minHeight: 44 }} disabled={!user} />
                      <button onClick={handleCommentSubmit} disabled={!user || !commentText.trim()}
                        className="rounded-lg px-4 py-2 text-sm font-bold text-white"
                        style={{ backgroundColor: user ? '#8B5CF6' : '#9CA3AF', minHeight: 44 }}>등록</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ 글쓰기 모달 ═══ */}
      {showWrite && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white">
          <WriteHeader onCancel={() => setShowWrite(false)} title="조각 모집 글쓰기" />

          <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 max-w-2xl mx-auto w-full">

            {/* ── 조각 유형 ── */}
            <SectionHeader title="조각 유형" />
            <div className="flex flex-wrap gap-2 mb-3">
              {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                if (cat.id === 'partner' && !isOwner) return null;
                return (
                  <button key={cat.id} type="button" onClick={() => setField('jogakCategory', cat.id)}
                    className="flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold transition"
                    style={{
                      backgroundColor: f.jogakCategory === cat.id ? cat.color : '#F3F4F6',
                      color: f.jogakCategory === cat.id ? '#FFF' : '#555',
                      minHeight: 36,
                    }}>
                    <span>{cat.icon}</span> {cat.label}
                  </button>
                );
              })}
            </div>

            {/* ── 기본 정보 — 모두 직접 입력 ── */}
            <SectionHeader title="기본 정보" />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>제목 <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={f.title} onChange={(e) => setField('title', e.target.value)}
              placeholder="예: 토요일 강남 클럽 같이 가실 분"
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none"
              style={{ borderColor: f.title ? '#8B5CF6' : '#E5E7EB', color: '#111', minHeight: 48 }} />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>지역 <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={f.region} onChange={(e) => setField('region', e.target.value)}
              placeholder="예: 강남, 홍대, 일산, 부산..."
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none"
              style={{ borderColor: f.region ? '#8B5CF6' : '#E5E7EB', color: '#111', minHeight: 48 }} />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>조각 성향 <span style={{ color: '#EF4444' }}>*</span></label>
            <select value={f.jogakType} onChange={(e) => setField('jogakType', e.target.value)}
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none appearance-none bg-white"
              style={{ borderColor: f.jogakType ? '#8B5CF6' : '#E5E7EB', color: '#111', minHeight: 48 }}>
              {JOGAK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>업소명 <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={f.venue} onChange={(e) => setField('venue', e.target.value)}
              placeholder="예: 레이스, 아르쥬, 찬스돔..."
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none"
              style={{ borderColor: f.venue ? '#8B5CF6' : '#E5E7EB', color: '#111', minHeight: 48 }} />

            {/* ── 날짜 & 시간 — 직접 입력 ── */}
            <SectionHeader title="날짜 & 시간" />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>날짜 <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={f.date} onChange={(e) => setField('date', e.target.value)}
              placeholder="예: 4/19(토), 오늘, 내일, 2026-04-20..."
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none"
              style={{ borderColor: f.date ? '#8B5CF6' : '#E5E7EB', color: '#111', minHeight: 48 }} />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>시간 <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={f.time} onChange={(e) => setField('time', e.target.value)}
              placeholder="예: 밤 10시, 22:00, 자정, 지금 바로..."
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none"
              style={{ borderColor: f.time ? '#8B5CF6' : '#E5E7EB', color: '#111', minHeight: 48 }} />

            {/* ── 모집 조건 — 직접 입력 ── */}
            <SectionHeader title="모집 조건" />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>모집 인원 (본인 포함) <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={f.maxPeople} onChange={(e) => setField('maxPeople', e.target.value)}
              placeholder="예: 4"
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none"
              style={{ borderColor: f.maxPeople ? '#8B5CF6' : '#E5E7EB', color: '#111', minHeight: 48 }} />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>성별 조건 <span style={{ color: '#EF4444' }}>*</span></label>
            <select value={f.gender} onChange={(e) => setField('gender', e.target.value)}
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none appearance-none bg-white"
              style={{ borderColor: f.gender ? '#8B5CF6' : '#E5E7EB', color: '#111', minHeight: 48 }}>
              {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>모집 연령대</label>
            <input value={f.ageRange} onChange={(e) => setField('ageRange', e.target.value)}
              placeholder="예: 20대후반~30대초반"
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none"
              style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>사진 교환</label>
            <select value={f.photo} onChange={(e) => setField('photo', e.target.value)}
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none appearance-none bg-white"
              style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }}>
              {PHOTO_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* ── 비용 정보 — 직접 입력 ── */}
            <SectionHeader title="비용 정보" />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>비용 분담 방식 <span style={{ color: '#EF4444' }}>*</span></label>
            <select value={f.cost} onChange={(e) => setField('cost', e.target.value)}
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none appearance-none bg-white"
              style={{ borderColor: f.cost ? '#8B5CF6' : '#E5E7EB', color: '#111', minHeight: 48 }}>
              {COST_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>주대 내역</label>
                <input value={f.tableCost} onChange={(e) => setField('tableCost', e.target.value)}
                  placeholder="예: 테이블비 50만원"
                  className="w-full rounded-lg border px-3 py-3 text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>1인당 예상</label>
                <input value={f.perPerson} onChange={(e) => setField('perPerson', e.target.value)}
                  placeholder="예: 약 8만원"
                  className="w-full rounded-lg border px-3 py-3 text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              </div>
            </div>

            {/* ── 담당 & 연락 — 직접 입력 ── */}
            <SectionHeader title="담당 & 연락" />

            {f.jogakCategory === 'partner' && (
              <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: '#FEF3C7' }}>
                <p className="text-xs font-bold" style={{ color: '#92400E' }}>제휴조각: 담당 MD/웨이터 정보 필수</p>
              </div>
            )}

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>
              담당 MD / 웨이터
              {f.jogakCategory === 'partner' && <span style={{ color: '#EF4444' }}> *</span>}
              {f.jogakCategory !== 'partner' && <span className="text-[10px] font-normal" style={{ color: '#999' }}> (제휴업장 필수)</span>}
            </label>
            <input value={f.mdName} onChange={(e) => setField('mdName', e.target.value)}
              placeholder="예: 장미 실장"
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none"
              style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>연락 방법 <span style={{ color: '#EF4444' }}>*</span></label>
            <select value={f.contact} onChange={(e) => setField('contact', e.target.value)}
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none appearance-none bg-white"
              style={{ borderColor: f.contact ? '#8B5CF6' : '#E5E7EB', color: '#111', minHeight: 48 }}>
              {CONTACT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* ── 한마디 ── */}
            <SectionHeader title="한마디" />

            <textarea value={f.message} onChange={(e) => setField('message', e.target.value)}
              placeholder="조각에게 하고 싶은 말을 자유롭게 적어주세요"
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none resize-none"
              style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 100, lineHeight: '1.7' }} />
          </div>

          {/* 하단 버튼 */}
          <div className="fixed bottom-0 left-0 right-0 px-4 py-4 border-t bg-white" style={{ borderColor: '#E5E7EB' }}>
            <button onClick={handleSubmit}
              disabled={submitting || !f.title.trim() || !f.region || !f.date || !f.time || !f.venue.trim()
                || (f.jogakCategory === 'partner' && !f.mdName.trim())}
              className="w-full rounded-xl py-4 text-base font-bold transition active:scale-[0.98] disabled:opacity-30"
              style={{ backgroundColor: '#8B5CF6', color: '#FFF', minHeight: 56 }}>
              {submitting ? '등록 중...' : '조각 모집글 올리기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
