/**
 * useCompareList — 비교 모드 선택 목록 (시즌157C)
 * 최대 4 venue, /compare 페이지에서 양주/부스/룸/사진/연락처 5축 표.
 */
import { useCallback, useEffect, useState } from 'react';

const KEY = 'nolcool_compare_list';
const MAX = 4;

export interface CompareItem {
  path: string;
  nameKo: string;
  category: string;
  regionKo: string;
  slug: string;
  addedAt: number;
}

function load(): CompareItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CompareItem[]) : [];
  } catch {
    return [];
  }
}

function save(list: CompareItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

export function useCompareList() {
  const [items, setItems] = useState<CompareItem[]>(load);

  useEffect(() => save(items), [items]);

  /* cross-tab sync */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isInList = useCallback(
    (path: string) => items.some((v) => v.path === path),
    [items],
  );

  const toggle = useCallback((item: Omit<CompareItem, 'addedAt'>) => {
    setItems((prev) => {
      const exists = prev.some((v) => v.path === item.path);
      if (exists) return prev.filter((v) => v.path !== item.path);
      if (prev.length >= MAX) return prev;
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, []);

  const remove = useCallback((path: string) => {
    setItems((prev) => prev.filter((v) => v.path !== path));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, isInList, toggle, remove, clear, count: items.length, max: MAX, isFull: items.length >= MAX };
}
