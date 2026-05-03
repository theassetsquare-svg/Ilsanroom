#!/usr/bin/env node
/**
 * Supabase 자동 마이그레이션 — supabase/migrations/*.sql 자동 실행
 *
 * 작동:
 *  1) DB에 _migrations 테이블 (이미 실행된 파일 기록)
 *  2) supabase/migrations/ 폴더에서 .sql 파일 알파벳 순으로 읽음
 *  3) _migrations에 없는 새 파일만 exec_sql RPC로 실행 후 기록
 *
 * 환경변수:
 *  SUPABASE_URL, SUPABASE_SERVICE_KEY (또는 SUPABASE_KEY)
 *
 * 실행: node scripts/migrate.mjs
 */
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rkqnblbajhnehmxfnvri.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY 환경변수 필요');
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function execSql(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || json?.message || text);
  }
  return json;
}

async function rpcSelect(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`SELECT ${table} 실패: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log('🔄 Supabase 마이그레이션 시작\n');

  // 1) _migrations 테이블 확보 + PostgREST 스키마 리로드
  await execSql(`
    CREATE TABLE IF NOT EXISTS public._migrations (
      filename text PRIMARY KEY,
      hash text NOT NULL,
      executed_at timestamptz DEFAULT now()
    );
    REVOKE ALL ON TABLE public._migrations FROM PUBLIC, anon, authenticated;
    NOTIFY pgrst, 'reload schema';
  `);

  // PostgREST가 스키마 다시 읽을 시간
  await new Promise(r => setTimeout(r, 1500));

  // 2) 실행된 마이그레이션 목록
  let done = [];
  for (let i = 0; i < 5; i++) {
    try {
      done = await rpcSelect('_migrations', 'select=filename,hash');
      break;
    } catch (e) {
      if (i === 4) throw e;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  const doneMap = new Map(done.map(d => [d.filename, d.hash]));

  // 3) 폴더 스캔
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const migDir = join(__dirname, '..', 'supabase', 'migrations');
  const files = readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();

  let applied = 0, skipped = 0, failed = 0;

  for (const file of files) {
    const sql = readFileSync(join(migDir, file), 'utf8');
    const hash = createHash('sha256').update(sql).digest('hex').slice(0, 16);

    if (doneMap.has(file)) {
      if (doneMap.get(file) === hash) {
        console.log(`⏭️  ${file} (이미 실행됨)`);
        skipped++;
        continue;
      } else {
        console.log(`⚠️  ${file} 변경 감지 (이미 실행된 파일을 수정함 — 무시)`);
        skipped++;
        continue;
      }
    }

    try {
      console.log(`▶  ${file} 실행 중...`);
      await execSql(sql);
      await execSql(`INSERT INTO public._migrations (filename, hash) VALUES ('${file.replace(/'/g, "''")}', '${hash}')`);
      console.log(`✅ ${file} 적용 완료`);
      applied++;
    } catch (e) {
      console.error(`❌ ${file} 실패: ${e.message}`);
      failed++;
      if (process.env.STRICT === '1') process.exit(1);
    }
  }

  console.log(`\n✨ 완료 — 적용 ${applied} / 건너뜀 ${skipped} / 실패 ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch(e => {
  console.error('❌ 치명적 에러:', e);
  process.exit(1);
});
