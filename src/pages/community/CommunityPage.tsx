import { useState, useEffect } from "react";
import { Link } from '../../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { createClient } from '@/lib/supabase';
import { CommunityPulse } from '@/components/ui/LiveStats';
import LiveActivityFeed from '@/components/ui/LiveActivityFeed';
import DailyPrompt from '@/components/community/DailyPrompt';
import { venues } from '@/data/venues';

// 놀쿨에 실제 등록된(영업확인) 업소 수 — venues.ts 1차 데이터 그대로, 가공·창작 0
const REGISTERED_VENUE_COUNT = venues.filter(v => v.status !== 'closed_or_unclear').length;

const sectionDefs = [
  { title: "업소후기", description: "직접 가본 솔직한 방문 후기", href: "/community/reviews", icon: "⭐", category: "reviews", hookLine: "별점 4점 이상만 모아봤더니 공통점이 있었다" },
  { title: "오늘어디갈까", description: "오늘 밤 어디 갈지 같이 고민하는 곳", href: "/community/qna", icon: "🗺️", category: "discussion", hookLine: "강남 vs 홍대, 오늘 밤 정답은?" },
  { title: "조각모집", description: "같이 놀러갈 사람 구하는 곳", href: "/community/jogak", icon: "🧩", category: "party", hookLine: "모집 마감 임박! 빈자리 3개 남음" },
  { title: "꿀팁", description: "밤놀이 고수들의 실전 노하우", href: "/community/tips", icon: "💡", category: "tips", hookLine: "줄 안 서고 들어가는 법, 진작 알았으면..." },
  { title: "자유게시판", description: "자유롭게 이야기 나누는 공간", href: "/community/free", icon: "💬", category: "free", hookLine: "어젯밤 일 아직도 생각나서 씀" },
];

