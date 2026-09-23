/**
 * [놀쿨11-2] 완독 뼈대 엔진 — 쪽 유형 6종(venue·list·hub·magazine·community·guide)의 SSR 본문을 한 뼈대로 세운다.
 *
 *   순서(11-1 명세): ① 첫 화면 직답(2~3문장) → ② 사실/표(장부 값만) → ③ 소제목 3+ 본문 → ④ FAQ 3~5(화면 dl = FAQPage JSON-LD)
 *                     → ⑤ 한 줄 정리 → ⑥ 「다음에 볼 곳」(11-4 가 채운다 · 자리 + 이미 있는 허브 링크)
 *   - 글(문장·숫자·이름)은 생성기 그대로. 이 엔진은 자리를 옮기고, 빠진 자리(표·정리·다음에 볼 곳)는 장부 값으로만 채운다.
 *   - 결과는 <article id="nc-article" class="nc-skel nc-skel-<type>" data-skel-type=…> 하나. 안의 조각은 data-skel="answer|facts|body|faq|summary|next".
 *   - 변형 엔진(uniq-variant.mjs)은 data-skel="body" 조각만 섞고 answer·facts 는 머리, faq·summary·next 는 꼬리로 고정한다.
 *   - 순수 함수: applySkeleton(type, ssrBody, ctx) → html. 파일을 쓰지 않는다.
 *
 *   ctx = { facts: {…}, members: [venue…], popRank: Map(slug→n), faqPairs: [{q,a}], summary: '…', catLabel: {…}, venueHref: fn }
 */
import { parseHtml, serializeHtml } from '../uniq-variant.mjs';

export const SKEL_TYPES = ['venue', 'list', 'hub', 'magazine', 'community', 'guide'];
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const textOf = (n) => serializeHtml(n).replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
const isEl = (n) => n && n.text === undefined;
const cls = (n) => (n.attrs || '').match(/class="([^"]*)"/)?.[1] || '';
const has = (n, c) => new RegExp(`(^|\\s)${c}(\\s|$)`).test(cls(n));

/* 소제목 분류 — 생성기가 쓰는 h2 문구(pickN 회전 문구 포함) */
const FAQ_RE = /자주 묻는|궁금한 점|미리 알아두면|방문 전 체크|FAQ/;
const NEXT_RE = /함께 찾는 키워드|지역으로 둘러보기|업종으로 둘러보기|역 근처로 둘러보기|주변 추천 업소|근처 가볼 만한|함께 보는 업소|주변 인기 업소|태그로 더 찾기|역 근처 업소|이어서 보면|같이 보기|비교 안내|커뮤니티|회원 이야기|더 둘러보기|관련 업종 둘러보기|지역별 인기 업소|함께 즐기기|업종별 더보기|일산요정 정보/;
const SUMMARY_RE = /총정리|한눈에 보기|핵심 요약|한 줄 정리|^정리$|\s정리$/;
const FACTS_RE = /(\d+곳|리스트|랭킹|큐레이션|도보권 업소|신규 )/;

function groupTop(root) {
  // 최상위 자식을 「h2 + 뒤따르는 형제」 묶음으로 나눈다. section/nav/div 는 한 묶음.
  const groups = []; let cur = null;
  for (const n of root.children) {
    if (!isEl(n)) { if (cur) cur.push(n); continue; }
    if (/^h[23]$/.test(n.tag)) { cur = [n]; groups.push(cur); continue; }
    if (n.tag === 'section' || n.tag === 'nav' || n.tag === 'div' || n.tag === 'article' || n.tag === 'footer') { cur = null; groups.push([n]); continue; }
    if (cur) cur.push(n); else groups.push([n]);
  }
  return groups;
}
const headingOf = (g) => {
  const first = g[0];
  if (/^h[23]$/.test(first.tag)) return textOf(first);
  const h = (first.children || []).find((c) => isEl(c) && /^h[23]$/.test(c.tag));
  return h ? textOf(h) : '';
};
const hasDl = (g) => g.some((n) => isEl(n) && (n.tag === 'dl' || (n.children || []).some((c) => isEl(c) && c.tag === 'dl')));
const ser = (g) => g.map(serializeHtml).join('');

