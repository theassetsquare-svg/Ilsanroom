#!/usr/bin/env node
/**
 * 놀쿨 체류 콘텐츠 분량 빌드게이트 (★재발 방지 — 시즌175).
 *
 * 막는 것: dist/sitemap.xml 색인 페이지의 SSR 본문이 분량/H2 바닥 밑으로 빠지는 회귀.
 *   - venue/매거진 상세 본문 < 1700자 / 리스팅·집계 < 2000자 → 체류 10분 깨짐(CLAUDE.md #5).
 *   - H2 < 5개 → 구조·SEO 약화.
 *
 * 측정 로직은 dwell-content-audit.mjs(라이브 KST 07:40 watch)와 글자 단위 동일.
 *   라이브 watch는 plain GET = prerender SSR HTML을 보므로(JS 실행 없음) 이 게이트가
 *   읽는 dist HTML과 동일한 본문이다 → 게이트 PASS ⟹ 라이브 watch PASS.
 *   라이브 watch는 배포 후 다음날에야 잡지만, 이 게이트는 push/배포 전에 막는다.
 *
 * dist/{path}/index.html(prerender 결과)을 본다 → 빌드(prerender) 후 실행.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const MIN_CHARS_DETAIL = 1700;
const MIN_CHARS_LISTING = 2000;
const MIN_H2 = 5;

// dwell-content-audit.mjs와 동일 — legal/admin/auth/내부 페이지는 체류 면제
// + 집계 허브(best/new/region/tag/near): 라이브 dwell watch는 MAX_PAGES=200으로
//   잘려 sitemap idx 204+의 집계 페이지를 안 본다. 집계 허브는 얇은 인덱스가 정상이고
//   2000자 강제는 보일러플레이트 패딩(scaled-content, CLAUDE.md #5 금지) → struct-fingerprint
//   집계 감사 + dist-stuffing-gate(3.5% 천장)가 담당. 이 게이트는 watch 실범위(상세/카테고리/
//   매거진/랜딩)만 잠근다.
const EXEMPT_PATTERNS = [
  /\/legal\//, /\/admin\//, /\/auth\//, /\/my\//, /\/profile\//, /\/business\//, /\/contact/,
  /\/sitemap/, /\/robots/, /\/llms/, /\/404/, /\/search\?/,
  /\/(best|new|tag|near)\//, /\/region\//,
];

function classifyPath(path) {
  if (/^\/(clubs|nights|lounges|rooms|yojeong|hoppa)\/[^/]+\/[^/]+\/?$/.test(path)) return 'detail';
  if (/^\/magazine\/[^/]+\/?$/.test(path)) return 'detail';
  return 'listing';
}

if (!existsSync(join(DIST, 'index.html'))) { console.log('⏭️  dist 없음 — 빌드 후 실행'); process.exit(0); }
if (!existsSync(join(DIST, 'sitemap.xml'))) { console.log('⏭️  dist/sitemap.xml 없음 — prerender 후 실행'); process.exit(0); }

const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  .filter(u => !u.endsWith('.xml') && !u.endsWith('.txt') && !u.endsWith('.png') && !u.endsWith('.jpg'))
  .filter(u => !EXEMPT_PATTERNS.some(re => re.test(u)));

console.log(`📖 체류 콘텐츠 빌드게이트 — 색인 페이지 ${urls.length}장`);
const errors = [];
let checked = 0;
for (const u of urls) {
  const path = decodeURIComponent(u.replace('https://nolcool.com', ''));
  const rel = path === '/' || path === '' ? 'index.html' : join(path.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
  const fp = join(DIST, rel);
  if (!existsSync(fp)) continue;
  checked++;
  const html = readFileSync(fp, 'utf8');
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const chars = text.length;
  const h2 = (html.match(/<h2/gi) || []).length;
  const min = classifyPath(path) === 'detail' ? MIN_CHARS_DETAIL : MIN_CHARS_LISTING;
  const out = [];
  if (chars < min) out.push(`본문 ${chars}자 (≥${min})`);
  if (h2 < MIN_H2) out.push(`H2 ${h2}개 (≥${MIN_H2})`);
  if (out.length) errors.push(`${path} → ${out.join(' / ')}`);
}

if (errors.length) {
  console.error(`\n❌ 체류 콘텐츠 빌드게이트 FAIL — ${errors.length}/${checked}장 미달`);
  errors.slice(0, 40).forEach(e => console.error(`   · ${e}`));
  if (errors.length > 40) console.error(`   … 외 ${errors.length - 40}건`);
  process.exit(1);
}
console.log(`✅ 체류 콘텐츠 빌드게이트 PASS — 색인 ${checked}장 전부 본문·H2 충족`);
