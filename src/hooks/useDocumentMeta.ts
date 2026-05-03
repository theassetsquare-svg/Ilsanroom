import { useEffect } from 'react';
// react-helmet-async는 HelmetProvider에서 사용됨

/**
 * react-helmet-async + DOM 직접 조작 병행
 * - Helmet: SSR/프리렌더링 시 head 태그 자동 관리
 * - useEffect: 클라이언트 SPA 네비게이션 시 즉시 반영
 * 모든 페이지에서 기존 호출 패턴 그대로 사용
 */
/* ── 프라이버시 — 카톡 공유 위장 ──
   og:title / og:description / og:image / twitter:* 는 항상 중립 고정.
   Kakao/Twitter/Facebook 미리보기에 업소·업종 단어 절대 노출 X.
   SEO는 <title>·<meta name=description>·페이지 본문이 담당하므로 영향 없음.
   유흥 사용자가 친구 단톡방·연인 카톡에 링크 보내도 안전. */
const SAFE_OG_TITLE = '놀쿨 — 오늘 밤 가이드';
const SAFE_OG_DESC = '전국 실시간. 친구·연인과 어디 갈지 한 곳에서.';
const SAFE_OG_IMAGE = 'https://nolcool.com/og/nolcool-og.jpg';

export function useDocumentMeta(title: string, description: string, _ogImage?: string, keywords?: string) {
  useEffect(() => {
    // 브라우저 탭 제목 — Stealth 모드에서 위장됨 (StealthMode 컴포넌트가 처리)
    if (!document.documentElement.hasAttribute('data-stealth')) {
      document.title = title;
    }

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

    // Standard meta — SEO용 (Google 검색)
    setMeta('name', 'description', trimmedDesc);
    if (keywords) setMeta('name', 'keywords', keywords);

    // Open Graph — 항상 중립 (Kakao/Facebook 공유 미리보기 위장)
    setMeta('property', 'og:title', SAFE_OG_TITLE);
    setMeta('property', 'og:description', SAFE_OG_DESC);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', currentUrl);
    setMeta('property', 'og:locale', 'ko_KR');
    setMeta('property', 'og:site_name', '놀쿨');
    setMeta('property', 'og:image', SAFE_OG_IMAGE);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '1200');

    // Twitter Card — 항상 중립
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', SAFE_OG_TITLE);
    setMeta('name', 'twitter:description', SAFE_OG_DESC);
    setMeta('name', 'twitter:image', SAFE_OG_IMAGE);

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
  }, [title, description, _ogImage, keywords]);
}
