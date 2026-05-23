/**
 * 내부 라우팅 링크 정책 (2026-05-22 변경):
 * - 내부 링크(react-router) = 같은 탭 (target 없음) → SPA 네비, pageview/세션 증가, SEO/CWV 유리
 * - 외부 링크는 일반 <a> 태그로 작성하고 target="_blank" rel="noopener noreferrer" 유지
 * 호출부에서 target을 명시하면 명시값이 우선 (예예외 케이스 허용).
 *
 * 2026-05-24 추가: prefetch on hover/touchstart/visible → 다음 페이지 0초 전환.
 * - 한 번 prefetch 한 href는 sessionStorage Set으로 중복 차단
 * - external href / hash-only는 prefetch 안 함
 */
import { forwardRef, useEffect, useRef } from 'react';
import { Link as RouterLink, LinkProps } from 'react-router-dom';

const prefetched = new Set<string>();

function prefetch(href: string) {
  if (typeof window === 'undefined') return;
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
  if (/^https?:\/\//i.test(href) && !href.includes(window.location.host)) return;
  const key = href.split('#')[0];
  if (prefetched.has(key)) return;
  prefetched.add(key);
  // 브라우저 idle 때 HTML 미리 받기 → CF Pages edge cache hit + 클라이언트 캐시 활용
  try {
    fetch(key, { credentials: 'same-origin', priority: 'low' as any, mode: 'no-cors' }).catch(() => {});
  } catch {}
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
  const { target, rel, to, onMouseEnter, onTouchStart, ...rest } = props;
  const safeRel = target === '_blank' ? (rel ?? 'noopener noreferrer') : rel;
  const innerRef = useRef<HTMLAnchorElement | null>(null);

  // IntersectionObserver — 뷰포트 진입 시 1회 prefetch
  useEffect(() => {
    if (target === '_blank') return;
    const el = innerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const href = typeof to === 'string' ? to : '';
    if (!href) return;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          // 메인 콘텐츠 로딩 끝난 뒤로 미루기
          if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => prefetch(href), { timeout: 2000 });
          } else {
            setTimeout(() => prefetch(href), 500);
          }
          io.disconnect();
          break;
        }
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [to, target]);

  const setRef = (node: HTMLAnchorElement | null) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLAnchorElement | null>).current = node;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (target !== '_blank' && typeof to === 'string') prefetch(to);
    onMouseEnter?.(e);
  };
  const handleTouchStart = (e: React.TouchEvent<HTMLAnchorElement>) => {
    if (target !== '_blank' && typeof to === 'string') prefetch(to);
    onTouchStart?.(e);
  };

  return (
    <RouterLink
      ref={setRef}
      to={to}
      target={target}
      rel={safeRel}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      {...rest}
    />
  );
});

// NavLink는 라우트 일치 시 active 스타일이 필요한 헤더/탭 등에서만 사용. 같은 정책 적용.
export { NavLink } from 'react-router-dom';
