import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { createClient } from '@/lib/supabase';
import { CommunityPulse } from '@/components/ui/LiveStats';
import LiveActivityFeed from '@/components/ui/LiveActivityFeed';

const sectionDefs = [
  { title: "업소후기", description: "직접 가본 솔직한 방문 후기", href: "/community/reviews", icon: "⭐", category: "reviews", hookLine: "별점 4점 이상만 모아봤더니 공통점이 있었다" },
  { title: "오늘어디갈까", description: "오늘 밤 어디 갈지 같이 고민하는 곳", href: "/community/qna", icon: "🗺️", category: "discussion", hookLine: "강남 vs 홍대, 오늘 밤 정답은?" },
  { title: "조각모집", description: "같이 놀러갈 사람 구하는 곳", href: "/community/jogak", icon: "🧩", category: "party", hookLine: "모집 마감 임박! 빈자리 3개 남음" },
  { title: "꿀팁", description: "밤놀이 고수들의 실전 노하우", href: "/community/tips", icon: "💡", category: "tips", hookLine: "입장료 아끼는 법, 진작 알았으면..." },
  { title: "자유게시판", description: "자유롭게 이야기 나누는 공간", href: "/community/free", icon: "💬", category: "free", hookLine: "어젯밤 일 아직도 생각나서 씀" },
];

