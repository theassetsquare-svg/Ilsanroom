#!/usr/bin/env node
/**
 * [차단 게이트] auto-content 시드 댓글 다양성 보장
 *
 * 배경(2026-06-16 사고): scripts/auto-content-v2.mjs 가 시드 댓글을
 *   `seed_comment_pool?limit=1&order=id.desc` 로 *단 한 행*(id 최대 = 풀 마지막
 *   삽입 "도우미 분이 친절하셨음")만 가져온 뒤 pick() 했다. 1개짜리 배열에
 *   pick() 은 무의미 → 15분마다 자동 달리는 점진 댓글이 전부 동일 문구로 박혀,
 *   관리자 지메일에 같은 "새 댓글" 알림이 끝없이 쌓이고 라이브 커뮤니티가
 *   봇처럼 보였다(AI 냄새 0% 규칙 위반).
 *
 * 불변식: auto-content 스크립트는 seed_comment_pool 에서 댓글을 고를 때
 *   단일 행(limit=1)으로 조회하면 안 된다. 풀 전체(또는 다수 행)를 받아
 *   JS pick()/random 으로 골라야 매번 다른 댓글이 달린다.
 *   ⚠️ seed_post_pool 은 used 플래그 로테이션이라 limit=1 이 정상 → 대상 아님.
 *
 * 검출: scripts/auto-content*.mjs 에서 seed_comment_pool 조회 쿼리에 limit=1 이
 *   포함되면 FAIL(빌드 차단). 위반 주입은 gate-bypass-audit REGISTRY 가 양방향 검증.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'scripts');
// 실제 콘텐츠 삽입 스크립트만 — 이 게이트 자신(-gate.mjs)은 제외
const files = readdirSync(DIR).filter((f) => /^auto-content.*\.mjs$/.test(f) && !f.endsWith('-gate.mjs'));

// seed_comment_pool 조회 문자열 안에 limit=1 이 들어간 패턴 (seed_post_pool 은 제외)
const BAD = /seed_comment_pool[^`'"]*\blimit=1\b/g;

const violations = [];
for (const f of files) {
  const src = readFileSync(join(DIR, f), 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    if (BAD.test(line)) violations.push(`${f}:${i + 1}  ${line.trim()}`);
    BAD.lastIndex = 0;
  });
}

console.log(`🧪 auto-content 댓글 다양성 게이트 — 스캔 ${files.length}개 파일`);
if (violations.length) {
  console.error(`\n❌ FAIL — seed_comment_pool 을 단일행(limit=1)으로 조회 ${violations.length}건:`);
  for (const v of violations) console.error(`   - ${v}`);
  console.error('\n→ 풀 전체를 받아(예: seed_comment_pool?select=content) JS pick()/random 으로 고르세요.');
  console.error('  단일행 조회 + pick() 은 항상 같은 댓글만 달려 동일 알림이 반복됩니다.');
  process.exit(1);
}
console.log('✅ PASS — auto-content 댓글은 풀에서 다양하게 선택됨');
