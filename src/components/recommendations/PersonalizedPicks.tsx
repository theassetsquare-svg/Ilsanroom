'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { venues } from '@/data/venues';
import type { Venue } from '@/types';

function getRecentlyViewed(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('neon_recently_viewed') || '[]');
  } catch { return []; }
}

function getLikedVenues(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('neon_liked_venues') || '[]');
  } catch { return []; }
}

export function trackView(venueId: string) {
  if (typeof window === 'undefined') return;
  const recent = getRecentlyViewed();
  const updated = [venueId, ...recent.filter(id => id !== venueId)].slice(0, 20);
  localStorage.setItem('neon_recently_viewed', JSON.stringify(updated));
}

export function toggleLike(venueId: string): boolean {
  if (typeof window === 'undefined') return false;
  const liked = getLikedVenues();
  const isLiked = liked.includes(venueId);
  const updated = isLiked ? liked.filter(id => id !== venueId) : [...liked, venueId];
  localStorage.setItem('neon_liked_venues', JSON.stringify(updated));
  return !isLiked;
}

function getCategoryPath(venue: Venue): string {
  const paths: Record<string, string> = {
    club: `/clubs/${venue.region}/${venue.slug}`,
    night: `/nights/${venue.slug}`,
    lounge: `/lounges/${venue.slug}`,
    room: `/rooms/${venue.region}/${venue.slug}`,
    yojeong: `/yojeong/${venue.region}/${venue.slug}`,
    hoppa: `/hoppa/${venue.slug}`,
    collatek: `/collatek/${venue.slug}`,
  };
  return paths[venue.category] || `/${venue.category}/${venue.slug}`;
}

export default function PersonalizedPicks() {
  const [recommendations, setRecommendations] = useState<Venue[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const recentIds = getRecentlyViewed();
    const likedIds = getLikedVenues();

    if (recentIds.length === 0 && likedIds.length === 0) {
      // No history - show popular venues
      setRecommendations(
        venues
          .filter(v => v.status !== 'closed_or_unclear')
          .sort((a, b) => b.reviewCount - a.reviewCount)
          .slice(0, 6)
      );
      return;
    }

    // Get categories and regions from viewed/liked venues
    const interactedVenues = [...new Set([...recentIds, ...likedIds])]
      .map(id => venues.find(v => v.id === id))
      .filter(Boolean) as Venue[];

    const preferredCategories = new Map<string, number>();
    const preferredRegions = new Map<string, number>();

    interactedVenues.forEach(v => {
      preferredCategories.set(v.category, (preferredCategories.get(v.category) || 0) + 1);
      preferredRegions.set(v.region, (preferredRegions.get(v.region) || 0) + 1);
    });

    // Score venues
    const scored = venues
      .filter(v => v.status !== 'closed_or_unclear' && !recentIds.includes(v.id))
      .map(v => {
        let score = v.rating * 10;
        score += (preferredCategories.get(v.category) || 0) * 30;
        score += (preferredRegions.get(v.region) || 0) * 20;
        if (v.isPremium) score += 15;
        return { venue: v, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    setRecommendations(scored.map(s => s.venue));
  }, []);

  if (!mounted || recommendations.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">당신이 좋아할 곳</h2>
          <p className="mt-1 text-sm text-neutral-500">최근 활동 기반 맞춤 추천</p>
        </div>
        <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-400">AI 추천</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map(venue => (
          <Link
            key={venue.id}
            href={getCategoryPath(venue)}
            className="group rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 transition-all hover:border-violet-500/40 hover:bg-neutral-900"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-lg font-bold text-white group-hover:text-violet-400 transition">{venue.nameKo}</span>
              {venue.isPremium && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">P</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span>{venue.regionKo}</span>
              <span>·</span>
              <span className="text-amber-400">★ {venue.rating}</span>
            </div>
            <p className="mt-2 text-xs text-neutral-600 line-clamp-2">{venue.shortDescription}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
