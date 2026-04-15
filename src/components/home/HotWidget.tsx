

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPopularVenues } from '@/data/venues';
import type { Venue } from '@/types';

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

function getCategoryLabel(cat: string) {
  const map: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
  return map[cat] || cat;
}

export default function HotWidget() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setVenues(getPopularVenues(5));
  }, []);

  // Pulse every 5 seconds (heartbeat effect)
  useEffect(() => {
    let pulseTimer: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      setPulse(true);
      pulseTimer = setTimeout(() => setPulse(false), 600);
    }, 5000);
    return () => { clearInterval(interval); clearTimeout(pulseTimer); };
  }, []);

  if (venues.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full bg-neon-pink transition-all duration-300 ${pulse ? 'scale-125 shadow-[0_0_12px_rgba(244,63,94,0.6)]' : 'scale-100'}`} />
        <h2 className="text-xl font-bold text-neon-text">지금 뜨는 TOP 5</h2>
        <span className="text-xs text-neon-text-muted">실시간</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {venues.map((v, i) => (
          <Link key={v.id}
            to={getCategoryHref(v.category, v.slug, v.region)}
            className="group flex items-center gap-3 rounded-2xl border border-neon-border bg-neon-surface/50 px-4 py-4 transition-all hover:border-neon-primary/40 card-hover"
            style={{ minHeight: '80px' }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6] text-sm font-bold text-white">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neon-text group-hover:text-neon-primary-light">{v.nameKo}</p>
              <p className="truncate text-xs text-neon-text-muted">
                {!v.nameKo.includes(v.regionKo) && <>{v.regionKo} · </>}
                {v.shortDescription ? <span className="line-clamp-1">{v.shortDescription}</span> : getCategoryLabel(v.category)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