function factsTable(type, ctx) {
  const f = ctx.facts || {};
  const rows = [];
  const push = (k, v) => { if (v !== undefined && v !== null && String(v).trim() !== '') rows.push([k, String(v)]); };
  if (type === 'venue') {
    push('업종', f.cat); push('지역', f.region); push('가까운 역', f.station); push('영업시간', f.hours); push('입장 기준', f.ageGroup);
    push('드레스코드', f.dressCode); push('추천 시간', f.bestTime); push('주차', f.parking); if (f.features && f.features.length) push('특징', f.features.slice(0, 6).join(' · '));
    if (f.staffNickname && f.staffPhone) push('예약 문의(광고)', `${f.staffNickname} ${f.staffPhone}`);
  } else if (type === 'magazine') { push('분류', f.tag); push('작성일', f.date); push('작성', '놀쿨 편집'); }
  else { push('업소 수', f.n ? `${f.n}곳` : ''); push('업종', f.cats); push('지역', f.regions); push('가까운 역', f.stations); }
  if (!rows.length) return '';
  return `<section data-skel="facts" class="nc-facts"><h2>${esc(f.factsHeading || '한눈에 보는 사실')}</h2><table class="nc-facts-table"><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table></section>`;
}

function memberList(ctx) {
  const ms = ctx.members || [];
  if (!ms.length) return '';
  const cat = ctx.catLabel || {};
  // 단일 업종·단일 지역 목록은 줄마다 그 낱말을 되풀이하지 않는다(키워드 밀도 3% 상한 · 제목·머리글에 이미 있다)
  const oneCat = new Set(ms.map((v) => v.cat)).size === 1, oneRegion = new Set(ms.map((v) => v.regionKo)).size === 1;
  const items = ms.map((v) => {
    const rank = ctx.popRank && ctx.popRank.get(v.slug);
    const keys = [ctx.facts?.tag, ctx.facts?.region, ctx.facts?.place].filter(Boolean).map((k) => String(k).replace(/역$/, ''));
    const sd = (v.shortDesc || '').replace(/\s+/g, ' ').trim();
    // 한 줄 요약 = 장부 shortDescription 앞 45자. 허브 키(태그·지역·역 이름)가 그 안에 또 나오면 특징(features) 두 개로 갈음(키워드 밀도 3% 상한 · 사실만)
    let line = sd.length > 90 ? sd.slice(0, 90).replace(/[,\s·]+\S*$/, '') + '…' : sd;
    if (keys.some((k) => k && line.includes(k)) || (v.nameKo && line.includes(v.nameKo))) line = (v.features || []).filter((f) => !keys.some((k) => k && f.includes(k)) && !(v.nameKo && f.includes(v.nameKo))).slice(0, 2).join(' · '); // 가게 이름이 요약 안에 또 나오면 특징으로(같은 이름 되풀이 0)
    const st = (v.nearbyStation || '').match(/([^\s]+역)/)?.[1] || '';
    const meta = [oneRegion ? '' : v.regionKo, oneCat ? '' : (cat[v.cat] || v.cat), keys.some((k) => st.includes(k)) ? '' : st].filter(Boolean).join(' · ');
    // 단일 업종 목록에서 「강남클럽 레이스」처럼 첫 토큰이 지역+업종 복합어면 뒷부분만 표시(시즌172 suffix 라벨과 같은 방식 · 밀도 3% 상한)
    const toks = (v.nameKo || '').split(/\s+/);
    // 허브 키(태그·지역·역)가 이름 토큰에 들어 있으면 그 토큰을 뺀다(생성기의 tagShort·shortLabel 과 같은 방식 · 키워드 밀도 3% 상한)
    let kept = toks.length >= 2 ? toks.filter((t) => !keys.some((k) => k && t.includes(k))) : toks;
    if (oneCat && kept.length >= 2 && kept[0].endsWith(cat[v.cat] || '')) kept = kept.slice(1);
    const label = kept.length ? kept.join(' ') : v.nameKo;
    return `<li><a href="${esc(ctx.venueHref ? ctx.venueHref(v) : '#')}">${esc(label)}</a>${line ? ` — ${esc(line)}` : ''}${meta ? ` <span class="nc-meta">(${esc(meta)})</span>` : ''}${rank ? ` <span class="nc-rank">인기 ${rank}위</span>` : ''}</li>`;
  });
  // 순위 설명 줄은 순위가 실제로 표시된 쪽에만(틀 문장 되풀이 최소화 · ⑤ 틀 글자)
  const anyRank = ms.some((v) => ctx.popRank && ctx.popRank.get(v.slug));
  const note = anyRank ? `<p class="nc-rank-note">인기 순위는 최근 28일 실제 조회·전화 문의·검색 유입으로 계산한 값만 표시합니다(표본이 적은 곳은 표시하지 않습니다).</p>` : '';
  return `<section data-skel="facts" class="nc-facts nc-members"><h2>${esc(ctx.facts?.factsHeading || `한 줄씩 보는 ${ms.length}곳`)}</h2><ul>${items.join('')}</ul>${note}</section>`;
}

