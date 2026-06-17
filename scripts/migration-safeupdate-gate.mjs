#!/usr/bin/env node
/**
 * 빌드 게이트 — supabase/migrations/*.sql 의 모든 최상위 UPDATE/DELETE 가 WHERE 절을 갖도록 강제한다.
 *
 * 배경(재발 방지): 2026-06-16 마이그레이션 20260616_cleanup_dup_helper_comments.sql 의
 *   `UPDATE posts SET comment_count = (SELECT COUNT(*) ...)` 가 WHERE 가 없어
 *   Supabase pg_safeupdate("UPDATE requires a WHERE clause")가 거부 → 파일 전체가 하나의
 *   exec_sql 트랜잭션이라 같은 파일의 DELETE 까지 롤백 → 중복 댓글이 라이브에 그대로 남고
 *   migrate.mjs 는 매 push 실패(_migrations 미기록 → 무한 재시도). 런타임에만 터지므로
 *   빌드타임에 차단한다.
 *
 * 동작: 각 .sql 에서 주석/문자열/달러인용 블록을 공백화 → 최상위(괄호깊이 0) 세미콜론으로 문장 분리 →
 *   문장이 UPDATE 또는 DELETE 로 시작하면 그 문장 안에 괄호깊이 0 의 WHERE 가 있는지 확인.
 *   서브쿼리 안의 WHERE(괄호 깊이>0)는 pg_safeupdate 를 만족시키지 못하므로 무시한다.
 *   ※ 범위: 최상위 DML. DO/plpgsql 본문(달러인용)은 공백화되어 검사 대상에서 빠진다
 *     (그 안의 DML 은 함수 실행시 별도 평가 — 이 게이트의 1차 표적은 마이그레이션 최상위 문장).
 *
 * 양방향 self-test 내장: 정상 SQL(서브쿼리 WHERE + 최상위 WHERE) = 0위반,
 *   WHERE 없는 UPDATE / WHERE 없는 DELETE / 서브쿼리에만 WHERE 있는 UPDATE = 전부 적발.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIG_DIR = path.join(ROOT, 'supabase', 'migrations');

/** 주석·단일인용문자열·달러인용 블록을 길이보존 공백으로 치환(세미콜론/괄호/키워드 오탐 제거). */
function blankNonCode(sql) {
  const a = sql.split('');
  const n = sql.length;
  const blank = (s, e) => { for (let k = s; k < e && k < n; k++) if (a[k] !== '\n') a[k] = ' '; };
  let i = 0;
  while (i < n) {
    if (sql[i] === '/' && sql[i + 1] === '*') { let j = sql.indexOf('*/', i + 2); j = j < 0 ? n : j + 2; blank(i, j); i = j; continue; }
    if (sql[i] === '-' && sql[i + 1] === '-') { let j = sql.indexOf('\n', i); j = j < 0 ? n : j; blank(i, j); i = j; continue; }
    if (sql[i] === "'") {
      let j = i + 1;
      while (j < n) { if (sql[j] === "'") { if (sql[j + 1] === "'") { j += 2; continue; } j++; break; } j++; }
      blank(i, j); i = j; continue;
    }
    if (sql[i] === '$') {
      const m = /^\$(\w*)\$/.exec(sql.slice(i));
      if (m) { const tag = m[0]; const start = i + tag.length; const end = sql.indexOf(tag, start); const j = end < 0 ? n : end + tag.length; blank(i, j); i = j; continue; }
    }
    i++;
  }
  return a.join('');
}

/** 최상위(괄호깊이 0) 세미콜론으로 문장 분리 → [text...]. */
function splitStatements(clean) {
  const out = [];
  let depth = 0, start = 0;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ';' && depth === 0) { out.push(clean.slice(start, i)); start = i + 1; }
  }
  if (clean.slice(start).trim()) out.push(clean.slice(start));
  return out;
}

/** 문장 안에 괄호깊이 0 의 WHERE 가 있는가. */
function hasTopLevelWhere(stmt) {
  let depth = 0;
  const re = /\(|\)|\bwhere\b/gi;
  let m;
  while ((m = re.exec(stmt))) {
    if (m[0] === '(') depth++;
    else if (m[0] === ')') depth--;
    else if (depth === 0) return true;
  }
  return false;
}

/** clean SQL → 위반 [{kind, snippet}]. */
function findViolations(clean) {
  const out = [];
  for (const stmt of splitStatements(clean)) {
    const t = stmt.trim();
    const mk = /^(update|delete)\b/i.exec(t);
    if (!mk) continue;
    if (!hasTopLevelWhere(t)) {
      out.push({ kind: mk[1].toUpperCase(), snippet: t.replace(/\s+/g, ' ').slice(0, 90) });
    }
  }
  return out;
}

// ─── 양방향 self-test ───
function selfTest() {
  const good = `
    DELETE FROM comments WHERE content = 'x; not a where (trap)';
    UPDATE posts p SET comment_count = (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id)
      WHERE p.comment_count IS DISTINCT FROM (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id);
    INSERT INTO posts (id) VALUES (1);
  `;
  if (findViolations(blankNonCode(good)).length !== 0) {
    console.error('❌ self-test 실패: 정상 SQL 오탐\n', findViolations(blankNonCode(good)));
    process.exit(1);
  }
  const bads = [
    ['UPDATE posts SET comment_count = 0;', 'WHERE 없는 UPDATE'],
    ['DELETE FROM comments;', 'WHERE 없는 DELETE'],
    ['UPDATE posts p SET comment_count = (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id);', '서브쿼리에만 WHERE 있는 UPDATE'],
  ];
  for (const [sql, label] of bads) {
    if (findViolations(blankNonCode(sql)).length === 0) {
      console.error(`❌ self-test 실패: ${label} 못 잡음 → ${sql}`);
      process.exit(1);
    }
  }
}

selfTest();

if (!fs.existsSync(MIG_DIR)) {
  console.log('⏭️  supabase/migrations 없음 — 검사 대상 0');
  process.exit(0);
}

const files = fs.readdirSync(MIG_DIR).filter((f) => f.endsWith('.sql'));
let failed = false;
for (const f of files) {
  const v = findViolations(blankNonCode(fs.readFileSync(path.join(MIG_DIR, f), 'utf8')));
  if (v.length) {
    failed = true;
    console.error(`❌ ${f}:`);
    v.forEach((x) => console.error(`   - WHERE 없는 ${x.kind}: ${x.snippet}…`));
  }
}
if (failed) {
  console.error('\n빌드 중단 — 마이그레이션에 WHERE 없는 최상위 UPDATE/DELETE 가 있습니다.');
  console.error('Supabase pg_safeupdate 가 거부 → 파일 전체 트랜잭션 롤백 → migrate 매 push 실패.');
  console.error('전체 갱신이 의도라면 WHERE 로 조건을 명시하세요(예: ... WHERE col IS DISTINCT FROM (…)).');
  process.exit(1);
}
console.log(`✅ 마이그레이션 safe-update 게이트 통과 (${files.length}개 .sql, self-test 양방향 OK)`);