export default function CommunityPage() {
  useDocumentMeta('밤 사람들이 모이는 우리 동네 커뮤니티다', '강남 홍대 이태원 일산 부산 수원 클럽 나이트 라운지 룸 요정 호빠 후기 꿀팁 파티모집 Q&A 자유게시판 패션 조각모임 — 진짜 회원이 직접 쓰는 익명 광장.');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recentPosts, setRecentPosts] = useState<{ id: string; title: string; category: string; likes: number; comment_count: number }[]>([]);
  const [hotCommentPosts, setHotCommentPosts] = useState<{ id: string; title: string; category: string; comment_count: number }[]>([]);
  const [todayPosts, setTodayPosts] = useState<number | null>(null);
  const [totalPosts, setTotalPosts] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let alive = true;

    // 순차 호출 — Supabase HTTP/2 동시 stream 한도 회피 (errors-in-console 0)
    (async () => {
      const kstNow = new Date();
      const kstMidnight = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate()).toISOString();

      try { const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', kstMidnight); if (alive) setTodayPosts(count ?? 0); } catch {}
      try { const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true }); if (alive) setTotalPosts(count ?? 0); } catch {}

      for (const sec of sectionDefs) {
        if (!alive) return;
        try {
          const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('category', sec.category);
          if (alive) setCounts(prev => ({ ...prev, [sec.category]: count || 0 }));
        } catch {}
      }

      try {
        const { data } = await supabase.from('posts').select('id, title, category, likes, comment_count').order('likes', { ascending: false }).limit(5);
        if (alive && data && data.length > 0) setRecentPosts(data as any);
      } catch {}

      try {
        const { data } = await supabase.from('posts').select('id, title, category, comment_count').order('comment_count', { ascending: false }).limit(5);
        if (alive && data && data.length > 0) setHotCommentPosts(data as any);
      } catch {}
    })();

    return () => { alive = false; };
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

          {/* Supabase 실시간 카운트 — 가짜 시드 없음 */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-4 flex-wrap">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-black" style={{ color: '#10B981' }}>
                {todayPosts === null ? '—' : todayPosts.toLocaleString()}
              </span>
              <span className="text-xs mt-1" style={{ color: '#595959' }}>오늘 새 글</span>
            </div>
            <div className="h-8 w-px" style={{ backgroundColor: '#E5E7EB' }} />
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-black" style={{ color: '#8B5CF6' }}>
                {totalPosts === null ? '—' : totalPosts.toLocaleString()}
              </span>
              <span className="text-xs mt-1" style={{ color: '#595959' }}>누적 글</span>
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

        {/* ══════ 오늘의 글감 — 매일 자정 회전 ══════ */}
        <DailyPrompt />

        {/* ══════ 운영팀 공식 안내 — 가짜 회원 사칭 아님, 운영자 1인칭 명시 / 실데이터만 ══════ */}
        <div className="mb-8 rounded-2xl border p-5 sm:p-6" style={{ borderColor: 'rgba(139,92,246,0.35)', background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(16,185,129,0.04))' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black" style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }}>놀쿨 운영팀 공식</span>
            <span className="text-xs" style={{ color: '#595959' }}>운영자가 직접 남기는 안내입니다</span>
          </div>
          <p className="text-base font-bold mb-1.5" style={{ color: '#111' }}>
            지금 놀쿨에 등록된 업소 <span style={{ color: '#8B5CF6' }}>{REGISTERED_VENUE_COUNT.toLocaleString()}곳</span> — 다녀온 곳, 첫 후기 주인공이 되어보세요
          </p>
          <p className="text-sm mb-4" style={{ color: '#555', lineHeight: 1.7 }}>
            여기 글·후기·댓글은 전부 실제 회원이 직접 씁니다. 자동으로 만들어 넣는 가짜 글은 한 건도 없어요. 다녀온 업소가 있다면 솔직한 한 줄이 다음 사람에게 가장 큰 도움이 됩니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/community/reviews" className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition" style={{ backgroundColor: '#8B5CF6', minHeight: 44 }}>
              후기 남기러 가기
            </Link>
            <Link to="/clubs" className="rounded-xl border px-4 py-2.5 text-sm font-bold transition" style={{ borderColor: '#E5E7EB', color: '#555', minHeight: 44 }}>
              등록 업소 둘러보기
            </Link>
          </div>
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
                  className="flex items-center gap-4 rounded-xl border border-neon-border bg-neon-bg px-4 sm:px-5 py-4 transition hover:border-neon-primary/40 hover:bg-neon-surface"
                  style={{ minHeight: 56 }}
                >
                  <span className="text-lg font-black shrink-0" style={{ color: idx < 3 ? '#8B5CF6' : '#999', width: 24, textAlign: 'center' }}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                        style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#5B21B6' }}>
                        {catLabel[post.category] || post.category}
                      </span>
                      <span className="text-sm font-bold truncate" style={{ color: '#111' }}>{post.title}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-3 ml-3 text-xs" style={{ color: '#595959' }}>
                    <span style={{ color: '#B91C1C' }}>♥ {post.likes}</span>
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
                  className="flex items-center justify-between rounded-xl border border-neon-border bg-neon-bg px-4 sm:px-5 py-3 transition hover:border-neon-primary/40 hover:bg-neon-surface"
                  style={{ minHeight: 48 }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#5B21B6' }}>
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

        {/* ══════ 업종별 라운지 배너 ══════ */}
        <div className="mb-8">
          <Link to="/lounge"
            className="block rounded-2xl border border-violet-200 p-5 sm:p-6 transition hover:border-violet-400 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.06))' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🏠</span>
              <h2 className="text-lg sm:text-xl font-black" style={{ color: '#111' }}>업종별 라운지</h2>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-600">NEW</span>
            </div>
            <p className="text-sm" style={{ color: '#555' }}>나이트·클럽·룸·요정·호빠·라운지바 — 같은 취향끼리 모여서 이야기하는 전용 게시판</p>
          </Link>
        </div>

        {/* ══════ 게시판 카드 그리드 ══════ */}
        <div className="mb-8">
          <h2 className="text-xl font-black mb-5" style={{ color: '#111' }}>게시판 둘러보기</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sectionDefs.map((section) => (
              <Link key={section.href}
                to={section.href}
                className="group rounded-2xl border border-neon-border bg-neon-surface p-5 transition-all hover:border-neon-primary/50 hover:bg-neon-surface/80 hover:shadow-lg hover:shadow-neon-primary/5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{section.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold group-hover:text-neon-primary-light">
                      {section.title}
                    </h3>
                    <span className="text-xs" style={{ color: '#595959' }}>
                      게시글 <span className="text-neon-primary-light font-bold">{(counts[section.category] || 0).toLocaleString()}</span>개
                    </span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-2" style={{ color: '#555' }}>
                  {section.description}
                </p>
                <p className="text-xs font-bold" style={{ color: '#5B21B6' }}>
                  "{section.hookLine}"
                </p>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
