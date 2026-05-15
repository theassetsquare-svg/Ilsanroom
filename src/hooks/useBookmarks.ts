/**
 * useBookmarks — 글 보관함 (디시 검증)
 * 게시판 글·매거진·업소 모두 path 기준 저장
 */
import { useCallback, useEffect, useState } from 'react';

const KEY = 'nolcool_bookmarks';

export interface BookmarkItem {
  path: string;
  title: string;
  savedAt: number;
}

function load(): BookmarkItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BookmarkItem[]) : [];
  } catch {
    return [];
  }
}

function save(list: BookmarkItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

export function useBookmarks() {
  const [items, setItems] = useState<BookmarkItem[]>(load);

  useEffect(() => save(items), [items]);

  const isBookmarked = useCallback(
    (path: string) => items.some((b) => b.path === path),
    [items],
  );

  const toggle = useCallback((path: string, title: string) => {
    setItems((prev) => {
      const exists = prev.some((b) => b.path === path);
      if (exists) return prev.filter((b) => b.path !== path);
      return [{ path, title, savedAt: Date.now() }, ...prev].slice(0, 200);
    });
  }, []);

  const remove = useCallback((path: string) => {
    setItems((prev) => prev.filter((b) => b.path !== path));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, isBookmarked, toggle, remove, clear, count: items.length };
}
