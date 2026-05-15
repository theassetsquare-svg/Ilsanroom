/**
 * useRecentPosts — 최근 본 글 (디시 검증)
 * 페이지 진입시 자동 트래킹 (커뮤니티 글·업소 상세)
 */
import { useCallback, useEffect, useState } from 'react';

const KEY = 'nolcool_recent_posts';
const MAX = 50;

export interface RecentItem {
  path: string;
  title: string;
  viewedAt: number;
}

function load(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

function save(list: RecentItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

/** 페이지에서 호출 — 자동 기록 */
export function useTrackRecent(path: string, title: string) {
  useEffect(() => {
    if (!path || !title) return;
    const prev = load().filter((r) => r.path !== path);
    const next = [{ path, title, viewedAt: Date.now() }, ...prev].slice(0, MAX);
    save(next);
  }, [path, title]);
}

/** /my/customize에서 사용 — 리스트 + 삭제 */
export function useRecentPosts() {
  const [items, setItems] = useState<RecentItem[]>(load);

  useEffect(() => save(items), [items]);

  const remove = useCallback((path: string) => {
    setItems((prev) => prev.filter((r) => r.path !== path));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, remove, clear, count: items.length };
}
