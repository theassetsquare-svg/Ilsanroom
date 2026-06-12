#!/usr/bin/env node
/**
 * [STEP 3/F] 커뮤니티 모더레이션 발행 게이트
 *
 * 사용자 생성 콘텐츠(글·댓글·후기)는 불법·성매매·호객·알선·욕설 표현을 담을 수 있다.
 * 이 게이트는 모더레이션이 "실제로 배선되어 있는지"를 빌드 단계에서 강제한다.
 *
 * 검증 항목:
 *  1) content-filter.ts 가 불법어 리스트(ILLEGAL_WORDS)+hasIllegalWord 를 정의하고
 *     checkContent/checkTitle 둘 다 hasIllegalWord 를 참조한다.
 *  2) community-api.ts 의 createPost/createComment/createReview 가 모더레이션을 호출한다.
 *  3) 작성 UI(WritePostModal·QuickPostInline)가 모더레이션을 호출한다.
 *  4) 커뮤니티 시드 데이터(community-data.ts·fake-users.ts)에 불법어가 0건이다.
 *     (불법어 목록은 content-filter.ts 에서 런타임 추출 — 이 게이트 파일엔 금지어 리터럴 0)
 *
 * 양방향 검증: 정상 PASS + 배선 제거/시드 오염 주입 시 FAIL.
 */
import fs from 'node:fs';

const errors = [];
const read = (p) => fs.readFileSync(p, 'utf8');

// --- 1) content-filter.ts 배선 ---
const FILTER = 'src/lib/content-filter.ts';
const filterSrc = read(FILTER);

if (!/const\s+ILLEGAL_WORDS\s*=\s*\[/.test(filterSrc)) {
  errors.push(`${FILTER}: ILLEGAL_WORDS 리스트가 없음`);
}
if (!/function\s+hasIllegalWord\b/.test(filterSrc)) {
  errors.push(`${FILTER}: hasIllegalWord() 가 없음`);
}
// checkContent / checkTitle 각각이 hasIllegalWord 를 호출하는지
const checkContentBody = filterSrc.match(/export function checkContent[\s\S]*?\n}/)?.[0] || '';
const checkTitleBody = filterSrc.match(/export function checkTitle[\s\S]*?\n}/)?.[0] || '';
if (!/hasIllegalWord\(/.test(checkContentBody)) {
  errors.push(`${FILTER}: checkContent 가 hasIllegalWord 를 호출하지 않음`);
}
if (!/hasIllegalWord\(/.test(checkTitleBody)) {
  errors.push(`${FILTER}: checkTitle 이 hasIllegalWord 를 호출하지 않음`);
}

// --- 불법어 목록을 content-filter.ts 에서 추출 (이 파일엔 리터럴 0) ---
let illegalWords = [];
const listMatch = filterSrc.match(/const\s+ILLEGAL_WORDS\s*=\s*\[([\s\S]*?)\];/);
if (listMatch) {
  const inner = listMatch[1];
  for (const m of inner.matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
    try {
      illegalWords.push(JSON.parse('"' + m[1].replace(/"/g, '\\"') + '"'));
    } catch { /* skip */ }
  }
}
if (illegalWords.length === 0) {
  errors.push(`${FILTER}: ILLEGAL_WORDS 추출 실패(0건) — 게이트가 시드를 검사할 수 없음`);
}

// --- 2) community-api.ts 배선 ---
const API = 'src/lib/community-api.ts';
const apiSrc = read(API);
const fnBody = (name) => {
  const start = apiSrc.indexOf(`export async function ${name}`);
  if (start === -1) return '';
  const rest = apiSrc.slice(start + 1);
  const next = rest.indexOf('\nexport ');
  return next === -1 ? rest : rest.slice(0, next);
};
for (const fn of ['createPost', 'createComment', 'createReview']) {
  const body = fnBody(fn);
  if (!/check(Content|Title)\(/.test(body)) {
    errors.push(`${API}: ${fn} 가 모더레이션(checkContent/checkTitle)을 호출하지 않음`);
  }
}

// --- 3) 작성 UI 배선 ---
for (const ui of [
  'src/components/community/WritePostModal.tsx',
  'src/components/community/QuickPostInline.tsx',
]) {
  const s = read(ui);
  if (!/checkContent\(/.test(s)) {
    errors.push(`${ui}: checkContent 호출이 없음`);
  }
}

// --- 4) 시드 데이터 오염 검사 ---
const escapeRe = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = illegalWords.map((w) => new RegExp(escapeRe(w).split('').join('[\\s.·_-]*'), 'i'));
for (const seed of ['src/lib/community-data.ts', 'src/lib/fake-users.ts']) {
  if (!fs.existsSync(seed)) continue;
  const s = read(seed);
  const hit = patterns.find((p) => p.test(s));
  if (hit) {
    errors.push(`${seed}: 불법·호객 표현이 시드 데이터에 포함됨 (패턴 ${hit})`);
  }
}

if (errors.length) {
  console.error(`\n❌ [STEP 3/F] 커뮤니티 모더레이션 게이트 FAIL (${errors.length}건)`);
  for (const e of errors) console.error(`   - ${e}`);
  console.error('\n사용자 콘텐츠 모더레이션 배선이 끊겼거나 시드가 오염됨. 배포 차단.\n');
  process.exit(1);
}

console.log(`✅ [STEP 3/F] 커뮤니티 모더레이션 게이트 PASS — 불법어 ${illegalWords.length}개 배선·시드 청결 확인`);
