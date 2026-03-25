import { useEffect } from 'react';

/**
 * 동적으로 document.title과 meta description을 설정
 * 모든 페이지에서 사용 — 후킹 제목 + 150자 이내 메타 설명
 */
export function useDocumentMeta(title: string, description: string, ogImage?: string) {
  useEffect(() => {
    document.title = title;

    const trimmedDesc = description.slice(0, 150);

    // meta description
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

    setMeta('name', 'description', trimmedDesc);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', trimmedDesc);
    setMeta('property', 'og:type', 'website');

    if (ogImage) {
      setMeta('property', 'og:image', ogImage);
      setMeta('property', 'og:image:width', '1200');
      setMeta('property', 'og:image:height', '630');
    }
  }, [title, description, ogImage]);
}
