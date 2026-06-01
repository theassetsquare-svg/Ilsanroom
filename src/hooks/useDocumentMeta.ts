import { useEffect } from 'react';

/**
 * SPA 네비게이션 시 head 메타 즉시 반영.
 * SSR HTML은 prerender-seo.mjs가 페이지별 og/twitter/canonical을 박아둠 (renderPage).
 * 시즌22 — SAFE_OG_* 강제 덮어쓰기 제거. SSR이 박은 page-specific og/twitter 값을 hydration 후에도 유지.
 * (메모리 project_og_dynamic: og 및 twitter 메타 페이지별 동적, 통일 금지.)
 */
export function useDocumentMeta(title: string, description: string, ogImage?: string, keywords?: string) {
  useEffect(() => {
    // 브라우저 탭 제목 — Stealth 모드에서 위장됨 (StealthMode 컴포넌트가 처리)
    if (!document.documentElement.hasAttribute('data-stealth')) {
      document.title = title;
    }

    const trimmedDesc = description.slice(0, 150);
    // canonical/og:url은 sitemap·prerender와 동일하게 trailing slash 통일.
    // (Googlebot이 slash 없는 URL을 렌더하면 SSR canonical을 덮어써 '불일치'로 잡힘)
    const { origin, pathname } = window.location;
    const normalizedPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
    const currentUrl = `${origin}${normalizedPath}`;

    const setMeta = (attr: string, key: string, value: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (el) {
        el.setAttribute('content', value);
      } else {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        el.setAttribute('content', value);
        document.head.appendChild(el);
      }
    };

    // Standard meta — SEO용
    setMeta('name', 'description', trimmedDesc);
    if (keywords) setMeta('name', 'keywords', keywords);

    // Open Graph + Twitter — page-specific (SSR 값과 일치)
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', trimmedDesc);
    setMeta('property', 'og:url', currentUrl);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', trimmedDesc);
    if (ogImage) {
      setMeta('property', 'og:image', ogImage);
      setMeta('name', 'twitter:image', ogImage);
    }

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      canonical.href = currentUrl;
    } else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = currentUrl;
      document.head.appendChild(canonical);
    }
  }, [title, description, ogImage, keywords]);
}
