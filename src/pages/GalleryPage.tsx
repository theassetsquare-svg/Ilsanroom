
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';
import { getSeedNickname } from '@/lib/fake-users';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { ReadFinishCount } from '@/components/engagement/ReadingEngagement';

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
  venue_category: string;
}

const VENUE_TABS = ['전체', '나이트', '클럽', '라운지', '호빠'] as const;

interface ClipComment {
  id: string;
  user_id: string;
  content: string;
  author: string;
  created_at: string;
}

/* ── 시드 클립 (DB 비어있을 때 표시 — 실제 존재하는 이미지 사용) ── */
const SEED_CLIPS: Clip[] = [
  { id: 's1', user_id: '', image_url: '/venues/gangnamclub-peak-1.jpg', caption: '금요일 피크 분위기 미쳤다 ㅋㅋ 역시 강남은 다르네', likes: 47, liked: false, created_at: new Date(Date.now() - 3600000 * 2).toISOString(), author: '강남유흥러', avatar_url: null, comments: [{ id: 'sc1', user_id: '', content: '여기 요즘 웨이팅 있던데 ㄷㄷ', author: '클럽마스터', created_at: new Date(Date.now() - 3600000 * 1).toISOString() }, { id: 'sc2', user_id: '', content: '부스 예약하고 가야 됨 진짜', author: '파티피플', created_at: new Date(Date.now() - 1800000).toISOString() }], comment_count: 2, venue_category: '클럽' },
  { id: 's2', user_id: '', image_url: '/venues/hongdaeclub-pacific-1.jpg', caption: '홍대 토요일 밤 현장. 이 에너지 실화냐', likes: 38, liked: false, created_at: new Date(Date.now() - 3600000 * 5).toISOString(), author: '홍대불주먹', avatar_url: null, comments: [{ id: 'sc3', user_id: '', content: '홍대는 역시 주말이지 ㅎㅎ', author: '주말전사', created_at: new Date(Date.now() - 3600000 * 4).toISOString() }], comment_count: 1, venue_category: '클럽' },
  { id: 's3', user_id: '', image_url: '/venues/cheongdamclub-arju-1.jpg', caption: '아르쥬 양주 세팅 클래스.. 이게 프리미엄이지', likes: 62, liked: false, created_at: new Date(Date.now() - 86400000 * 1).toISOString(), author: '분위기장인', avatar_url: null, comments: [{ id: 'sc4', user_id: '', content: '아르쥬 서비스 진짜 좋음 인정', author: '단골손님', created_at: new Date(Date.now() - 86400000 * 0.8).toISOString() }, { id: 'sc5', user_id: '', content: '여기 실장님 추천받고 갔는데 대만족', author: '첫방문후기', created_at: new Date(Date.now() - 86400000 * 0.5).toISOString() }], comment_count: 2, venue_category: '클럽' },
  { id: 's4', user_id: '', image_url: '/venues/suwonchancenight-1.jpg', caption: '수원찬스 부스에서 본 뷰 ㄹㅇ 예술이다', likes: 29, liked: false, created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(), author: '새벽감성', avatar_url: null, comments: [{ id: 'sc9', user_id: '', content: '수원 가면 여기가 국룰이지', author: '경기도민', created_at: new Date(Date.now() - 86400000 * 1.2).toISOString() }], comment_count: 1, venue_category: '나이트' },
  { id: 's5', user_id: '', image_url: '/venues/ilsanmyeongwolgwanyojeong-1.jpg', caption: '일산 명월관 처음 가봤는데 한실 분위기 진짜 다르다', likes: 34, liked: false, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), author: '룸매니아', avatar_url: null, comments: [{ id: 'sc6', user_id: '', content: '여기 접대 자리로 최고임 강추', author: '금요일밤', created_at: new Date(Date.now() - 86400000 * 1.8).toISOString() }], comment_count: 1, venue_category: '라운지' },
  { id: 's6', user_id: '', image_url: '/venues/gangnamclub-utopia-1.jpg', caption: '유토피아 사운드 시스템 국내 탑인듯 ㅋㅋ', likes: 55, liked: false, created_at: new Date(Date.now() - 86400000 * 3).toISOString(), author: '나이트초보', avatar_url: null, comments: [{ id: 'sc7', user_id: '', content: '강남 유토피아 진짜 레전드', author: '클럽마스터', created_at: new Date(Date.now() - 86400000 * 2.5).toISOString() }, { id: 'sc8', user_id: '', content: '외국인도 엄청 많더라', author: '파티피플', created_at: new Date(Date.now() - 86400000 * 2).toISOString() }], comment_count: 2, venue_category: '클럽' },
  { id: 's7', user_id: '', image_url: '/venues/busanasiadnight-1.jpg', caption: '부산 아시아드 금토 분위기 서울 안부러움', likes: 41, liked: false, created_at: new Date(Date.now() - 86400000 * 3.5).toISOString(), author: '부산사나이', avatar_url: null, comments: [{ id: 'sc10', user_id: '', content: '해운대 끝나고 여기 오면 딱이야', author: '남포동킹', created_at: new Date(Date.now() - 86400000 * 3).toISOString() }], comment_count: 1, venue_category: '나이트' },
  { id: 's8', user_id: '', image_url: '/venues/ilsanshampoonight-1.jpg', caption: '일산 샴푸나이트 밴드 라이브 오늘도 불태웠다', likes: 36, liked: false, created_at: new Date(Date.now() - 86400000 * 4).toISOString(), author: '일산토박이', avatar_url: null, comments: [{ id: 'sc11', user_id: '', content: '샴푸 밴드 트로트 메들리 진짜 미침 ㅋㅋ', author: '댄스왕', created_at: new Date(Date.now() - 86400000 * 3.8).toISOString() }], comment_count: 1, venue_category: '나이트' },
  { id: 's9', user_id: '', image_url: '/venues/daejeonsevennight-1.jpg', caption: '대전세븐 7번째 방문인데 매번 새로움 ㄹㅇ', likes: 28, liked: false, created_at: new Date(Date.now() - 86400000 * 5).toISOString(), author: '대전감성', avatar_url: null, comments: [], comment_count: 0, venue_category: '나이트' },
  { id: 's10', user_id: '', image_url: '/venues/cheongdamh2onight-1.jpg', caption: '청담 H2O 물 컨셉 인테리어 보고 반했다', likes: 51, liked: false, created_at: new Date(Date.now() - 86400000 * 5.5).toISOString(), author: '청담동주민', avatar_url: null, comments: [{ id: 'sc12', user_id: '', content: '여기 양주 세팅 퀄리티 ㄷㄷ', author: '위스키러버', created_at: new Date(Date.now() - 86400000 * 5).toISOString() }, { id: 'sc13', user_id: '', content: '펩시맨 실장 서비스 찐이야', author: 'VIP단골', created_at: new Date(Date.now() - 86400000 * 4.5).toISOString() }], comment_count: 2, venue_category: '나이트' },
];

