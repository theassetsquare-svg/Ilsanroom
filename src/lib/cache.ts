/**
 * 인메모리 캐싱 레이어
 * Simple in-memory cache with TTL support.
 * Suitable for per-process caching in serverless / edge environments.
 */

// ─── Types ───────────────────────────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Unix timestamp in ms
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

// ─── State ───────────────────────────────────────────────────────────

const store = new Map<string, CacheEntry<unknown>>();

let hits = 0;
let misses = 0;

// ─── Default TTL ─────────────────────────────────────────────────────

/** Default TTL: 5 minutes (in milliseconds) */
const DEFAULT_TTL_MS = 5 * 60 * 1000;

// ─── Functions ───────────────────────────────────────────────────────

/**
 * 캐시에서 값 조회
 * Returns the cached value if it exists and has not expired, otherwise `null`.
 */
export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    misses++;
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    misses++;
    return null;
  }

  hits++;
  return entry.value;
}

/**
 * 캐시에 값 저장
 * Stores a value with an optional TTL (defaults to 5 minutes).
 *
 * @param key   - Cache key
 * @param value - Value to cache
 * @param ttlMs - Time-to-live in milliseconds (default: 300 000)
 */
export function cacheSet<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * 캐시에서 키 삭제
 * Returns `true` if the key existed and was removed.
 */
export function cacheDelete(key: string): boolean {
  return store.delete(key);
}

/**
 * 전체 캐시 초기화
 * Removes all entries and resets hit/miss counters.
 */
export function cacheClear(): void {
  store.clear();
  hits = 0;
  misses = 0;
}

/**
 * 캐시 통계 조회
 */
export function cacheStats(): CacheStats {
  // Purge expired entries before reporting size
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(key);
    }
  }

  const total = hits + misses;
  return {
    size: store.size,
    hits,
    misses,
    hitRate: total === 0 ? 0 : hits / total,
  };
}

/**
 * 캐시 래퍼 (get-or-set 패턴)
 * If the key is cached, returns the cached value.
 * Otherwise calls `fetcher`, caches the result, and returns it.
 *
 * @example
 * const venues = await cacheWrap("venues:gangnam", () => fetchVenues("gangnam"), 60_000);
 */
export async function cacheWrap<T>(
  key: string,
  fetcher: () => T | Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await fetcher();
  cacheSet(key, value, ttlMs);
  return value;
}
