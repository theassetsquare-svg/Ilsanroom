#!/usr/bin/env node
/**
 * [지표/정직] 스크롤(끝까지읽기) 정직 게이트 — "분자>분모(>100%)"·"봇 스크롤 집계"를 빌드에서 영구 차단.
 *
 * 배경(시즌: 분자·분모 기준 통일):
 *   끝까지읽기율(scrollRate)이 한때 282%·321% 등 물리 불가능값을 보였다. 원인 =
 *   분자로 GA4 향상측정 'scroll'(90% 도달·★게이트 없음=봇·감사봇·링크미리보기 포함)을 쓰고,
 *   분모로 게이트 통과 page_view(진짜 방문자만)를 써서 ★기준이 어긋났기 때문.
 *   해결 = 분자도 visitor-tracker send() 게이트(관리자·봇·내부 제외)를 통과한 'scroll_100'(≥99%)만
 *   집계 → scroll_100 ≤ page_view 가 구조적으로 보장되어 >100% 가 원천적으로 불가능.
 *
 * 이 게이트는 그 정직 구조가 코드에서 무너지지 않게 강제한다(누가 되돌리면 빌드 차단).
 *
 * 불변식:
 *  A) ga-optimizer.mjs 의 끝까지읽기 분자 = 게이트 통과 'scroll_100'.
 *     - eventName 필터 value 가 ★'scroll_100' 이어야 함. 'scroll'(향상측정, 게이트 없음=봇 포함) 금지.
 *  B) visitor-tracker 의 GA 발송은 ★게이트 통과 후(forwardToGa4) 에서만.
 *     - scroll_100 을 GA로 보내는 gtag 호출이 존재.
 *     - 모든 gtag( 호출은 forwardToGa4 내부에만(=send() 게이트 통과 후) 존재. 게이트 밖 발송 0.
 *     - onScroll 안에서 gtag 직접 호출 0 (봇 스크롤이 게이트 우회로 집계되지 않음).
 *     - send() 는 봇 가드(isBot) ★다음에 forwardToGa4 를 호출(게이트 통과 후 발송).
 *
 * ⚠️ 정직: 이 게이트는 측정 구조만 검증한다. 어떤 수치도 조작하지 않는다.
 * 양방향 검증: 정상 PASS + 위반(분자 'scroll' 되돌리기·게이트 밖 gtag·onScroll 직접 gtag) 주입 시 FAIL.
 */
import fs from 'node:fs';

const OPTIMIZER = 'scripts/ga-optimizer.mjs';
const TRACKER = 'src/lib/visitor-tracker.ts';

const errors = [];

/** `function NAME(` 선언부터 중괄호 매칭으로 함수 본문 추출(중첩 대응). 없으면 null.
 *  파라미터 타입 안의 `{ }`(예: opts?: { dwellMs?: number })에 걸리지 않도록 파라미터 괄호를
 *  먼저 닫은 뒤의 본문 `{` 부터 매칭한다. */
function fnBody(src, name) {
  const decl = new RegExp(`function\\s+${name}\\s*\\(`).exec(src);
  if (!decl) return null;
  // 파라미터 리스트의 닫는 ')' 까지 괄호 깊이로 건너뛴다
  let i = src.indexOf('(', decl.index);
  let paren = 0;
  for (; i < src.length; i++) {
    if (src[i] === '(') paren++;
    else if (src[i] === ')') { paren--; if (paren === 0) { i++; break; } }
  }
  const open = src.indexOf('{', i);
  if (open < 0) return null;
  let depth = 0;
  for (let j = open; j < src.length; j++) {
    const c = src[j];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return { body: src.slice(open, j + 1), start: open, end: j + 1 }; }
  }
  return null;
}

