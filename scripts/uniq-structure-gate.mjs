#!/usr/bin/env node
/**
 * [플랫폼 트랙 P · 재발 방지 잠금] 구조 고유성 게이트 — dist 의 사이트맵 전 쪽에 페이지별 토큰·style 이 있는지, 껍데기(카테고리 nav·사이트맵 footer)가 제자리인지.
 *   실패 = 빌드 중단(exit 1). 글 5차원 전수 측정은 naver-watch 의 주간 PLATFORM 작업이 맡는다(로컬).
 */
import fs from 'node:fs';
import path from 'node:path';
const DIST = 'dist';
const xml = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decodeURIComponent(m[1].replace(/^https?:\/\/[^/]+\//, '')).replace(/\/$/, ''));
const errs = []; let ok = 0; const ids = new Map();
for (const rel of locs) {
  const f = path.join(DIST, rel, 'index.html');
  if (!fs.existsSync(f)) { errs.push(rel + ': 파일 없음'); continue; }
  const h = fs.readFileSync(f, 'utf8');
  const id = (h.match(/<style data-page="(u[0-9a-z]+)"/) || [])[1];
  if (!id) { errs.push(rel + ': 페이지별 style 없음'); continue; }
  const main = (h.match(/<main id="main-content">[\s\S]*?<\/main>/) || [''])[0];
  const toks = (main.match(new RegExp('class="' + id + '-', 'g')) || []).length;
  if (toks < 3) { errs.push(rel + ': 본문 토큰 ' + toks + '개'); continue; }
  const navI = h.indexOf('<nav aria-label="카테고리">'), mainI = h.indexOf('<main id="main-content">'), footI = h.indexOf('<footer aria-label="사이트맵">');
  if (!(navI >= 0 && mainI > navI && footI > mainI)) { errs.push(rel + ': 껍데기 순서 어긋남 nav/main/footer=' + navI + '/' + mainI + '/' + footI); continue; }
  if (ids.has(id)) errs.push(rel + ': 토큰 id 중복 (' + ids.get(id) + ')'); else ids.set(id, rel);
  ok++;
}
console.log(`🧩 구조 고유성 게이트 — ${locs.length}쪽 · 통과 ${ok} · 실패 ${errs.length}`);
for (const e of errs.slice(0, 15)) console.log('   ❌ ' + e);
if (errs.length) { console.log('🛑 구조 고유성 위반 — 배포 불가 (uniq-variant.mjs / prerender 연결 확인)'); process.exit(1); }
console.log('✅ 구조 고유성 정상 — 전 쪽 페이지별 토큰·style, 껍데기 제자리');