function faqDl(pairs) {
  if (!pairs || !pairs.length) return '';
  return `<section data-skel="faq" class="nc-faq"><h2>자주 묻는 질문</h2><dl>${pairs.map((p) => `<dt>${esc(p.q)}</dt><dd>${esc(p.a)}</dd>`).join('')}</dl></section>`;
}

export function applySkeleton(type, ssrBody, ctx = {}) {
  if (!ssrBody) return ssrBody;
  if (!SKEL_TYPES.includes(type)) type = 'guide';
  // 브랜드 껍데기(건너뛰기 링크·카테고리 nav·사이트맵 footer)는 뼈대 밖 — writePage 가 다시 붙인다
  ssrBody = ssrBody
    .replace(/<a href="#main-content" class="skip-link"[\s\S]*?<\/a>/g, '')
    .replace(/<nav aria-label="카테고리">[\s\S]*?<\/nav>/g, '')
    .replace(/<footer aria-label="사이트맵">[\s\S]*?<\/footer>/g, '');
  let root = parseHtml(ssrBody);
  // 매거진처럼 <article> 하나로 감싼 본문은 안쪽을 쓴다
  const onlyEl = root.children.filter(isEl);
  if (onlyEl.length === 1 && onlyEl[0].tag === 'article') root = onlyEl[0];
  const groups = groupTop(root);
  const head = [], body = [], faq = [], summary = [], next = [], intro = [];
  let h1 = null;
  for (const g of groups) {
    const first = g[0];
    if (isEl(first) && first.tag === 'h1') { h1 = first; if (g.length > 1) intro.push(...g.slice(1)); continue; }
    if (isEl(first) && (has(first, 'ssr-answer') || has(first, 'ssr-phone') || has(first, 'ssr-hours') || has(first, 'ssr-age') || has(first, 'ssr-adlabel') || (first.tag === 'p' && !head.length && !body.length && !intro.length))) { intro.push(...g); continue; }
    if (isEl(first) && first.tag === 'p' && !body.length) { intro.push(...g); continue; }
    const hd = headingOf(g);
    if (isEl(first) && first.tag === 'nav' && /이어서 볼 글|다음에 볼 곳/.test(first.attrs || '')) { next.push(...g); continue; }
    if (hasDl(g) || (FAQ_RE.test(hd) && g.some((n) => isEl(n) && /<(dt|h3)/.test(serializeHtml(n))))) { faq.push(...g); continue; } // 문답(dl 또는 h3 쌍)이 있을 때만 FAQ
    if (NEXT_RE.test(hd)) { next.push(...g); continue; }
    if (SUMMARY_RE.test(hd)) { summary.push(...g); continue; }
    if (isEl(first) && first.tag === 'p' && has(first, 'agg-cta')) { body.push(...g); continue; }
    body.push(...g);
  }
  // ① 직답 — 생성기의 .ssr-answer·설명 문단·전화/시간/입장 줄 (없으면 첫 body 문단을 끌어올리지 않는다: 창작 0)
  let answerHtml = intro.length ? ser(intro) : (ctx.answer ? `<p class="ssr-answer">${esc(ctx.answer)}</p>` : '');
  // ② 사실/표
  let factsHtml = (type === 'list' || type === 'hub') ? memberList(ctx) : factsTable(type, ctx);
  if (!factsHtml && (type === 'list' || type === 'hub')) factsHtml = factsTable(type, ctx);
  // 목록·허브: 생성기의 「N곳」 링크 목록 묶음은 표로 대체됐으니 본문에서 뺀다(같은 링크 두 번 X)
  let bodyGroups = groupTop({ children: body });
  if ((type === 'list' || type === 'hub') && (ctx.members || []).length) {
    bodyGroups = bodyGroups.filter((g) => { const hd = headingOf(g); const isCountList = FACTS_RE.test(hd) && g.some((n) => isEl(n) && (n.tag === 'ul' || n.tag === 'ol')); return !isCountList; });
  }
  const bodyHtml = bodyGroups.map((g) => `<section data-skel="body">${ser(g)}</section>`).join('');
  // ④ FAQ — 화면 dl 이 있으면 그대로(FAQPage LD 와 같은 배열에서 나왔다), 없고 ctx.faqPairs 가 있으면 그것으로
  // 화면 문답이 FAQPage JSON-LD 의 질문을 전부 담지 않으면(생성기 회전 질문 ≠ LD 질문) LD 배열로 화면 문답을 다시 그린다 → 화면 = 스키마
  const visQ = new Set(faq.flatMap((n) => [...serializeHtml(n).matchAll(/<(dt|h3|h4)[^>]*>([\s\S]*?)<\/>/g)].map((m) => m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, '').toLowerCase())));
  const ldQ = (ctx.faqPairs || []).map((q) => String(q.q || '').replace(/\s+/g, '').toLowerCase());
  const faqMatches = ldQ.length > 0 && ldQ.every((q) => visQ.has(q));
  // 화면 문답이 있으면 그대로 둔다(글 불변). LD 질문과 다르면 writePage 가 FAQPage JSON-LD 를 화면 문답으로 맞춘다(화면 = 스키마 · 이름 되풀이 0)
  void faqMatches;
  let faqHtml = faq.length ? `<section data-skel="faq" class="nc-faq">${ser(faq)}</section>` : faqDl(ctx.faqPairs);
  // ⑤ 한 줄 정리 — 생성기 정리 문단이 있으면 그것, 없으면 ctx.summary(장부 값으로 조립된 한 문장)
  let summaryHtml = summary.length ? `<section data-skel="summary" class="nc-summary">${ser(summary)}</section>` : (ctx.summary ? `<section data-skel="summary" class="nc-summary"><h2>한 줄 정리</h2><p>${esc(ctx.summary)}</p></section>` : '');
  // ⑥ 다음에 볼 곳 — 허브 링크 묶음을 모아 h2→h3 로 낮추고 자리(빈 목록)를 둔다. 11-4 가 채운다.
  const nextInner = ser(next).replace(/<h2\b/g, '<h3').replace(/<\/h2>/g, '</h3>');
  const nextHtml = `<nav data-skel="next" class="nc-next" aria-label="다음에 볼 곳"><h2>다음에 볼 곳</h2><ul class="nc-next-list" data-nc-next="slot"></ul>${nextInner}</nav>`;
  const h1Html = h1 ? `<h2 class="nc-h1-echo">${textOf(h1) ? esc(textOf(h1)) : ''}</h2>` : '';
  const out = `<article id="nc-article" class="nc-skel nc-skel-${type}" data-skel-type="${type}">` +
    (answerHtml ? `<section data-skel="answer" class="nc-answer">${answerHtml}</section>` : '') +
    factsHtml + bodyHtml + faqHtml + summaryHtml + nextHtml + `</article>`;
  void h1Html; // H1 은 보이는 hero 가 맡는다 — 본문에는 되풀이하지 않는다(제목 되풀이 0)
  return out;
}