const countGtag = (s) => (s.match(/gtag\s*\(/g) || []).length;

// ── A) ga-optimizer 끝까지읽기 분자 = 게이트 통과 'scroll_100' ──
if (!fs.existsSync(OPTIMIZER)) {
  errors.push(`${OPTIMIZER}: 파일 없음`);
} else {
  const src = fs.readFileSync(OPTIMIZER, 'utf8');
  const sb = fnBody(src, 'scrollByPage');
  if (!sb) {
    errors.push(`${OPTIMIZER}: scrollByPage 함수 없음 — 끝까지읽기 분자 출처 불명`);
  } else {
    // 향상측정 'scroll'(게이트 없음=봇 포함)을 eventName 필터로 쓰면 분자>분모(>100%) 재발 → 차단
    if (/value:\s*['"]scroll['"]/.test(sb.body)) {
      errors.push(`${OPTIMIZER}: 끝까지읽기 분자가 향상측정 'scroll'(게이트 없음=봇 포함) — 분자>분모(>100%) 재발. 'scroll_100'으로`);
    }
    if (!/value:\s*['"]scroll_100['"]/.test(sb.body)) {
      errors.push(`${OPTIMIZER}: scrollByPage 가 게이트 통과 'scroll_100'을 분자로 쓰지 않음 (eventName 필터 value:'scroll_100' 필요)`);
    }
  }
}

// ── B) visitor-tracker GA 발송은 게이트 통과 후(forwardToGa4)에서만 ──
if (!fs.existsSync(TRACKER)) {
  errors.push(`${TRACKER}: 파일 없음`);
} else {
  const src = fs.readFileSync(TRACKER, 'utf8');

  // scroll_100 을 GA로 보내는 호출 존재
  if (!/gtag\s*\(\s*['"]event['"]\s*,\s*['"]scroll_100['"]/.test(src)) {
    errors.push(`${TRACKER}: scroll_100 GA 발송(gtag('event','scroll_100', …)) 없음 — 끝까지읽기 GA 미전달`);
  }

  // 모든 gtag( 호출이 forwardToGa4 내부에만 = 게이트 통과 후에만 발송
  const fwd = fnBody(src, 'forwardToGa4');
  if (!fwd) {
    errors.push(`${TRACKER}: forwardToGa4 함수 없음 — GA 발송 길목 불명`);
  } else {
    const totalGtag = countGtag(src);
    const inFwd = countGtag(fwd.body);
    if (totalGtag !== inFwd) {
      errors.push(`${TRACKER}: gtag( 호출 ${totalGtag}건 중 ${inFwd}건만 forwardToGa4 내부 — 게이트 밖 GA 발송(봇 포함 위험) 차단`);
    }
  }

  // onScroll 안에서 gtag 직접 호출 0 (봇 스크롤이 게이트 우회로 집계 안 됨)
  const os = fnBody(src, 'onScroll');
  if (os && /gtag\s*\(/.test(os.body)) {
    errors.push(`${TRACKER}: onScroll 안에서 gtag 직접 호출 — 게이트 우회. send() 통해서만 발송해야 봇 스크롤 0`);
  }

  // send() 는 봇 가드(isBot) 다음에 forwardToGa4 를 호출(게이트 통과 후 발송)
  const sb = fnBody(src, 'send');
  if (!sb) {
    errors.push(`${TRACKER}: send 함수 없음 — 게이트 위치 검증 불가`);
  } else {
    const botIdx = sb.body.search(/isBot\s*\(/);
    const fwdIdx = sb.body.search(/forwardToGa4\s*\(/);
    if (fwdIdx < 0) errors.push(`${TRACKER}: send() 가 forwardToGa4 를 호출하지 않음`);
    else if (botIdx < 0) errors.push(`${TRACKER}: send() 에 봇 가드(isBot) 없음 — 봇 스크롤이 GA로 셈`);
    else if (fwdIdx < botIdx) errors.push(`${TRACKER}: send() 가 봇 가드(isBot) ★전에 forwardToGa4 호출 — 게이트 우회(봇 포함)`);
  }
}

if (errors.length) {
  console.error(`\n❌ [지표/정직] 스크롤 정직 게이트 FAIL (${errors.length}건)`);
  for (const e of errors) console.error(`   - ${e}`);
  console.error('\n끝까지읽기 분자=게이트 통과 scroll_100(봇 0) · GA 발송=게이트 통과 후만 · onScroll 직접발송 0. 배포 차단.\n');
  process.exit(1);
}

console.log('✅ [지표/정직] 스크롤 정직 게이트 PASS — 분자=게이트 scroll_100(봇 0)·발송=게이트 통과 후·>100% 구조적 불가 확인');
