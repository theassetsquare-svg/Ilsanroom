#!/usr/bin/env node
// 가독성 빌드 게이트 — venue 상세 가독성 회귀를 빌드 단계에서 차단한다 (재발 방지).
// 검사 4종:
//   1. 단락 벽 렌더 계약: venue 본문은 splitParagraphs(text, max≤300)로만 렌더해야 한다.
//      - 호출의 max 인자가 300 초과면 FAIL (벽 재발).
//      - description/full을 분할 없이 <p>에 직접 박으면 FAIL.
//      - 계약대로 max에 description을 실제로 쪼개 가장 긴 <p>가 300 초과면 FAIL(이중 안전망).
//   2. 조사 placeholder: 본문/메타에 "이(가)·을(를)·은(는)·과(와)·으로(로)" 리터럴이 남아있으면 FAIL.
//   3. description 중복 렌더: VenueSeoContent가 venue.description을 다시 렌더하면 FAIL (단일 출처 강제).
//   4. 죽은 가짜 통계 prop: readerCount=/baseCount= 또는 시드 난수 카운터가 남아있으면 FAIL.
// splitParagraphs는 React 컴포넌트와 동일 모듈을 import → 로직이 절대 어긋나지 않는다.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { splitParagraphs } from '../src/lib/text-format.mjs';

const MAX_PARA = 300; // <p> 한 단락 허용 상한
const fails = [];

const venuesSrc = readFileSync('src/data/venues.ts', 'utf8');
const blocks = venuesSrc.split(/(?=^\s+id:\s*'v-\d+')/m).slice(1);
function pick(b, key) {
  const m = b.match(new RegExp(`${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
  return m ? m[1].replace(/\\'/g, "'") : '';
}

// ── 1. 단락 벽 렌더 계약 검사 ──
const tabsSrc = readFileSync('src/components/venue/VenueDetailTabs.tsx', 'utf8');
const seoSrc = readFileSync('src/components/venue/VenueSeoContent.tsx', 'utf8');

// 1a. splitParagraphs(text, max) 호출의 max가 모두 ≤300 인지 (기본값 280은 통과).
let contractMax = 0;
for (const src of [tabsSrc, seoSrc]) {
  for (const m of src.matchAll(/splitParagraphs\([^,]+,\s*(\d+)\s*\)/g)) {
    const n = Number(m[1]);
    if (n > contractMax) contractMax = n;
    if (n > MAX_PARA) fails.push(`[단락 벽] splitParagraphs max=${n} > ${MAX_PARA} — 벽 재발 위험`);
  }
}
if (contractMax === 0) contractMax = 280; // 인자 생략 시 모듈 기본값

// 1b. description/full을 분할 없이 <p>에 직접 박는 회귀 차단.
if (/<p[^>]*>\s*\{full\}/.test(tabsSrc) || /<p[^>]*>\s*\{venue\.description\}/.test(tabsSrc)) {
  fails.push('[단락 벽] VenueDetailTabs가 description/full을 분할 없이 <p>에 직접 렌더');
}

// 1c. 이중 안전망: 계약 max로 실제 description을 쪼개 가장 긴 <p> 확인.
let worst = { name: '', len: 0 };
for (const b of blocks) {
  if (/status:\s*'closed_or_unclear'/.test(b)) continue;
  const nameKo = pick(b, 'nameKo');
  const description = pick(b, 'description');
  if (!description) continue;
  const full = description.slice(0, 100).includes(nameKo) ? description : `${nameKo} — ${description}`;
  for (const p of splitParagraphs(full, contractMax)) {
    if (p.length > worst.len) worst = { name: nameKo, len: p.length };
  }
}
if (worst.len > MAX_PARA) {
  fails.push(`[단락 벽] 계약 max=${contractMax}로 쪼갠 최장 <p> ${worst.len}자(${worst.name}) > ${MAX_PARA}`);
}

// ── src 파일 수집 ──
function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}
const srcFiles = walk('src').filter((f) => !f.includes('text-format'));

// ── 2. 조사 placeholder 검사 ──
const PARTICLE = /이\(가\)|을\(를\)|은\(는\)|과\(와\)|으로\(로\)|를\(을\)|가\(이\)/;
const particleHits = [];
for (const f of srcFiles) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((ln, i) => { if (PARTICLE.test(ln)) particleHits.push(`${f}:${i + 1}`); });
}
for (const b of blocks) {
  if (PARTICLE.test(pick(b, 'description')) || PARTICLE.test(pick(b, 'shortDescription'))) {
    particleHits.push(`venues.ts:${pick(b, 'nameKo')}`);
  }
}
if (particleHits.length) {
  fails.push(`[조사 placeholder] 리터럴 잔존 ${particleHits.length}곳 → ${particleHits.slice(0, 8).join(', ')}`);
}

// ── 3. description 중복 렌더 검사 ──
if (/venue\.description/.test(seoSrc)) {
  fails.push('[중복 렌더] VenueSeoContent.tsx가 venue.description을 렌더 → 단일 출처(VenueDetailTabs) 위반');
}
if (!/splitParagraphs\(full/.test(tabsSrc)) {
  fails.push('[단일 출처] VenueDetailTabs.tsx가 description을 splitParagraphs로 렌더하지 않음');
}

// ── 4. 죽은 가짜 통계 prop 검사 ──
const FAKE = /readerCount\s*=|baseCount\s*=|\d+\s*\+\s*\(hash\s*%\s*\d+\)/;
const fakeHits = [];
for (const f of srcFiles.filter((f) => /components\/venue|components\/engagement/.test(f))) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((ln, i) => { if (FAKE.test(ln)) fakeHits.push(`${f}:${i + 1}`); });
}
if (fakeHits.length) {
  fails.push(`[죽은 가짜 통계] prop 잔존 ${fakeHits.length}곳 → ${fakeHits.slice(0, 6).join(', ')}`);
}

// ── 결과 ──
if (fails.length) {
  console.error('\n❌ 가독성 게이트 FAIL:');
  for (const f of fails) console.error('  - ' + f);
  console.error('');
  process.exit(1);
}
console.log(`✅ 가독성 게이트 PASS — 최장 <p> ${worst.len}자(${worst.name}), 조사 placeholder 0, 중복 렌더 0, 죽은 통계 0`);
