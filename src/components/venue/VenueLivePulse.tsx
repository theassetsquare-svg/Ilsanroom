import { useEffect, useState } from 'react';

/* 업소 상세 라이브 펄스
   - "지금 N명 보는 중" / "오늘 X명 조회" / "방금 ㅁㅁㅁ님이 찜" 3종 메시지가 5초마다 회전
   - venue.slug 기반 결정적 시드 + 시간대/요일 배율 + 매분 jitter
   - 사이트 컨셉: 직원 100명이 24시간 운영 — AI 냄새 0%, 진짜 사람 활동 느낌 */

const NICKS = [
  '강남언니', '홍대오빠', '클럽킬러', '주말전사', '나이트단골',
  '압구정여신', '신촌막내', '이태원형', '룸예약장인', '술맛도사',
  '드레스코드왕', '파티퀸', '단골30년', '새벽감성러', '가성비헌터',
];

function hash(s: string): number {
  return s.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0) >>> 0;
}

function dayBucket(): number {
  const d = new Date();
  return d.getFullYear() * 400 + (d.getMonth() + 1) * 32 + d.getDate();
}

function hourMult(h: number, dow: number): number {
  const w = (dow === 5 || dow === 6) ? 1.0 : (dow === 0 || dow === 4) ? 0.85 : 0.7;
  let base: number;
  if (h >= 22 || h < 2) base = 1.0;
  else if (h >= 19) base = 0.85;
  else if (h >= 14) base = 0.55;
  else base = 0.45;
  return base * w;
}

export default function VenueLivePulse({
  slug,
  isPremium = false,
  initialViewing,
}: {
  slug: string;
  isPremium?: boolean;
  initialViewing: number;
}) {
  const [viewing, setViewing] = useState(initialViewing);
  const [todayViews] = useState(() => {
    const h = hash(slug);
    const m = hourMult(new Date().getHours(), new Date().getDay());
    const popular = isPremium || h % 3 === 0;
    return Math.floor(((popular ? 320 : 110) + (h % 140)) * (0.5 + m));
  });
  const [favoritedNick] = useState(() => {
    const h = hash(slug + dayBucket().toString());
    return NICKS[h % NICKS.length];
  });
  const [favoritedAgo, setFavoritedAgo] = useState(() => {
    const h = hash(slug);
    return (h % 9) + 1; // 1~9분 전
  });
  const [variant, setVariant] = useState(0);

  useEffect(() => {
    // 메시지 회전: 5초마다 다음 변형으로
    const rot = setInterval(() => setVariant((v) => (v + 1) % 3), 5000);
    // viewing 미세 변동: 12초마다 -1/0/+1/+2
    const live = setInterval(() => {
      setViewing((v) => Math.max(2, v + (Math.floor(Math.random() * 4) - 1)));
    }, 12000);
    // 찜 분 카운터: 60초마다 +1
    const ago = setInterval(() => setFavoritedAgo((a) => a + 1), 60000);
    return () => {
      clearInterval(rot);
      clearInterval(live);
      clearInterval(ago);
    };
  }, []);

  const messages = [
    {
      key: 'view',
      dot: 'bg-emerald-500',
      ping: 'bg-emerald-400',
      text: (
        <>
          지금 <strong className="text-emerald-700">{viewing}</strong>명이 이 업소 보는 중
        </>
      ),
    },
    {
      key: 'today',
      dot: 'bg-violet-500',
      ping: 'bg-violet-400',
      text: (
        <>
          오늘 <strong className="text-violet-700">{todayViews.toLocaleString()}</strong>명이 조회
        </>
      ),
    },
    {
      key: 'fav',
      dot: 'bg-rose-500',
      ping: 'bg-rose-400',
      text: (
        <>
          방금 <strong className="text-rose-700">{favoritedNick}</strong>님이 찜 ({favoritedAgo}분 전)
        </>
      ),
    },
  ];
  const m = messages[variant];

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-neon-border bg-white/70 backdrop-blur px-3 py-1.5 shadow-sm transition-all">
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${m.ping} opacity-75`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${m.dot}`} />
      </span>
      <span className="text-[12px] text-[#444] leading-none">{m.text}</span>
    </div>
  );
}
