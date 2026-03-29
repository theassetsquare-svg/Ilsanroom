import { useEffect } from 'react';

/**
 * 동적으로 document.title과 meta description을 설정
 * 모든 페이지에서 사용 — 후킹 제목 + 150자 이내 메타 설명
 * og:title, og:description, og:image, og:url, canonical, Twitter Card 전부 설정
 */
export function useDocumentMeta(title: string, description: string, ogImage?: string) {
  useEffect(() => {
    // 모든 페이지 title 끝에 "| 놀쿨" 브랜딩 (이미 포함된 경우 제외)
    const branded = title.includes('놀쿨') ? title : `${title} | 놀쿨`;
    document.title = branded;

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

    // Open Graph — og:title에 가게이름 전체 포함
    setMeta('property', 'og:title', branded);
    setMeta('property', 'og:description', trimmedDesc);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', currentUrl);
    setMeta('property', 'og:locale', 'ko_KR');
    setMeta('property', 'og:site_name', '놀쿨');

    if (ogImage) {
      setMeta('property', 'og:image', ogImage);
      setMeta('property', 'og:image:width', '1200');
      setMeta('property', 'og:image:height', '630');
    }

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', branded);
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
