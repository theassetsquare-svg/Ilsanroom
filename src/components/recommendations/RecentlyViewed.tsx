

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { venues } from '@/data/venues';
import type { Venue } from '@/types';

function getCategoryPath(venue: Venue): string {
  const paths: Record<string, string> = {
    club: `/clubs/${venue.region}/${venue.slug}`,
    night: `/nights/${venue.slug}`,
    lounge: `/lounges/${venue.slug}`,
    room: `/rooms/${venue.region}/${venue.slug}`,
    yojeong: `/yojeong/${venue.region}/${venue.slug}`,
    hoppa: `/hoppa/${venue.slug}`,
  };
  return paths[venue.category] || `/${venue.category}/${venue.slug}`;
}

const categoryLabels: Record<string, string> = {
  club: '클럽', night: '나이트', lounge: '라운지', room: '룸',
  yojeong: '요정', hoppa: '호빠',
};

export default function RecentlyViewed() {
  const [recent, setRecent] = useState<Venue[]>([]);

  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('neon_recently_viewed') || '[]');
      const found = ids
        .map(id => venues.find(v => v.id === id))
        .filter(Boolean) as Venue[];
      setRecent(found.slice(0, 5));
    } catch { /* empty */ }
  }, []);

  if (recent.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <h2 className="mb-4 text-lg font-bold text-neon-text">최근 본 업소</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {recent.map(venue => (
          <Link
            key={venue.id}
            to={getCategoryPath(venue)}
            className="flex min-w-[200px] items-center gap-3 rounded-xl border border-neon-border bg-neon-surface/50 px-4 py-3 transition hover:border-violet-500/40"
          >
            <div>
              <p className="text-sm font-medium text-neon-text">{venue.nameKo}</p>
              <p className="text-xs text-neon-text-muted">{categoryLabels[venue.category]} · {venue.regionKo}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
