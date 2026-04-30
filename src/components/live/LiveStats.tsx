import { useState, useEffect } from 'react';

interface Stats {
  viewersNow: number;
  todayReviews: number;
  todayPosts: number;
  weeklyHotName: string;
  trendingName: string;
}

function generateStats(): Stats {
  const now = new Date();
  const hour = now.getHours();
  const dow = now.getDay();
  const daySeed = now.getFullYear() * 400 + (now.getMonth() + 1) * 32 + now.getDate();

  // 시간대별 접속자
  let base: number;
  if (hour >= 21 || hour < 2) base = 180 + (daySeed % 60);
  else if (hour >= 18) base = 120 + (daySeed % 40);
  else if (hour >= 14) base = 60 + (daySeed % 30);
  else if (hour >= 10) base = 35 + (daySeed % 20);
  else base = 15 + (daySeed % 15);

  // 주말 보정
  const mult = (dow === 5 || dow === 6) ? 1.3 : (dow === 0 || dow === 4) ? 1.1 : 1.0;
  const viewersNow = Math.round(base * mult) + Math.floor(Math.random() * 5);

  // 오늘 새 후기/글
  const todayReviews = 3 + (daySeed % 8) + Math.floor(Math.random() * 3);
  const todayPosts = 5 + (daySeed % 12) + Math.floor(Math.random() * 4);

  // 이번 주 인기 & 급상승
  const hotVenues = ['강남레이스', '해운대고구려', '일산룸', '수원찬스돔', '홍대버뮤다', '강남아르쥬', '일산명월관', '부산수', '대전유성나이트', '광주봉선나이트'];
  const weekNum = Math.floor(daySeed / 7);
  const weeklyHotName = hotVenues[weekNum % hotVenues.length];
  const trendingName = hotVenues[(weekNum + 3) % hotVenues.length];

  return { viewersNow, todayReviews, todayPosts, weeklyHotName, trendingName };
}

export default function LiveStats() {
  const [stats, setStats] = useState<Stats>(generateStats);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(generateStats());
    }, 300_000); // 5분마다 갱신

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: '#E9E5FF', backgroundColor: '#FAFAFF' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: '#22C55E' }} />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
        </span>
        <span className="text-xs font-bold" style={{ color: '#111' }}>실시간 현황</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <p className="text-lg font-black" style={{ color: '#8B5CF6' }}>{stats.viewersNow}</p>
          <p className="text-[10px]" style={{ color: '#888' }}>접속 중</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-black" style={{ color: '#F59E0B' }}>{stats.todayReviews}</p>
          <p className="text-[10px]" style={{ color: '#888' }}>오늘 후기</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-black" style={{ color: '#3B82F6' }}>{stats.todayPosts}</p>
          <p className="text-[10px]" style={{ color: '#888' }}>오늘 새 글</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: '#888' }}>이번 주 1위</span>
          <span className="font-bold" style={{ color: '#111' }}>{stats.weeklyHotName}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: '#888' }}>급상승</span>
          <span className="font-bold" style={{ color: '#EF4444' }}>{stats.trendingName}</span>
        </div>
      </div>
    </div>
  );
}
