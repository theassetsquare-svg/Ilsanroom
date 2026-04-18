import { useState, useEffect } from 'react';

/* ── 시간대별 현실적 수치 생성기 ── */
function getHourMultiplier(): number {
  const h = new Date().getHours();
  if (h >= 22 || h < 2) return 1.0;    // 피크
  if (h >= 20 && h < 22) return 0.85;
  if (h >= 18 && h < 20) return 0.65;
  if (h >= 15 && h < 18) return 0.35;
  if (h >= 12 && h < 15) return 0.25;
  if (h >= 9 && h < 12) return 0.2;
  if (h >= 6 && h < 9) return 0.1;
  return 0.15; // 새벽 2~6시
}

function jitter(base: number, range: number): number {
  return base + Math.floor(Math.random() * range * 2) - range;
}

/* ══════════════════════════════════════════ */
/*  1. PageLiveCounter — "지금 N명이 이 페이지 보는 중" */
/* ══════════════════════════════════════════ */
export function PageLiveCounter({ pageName, baseCount = 30, className = '' }: { pageName?: string; baseCount?: number; className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const m = getHourMultiplier();
    setCount(Math.max(3, Math.floor(baseCount * m + Math.random() * 10)));

    const timer = setInterval(() => {
      setCount(prev => Math.max(3, prev + Math.floor(Math.random() * 5) - 2));
    }, 7000 + Math.floor(Math.random() * 4000));

    return () => clearInterval(timer);
  }, [baseCount]);

  if (!count) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      <span className="text-gray-500">
        지금 <strong className="text-gray-700">{count}</strong>명{pageName ? ` ${pageName}` : ''} 보는 중
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════ */
/*  2. TodayStats — "오늘 방문 N명 · 새 글 N개 · 댓글 N개" */
/* ══════════════════════════════════════════ */
export function TodayStats({ className = '' }: { className?: string }) {
  const [stats, setStats] = useState({ visitors: 0, posts: 0, comments: 0 });

  useEffect(() => {
    const h = new Date().getHours();
    const m = getHourMultiplier();
    const base = {
      visitors: Math.floor((380 + h * 47) * m + Math.random() * 50),
      posts: Math.floor((12 + h * 2.3) * m + Math.random() * 5),
      comments: Math.floor((34 + h * 4.8) * m + Math.random() * 10),
    };
    setStats(base);

    const timer = setInterval(() => {
      setStats(prev => ({
        visitors: prev.visitors + Math.floor(Math.random() * 4) + 1,
        posts: Math.random() > 0.7 ? prev.posts + 1 : prev.posts,
        comments: Math.random() > 0.4 ? prev.comments + 1 : prev.comments,
      }));
    }, 12000 + Math.floor(Math.random() * 8000));

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`flex items-center gap-2 text-xs text-gray-400 ${className}`}>
      <span>오늘 방문 <strong className="text-[#8B5CF6]">{stats.visitors.toLocaleString()}</strong>명</span>
      <span>·</span>
      <span>새 글 <strong className="text-[#8B5CF6]">{stats.posts}</strong>개</span>
      <span>·</span>
      <span>댓글 <strong className="text-[#8B5CF6]">{stats.comments}</strong>개</span>
    </div>
  );
}

/* ══════════════════════════════════════════ */
/*  3. VenueCardStats — 업소 카드용 미니 수치 */
/* ══════════════════════════════════════════ */
export function VenueCardStats({ slug, className = '' }: { slug: string; className?: string }) {
  const [data, setData] = useState({ viewing: 0, todayViews: 0, weekInquiry: 0 });

  useEffect(() => {
    const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const m = getHourMultiplier();
    const popular = hash % 3 === 0; // 인기 업소는 수치 높게
    setData({
      viewing: Math.max(2, Math.floor((popular ? 18 : 8) * m + (hash % 7))),
      todayViews: Math.floor((popular ? 180 : 60) + (hash % 80) + Math.random() * 30),
      weekInquiry: Math.floor((popular ? 24 : 8) + (hash % 12)),
    });

    const timer = setInterval(() => {
      setData(prev => ({
        viewing: Math.max(1, prev.viewing + Math.floor(Math.random() * 5) - 2),
        todayViews: prev.todayViews + Math.floor(Math.random() * 3),
        weekInquiry: prev.weekInquiry,
      }));
    }, 9000 + Math.floor(Math.random() * 5000));

    return () => clearInterval(timer);
  }, [slug]);

  return (
    <div className={`flex items-center gap-2 text-[10px] text-gray-400 ${className}`}>
      <span className="flex items-center gap-1">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
        {data.viewing}명 보는 중
      </span>
      <span>·</span>
      <span>오늘 {data.todayViews}회 조회</span>
    </div>
  );
}

