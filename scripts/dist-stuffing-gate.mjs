#!/usr/bin/env node
/**
 * 놀쿨 전 페이지 키워드 스터핑 빌드게이트 (★재발 방지 — 시즌175).
 *
 * 막는 것: dist/sitemap.xml 색인 페이지(약 374 URL)의 visible-text 최빈 단어
 *   밀도가 3.5%를 넘는 스터핑 회귀. 카테고리 6장은 category-density-gate.mjs가
 *   이미 막지만, 집계 페이지(tag/region/near/best/new)와 venue 상세는 막는
 *   게이트가 없었다 → 고친 스터핑이 조용히 회귀해 다음날 06:20 라이브 watch에만
 *   잡혔다. 이 게이트가 그 갭을 메운다: push/배포 전에 막아 회귀가 라이브에 못 닿는다.
 *
 * 측정 로직은 keyword-stuffing-pc-mobile-watch.mjs(라이브 06:20 watch)의 audit()와
 *   글자 단위까지 동일하게 미러한다 → 게이트가 통과하면 라이브 watch도 통과.
 *   검사 항목(라이브 watch reasons()와 동일):
 *     1) 최빈 단어 밀도 ≤ 3.5%
 *     2) title ≤ 60자 + 중복단어 없음
 *     3) desc ≤ 150자
 *     4) 본문 텍스트 ≥ 800자 (정책/util 페이지 SHORT_OK 면제)
 *
 * dist/{path}/index.html(prerender 결과)을 본다 → 빌드(prerender) 후 실행.
 * sitemap에 없는 noindex 페이지(단일멤버 tag 등)는 검사 대상이 아니다(라이브 watch와 동일).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

// keyword-stuffing-pc-mobile-watch.mjs와 동일 — 정책/유틸 페이지 본문 분량 면제
const SHORT_OK = /^\/(legal|privacy|terms|about|contact|sitemap|llms|robots|404|admin|auth|my\/|search|roulette|tonight|weekend|budget|occasion|share|recent|favorites|stats|customize|onboarding)/;

if (!existsSync(join(DIST, 'index.html'))) { console.log('⏭️  dist 없음 — 빌드 후 실행'); process.exit(0); }
if (!existsSync(join(DIST, 'sitemap.xml'))) { console.log('⏭️  dist/sitemap.xml 없음 — prerender 후 실행'); process.exit(0); }

// keyword-stuffing-pc-mobile-watch.mjs audit()와 글자 단위 동일
function audit(html) {
  const get = re => { const m = html.match(re); return m ? m[1].trim() : ''; };
  const title = get(/<title>([^<]+)<\/title>/);
  const desc = get(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = text.match(/[가-힣A-Za-z][가-힣A-Za-z0-9]{1,}/g) || [];
  const freq = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  const topEntry = Object.entries(freq).sort((a, b) => b[1] - a[1])[0] || ['', 0];
  const [topWord, topCount] = topEntry;
  const density = text.length ? (topCount * topWord.length) / text.length : 0;
  const titleWords = title.replace(/[—,.\-·]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  const dupTitle = titleWords.filter((w, i) => titleWords.indexOf(w) !== i);
  return { title, desc, textLen: text.length, topWord, topCount, density, dupTitle };
}

// dist/sitemap.xml의 색인 URL → 로컬 dist 경로 매핑 (라이브 watch가 보는 집합과 동일)
const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(m => decodeURIComponent(m[1].replace('https://nolcool.com', '')))
  .map(p => p.replace(/\/$/, '') || '/');

console.log(`🔍 스터핑 빌드게이트 — 색인(sitemap) 페이지 ${paths.length}장`);
const errors = [];
let checked = 0;
for (const path of paths) {
  const rel = path === '/' ? 'index.html' : join(path.replace(/^\//, ''), 'index.html');
  const fp = join(DIST, rel);
  if (!existsSync(fp)) continue; // sitemap엔 있으나 dist 파일 없으면 다른 게이트(route-sitemap) 소관
  checked++;
  const a = audit(readFileSync(fp, 'utf8'));
  const out = [];
  if (a.density > 0.035) out.push(`스터핑 ${a.topWord}:${a.topCount}회/밀도 ${(a.density * 100).toFixed(2)}%`);
  if (a.title.length > 60) out.push(`title ${a.title.length}자`);
  if (a.dupTitle.length > 0) out.push(`title 중복 [${a.dupTitle.join(',')}]`);
  if (a.desc.length > 150) out.push(`desc ${a.desc.length}자`);
  if (!SHORT_OK.test(path) && a.textLen < 800) out.push(`본문 ${a.textLen}자 (≥800)`);
  if (out.length) errors.push(`${path} → ${out.join(' / ')}`);
}

if (errors.length) {
  console.error(`\n❌ 스터핑 빌드게이트 FAIL — ${errors.length}/${checked}장 회귀`);
  errors.slice(0, 40).forEach(e => console.error(`   · ${e}`));
  if (errors.length > 40) console.error(`   … 외 ${errors.length - 40}건`);
  process.exit(1);
}
console.log(`✅ 스터핑 빌드게이트 PASS — 색인 ${checked}장 전부 밀도≤3.5%·title·desc·본문 정상`);
