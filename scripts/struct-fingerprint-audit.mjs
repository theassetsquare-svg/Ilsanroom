#!/usr/bin/env node
// 구조 지문(structural fingerprint) 감사 — Google 2026 scaled-content-abuse 회귀 차단.
// dist의 venue 상세 본문(<article>)을 카테고리별 전수 쌍 비교 → 5-gram shingle Jaccard.
//
// 신규 venue 추가 / SSR 본문 변경 시 자동 실행(audit:all 체인). 임계 초과 시 exit 1 → 배포 차단.
//   FAIL  > 15%  (프로그래매틱 복붙/근접 중복 — 구조 지문)
//   WARN  10~15% (정당 겹침: 동일 지역 키워드+실제 공유 데이터. 감시만)
// 정상 고유 페이지 = ≤10%. 현재 사이트 max 7.5%(nights). 자세한 배경: MEMORY project_structural_fingerprint.md
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const FAIL_AT = 0.15;
const WARN_AT = 0.10;
const DIST = 'dist';
const CAT_DIRS = { clubs: 'clubs', nights: 'nights', lounges: 'lounges', rooms: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa' };

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e === 'index.html') out.push(p);
  }
  return out;
}
function articleText(html) {
  const m = html.match(/<article[\s\S]*?<\/article>/);
  const body = m ? m[0] : '';
  return body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function shingles(text, n = 5) {
  const toks = text.split(/\s+/);
  const s = new Set();
  for (let i = 0; i + n <= toks.length; i++) s.add(toks.slice(i, i + n).join(' '));
  return s;
}
function jaccard(a, b) { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); }

let fail = 0, warn = 0;
console.log(`🔬 구조 지문 감사 — FAIL>${(FAIL_AT * 100)}% / WARN>${(WARN_AT * 100)}% (5-gram Jaccard, 전수 쌍)`);

for (const [cat, d] of Object.entries(CAT_DIRS)) {
  const base = join(DIST, d);
  if (!existsSync(base)) continue;
  const files = walk(base).filter(f => { const h = readFileSync(f, 'utf8'); return /itemprop="name"/.test(h) && /<article/.test(h); });
  const arts = files.map(f => { const t = articleText(readFileSync(f, 'utf8')); return { f, len: t.length, sh: shingles(t) }; }).filter(a => a.len > 200);
  if (arts.length < 2) { if (arts.length) console.log(`[${cat}] n=${arts.length} (쌍 비교 불가)`); continue; }

  let sum = 0, pairs = 0, maxJ = 0; const flagged = [];
  for (let i = 0; i < arts.length; i++) for (let j = i + 1; j < arts.length; j++) {
    const J = jaccard(arts[i].sh, arts[j].sh); sum += J; pairs++;
    if (J > maxJ) maxJ = J;
    if (J > WARN_AT) flagged.push({ a: arts[i].f, b: arts[j].f, J });
  }
  const avg = pairs ? sum / pairs : 0;
  console.log(`[${cat}] n=${arts.length} · 평균 ${(avg * 100).toFixed(1)}% · 최대 ${(maxJ * 100).toFixed(1)}% · 전수 ${pairs}쌍`);
  flagged.sort((x, y) => y.J - x.J);
  for (const p of flagged) {
    const lvl = p.J > FAIL_AT ? '🛑 FAIL' : '⚠️ WARN';
    if (p.J > FAIL_AT) fail++; else warn++;
    console.log(`   ${lvl} ${(p.J * 100).toFixed(1)}%  ${p.a.replace('dist', '')}  ↔  ${p.b.replace('dist', '')}`);
  }
}

console.log(`\n📊 결과: 🛑 FAIL ${fail}쌍 / ⚠️ WARN ${warn}쌍`);
if (fail > 0) {
  console.log(`❌ 구조 지문 회귀 — 두 페이지 본문이 ${(FAIL_AT * 100)}% 초과로 닮음. 신규/수정 venue 고유 데이터(liquorInfo/roomInfo/features/shortDescription) 보강 필요.`);
  process.exit(1);
}
console.log('✅ 전 카테고리 구조 지문 정상 (FAIL 0)');
