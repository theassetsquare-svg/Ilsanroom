import { useState, useEffect } from 'react';
import { createClient, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { articles as localArticles, type MagazineArticle } from '@/data/magazine-articles';

interface DbArticle {
  id: string;
  title: string;
  excerpt: string;
  tag: string;
  date: string;
  content: string;
  cover_image?: string | null;
  is_published?: boolean;
  view_count?: number;
}

function dbToArticle(r: DbArticle): MagazineArticle {
  return { id: r.id, title: r.title, excerpt: r.excerpt, tag: r.tag, date: r.date, content: r.content };
}

// ★ 시즌70 — anon key 401(만료/회전)시 localStorage 영구 마킹 (key prefix 기반 자동 만료)
// 새 빌드에 새 key가 박히면 prefix 불일치로 마킹 자동 해제 → DB 자동 복귀
const SKIP_KEY = 'nolcool-magazine-db-401';
const KEY_FINGERPRINT = (SUPABASE_ANON_KEY || '').slice(0, 24);
let memSkip = false;
function isSkipped(): boolean {
  if (memSkip) return true;
  try {
    if (typeof localStorage === 'undefined') return false;
    const v = localStorage.getItem(SKIP_KEY);
    if (v && v === KEY_FINGERPRINT) { memSkip = true; return true; }
    if (v && v !== KEY_FINGERPRINT) { localStorage.removeItem(SKIP_KEY); }
  } catch { /* noop */ }
  return false;
}
function markSkip() {
  memSkip = true;
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(SKIP_KEY, KEY_FINGERPRINT); } catch { /* noop */ }
}

// ★ Promise singleton — 같은 페이지에서 useArticle+useArticles 동시 마운트시 fetch 1회만 발사
let listPromise: Promise<MagazineArticle[] | null> | null = null;
const idPromiseCache: Record<string, Promise<MagazineArticle | null>> = {};

function fetchList(): Promise<MagazineArticle[] | null> {
  if (isSkipped()) return Promise.resolve(null);
  if (listPromise) return listPromise;
  const supabase = createClient();
  if (!supabase) return Promise.resolve(null);
  const p: Promise<MagazineArticle[] | null> = Promise.resolve(
    supabase
      .from('magazine_articles')
      .select('*')
      .eq('is_published', true)
      .order('date', { ascending: false })
  ).then(({ data, error }) => {
    if (error) {
      const msg = String((error as { message?: string }).message || '');
      const code = String((error as { code?: string }).code || '');
      if (/401|jwt|api key|unauthor/i.test(msg) || code === 'PGRST301') markSkip();
      return null;
    }
    return data && data.length > 0 ? (data as DbArticle[]).map(dbToArticle) : null;
  }).catch(() => { markSkip(); return null; });
  listPromise = p;
  return p;
}

function fetchOne(id: string): Promise<MagazineArticle | null> {
  if (isSkipped()) return Promise.resolve(null);
  const cached = idPromiseCache[id];
  if (cached) return cached;
  // ★ 시즌70 — 별도 fetch 대신 list 결과에서 찾기 → detail 페이지 fetch 1회로 통합
  const p: Promise<MagazineArticle | null> = fetchList().then(list => {
    if (!list) return null;
    return list.find(a => a.id === id) || null;
  });
  idPromiseCache[id] = p;
  return p;
}

/** 매거진 전체 목록 (DB 우선, 없으면 로컬 폴백) */
export function useArticles() {
  const [articles, setArticles] = useState<MagazineArticle[]>(localArticles);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchList().then(list => {
      if (cancelled) return;
      if (list) setArticles(list);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { articles, loading };
}

/** 단일 글 (id 기반) */
export function useArticle(id: string | undefined) {
  const local = id ? localArticles.find(a => a.id === id) : undefined;
  const [article, setArticle] = useState<MagazineArticle | null>(local || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    fetchOne(id).then(a => {
      if (cancelled) return;
      if (a) setArticle(a);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  return { article, loading };
}
