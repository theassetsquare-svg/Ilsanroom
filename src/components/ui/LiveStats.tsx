import { useState, useEffect } from 'react';

/* ── 날짜 시드 ──
   매일 다른 수치가 나오도록 날짜(년+월+일+요일)를 시드로 사용.
   같은 날 같은 시간에 새로고침하면 기본값은 비슷하지만 random jitter가 더해져서 약간씩 다르다.
   다른 날에는 daySeed 자체가 달라서 확실히 다른 수치가 나온다. */
function getDaySeed(): number {
  const now = new Date();
  return now.getFullYear() * 400 + (now.getMonth() + 1) * 32 + now.getDate();
}

/* ── 시간대별 수치 배율 ──
   365일 24시간 언제 들어가도 "사람 많다" 느낌.
   요일에 따라 배율이 약간 다름: 금토 피크, 일~목 평일. */
function getHourMultiplier(): number {
  const now = new Date();
  const h = now.getHours();
  const dow = now.getDay(); // 0=일, 5=금, 6=토
  const isWeekend = dow === 5 || dow === 6; // 금토
  const wMult = isWeekend ? 1.0 : (dow === 0 || dow === 4) ? 0.85 : 0.75; // 일/목은 중간

  let base: number;
  if (h >= 22 || h < 2) base = 1.0;
  else if (h >= 20 && h < 22) base = 0.9;
  else if (h >= 18 && h < 20) base = 0.75;
  else if (h >= 15 && h < 18) base = 0.55;
  else if (h >= 12 && h < 15) base = 0.5;
  else if (h >= 6 && h < 12) base = 0.45;
  else base = 0.5; // 새벽 2~6시

  return Math.max(0.4, base * wMult);
}

/* 간단한 해시: 날짜 시드를 넣으면 매일 다른 정수 반환 */
function dailyHash(seed: number, salt: number): number {
  let x = ((seed + salt) * 2654435761) >>> 0;
  x = ((x >> 16) ^ x) * 0x45d9f3b;
  x = ((x >> 16) ^ x);
  return x >>> 0;
}

/* ══════════════════════════════════════════ */
/*  1. PageLiveCounter — "지금 N명이 이 페이지 보는 중" */
/* ══════════════════════════════════════════ */
export function PageLiveCounter({ pageName, baseCount = 30, className = '' }: { pageName?: string; baseCount?: number; className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const m = getHourMultiplier();
    const ds = getDaySeed();
    const dayVar = (dailyHash(ds, baseCount) % 20) - 10; // -10 ~ +10 매일 다른 보정
    setCount(Math.max(5, Math.floor(baseCount * m + dayVar + Math.random() * 8)));

    const timer = setInterval(() => {
      setCount(prev => Math.max(4, prev + Math.floor(Math.random() * 5) - 2));
    }, 15000);

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
    const ds = getDaySeed();
    const dv = dailyHash(ds, 777) % 120; // 매일 0~119 다른 보정
    const dp = dailyHash(ds, 888) % 8;
    const dc = dailyHash(ds, 999) % 20;
    const base = {
      visitors: Math.floor((380 + h * 47 + dv) * m + Math.random() * 50),
      posts: Math.floor((12 + h * 2.3 + dp) * m + Math.random() * 5),
      comments: Math.floor((34 + h * 4.8 + dc) * m + Math.random() * 10),
    };
    setStats(base);

    const timer = setInterval(() => {
      setStats(prev => ({
        visitors: prev.visitors + Math.floor(Math.random() * 4) + 1,
        posts: Math.random() > 0.7 ? prev.posts + 1 : prev.posts,
        comments: Math.random() > 0.4 ? prev.comments + 1 : prev.comments,
      }));
    }, 20000);

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
    const ds = getDaySeed();
    const dh = dailyHash(ds, hash);
    const popular = hash % 3 === 0;
    setData({
      viewing: Math.max(2, Math.floor((popular ? 18 : 8) * m + (dh % 7) + (hash % 5))),
      todayViews: Math.floor((popular ? 180 : 60) + (dh % 90) + Math.random() * 30),
      weekInquiry: Math.floor((popular ? 24 : 8) + (dh % 15)),
    });

    const timer = setInterval(() => {
      setData(prev => ({
        viewing: Math.max(1, prev.viewing + Math.floor(Math.random() * 5) - 2),
        todayViews: prev.todayViews + Math.floor(Math.random() * 3),
        weekInquiry: prev.weekInquiry,
      }));
    }, 15000);

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
    const ds = getDaySeed();
    const memberGrowth = Math.floor((ds - 740000) * 0.3); // 날짜 지날수록 회원수 증가
    setData({
      online: Math.max(12, Math.floor(85 * m + (dailyHash(ds, 111) % 25))),
      todayPosts: Math.floor(15 + h * 2.1 + (dailyHash(ds, 222) % 8)),
      todayComments: Math.floor(42 + h * 5.3 + (dailyHash(ds, 333) % 18)),
      totalMembers: 2847 + Math.max(0, memberGrowth) + (dailyHash(ds, 444) % 15),
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
    const ds = getDaySeed();
    setCount(Math.floor(3 + h * 0.7 + (dailyHash(ds, 555) % 4) + Math.random() * 2));

    const timer = setInterval(() => {
      if (Math.random() > 0.6) {
        setCount(prev => prev + 1);
      }
    }, 30000);

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
  const ds = getDaySeed();
  const base = 1200 + (hash % 800) + Math.floor(new Date().getHours() * 15) + (dailyHash(ds, hash) % 200);
  const [count, setCount] = useState(base);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Math.random() > 0.5) setCount(prev => prev + 1);
    }, 25000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className={`text-xs text-gray-400 ${className}`}>
      {count.toLocaleString()}명이 읽었어요
    </span>
  );
}