/** 쪽 유형 판정 — 주소만으로(정적 쪽·매거진·커뮤니티·가이드). 생성기가 skel.type 을 주면 그것이 우선. */
export function skelTypeOf(routePath) {
  const p = routePath.replace(/\/$/, '') || '/';
  if (p === '/') return 'guide';
  if (/^\/(clubs|nights|rooms|yojeong|lounges|hoppa)\/[^/]+\/[^/]+$/.test(p)) return 'venue';
  if (/^\/(nights|hoppa|lounges)\/[^/]+$/.test(p)) return 'venue';
  if (/^\/(clubs|rooms|yojeong)\/[^/]+$/.test(p)) return 'list';
  if (/^\/(clubs|nights|rooms|yojeong|lounges|hoppa)$/.test(p)) return 'list';
  if (/^\/(best|new)\//.test(p)) return 'list';
  if (/^\/(region|near|tag)\//.test(p)) return 'hub';
  if (/^\/magazine\/./.test(p)) return 'magazine';
  if (/^\/community/.test(p) || /^\/lounge\//.test(p)) return 'community';
  return 'guide';
}

/** 뼈대 검사(게이트용·순수) — 조각 순서와 필수 조각. */
export function checkSkeleton(html, type) {
  const m = html.match(/<article id="nc-article"[^>]*>([\s\S]*?)<\/article>\s*(?=<\/main>|$)/);
  if (!m) return { ok: false, why: 'nc-article 없음' };
  const order = [...m[1].matchAll(/data-skel="(answer|facts|body|faq|summary|next)"/g)].map((x) => x[1]);
  const rank = { answer: 0, facts: 1, body: 2, faq: 3, summary: 4, next: 5 };
  for (let i = 1; i < order.length; i++) if (rank[order[i]] < rank[order[i - 1]]) return { ok: false, why: `순서 어긋남 ${order.join('>')}` };
  const need = { venue: ['answer', 'facts', 'body', 'faq', 'summary', 'next'], list: ['answer', 'facts', 'body', 'faq', 'summary', 'next'], hub: ['answer', 'facts', 'body', 'faq', 'summary', 'next'], magazine: ['answer', 'facts', 'body', 'summary', 'next'], community: ['answer', 'body', 'next'], guide: ['answer', 'body', 'next'] };
  const missing = (need[type] || need.guide).filter((k) => !order.includes(k));
  return missing.length ? { ok: false, why: `빠진 조각 ${missing.join(',')}` } : { ok: true, order };
}
