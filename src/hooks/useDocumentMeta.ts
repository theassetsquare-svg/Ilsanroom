import { useEffect } from 'react';
// react-helmet-async는 HelmetProvider에서 사용됨

/**
 * react-helmet-async + DOM 직접 조작 병행
 * - Helmet: SSR/프리렌더링 시 head 태그 자동 관리
 * - useEffect: 클라이언트 SPA 네비게이션 시 즉시 반영
 * 모든 페이지에서 기존 호출 패턴 그대로 사용
 */
export function useDocumentMeta(title: string, description: string, ogImage?: string) {
  useEffect(() => {
    document.title = title;

    const trimmedDesc = description.slice(0, 150);
    const currentUrl = window.location.href;

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

    // Standard meta
    setMeta('name', 'description', trimmedDesc);

    // Open Graph
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', trimmedDesc);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', currentUrl);
    setMeta('property', 'og:locale', 'ko_KR');
    setMeta('property', 'og:site_name', '놀쿨');

    if (ogImage) {
      setMeta('property', 'og:image', ogImage);
      setMeta('property', 'og:image:width', '1200');
      setMeta('property', 'og:image:height', '1200');
    }

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', trimmedDesc);
    if (ogImage) {
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
  }, [title, description, ogImage]);
}
