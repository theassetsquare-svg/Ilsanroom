import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

/**
 * 단계 5 — 관리자가 /admin/blocks에서 설정한 페이지 블록 값.
 * 사용: const title = usePageBlock('home', 'hero_h1', '오늘 밤, 어디 갈래?');
 * 폴백 동작: DB값 없거나 enabled=false면 fallback 반환 (즉시 동기 fallback → 비동기 DB 갱신)
 * 캐시: 페이지 키 단위 모듈 레벨 Map. 세션당 1회 fetch.
 */

interface Block {
  block_key: string;
  value: string;
  is_html: boolean;
}

const cache = new Map<string, Map<string, Block>>();
const inflight = new Map<string, Promise<Map<string, Block>>>();
const subscribers = new Set<() => void>();

async function loadPage(pageKey: string): Promise<Map<string, Block>> {
  if (cache.has(pageKey)) return cache.get(pageKey)!;
  if (inflight.has(pageKey)) return inflight.get(pageKey)!;

  const supabase = createClient();
  if (!supabase) {
    cache.set(pageKey, new Map());
    return cache.get(pageKey)!;
  }

  const p = supabase
    .from('page_blocks')
    .select('block_key,value,is_html')
    .eq('page_key', pageKey)
    .eq('enabled', true)
    .then(({ data }) => {
      const m = new Map<string, Block>();
      (data || []).forEach((row: Block) => m.set(row.block_key, row));
      cache.set(pageKey, m);
      inflight.delete(pageKey);
      subscribers.forEach(fn => fn());
      return m;
    }) as unknown as Promise<Map<string, Block>>;

  inflight.set(pageKey, p);
  return p;
}

/** 캐시 전체 무효화 — 관리자 저장 직후 호출 */
export function invalidatePageBlocksCache() {
  cache.clear();
  inflight.clear();
  subscribers.forEach(fn => fn());
}

export function usePageBlock(pageKey: string, blockKey: string, fallback: string): string {
  const [value, setValue] = useState<string>(() => {
    const m = cache.get(pageKey);
    return m?.get(blockKey)?.value || fallback;
  });

  useEffect(() => {
    let cancelled = false;
    const apply = () => {
      if (cancelled) return;
      const m = cache.get(pageKey);
      const v = m?.get(blockKey)?.value;
      setValue(v && v.trim() ? v : fallback);
    };
    subscribers.add(apply);
    loadPage(pageKey).then(apply);
    return () => { cancelled = true; subscribers.delete(apply); };
  }, [pageKey, blockKey, fallback]);

  return value;
}
