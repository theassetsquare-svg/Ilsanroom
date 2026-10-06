import { useSyncExternalStore, type HTMLAttributes, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * [놀쿨34-1 · C5·G2] 쪽의 큰 제목(h1) = 그 쪽의 제목(<title>) 글자 그대로.
 *
 * 구글은 자바스크립트를 돌린 뒤의 화면을 본다. 프리렌더 HTML 의 h1 만 제목과 맞추면 React 가 첫 화면을 다시 그릴 때
 * 화면마다 따로 적어 둔 h1(「소셜댄스 · 부킹 명소」 같은 문구)로 돌아가 버린다(34-1 실측: 그린 뒤 h1 = 제목 3/75쪽).
 * 그래서 화면의 h1 은 이 컴포넌트 하나를 거친다 — 프리렌더가 그 주소에 만든 제목(window.__NC_META · 사이트 안 이동은
 * SsrArticle 이 받아 둔 __NC_META_CACHE)이 있으면 그 글자를, 없으면(프리렌더가 없는 주소) 원래 넣어 둔 글자를 그린다.
 * 제목 읽는 법은 useDocumentMeta 와 같다(같은 주소 꼴 · 같은 자리) → document.title = h1.
 *
 * 모양: 「머리 — 꼬리」 꼴 제목은 머리를 h1 크기 그대로, 꼬리를 작게 한 줄 아래에 둔다(글자는 한 h1 안에 그대로 · 빠지는 글자 0).
 */
type Meta = { path: string; title: string };
type Win = { __NC_META?: Meta; __NC_META_CACHE?: Record<string, Meta> };

export const NC_META_EVENT = 'nolcool:meta';

function readTitle(): string {
  try {
    const w = window as unknown as Win;
    const cur = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`;
    const pm = w.__NC_META && w.__NC_META.path === cur ? w.__NC_META : (w.__NC_META_CACHE || {})[cur];
    return (pm && pm.title) || '';
  } catch {
    return '';
  }
}
function subscribe(cb: () => void) {
  window.addEventListener(NC_META_EVENT, cb);
  return () => window.removeEventListener(NC_META_EVENT, cb);
}

const SEP = ' — ';
const TAIL_STYLE = { display: 'block', fontSize: '0.58em', fontWeight: 700, lineHeight: 1.35, marginTop: '0.3em', letterSpacing: '-0.01em' } as const;
const LONG_STYLE = { fontSize: '0.74em', lineHeight: 1.3 } as const;

export default function NcH1({ children, ...rest }: HTMLAttributes<HTMLHeadingElement> & { children?: ReactNode }) {
  useLocation(); // 주소가 바뀌면 다시 그린다(같은 화면 컴포넌트가 주소만 바뀌어 남는 경우)
  const title = useSyncExternalStore(subscribe, readTitle, () => '');
  if (!title) return <h1 {...rest}>{children}</h1>;
  const i = title.indexOf(SEP);
  if (i > 0) {
    return (
      <h1 {...rest}>
        {title.slice(0, i)}{' '}
        <span style={TAIL_STYLE}>— {title.slice(i + SEP.length)}</span>
      </h1>
    );
  }
  return <h1 {...rest}>{title.length > 20 ? <span style={LONG_STYLE}>{title}</span> : title}</h1>;
}
