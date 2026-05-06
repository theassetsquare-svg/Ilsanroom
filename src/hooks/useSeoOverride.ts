import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createClient } from '@/lib/supabase';

/**
 * 단계 4 — 관리자가 /admin/seo에서 설정한 페이지별 메타 오버라이드를 적용한다.
 * - 전체 enabled 오버라이드를 세션당 1회만 fetch (모듈 레벨 캐시)
 * - 라우트 변경 시 useEffect가 매칭되는 path에 한해 DOM head를 덮어쓴다
 * - useDocumentMeta 다음에 실행되므로 마지막에 적용된 값이 라이브 메타가 됨
 */

interface Override {
  path: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  canonical: string | null;
  robots: string | null;
}

let cache: Map<string, Override> | null = null;
let inflight: Promise<Map<string, Override>> | null = null;

async function loadOverrides(): Promise<Map<string, Override>> {
  if (cache) return cache;
  if (inflight) return inflight;
  const supabase = createClient();
  if (!supabase) {
    cache = new Map();
    return cache;
  }
  inflight = supabase
    .from('seo_overrides')
    .select('path,title,description,og_image,canonical,robots')
    .eq('enabled', true)
    .then(({ data }) => {
      const m = new Map<string, Override>();
      (data || []).forEach((row: Override) => m.set(row.path, row));
      cache = m;
      inflight = null;
      return m;
    }) as unknown as Promise<Map<string, Override>>;
  return inflight;
}

/** 캐시 무효화 — 관리자 저장 직후 호출 */
export function invalidateSeoOverrideCache() {
  cache = null;
  inflight = null;
}

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (el) {
    el.setAttribute('content', value);
  } else {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute('content', value);
    document.head.appendChild(el);
  }
}

export function useSeoOverride() {
  const { pathname } = useLocation();
  useEffect(() => {
    let cancelled = false;
    loadOverrides().then(map => {
      if (cancelled) return;
      const ov = map.get(pathname);
      if (!ov) return;
      if (ov.title) document.title = ov.title;
      if (ov.description) setMeta('name', 'description', ov.description.slice(0, 160));
      if (ov.og_image) {
        setMeta('property', 'og:image', ov.og_image);
        setMeta('name', 'twitter:image', ov.og_image);
      }
      if (ov.canonical) {
        let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'canonical';
          document.head.appendChild(link);
        }
        link.href = ov.canonical;
      }
      if (ov.robots) setMeta('name', 'robots', ov.robots);
    });
    return () => { cancelled = true; };
  }, [pathname]);
}
