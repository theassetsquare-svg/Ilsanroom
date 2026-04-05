
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { venues } from '@/data/venues';

/**
 * [10] NIGHT TIMELINE — Scrollable horizontal timeline
 * "밤 8시: 이 3곳이 뜨기 시작 → 10시: 여기가 피크 → 12시: 새벽 갈 곳"
 * Real-time feel. Users check back at different times.
 */

function getCategoryHref(category: string, slug: string, region: string) {
  const pathMap: Record<string, string> = {
    club: `/clubs/${region}/${slug}`,
    night: `/nights/${slug}`,
    lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`,
    yojeong: `/yojeong/${region}/${slug}`,
    hoppa: `/hoppa/${slug}`,
  };
  return pathMap[category] || `/${category}/${slug}`;
}

const timeSlots = [
  { hour: 18, label: '6PM', title: '저녁 시작', desc: '여유롭게 시작하기 좋은 곳', categories: ['lounge', 'yojeong', 'room'] },
  { hour: 20, label: '8PM', title: '뜨기 시작', desc: '분위기 올라가는 시간', categories: ['lounge', 'room', 'night'] },
  { hour: 22, label: '10PM', title: '피크 타임', desc: '가장 뜨거운 시간대', categories: ['club', 'night', 'hoppa'] },
  { hour: 0, label: '12AM', title: '심야 모드', desc: '밤이 진짜 시작되는 시간', categories: ['club', 'night', 'hoppa'] },
  { hour: 2, label: '2AM', title: '새벽 감성', desc: '마지막까지 즐기는 곳', categories: ['club', 'lounge'] },
];

export default function NightTimeline() {
  const currentHour = new Date().getHours();
  const [activeSlot, setActiveSlot] = useState(() => {
    const idx = timeSlots.findIndex(s => {
      const h = s.hour;
      return currentHour >= h && currentHour < h + 2;
    });
    return idx >= 0 ? idx : 0;
  });

  const slotVenues = useMemo(() => {
    const slot = timeSlots[activeSlot];
    const open = venues.filter(v => v.status !== 'closed_or_unclear' && slot.categories.includes(v.category));
    // Shuffle deterministically based on slot
    return open.sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [activeSlot]);

  return (
    <section className="py-4 max-w-[1200px] mx-auto">
      <h2 className="text-base font-black text-[#111] px-4 mb-3">🌙 시간대별 추천</h2>

      {/* Timeline - horizontal scroll */}
      <div className="overflow-x-auto scrollbar-hide mb-4">
        <div className="flex gap-0 px-4" style={{ minWidth: 'max-content' }}>
          {timeSlots.map((slot, i) => {
            const isActive = i === activeSlot;
            const isNow = currentHour >= slot.hour && currentHour < slot.hour + 2;
            return (
              <button
                key={slot.hour}
                onClick={() => setActiveSlot(i)}
                className="flex flex-col items-center relative"
                style={{ minWidth: 80, minHeight: 44 }}
              >
                {/* Connector line */}
                {i > 0 && (
                  <div className={`absolute top-4 right-1/2 w-full h-0.5 ${
                    i <= activeSlot ? 'bg-[#8B5CF6]' : 'bg-gray-200'
                  }`} style={{ transform: 'translateX(50%)' }} />
                )}
                {/* Dot */}
                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  isActive ? 'bg-[#8B5CF6] text-white scale-110' : isNow ? 'bg-violet-100 text-[#8B5CF6]' : 'bg-gray-100 text-gray-400'
                }`}>
                  <span className="text-xs font-bold">{slot.label}</span>
                </div>
                <span className={`mt-1 text-[10px] font-medium ${isActive ? 'text-[#8B5CF6]' : 'text-gray-400'}`}>
                  {slot.title}
                </span>
                {isNow && (
                  <span className="text-[9px] text-red-500 font-bold">NOW</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot description + venues */}
      <div className="px-4">
        <p className="text-sm text-[#555] mb-3">{timeSlots[activeSlot].desc}</p>
        <div className="grid grid-cols-3 gap-2">
          {slotVenues.map(v => (
            <Link
              key={v.id}
              to={getCategoryHref(v.category, v.slug, v.region)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-[#8B5CF6] hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-sm font-bold text-[#8B5CF6] mb-2">
                {v.nameKo.charAt(0)}
              </div>
              <p className="text-xs font-bold text-[#111] truncate">{v.nameKo}</p>
              <p className="text-[10px] text-[#555] truncate">{v.regionKo}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
