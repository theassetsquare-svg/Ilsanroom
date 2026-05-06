import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
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

/** 매거진 전체 목록 (DB 우선, 없으면 로컬 폴백) */
export function useArticles() {
  const [articles, setArticles] = useState<MagazineArticle[]>(localArticles);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }

    supabase
      .from('magazine_articles')
      .select('*')
      .eq('is_published', true)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data && data.length > 0) {
          setArticles((data as DbArticle[]).map(dbToArticle));
        }
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
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }

    supabase
      .from('magazine_articles')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setArticle(dbToArticle(data as DbArticle));
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  return { article, loading };
}