/* 실시간 느낌 숫자: 시간대에 따라 변동 */
function useLiveNumber(base: number, range: number) {
  const [num, setNum] = useState(base);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const h = new Date().getHours();
    const mult = (h >= 20 || h < 3) ? 1.4 : (h >= 15) ? 0.9 : 0.6;
    setNum(Math.floor(base * mult) + Math.floor(Math.random() * range));
    timerRef.current = setInterval(() => {
      setNum(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [base, range]);
  return num;
}

export default function CommunityPage() {
  useDocumentMeta('밤 사람들이 모이는 커뮤니티', '후기, 꿀팁, 파티 모집, 오늘 밤 추천까지. 같이 노는 사람들의 광장.');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recentPosts, setRecentPosts] = useState<{ id: string; title: string; category: string; likes: number; comment_count: number }[]>([]);
  const [hotCommentPosts, setHotCommentPosts] = useState<{ id: string; title: string; category: string; comment_count: number }[]>([]);

  const liveViewers = useLiveNumber(127, 40);
  const todayPosts = useLiveNumber(34, 15);
  const todayComments = useLiveNumber(89, 30);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    sectionDefs.forEach(async (sec) => {
      const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('category', sec.category);
      setCounts(prev => ({ ...prev, [sec.category]: count || 0 }));
    });

    // 최근 인기글 5개
    supabase.from('posts')
      .select('id, title, category, likes, comment_count')
      .order('likes', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data && data.length > 0) setRecentPosts(data as any);
      });

    // 오늘 가장 많이 댓글 달린 글 5개
    supabase.from('posts')
      .select('id, title, category, comment_count')
      .order('comment_count', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data && data.length > 0) setHotCommentPosts(data as any);
      });
  }, []);

  const catLabel: Record<string, string> = { reviews: '후기', discussion: 'Q&A', party: '모집', tips: '꿀팁', free: '자유' };

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">

        {/* ══════ HERO: 살아있는 사이트 느낌 ══════ */}
        <div className="mb-10 rounded-2xl border border-neon-primary/30 p-6 sm:p-8 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(16,185,129,0.06))' }}>
          <h1 className="mb-3 text-3xl sm:text-4xl font-black" style={{ color: '#111' }}>
            밤 사람들이 모이는 커뮤니티
          </h1>
          <p className="text-base sm:text-lg mb-5" style={{ color: '#555' }}>
            지금 이 순간에도 사람들이 모이고, 떠들고, 약속을 잡고 있다
          </p>

          {/* 실시간 숫자 3개 */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-4 flex-wrap">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-black" style={{ color: '#8B5CF6' }}>{liveViewers.toLocaleString()}</span>
              <span className="text-xs mt-1" style={{ color: '#999' }}>접속 중</span>
            </div>
            <div className="h-8 w-px" style={{ backgroundColor: '#E5E7EB' }} />
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-black" style={{ color: '#10B981' }}>{todayPosts}</span>
              <span className="text-xs mt-1" style={{ color: '#999' }}>오늘 새 글</span>
            </div>
            <div className="h-8 w-px" style={{ backgroundColor: '#E5E7EB' }} />
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-black" style={{ color: '#F59E0B' }}>{todayComments}</span>
              <span className="text-xs mt-1" style={{ color: '#999' }}>오늘 댓글</span>
            </div>
          </div>

          <CommunityPulse className="justify-center" />
        </div>

        {/* ══════ 실시간 활동 피드 (상단 노출) ══════ */}
        <div className="mb-8 rounded-2xl border border-neon-border bg-neon-surface p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm font-bold" style={{ color: '#111' }}>지금 일어나고 있는 일</p>
          </div>
          <LiveActivityFeed maxItems={5} interval={4000} />
        </div>

        {/* ══════ 지금 뜨는 글 (미리보기 스니펫 포함) ══════ */}
        {recentPosts.length > 0 && (
          <div className="mb-8 rounded-2xl border border-neon-border bg-neon-surface p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">🔥</span>
              <h2 className="text-xl font-black" style={{ color: '#111' }}>지금 뜨는 글</h2>
            </div>
            <div className="space-y-3">
              {recentPosts.map((post, idx) => (
                <Link
                  key={post.id}
                  to={`/community/post/${post.id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl border border-neon-border bg-neon-bg px-4 sm:px-5 py-4 transition hover:border-neon-primary/40 hover:bg-neon-surface"
                  style={{ minHeight: 56 }}
                >
                  <span className="text-lg font-black shrink-0" style={{ color: idx < 3 ? '#8B5CF6' : '#999', width: 24, textAlign: 'center' }}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                        style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                        {catLabel[post.category] || post.category}
                      </span>
                      <span className="text-sm font-bold truncate" style={{ color: '#111' }}>{post.title}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-3 ml-3 text-xs" style={{ color: '#999' }}>
                    <span style={{ color: '#EF4444' }}>♥ {post.likes}</span>
                    <span>💬 {post.comment_count || 0}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ══════ 오늘 가장 많이 댓글 달린 글 ══════ */}
        {hotCommentPosts.length > 0 && (
          <div className="mb-8 rounded-2xl border border-neon-border bg-neon-surface p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">💬</span>
              <h2 className="text-xl font-black" style={{ color: '#111' }}>댓글 폭발 중</h2>
              <span className="text-xs rounded-full px-2 py-0.5 font-bold animate-pulse"
                style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>HOT</span>
            </div>
            <div className="space-y-2">
              {hotCommentPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/community/post/${post.id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-neon-border bg-neon-bg px-4 sm:px-5 py-3 transition hover:border-neon-primary/40 hover:bg-neon-surface"
                  style={{ minHeight: 48 }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                      {catLabel[post.category] || post.category}
                    </span>
                    <span className="text-sm font-medium truncate" style={{ color: '#111' }}>{post.title}</span>
                  </div>
                  <span className="shrink-0 ml-3 rounded-full px-3 py-1 text-xs font-bold"
                    style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                    💬 {post.comment_count || 0}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ══════ 게시판 카드 그리드 ══════ */}
        <div className="mb-8">
          <h2 className="text-xl font-black mb-5" style={{ color: '#111' }}>게시판 둘러보기</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sectionDefs.map((section) => (
              <Link target="_blank" rel="noopener noreferrer" key={section.href}
                to={section.href}
                className="group rounded-2xl border border-neon-border bg-neon-surface p-5 transition-all hover:border-neon-primary/50 hover:bg-neon-surface/80 hover:shadow-lg hover:shadow-neon-primary/5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{section.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold group-hover:text-neon-primary-light">
                      {section.title}
                    </h3>
                    <span className="text-xs" style={{ color: '#999' }}>
                      게시글 <span className="text-neon-primary-light font-bold">{(counts[section.category] || 0).toLocaleString()}</span>개
                    </span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-2" style={{ color: '#555' }}>
                  {section.description}
                </p>
                <p className="text-xs font-bold" style={{ color: '#8B5CF6' }}>
                  "{section.hookLine}"
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* DB에 글이 없을 때 — 시드 인기글로 사이트가 살아보이게 */}
        {recentPosts.length === 0 && (
          <div className="mb-8 rounded-2xl border border-neon-border bg-neon-surface p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">🔥</span>
              <h2 className="text-xl font-black" style={{ color: '#111' }}>지금 뜨는 글</h2>
            </div>
            <div className="space-y-3">
              {[
                { id: 's1', cat: '후기', title: '레이스 금요일 다녀옴 — 역시 사운드 미쳤다', likes: 24, comments: 8 },
                { id: 's2', cat: '자유', title: '혼자 나이트 가봤는데 생각보다 괜찮았음', likes: 18, comments: 12 },
                { id: 's3', cat: '팁', title: '입장료 아끼는 법 3가지 (진짜 됨)', likes: 31, comments: 6 },
                { id: 's4', cat: 'Q&A', title: '나이트 드레스코드 뭐 입고 가야돼?', likes: 9, comments: 15 },
                { id: 's5', cat: '모집', title: '토요일 강남 같이 갈 사람 2명 구함', likes: 14, comments: 7 },
              ].map((post, idx) => (
                <Link key={post.id} to="/community/free" className="flex items-center gap-4 rounded-xl border border-neon-border bg-neon-bg px-4 sm:px-5 py-4 transition hover:border-neon-primary/40 hover:bg-neon-surface" style={{ minHeight: 56 }}>
                  <span className="text-lg font-black shrink-0" style={{ color: idx < 3 ? '#8B5CF6' : '#999', width: 24, textAlign: 'center' }}>{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>{post.cat}</span>
                      <span className="text-sm font-bold truncate" style={{ color: '#111' }}>{post.title}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-3 ml-3 text-xs" style={{ color: '#999' }}>
                    <span style={{ color: '#EF4444' }}>♥ {post.likes}</span>
                    <span>💬 {post.comments}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        {hotCommentPosts.length === 0 && (
          <div className="mb-8 rounded-2xl border border-neon-border bg-neon-surface p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">💬</span>
              <h2 className="text-xl font-black" style={{ color: '#111' }}>댓글 폭발 중</h2>
              <span className="text-xs rounded-full px-2 py-0.5 font-bold animate-pulse" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>HOT</span>
            </div>
            <div className="space-y-2">
              {[
                { id: 'sc1', cat: 'Q&A', title: '클럽 혼자 가도 되나요? 진짜 궁금', comments: 23 },
                { id: 'sc2', cat: '자유', title: '어젯밤 홍대 만취 썰 풀어봄', comments: 19 },
                { id: 'sc3', cat: '후기', title: '아르쥬 vs 레이스 내 결론', comments: 16 },
              ].map((post) => (
                <Link key={post.id} to="/community/free" className="flex items-center justify-between rounded-xl border border-neon-border bg-neon-bg px-4 sm:px-5 py-3 transition hover:border-neon-primary/40 hover:bg-neon-surface" style={{ minHeight: 48 }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>{post.cat}</span>
                    <span className="text-sm font-medium truncate" style={{ color: '#111' }}>{post.title}</span>
                  </div>
                  <span className="shrink-0 ml-3 rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>💬 {post.comments}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
