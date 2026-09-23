import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * [놀쿨11-2] 프리렌더가 #root 밖 #nc-ssr 에 둔 완독 뼈대 본문(<main id="main-content"> 안 <article id="nc-article">)을
 * React 가 마운트된 뒤 이 자리로 끌어안는다 → 크롤러(JS 없음)와 사람이 같은 본문을 본다(숨김 SSR 0).
 *  - 첫 로드: 이미 있는 DOM 노드를 옮긴다(재요청 0) · 옮긴 뒤 #nc-ssr 을 지워 main#main-content 가 하나만 남는다.
 *  - SPA 이동: 그 주소의 프리렌더 HTML 을 같은 출처에서 받아 article 만 꺼내 넣는다(캐시). 없으면 비워 둔다.
 *  - 글은 프리렌더 그대로. 여기서는 옮기기만 한다(창작 0).
 */
const cache = new Map<string, string>();

const dec = (t: string) => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
type NcMeta = { path: string; title: string; desc: string };
export function applyPrerenderMeta(html: string, key: string) {
  const t = html.match(/<title>([^<]*)<\/title>/);
  const d = html.match(/<meta name="description" content="([^"]*)"/);
  const meta: NcMeta = { path: key, title: t ? dec(t[1]) : '', desc: d ? dec(d[1]) : '' };
  const w = window as unknown as { __NC_META_CACHE?: Record<string, NcMeta> };
  w.__NC_META_CACHE = { ...(w.__NC_META_CACHE || {}), [key]: meta };
  if (meta.title && !document.documentElement.hasAttribute('data-stealth')) document.title = meta.title;
  if (meta.desc) { const el = document.querySelector('meta[name="description"]'); if (el) el.setAttribute('content', meta.desc); }
}

function normPath(p: string) {
  return p === '/' ? '/' : p.replace(/\/+$/, '') + '/';
}

export default function SsrArticle() {
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const ssr = document.getElementById('nc-ssr');
    if (ssr) {
      // 첫 로드 — 프리렌더 노드를 그대로 옮긴다
      const art = ssr.querySelector('#nc-article');
      const crumb = ssr.querySelector('.ssr-breadcrumb');
      host.replaceChildren();
      if (crumb) host.appendChild(crumb);
      if (art) host.appendChild(art);
      cache.set(normPath(pathname), host.innerHTML);
      ssr.remove();
      return;
    }
    const key = normPath(pathname);
    if (cache.has(key)) {
      host.innerHTML = cache.get(key) || '';
      const mm = (window as unknown as { __NC_META_CACHE?: Record<string, NcMeta> }).__NC_META_CACHE?.[key];
      if (mm && mm.title && !document.documentElement.hasAttribute('data-stealth')) document.title = mm.title;
      return;
    }
    let alive = true;
    fetch(key, { headers: { Accept: 'text/html' } })
      .then((r) => (r.ok ? r.text() : ''))
      .then((html) => {
        if (!alive) return;
        const m = html.match(/<article id="nc-article"[\s\S]*?<\/article>(?=\s*<\/main>)/);
        const c = html.match(/<nav aria-label="현재 위치" class="ssr-breadcrumb">[\s\S]*?<\/nav>/);
        const out = (c ? c[0] : '') + (m ? m[0] : '');
        cache.set(key, out);
        host.innerHTML = out;
        // 제목·설명 = 프리렌더 값(창고가 만든 고유 제목) — React 의 옛 틀 제목이 덮어쓰지 않게 뒤에서 한 번 더 맞춘다
        applyPrerenderMeta(html, key);
      })
      .catch(() => { if (alive) host.innerHTML = ''; });
    return () => { alive = false; };
  }, [pathname]);

  return <div ref={ref} className="nc-ssr nc-ssr-adopted" data-nc-ssr="adopted" />;
}
