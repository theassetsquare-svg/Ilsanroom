/**
 * useRecentVenues — 최근 본 venue 영구 바 (시즌157A)
 * VenueDetailPage 마운트 시 push, RecentVenuesBar에서 표시.
 * localStorage 백엔드, 20개 LRU.
 */
import { useCallback, useEffect, useState } from 'react';

const KEY = 'nolcool_recent_venues';
const MAX = 20;

export interface RecentVenueItem {
  path: string;
  nameKo: string;
  category: string;
  regionKo: string;
  slug: string;
  visitedAt: number;
}

function load(): RecentVenueItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentVenueItem[]) : [];
  } catch {
    return [];
  }
}

function save(list: RecentVenueItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

export function useRecentVenues() {
  const [items, setItems] = useState<RecentVenueItem[]>(load);

  useEffect(() => save(items), [items]);

  /* cross-tab sync */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const push = useCallback((item: Omit<RecentVenueItem, 'visitedAt'>) => {
    setItems((prev) => {
      const filtered = prev.filter((v) => v.path !== item.path);
      return [{ ...item, visitedAt: Date.now() }, ...filtered].slice(0, MAX);
    });
  }, []);

  const remove = useCallback((path: string) => {
    setItems((prev) => prev.filter((v) => v.path !== path));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, push, remove, clear, count: items.length };
}
