/**
 * 모든 내부 라우팅 링크는 새 탭에서 열림 (CLAUDE.md "All links open in new tab" 규칙).
 * react-router-dom의 Link를 감싸 target/rel 기본값을 주입.
 * 호출부에서 target/rel을 명시하면 명시값이 우선.
 */
import { forwardRef } from 'react';
import { Link as RouterLink, LinkProps } from 'react-router-dom';

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
  const { target = '_blank', rel = 'noopener noreferrer', ...rest } = props;
  return <RouterLink ref={ref} target={target} rel={rel} {...rest} />;
});

// NavLink는 라우트 일치 시 active 스타일이 필요한 헤더/탭 등에서만 사용. 같은 정책 적용.
export { NavLink } from 'react-router-dom';
