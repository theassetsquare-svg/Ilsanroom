#!/usr/bin/env node
// CLAUDE.md 룰과 scripts/nolcool-guard.mjs 룰 키워드 비교
// CLAUDE.md에 적힌 금지어/룰 키워드가 guard에 누락되었는지 검출
import { readFileSync } from 'node:fs';

const md = readFileSync('CLAUDE.md', 'utf8');
const guard = readFileSync('scripts/nolcool-guard.mjs', 'utf8');

// CLAUDE.md MUST/NEVER 섹션에서 추출해야 할 키워드 핵심셋
// (가드가 반드시 인식하고 있어야 하는 단어)
const EXPECTED = {
  price: ['만원', '입장료', '가성비', '시세', '가격대'],
  banned: ['2차', '무료체험', '부모님생신', '상견례', '가족모임', '돌잔치', '결혼기념일'],
  router: ['HashRouter', 'next/router', 'next/link', 'next/navigation'],
  thirdparty: ['thum.io', 'microlink', 'screenshotone'],
  canonical: ['ilsanroom.pages.dev'],
  brand: ['놀쿨'],
};

const issues = [];
for (const [cat, words] of Object.entries(EXPECTED)) {
  for (const w of words) {
    const inMd = md.includes(w);
    const inGuard = guard.includes(w);
    if (inMd && !inGuard) {
      issues.push(`🛑 [${cat}] "${w}" — CLAUDE.md에 있으나 guard.mjs에 없음`);
    } else if (!inMd && inGuard) {
      issues.push(`⚠️  [${cat}] "${w}" — guard.mjs에 있으나 CLAUDE.md에 없음 (의도된 확장?)`);
    }
  }
}

// 추가: CLAUDE.md MUST/NEVER 섹션 길이 sanity check
const must = md.match(/## MUST([\s\S]*?)##/);
const never = md.match(/## NEVER([\s\S]*?)##/);
if (!must) issues.push('🛑 CLAUDE.md에 ## MUST 섹션 누락');
if (!never) issues.push('🛑 CLAUDE.md에 ## NEVER 섹션 누락');

const err = issues.filter(i => i.startsWith('🛑')).length;
const warn = issues.filter(i => i.startsWith('⚠️')).length;
console.log(`📋 CLAUDE.md ↔ guard.mjs drift: 🛑 ${err} / ⚠️  ${warn}`);
for (const i of issues) console.log(`  ${i}`);

process.exit(err > 0 ? 1 : 0);
