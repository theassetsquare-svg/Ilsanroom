/**
 * [플랫폼 트랙 P · 설계도 14장] 페이지 고유 레이아웃 변형 엔진 — prerender-seo.mjs 가 쓴다.
 *   - 글(문장·숫자·제목·URL)은 한 글자도 바꾸지 않는다. 마크업(섹션 순서·요소 형태·클래스 토큰·페이지별 CSS)만 바꾼다.
 *   - 브랜드 껍데기(카테고리 nav·사이트맵 footer·로고·팔레트)는 건드리지 않는다(14-2). 이 함수는 본문(ssrBody)만 받는다.
 *   - 같은 주소면 항상 같은 결과(주소 해시 씨앗) → 빌드마다 lastmod 가 흔들리지 않는다.
 *
 *   transformSsr(ssrBody, routePath) → 변형된 본문
 *   pageTokens(routePath)            → { id, style, heroClass, heroVariant }  (renderPage 의 hero·head 용)
 */

/* ── 씨앗 ── */
export function seedOf(route) {
  let h = 0x811c9dc5;
  for (let i = 0; i < route.length; i++) { h ^= route.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
function mix(seed, off) {
  let x = (seed ^ Math.imul(off + 1, 0x9e3779b9)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}
const pick = (seed, off, arr) => arr[mix(seed, off) % arr.length];
function shuffle(arr, seed) {
  const a = arr.slice(); let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 1103515245 + 12345) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function pageId(route) { return 'u' + seedOf(route).toString(36).padStart(7, '0'); }

/* ── 아주 작은 HTML 트리 (생성기가 만든 정형 HTML 전용) ── */
const VOID = new Set(['img', 'br', 'hr', 'meta', 'link', 'input', 'source', 'wbr']);
function parse(html) {
  const root = { tag: '#root', attrs: '', children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s=>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|[^<]+|</g;
  let m;
  while ((m = re.exec(html))) {
    const s = m[0];
    if (!s) { re.lastIndex++; continue; }
    if (s.startsWith('<!--')) { stack[stack.length - 1].children.push({ text: s }); continue; }
    if (m[1]) { // 닫는 태그
      const name = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) { if (stack[i].tag === name) { stack.length = i; break; } }
      continue;
    }
    if (m[2]) {
      const name = m[2].toLowerCase();
      const node = { tag: name, attrs: m[3] || '', children: [] };
      stack[stack.length - 1].children.push(node);
      if (!VOID.has(name) && !m[4]) stack.push(node);
      continue;
    }
    stack[stack.length - 1].children.push({ text: s });
  }
  return root;
}
function serialize(node) {
  if (node.text !== undefined) return node.text;
  if (node.tag === '#root') return node.children.map(serialize).join('');
  const open = `<${node.tag}${node.attrs ? node.attrs : ''}>`;
  if (VOID.has(node.tag)) return open;
  return open + node.children.map(serialize).join('') + `</${node.tag}>`;
}
function hasClass(node, cls) { return new RegExp(`class="[^"]*\\b${cls}\\b`).test(node.attrs || ''); }
/* 브랜드 껍데기(카테고리 nav·사이트맵 footer·건너뛰기 링크·브레드크럼) — 14-2: 손대지 않는다 */
const isShell = (node) => node.text === undefined && (/aria-label="(카테고리|사이트맵|현재 위치)"/.test(node.attrs || '') || hasClass(node, 'skip-link') || hasClass(node, 'ssr-breadcrumb'));
function firstTextIs(node, re) { return re.test(serialize(node).replace(/<[^>]+>/g, '').slice(0, 40)); }

/* ── 1) 섹션 순서 ── */
/* article/main 바로 아래 자식들을 「머리(고정)·몸통(섞음)·꼬리(고정)」로 나눠 몸통만 씨앗 순서로 */
function reorder(container, seed) {
  // 껍데기(건너뛰기 링크·카테고리 nav → 맨 앞 / 사이트맵 footer → 맨 뒤)는 자리 고정
  const front = [], back = [], rest = [];
  for (const n of container.children) {
    if (isShell(n)) { (/aria-label="사이트맵"/.test(n.attrs || '') ? back : front).push(n); } else rest.push(n);
  }
  const kids = rest;
  const isHead = (n) => n.text !== undefined || /^h[12]$/.test(n.tag) || hasClass(n, 'ssr-answer') || hasClass(n, 'ssr-phone') || hasClass(n, 'ssr-hours') || hasClass(n, 'ssr-age')
    || (n.tag === 'p' && /itemprop="description"/.test(n.attrs)) || (n.tag === 'div' && /itemprop="description"/.test(n.attrs)) || hasClass(n, 'ssr-breadcrumb') || n.tag === 'nav';
  const isTail = (n) => n.tag === 'footer' || (n.tag === 'p' && firstTextIs(n, /^(직접 가보면|한 번 방문하면|와서 보면|겪어보면|처음 |[가-힣]+ 지역에서)/));
  let i = 0; while (i < kids.length && isHead(kids[i])) i++;
  let j = kids.length; while (j > i && (isTail(kids[j - 1]) || kids[j - 1].text !== undefined)) j--;
  const body = kids.slice(i, j);
  // 몸통은 <section>/<h2+p 묶음> 단위로 묶는다: h2 는 다음 h2·section 전까지 한 덩어리
  const groups = []; let cur = null;
  for (const n of body) {
    if (n.tag === 'section' || n.tag === 'article' || n.tag === 'div' && /itemprop="description"/.test(n.attrs)) { cur = null; groups.push([n]); continue; }
    if (/^h[23]$/.test(n.tag)) { cur = [n]; groups.push(cur); continue; }
    if (cur) cur.push(n); else groups.push([n]);
  }
  if (groups.length < 2) { container.children = front.concat(kids, back); return; }
  const shuffled = shuffle(groups, seed);
  container.children = front.concat(kids.slice(0, i), shuffled.flat(), kids.slice(j), back);
}

/* ── 2) 요소 형태 변형 (글 불변) ── */
function reshape(node, seed, path) {
  if (node.text !== undefined || isShell(node)) return;
  const off = path.length * 7 + (node.tag.charCodeAt(0) || 0);
  if (node.tag === 'section' && !/aria-label|itemscope/.test(node.attrs)) node.tag = pick(seed, off, ['section', 'div', 'section', 'div']);
  if (node.tag === 'ul' && !/aria-label|class="[^"]*nav/.test(node.attrs) && node.children.every((c) => c.text !== undefined || c.tag === 'li')) {
    const v = pick(seed, off + 1, ['ul', 'ol', 'ul', 'div']);
    if (v === 'div') { node.tag = 'div'; for (const c of node.children) if (c.tag === 'li') c.tag = 'p'; } else node.tag = v;
  }
  if (node.tag === 'dl') {
    const v = pick(seed, off + 2, ['dl', 'dl', 'div', 'section']);
    if (v !== 'dl') { node.tag = v; for (const c of node.children) { if (c.tag === 'dt') c.tag = 'h3'; else if (c.tag === 'dd') c.tag = 'p'; } }
  }
  if (node.tag === 'h3' && pick(seed, off + 3, [0, 1]) === 1) node.tag = 'h4';
  if (node.tag === 'p' && pick(seed, off + 4, [0, 0, 0, 1]) === 1 && !/itemprop|class=/.test(node.attrs)) node.tag = 'div';
  node.children.forEach((c, k) => reshape(c, seed, path.concat(k)));
}

/* ── 3) 클래스 토큰 (페이지별 해시, 기존 클래스는 뒤에 보존) ── */
function tokenize(node, id, counter, depth) {
  if (node.text !== undefined || isShell(node)) return;
  if (node.tag !== '#root') {
    const n = counter.n++;
    const tok = `${id}-${(mix(n, depth) % 46656).toString(36)}`;
    if (/\sclass="/.test(node.attrs)) node.attrs = node.attrs.replace(/\sclass="([^"]*)"/, (m, c) => ` class="${tok} ${c}"`);
    else node.attrs = ` class="${tok}"` + node.attrs;
  }
  node.children.forEach((c) => tokenize(c, id, counter, depth + 1));
}

export function transformSsr(ssrBody, routePath) {
  if (!ssrBody) return ssrBody;
  const seed = seedOf(routePath);
  const root = parse(ssrBody);
  // 본문 컨테이너: <article> 이 있으면 그 안, 없으면 최상위
  const containers = [];
  const walk = (n) => { if (n.text !== undefined) return; if (n.tag === 'article' || n.tag === 'main') containers.push(n); n.children.forEach(walk); };
  walk(root);
  if (!containers.length) containers.push(root);
  for (const c of containers) reorder(c, seed);
  reshape(root, seed, []);
  tokenize(root, pageId(routePath), { n: 0 }, 0);
  return serialize(root);
}

/* ── 4) 페이지별 CSS·hero 변형 ── */
const PALETTE = ['#7c3aed', '#0ea5e9', '#e11d48', '#f59e0b', '#10b981', '#6366f1', '#d946ef', '#0891b2', '#dc2626', '#65a30d'];
export function pageTokens(routePath) {
  const seed = seedOf(routePath); const id = pageId(routePath);
  const accent = pick(seed, 101, PALETTE);
  const radius = pick(seed, 102, [8, 12, 16, 20, 24]);
  const pad = pick(seed, 103, [72, 80, 88, 96]);
  const h1 = pick(seed, 104, [22, 24, 26, 28]);
  const font = pick(seed, 105, ['"Pretendard", "Noto Sans KR", system-ui, sans-serif', '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif', 'system-ui, "Malgun Gothic", sans-serif', '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif']);
  const gap = pick(seed, 106, [8, 10, 12, 14, 16]);
  const heroVariant = pick(seed, 107, ['img-top', 'title-top', 'img-top', 'band']);
  const style = `<style data-page="${id}">:root{--${id}-a:${accent};--${id}-r:${radius}px;--${id}-g:${gap}px}` +
    `.${id}-hero{padding:${pad}px 16px 24px;font-family:${font}}` +
    `.${id}-hero h1{font-size:${h1}px;border-left:${pick(seed, 108, [0, 3, 4, 6])}px solid var(--${id}-a);padding-left:${pick(seed, 109, [0, 8, 10, 12])}px}` +
    `.${id}-hero img{border-radius:var(--${id}-r)}` +
    `.${id}-hero p{margin-top:var(--${id}-g)}` +
    (heroVariant === 'band' ? `.${id}-hero{background:linear-gradient(180deg,${accent}14,transparent);border-radius:var(--${id}-r)}` : '') +
    `</style>`;
  return { id, style, heroClass: `${id}-hero`, heroVariant, accent };
}
