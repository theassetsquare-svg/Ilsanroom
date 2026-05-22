/**
 * 내부 라우팅 링크 정책 (2026-05-22 변경):
 * - 내부 링크(react-router) = 같은 탭 (target 없음) → SPA 네비, pageview/세션 증가, SEO/CWV 유리
 * - 외부 링크는 일반 <a> 태그로 작성하고 target="_blank" rel="noopener noreferrer" 유지
 * 호출부에서 target을 명시하면 명시값이 우선 (예외 케이스 허용).
 */
import { forwardRef } from 'react';
import { Link as RouterLink, LinkProps } from 'react-router-dom';

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
  // target 미지정 시 같은 탭. 호출부가 target="_blank"을 명시하면 자동으로 rel도 보강.
  const { target, rel, ...rest } = props;
  const safeRel = target === '_blank' ? (rel ?? 'noopener noreferrer') : rel;
  return <RouterLink ref={ref} target={target} rel={safeRel} {...rest} />;
});

// NavLink는 라우트 일치 시 active 스타일이 필요한 헤더/탭 등에서만 사용. 같은 정책 적용.
export { NavLink } from 'react-router-dom';