/* ══════════════════════════════════════════ */
/*  4. CommunityPulse — 커뮤니티 활동 수치 바 */
/* ══════════════════════════════════════════ */
export function CommunityPulse({ className = '' }: { className?: string }) {
  const [data, setData] = useState({ online: 0, todayPosts: 0, todayComments: 0, totalMembers: 0 });

  useEffect(() => {
    const h = new Date().getHours();
    const m = getHourMultiplier();
    setData({
      online: Math.max(8, Math.floor(85 * m + Math.random() * 25)),
      todayPosts: Math.floor(15 + h * 2.1 + Math.random() * 6),
      todayComments: Math.floor(42 + h * 5.3 + Math.random() * 15),
      totalMembers: 2847 + Math.floor(Math.random() * 30),
    });

    const timer = setInterval(() => {
      setData(prev => ({
        online: Math.max(5, prev.online + Math.floor(Math.random() * 7) - 3),
        todayPosts: Math.random() > 0.8 ? prev.todayPosts + 1 : prev.todayPosts,
        todayComments: Math.random() > 0.5 ? prev.todayComments + 1 : prev.todayComments,
        totalMembers: prev.totalMembers + (Math.random() > 0.9 ? 1 : 0),
      }));
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${className}`}>
      <span className="flex items-center gap-1.5">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-gray-500">접속 중 <strong className="text-emerald-600">{data.online}</strong>명</span>
      </span>
      <span className="text-gray-500">오늘 글 <strong className="text-[#8B5CF6]">{data.todayPosts}</strong>개</span>
      <span className="text-gray-500">댓글 <strong className="text-[#8B5CF6]">{data.todayComments}</strong>개</span>
      <span className="text-gray-500">회원 <strong className="text-gray-700">{data.totalMembers.toLocaleString()}</strong>명</span>
    </div>
  );
}

/* ══════════════════════════════════════════ */
/*  5. RecentJoinTicker — "방금 N명이 가입했어요" */
/* ══════════════════════════════════════════ */
export function RecentJoinTicker({ className = '' }: { className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const h = new Date().getHours();
    setCount(Math.floor(3 + h * 0.7 + Math.random() * 3));

    const timer = setInterval(() => {
      if (Math.random() > 0.6) {
        setCount(prev => prev + 1);
      }
    }, 25000 + Math.floor(Math.random() * 15000));

    return () => clearInterval(timer);
  }, []);

  if (!count) return null;

  return (
    <span className={`text-xs text-gray-400 ${className}`}>
      최근 1시간 <strong className="text-[#8B5CF6]">{count}</strong>명 가입
    </span>
  );
}

/* ══════════════════════════════════════════ */
/*  6. GuideReadCount — "N명이 이 가이드를 읽었어요" */
/* ══════════════════════════════════════════ */
export function GuideReadCount({ category, className = '' }: { category: string; className?: string }) {
  const hash = category.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = 1200 + (hash % 800) + Math.floor(new Date().getHours() * 15);
  const [count, setCount] = useState(base);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Math.random() > 0.5) setCount(prev => prev + 1);
    }, 15000 + Math.floor(Math.random() * 10000));
    return () => clearInterval(timer);
  }, []);

  return (
    <span className={`text-xs text-gray-400 ${className}`}>
      {count.toLocaleString()}명이 읽었어요
    </span>
  );
}
