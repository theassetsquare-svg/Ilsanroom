'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { venues } from '@/data/venues';

/**
 * ★ FOMO + 긴급감 + 가변보상 위젯 ★
 *
 * 심리학:
 * - "N명이 보고 있습니다" → 사회적 증거, 안 보면 뒤처질 것 같음
 * - "이 추천은 N분 후 바뀝니다" → 지금 안 보면 사라짐 (FOMO)
 * - 매 시간 다른 추천 → 가변보상, 뭐가 나올지 모름
 * - 카운트다운 → 긴박감, 빨리 봐야 함
 */

function getHourlyPicks() {
  const hour = new Date().getHours();
  const open = venues.filter(v => v.status !== 'closed_or_unclear');
  // Use hour as seed for consistent-per-hour but different-each-hour picks
  const seed = hour * 17 + new Date().getDate() * 7;
  const shuffled = [...open].sort((a, b) => {
    const hashA = (a.slug.charCodeAt(0) * 31 + seed) % 1000;
    const hashB = (b.slug.charCodeAt(0) * 31 + seed) % 1000;
    return hashA - hashB;
  });
  return shuffled.slice(0, 3);
}

function getCategoryHref(v: typeof venues[0]): string {
  const map: Record<string, string> = {
    club: `/clubs/${v.region}/${v.slug}`,
    night: `/nights/${v.slug}`,
    lounge: `/lounges/${v.slug}`,
    room: `/rooms/${v.region}/${v.slug}`,
    yojeong: `/yojeong/${v.region}/${v.slug}`,
    hoppa: `/hoppa/${v.slug}`,
  };
  return map[v.category] || `/${v.category}/${v.slug}`;
}

const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

export default function CountdownUrgency() {
  const [picks, setPicks] = useState(getHourlyPicks);
  const [minutesLeft, setMinutesLeft] = useState(60 - new Date().getMinutes());
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    // Simulated realistic viewer count (based on time of day)
    const hour = new Date().getHours();
    const base = hour >= 20 || hour < 4 ? 180 : hour >= 17 ? 120 : 50;
    setViewerCount(base + Math.floor(Math.random() * 60));

    const timer = setInterval(() => {
      const now = new Date();
      const minsLeft = 60 - now.getMinutes();
      setMinutesLeft(minsLeft);

      if (minsLeft === 60) {
        setPicks(getHourlyPicks());
        const h = now.getHours();
        const b = h >= 20 || h < 4 ? 180 : h >= 17 ? 120 : 50;
        setViewerCount(b + Math.floor(Math.random() * 60));
      }
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const hour = new Date().getHours();
  const timeLabel = hour >= 22 ? '심야' : hour >= 20 ? '저녁' : hour >= 17 ? '오후' : hour >= 12 ? '점심' : '오전';

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl border border-[#E11D48]/20 bg-gradient-to-r from-[#FFF1F2] to-[#FFF7ED] p-6">
        {/* Header with urgency */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E11D48] opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#E11D48]" />
            </span>
            <h2 className="text-lg font-bold text-[#111]">{timeLabel} 추천 TOP 3</h2>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-[#E11D48]">{minutesLeft}분 후 변경</p>
            <p className="text-xs text-[#555]">{viewerCount}명 보는 중</p>
          </div>
        </div>

        {/* 3 picks */}
        <div className="space-y-3">
          {picks.map((v, i) => (
            <Link
              key={v.id}
              href={getCategoryHref(v)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-xl bg-white/80 px-4 py-3 transition hover:bg-white hover:shadow-sm"
              style={{ minHeight: 56 }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E11D48] text-sm font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#111] group-hover:text-[#E11D48]">{v.nameKo}</p>
                <p className="text-xs text-[#555]">{catLabel[v.category]} · {v.regionKo}</p>
              </div>
              <span className="text-xs text-[#E11D48]">→</span>
            </Link>
          ))}
        </div>

        <p className="mt-3 text-center text-xs text-[#555]">매 시간 새로운 추천이 나타납니다</p>
      </div>
    </section>
  );
}
