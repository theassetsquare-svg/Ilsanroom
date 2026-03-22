import { useEffect } from 'react';

/**
 * 동적으로 document.title과 meta description을 설정
 * 모든 페이지에서 사용 — 후킹 제목 + 150자 이내 메타 설명
 */
export function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    // title 설정
    document.title = title;

    // meta description 설정 (150자 이내)
    const trimmedDesc = description.slice(0, 150);
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', trimmedDesc);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      metaDesc.setAttribute('content', trimmedDesc);
      document.head.appendChild(metaDesc);
    }

    // og:title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }

    // og:description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', trimmedDesc);
    }
  }, [title, description]);
}