/* ── Helpers ── */
/* 캡션·댓글에서 #해시태그 / @멘션 자동 인식 → 보라색 강조 (인스타 동일) */
function renderRichText(text: string): React.ReactNode[] {
  if (!text) return [];
  // # 뒤에 한글/영문/숫자/_ , @ 동일
  const parts = text.split(/(#[\p{L}\p{N}_]+|@[\p{L}\p{N}_]+)/gu);
  return parts.map((part, i) => {
    if (part.startsWith('#') || part.startsWith('@')) {
      return (
        <span key={i} className="text-[#8B5CF6] font-medium cursor-pointer">
          {part}
        </span>
      );
    }
    return part;
  });
}

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
  useDocumentMeta('클립 — 실시간 나이트라이프 포토 피드', '회원이 직접 올린 매장 내부 실사 사진. 조명, 룸 배치, 무대 크기, 부스 분위기, 양주 라인업까지 직접 가기 전에 눈으로 먼저 확인. 강남 홍대 일산 핫플 실시간 사진 피드.');
  const { user } = useAuth();
  const navigate = useNavigate();
  const supabase = createClient();
  const requireLogin = () => { if (!user) { navigate('/login'); return false; } return true; };

  /* ── State ── */
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [doubleTapId, setDoubleTapId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<typeof VENUE_TABS[number]>('전체');

  /* ── 피드 불러오기 ── */
  const fetchClips = useCallback(async () => {
    if (!supabase) { setClips(SEED_CLIPS); setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, users!posts_user_id_fkey(nickname, avatar_url)')
        .eq('category', 'clip')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        const { data: fb } = await supabase
          .from('posts')
          .select('*')
          .eq('category', 'clip')
          .order('created_at', { ascending: false })
          .limit(30);
        if (fb && fb.length > 0) setClips(fb.map((p: any) => mapClip(p)));
        else setClips(SEED_CLIPS);
      } else if (data && data.length > 0) {
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
                author: c.users?.nickname || getSeedNickname(c.id),
                created_at: c.created_at,
              });
            }
          }
        }
        setClips(data.map((p: any) => ({ ...mapClip(p), comments: commentsMap[p.id] || [] })));
      } else {
        setClips(SEED_CLIPS);
      }
    } catch {
      setClips(SEED_CLIPS);
    } finally {
      setLoading(false);
    }
  }, []);

  function mapClip(p: any): Clip {
    let imageUrl = '';
    let caption = p.title || '';
    let venueCategory = '';
    let jsonAuthor = '';
    try {
      const parsed = JSON.parse(p.content);
      imageUrl = parsed.imageUrl || '';
      caption = parsed.caption || p.title || '';
      venueCategory = parsed.venueCategory || '';
      jsonAuthor = parsed.author || '';
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
      author: (p.users as any)?.nickname || jsonAuthor || getSeedNickname(p.id),
      avatar_url: (p.users as any)?.avatar_url || null,
      comments: [],
      comment_count: p.comment_count || 0,
      venue_category: venueCategory,
    };
  }

  useEffect(() => { fetchClips(); }, [fetchClips]);

  /* ── 좋아요 ── */
  const toggleLike = async (clipId: string, forceOn?: boolean) => {
    if (!requireLogin()) return;
    setClips(prev => prev.map(c => {
      if (c.id !== clipId) return c;
      if (forceOn && c.liked) return c;
      return { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 };
    }));
    if (!supabase) return;
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      const newLikes = (forceOn && clip.liked) ? clip.likes : (clip.liked ? clip.likes - 1 : clip.likes + 1);
      await supabase.from('posts').update({ likes: Math.max(0, newLikes) }).eq('id', clipId);
    }
  };

  /* ── 더블탭 좋아요 ── */
  const lastTapRef = useRef<Record<string, number>>({});
  const handleDoubleTap = (clipId: string) => {
    const now = Date.now();
    const last = lastTapRef.current[clipId] || 0;
    if (now - last < 300) {
      toggleLike(clipId, true);
      setDoubleTapId(clipId);
      setTimeout(() => setDoubleTapId(null), 800);
    }
    lastTapRef.current[clipId] = now;
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
      .insert({ post_id: clipId, user_id: user!.id, content: text } as any)
      .select('*')
      .single();

    if (!error && data) {
      const newComment: ClipComment = {
        id: (data as any).id,
        user_id: user!.id,
        content: text,
        author: (user!.user_metadata?.name as string) || '나',
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

  /* ── 이미지 에러 핸들링 ── */
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  /* ── 카테고리 필터 ── */
  const filteredClips = selectedTab === '전체' ? clips : clips.filter(c => c.venue_category === selectedTab);

  return (
    <div>
      {/* ═══ VISUAL HERO ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0118] via-[#1a0a2e] to-black">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #EC4899 0%, transparent 40%), radial-gradient(circle at 70% 50%, #8B5CF6 0%, transparent 40%)' }} />
        <div className="relative mx-auto max-w-lg px-4 py-10 text-center">
          <h1 className="text-2xl font-black text-white mb-2">실시간 클립</h1>
          <p className="text-sm text-white/50 mb-4" style={{ lineHeight: '1.7' }}>
            지금 이 순간, 현장 분위기를 사진으로 먼저 확인해
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 border border-white/10">
              <PageLiveCounter pageName="클립 보는 중" baseCount={38} className="text-white/80 [&_strong]:text-white" />
            </div>
            <span className="text-xs text-white/30">{clips.length}개 클립</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg bg-white min-h-screen">
        {/* ═══ 상단 액션 바 ═══ */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          {/* 내 클립 (스토리 스타일) */}
          <button
            onClick={() => requireLogin() && setShowUpload(true)}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="내 프로필" loading="lazy" width={64} height={64} className="w-full h-full rounded-full object-cover" />
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

          {/* 탭 필터 */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {VENUE_TABS.map(tab => {
              const active = selectedTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${active ? 'bg-[#111] text-white' : 'bg-gray-100 text-[#555]'}`}
                  style={{ minHeight: 36 }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ 업로드 모달 ═══ */}
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
        ) : filteredClips.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" strokeWidth={1.5} />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#111] mb-1">{selectedTab === '전체' ? '아직 클립이 없습니다' : `${selectedTab} 클립이 아직 없어요`}</h3>
            <p className="text-sm text-[#555] mb-6">{selectedTab === '전체' ? '첫 번째 현장 사진을 올려보세요!' : '첫 번째로 올려보세요!'}</p>
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
            {filteredClips.map(clip => {
              const isExpanded = expandedComments.has(clip.id);
              const isMine = user?.id === clip.user_id;
              const hasImgError = imgErrors.has(clip.id);
              // 시드 클립은 user_id 비어있고 id가 UUID가 아니므로 댓글 INSERT 시 22P02 에러
              const isSeed = !clip.user_id || clip.id.length < 32;
              return (
                <article key={clip.id}>
                  {/* 헤더 */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] p-[2px]">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {clip.avatar_url ? (
                          <img src={clip.avatar_url} alt={`${clip.author} 프로필`} loading="lazy" width={36} height={36} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-[#8B5CF6]">{clip.author.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#111]">{clip.author}</p>
                      <p className="text-[11px] text-[#999]">{timeAgo(clip.created_at)}</p>
                    </div>
                    {isMine && (
                      <button onClick={() => { if (confirm('이 클립을 삭제할까요?')) deleteClip(clip.id); }} className="p-2" style={{ minHeight: 44 }}>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="6" r="1" fill="currentColor" />
                          <circle cx="12" cy="12" r="1" fill="currentColor" />
                          <circle cx="12" cy="18" r="1" fill="currentColor" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* 이미지 — 더블탭 좋아요 */}
                  <div
                    className="relative w-full aspect-square bg-gray-100 overflow-hidden select-none"
                    onClick={() => handleDoubleTap(clip.id)}
                  >
                    {clip.image_url && !hasImgError ? (
                      <img
                        src={clip.image_url}
                        alt={clip.caption}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={() => setImgErrors(prev => { const n = new Set(prev); n.add(clip.id); return n; })}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-700">
                        <svg className="w-16 h-16 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <circle cx="12" cy="13" r="3" strokeWidth={1.5} />
                        </svg>
                      </div>
                    )}
                    {/* 더블탭 하트 애니메이션 */}
                    {doubleTapId === clip.id && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-24 h-24 text-white drop-shadow-lg animate-[heartPop_0.8s_ease-out_forwards]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-4 px-4 pt-3 pb-1">
                    <button onClick={() => toggleLike(clip.id)} style={{ minHeight: 44 }} className="active:scale-110 transition-transform">
                      <svg className="w-7 h-7" fill={clip.liked ? '#EF4444' : 'none'} stroke={clip.liked ? '#EF4444' : '#111'} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (isSeed) { if (requireLogin()) setShowUpload(true); return; }
                        const el = document.getElementById(`comment-${clip.id}`) as HTMLInputElement | null;
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          setTimeout(() => el.focus(), 250);
                        }
                      }}
                      style={{ minHeight: 44 }}
                    >
                      <svg className="w-7 h-7" fill="none" stroke="#111" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                    <button onClick={() => { if (navigator.share) navigator.share({ text: clip.caption, url: window.location.href }); }} style={{ minHeight: 44 }}>
                      <svg className="w-7 h-7" fill="none" stroke="#111" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                    <div className="flex-1" />
                    <button style={{ minHeight: 44 }}>
                      <svg className="w-7 h-7" fill="none" stroke="#111" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>

                  {clip.likes > 0 && (
                    <p className="px-4 text-sm font-bold text-[#111]">좋아요 {clip.likes.toLocaleString()}개</p>
                  )}

                  {clip.caption && (
                    <p className="px-4 mt-1 text-sm text-[#111] leading-relaxed">
                      <span className="font-bold">{clip.author}</span>{' '}{renderRichText(clip.caption)}
                    </p>
                  )}

                  {/* 댓글 */}
                  <div className="px-4 mt-2">
                    {clip.comments.length > 2 && !isExpanded && (
                      <button onClick={() => setExpandedComments(prev => { const n = new Set(prev); n.add(clip.id); return n; })}
                        className="text-xs mb-1" style={{ color: '#999', minHeight: 28 }}>
                        댓글 {clip.comments.length}개 모두 보기
                      </button>
                    )}
                    {(isExpanded ? clip.comments : clip.comments.slice(-2)).map(c => (
                      <div key={c.id} className="flex items-start gap-1 mb-1">
                        <p className="text-sm flex-1 text-[#111]">
                          <span className="font-bold">{c.author}</span>{' '}{renderRichText(c.content)}
                        </p>
                        {user?.id === c.user_id && (
                          <button onClick={() => deleteComment(clip.id, c.id)} className="text-[10px] shrink-0 text-gray-400 pt-0.5" style={{ minHeight: 28 }}>삭제</button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 댓글 입력 — 시드 클립에는 비활성, 직접 올리기 유도 */}
                  {isSeed ? (
                    <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-50">
                      <p className="text-xs text-[#999]">예시 클립이에요</p>
                      <button
                        onClick={() => requireLogin() && setShowUpload(true)}
                        className="text-sm font-bold text-[#8B5CF6]"
                        style={{ minHeight: 40 }}
                      >
                        내 클립 올리기 →
                      </button>
                    </div>
                  ) : (
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
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* ═══ BOTTOM ═══ */}
        {!loading && clips.length > 0 && (
          <div className="text-center py-8 px-4 space-y-3 border-t border-gray-100">
            <ReadFinishCount pageName="클립 피드" baseCount={130} />
            <p className="text-xs text-[#999]">직접 올린 현장 사진만 모아놨다</p>
            <Link to="/community" className="inline-flex items-center gap-1 text-sm font-bold text-[#8B5CF6] hover:text-[#7C3AED]">
              커뮤니티 더 보기
            </Link>
          </div>
        )}

        {/* ═══ 하단 업로드 FAB ═══ */}
        {!showUpload && (
          <button
            onClick={() => requireLogin() && setShowUpload(true)}
            className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#8B5CF6] text-white shadow-xl shadow-purple-300/40 active:scale-90 transition"
            aria-label="클립 올리기"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" strokeWidth={2} />
            </svg>
          </button>
        )}
      </div>

      {/* 더블탭 하트 CSS */}
      <style>{`
        @keyframes heartPop {
          0% { opacity: 0; transform: scale(0.2); }
          15% { opacity: 1; transform: scale(1.3); }
          30% { transform: scale(0.95); }
          45% { transform: scale(1.05); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}


/* ══════════════════════════════════════════ */
/*      UPLOAD MODAL — 카메라+앨범+글쓰기       */
/* ══════════════════════════════════════════ */
function UploadModal({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const { user } = useAuth();
  const supabase = createClient();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'select' | 'edit' | 'posting'>('select');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [venueCategory, setVenueCategory] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const CATEGORY_OPTIONS = ['나이트', '클럽', '라운지', '호빠'];

  /* ── 모바일 OOM 방지: <Image> + canvas 1440px JPEG 85% ── */
  /* 인스타와 동일한 방식 — 가장 호환성 좋고 메모리 효율적 */
  function compressImage(orig: File, maxDim = 1440, quality = 0.85): Promise<File> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(orig);
      const img = new Image();
      // 갤럭시 Samsung Internet 등 일부 구버전 호환
      img.decoding = 'async';
      img.onload = () => {
        try {
          let tw = img.naturalWidth || img.width;
          let th = img.naturalHeight || img.height;
          if (!tw || !th) throw new Error('이미지 크기 못 읽음');

          if (tw > maxDim || th > maxDim) {
            const r = Math.min(maxDim / tw, maxDim / th);
            tw = Math.max(1, Math.round(tw * r));
            th = Math.max(1, Math.round(th * r));
          }
          const canvas = document.createElement('canvas');
          canvas.width = tw;
          canvas.height = th;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('canvas 컨텍스트 없음');
          // 흰색 배경으로 깔아서 EXIF/투명 채널 영향 제거
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, tw, th);
          ctx.drawImage(img, 0, 0, tw, th);
          // GC 힌트 — 큰 이미지 메모리 빨리 해제
          img.src = '';
          URL.revokeObjectURL(url);
          canvas.toBlob(
            blob => {
              if (!blob) return reject(new Error('압축 결과 비어있음'));
              const newName = (orig.name || 'photo').replace(/\.\w+$/, '') + '.jpg';
              resolve(new File([blob], newName, { type: 'image/jpeg' }));
            },
            'image/jpeg',
            quality
          );
        } catch (e: any) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('사진을 불러올 수 없습니다'));
      };
      img.src = url;
    });
  }

  const [compressing, setCompressing] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    // input 재선택 가능하도록 value 초기화
    if (e.target) e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/') && !/\.(jpe?g|png|heic|heif|webp)$/i.test(f.name)) {
      setError('사진 파일만 올릴 수 있어요');
      return;
    }
    // 50MB 초과만 사전 차단 (그 이하는 무조건 압축 시도)
    if (f.size > 50 * 1024 * 1024) {
      setError('사진이 너무 커요 (50MB 초과)');
      return;
    }
    setError('');
    setStep('edit');
    setCompressing(true);
    try {
      const compressed = await compressImage(f);
      setFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch (err: any) {
      // 압축 실패: 원본이 작으면 그대로 사용, 크면 거부
      if (f.size <= 5 * 1024 * 1024) {
        setFile(f);
        setPreviewUrl(URL.createObjectURL(f));
      } else {
        setError('사진을 처리할 수 없어요. 다른 사진으로 시도해주세요. (' + (err?.message || '알 수 없음') + ')');
        setStep('select');
      }
    } finally {
      setCompressing(false);
    }
  };

  const goBack = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setStep('select');
    setPreviewUrl(null);
    setFile(null);
    setCaption('');
    setVenueCategory('');
    setError('');
  };

  const handlePost = async () => {
    if (!file || !supabase || !user) return;
    setUploading(true);
    setStep('posting');
    setError('');

    try {
      // service_role로 RLS 우회 (호스팅 Supabase는 storage.objects 정책 추가 불가)
      const { data: sessionData } = await supabase.auth.getSession();
      const jwt = sessionData.session?.access_token;
      if (!jwt) {
        setError('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
        setStep('edit');
        setUploading(false);
        return;
      }

      const fd = new FormData();
      fd.append('file', file);

      const upRes = await fetch('/api/clip-upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        body: fd,
      });
      const upJson = await upRes.json().catch(() => ({} as any));
      if (!upRes.ok || !upJson?.publicUrl) {
        setError('사진 업로드 실패: ' + (upJson?.error || upRes.statusText));
        setStep('edit');
        setUploading(false);
        return;
      }
      const imageUrl: string = upJson.publicUrl;

      const content = JSON.stringify({ imageUrl, caption: caption.trim(), venueCategory });
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
        setStep('edit');
        setUploading(false);
        return;
      }

      onPosted();
      onClose();
    } catch (err: any) {
      setError('오류 발생: ' + (err?.message || '알 수 없는 오류'));
      setStep('edit');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-white">
      {/* 헤더 — 인스타 스타일 (좌: 뒤로/취소, 중앙: 제목, 우: 공유) */}
      <div className="flex items-center justify-between px-4 border-b border-gray-100" style={{ height: 52 }}>
        <button
          onClick={step === 'edit' ? goBack : onClose}
          className="text-sm font-medium text-[#555] flex items-center gap-1"
          style={{ minHeight: 44, minWidth: 44 }}
        >
          {step === 'edit' ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          ) : '취소'}
        </button>
        <h2 className="text-base font-bold text-[#111]">
          {step === 'select' ? '새 게시물' : step === 'edit' ? '새 게시물' : '게시 중...'}
        </h2>
        {step === 'edit' ? (
          <button
            onClick={handlePost}
            disabled={uploading || compressing || !file}
            className="text-sm font-bold disabled:opacity-40 active:scale-95 transition"
            style={{ color: '#8B5CF6', minHeight: 44, minWidth: 44 }}
          >
            공유
          </button>
        ) : (
          <div style={{ width: 44 }} />
        )}
      </div>

      {/* ── STEP 1: 소스 선택 ── */}
      {step === 'select' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* 카메라 input — 모바일에서 카메라 직접 실행 */}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
          {/* 갤러리 input — 앨범에서 선택 */}
          <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

          <div className="text-center mb-10">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-50">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" strokeWidth={1.5} />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#111] mb-1">현장 사진을 공유하세요</h3>
            <p className="text-sm text-[#555]">지금 이 순간을 다른 회원들과 나눠보세요</p>
          </div>

          {/* 카메라로 찍기 */}
          <button
            onClick={() => cameraRef.current?.click()}
            className="w-full max-w-xs flex items-center justify-center gap-3 rounded-xl py-4 text-base font-bold text-white mb-3 active:scale-[0.98] transition"
            style={{ backgroundColor: '#8B5CF6', minHeight: 52 }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" strokeWidth={2} />
            </svg>
            카메라로 찍기
          </button>

          {/* 앨범에서 선택 */}
          <button
            onClick={() => galleryRef.current?.click()}
            className="w-full max-w-xs flex items-center justify-center gap-3 rounded-xl py-4 text-base font-bold border-2 border-[#8B5CF6] text-[#8B5CF6] mb-3 active:scale-[0.98] transition"
            style={{ minHeight: 52 }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            앨범에서 선택
          </button>

          {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}
        </div>
      )}

      {/* ── STEP 2: 편집 + 글쓰기 (인스타 스타일) ── */}
      {step === 'edit' && (
        <>
        <div className="flex-1 overflow-y-auto pb-24">
          {/* 캡션 영역 — 작은 썸네일 + textarea 가로 배치 (인스타 정확) */}
          <div className="flex gap-3 px-4 pt-4 pb-3">
            {compressing ? (
              <div className="shrink-0 w-[72px] h-[72px] rounded bg-gray-50 flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#8B5CF6] border-t-transparent" />
              </div>
            ) : previewUrl ? (
              <div className="shrink-0 w-[72px] h-[72px] rounded overflow-hidden bg-black">
                <img src={previewUrl} alt="미리보기" loading="eager" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="shrink-0 w-[72px] h-[72px] rounded bg-gray-50" />
            )}
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="문구 입력... (#해시태그 @멘션 가능)"
              rows={4}
              maxLength={2200}
              className="flex-1 text-[15px] outline-none resize-none bg-transparent text-[#111] min-h-[72px]"
              style={{ lineHeight: '1.5' }}
              autoFocus
            />
          </div>

          {/* 글자 수 카운트 */}
          <div className="px-4 pb-3 flex items-center justify-end">
            <span className="text-[11px] text-[#bbb]">{caption.length}/2,200</span>
          </div>

          {/* 추천 태그 — 빠른 입력 도우미 (직접 #해시태그 입력도 textarea에서 가능) */}
          <div className="px-4 pb-4 border-b border-gray-100">
            <div className="flex flex-wrap gap-2">
              {['#오늘밤', '#나이트라이프', '#클럽', '#분위기맛집', '#놀쿨', '#현장', '#댄스', '#양주'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setCaption(prev => prev.endsWith(' ') || prev === '' ? prev + tag + ' ' : prev + ' ' + tag + ' ')}
                  className="rounded-full px-3 py-1.5 text-xs font-medium active:scale-95 transition"
                  style={{ backgroundColor: '#F3F0FF', color: '#8B5CF6', minHeight: 32 }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 옵션 메뉴 행 — 인스타 스타일 (사람 태그하기, 위치 추가, 카테고리) */}
          <div className="border-b border-gray-100">
            <button
              type="button"
              onClick={() => setCaption(prev => prev.endsWith(' ') || prev === '' ? prev + '@' : prev + ' @')}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 transition"
              style={{ minHeight: 48 }}
            >
              <span className="text-[15px] text-[#111]">사람 태그하기</span>
              <svg className="w-4 h-4 text-[#bbb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setCaption(prev => prev.endsWith(' ') || prev === '' ? prev + '#' : prev + ' #')}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 transition border-t border-gray-100"
              style={{ minHeight: 48 }}
            >
              <span className="text-[15px] text-[#111]">해시태그 추가</span>
              <svg className="w-4 h-4 text-[#bbb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 업종 카테고리 — 인스타의 "위치 추가"와 동일한 톤 */}
          <div className="px-4 py-3.5 border-b border-gray-100">
            <p className="text-[15px] text-[#111] mb-2.5">업종</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map(cat => {
                const active = venueCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setVenueCategory(active ? '' : cat)}
                    className="rounded-full px-4 py-2 text-xs font-bold active:scale-95 transition border"
                    style={{
                      backgroundColor: active ? '#8B5CF6' : '#fff',
                      color: active ? '#fff' : '#555',
                      borderColor: active ? '#8B5CF6' : '#E5E7EB',
                      minHeight: 36,
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 가이드라인 (작게) */}
          <div className="px-4 py-4">
            <p className="text-[11px] text-[#999]" style={{ lineHeight: '1.6' }}>
              얼굴이 나오는 사진은 본인 동의 하에 · 큰 사진은 자동으로 1440px로 압축
            </p>
          </div>

          {error && <p className="px-4 pb-4 text-sm text-red-500">{error}</p>}
        </div>

        {/* ── 하단 고정 공유 버튼 (모바일 엄지 도달 영역) ── */}
        <div
          className="border-t border-gray-100 bg-white px-4 py-3"
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={handlePost}
            disabled={uploading || compressing || !file}
            className="w-full rounded-xl text-base font-bold text-white disabled:opacity-40 active:scale-[0.98] transition"
            style={{ backgroundColor: '#8B5CF6', minHeight: 52 }}
          >
            {compressing ? '사진 처리 중...' : uploading ? '게시 중...' : '공유하기'}
          </button>
        </div>
        </>
      )}

      {/* ── STEP 3: 업로드 중 ── */}
      {step === 'posting' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#8B5CF6] border-t-transparent" />
            <p className="text-base font-bold text-[#111] mb-1">게시 중...</p>
            <p className="text-sm text-[#555]">잠시만 기다려주세요</p>
          </div>
        </div>
      )}
    </div>
  );
}
