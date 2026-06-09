#!/usr/bin/env node
// 일회용 진단 v3 — plpgsql 함수 생성 stack depth 원인 격리. 실행 후 삭제 예정.
const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function run(label, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST', headers, body: JSON.stringify({ query }),
  });
  const text = await res.text();
  let j; try { j = JSON.parse(text); } catch { j = { raw: text }; }
  const ok = res.ok && j?.success !== false;
  console.log(`\n=== ${label} === ${ok ? 'OK' : 'FAIL'}`);
  if (!ok) console.log('  err:', j?.error || j?.message || text);
  else console.log('  ->', JSON.stringify(j).slice(0, 1500));
  return ok;
}

// T1: check_function_bodies=off 로 우회되는가
const T1 = `SET check_function_bodies = off;
CREATE OR REPLACE FUNCTION public._probe_cfb() RETURNS trigger AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;`;

// T2: 진단 결과를 스크래치 테이블에 적재 → PostgREST로 읽기
const T2 = `DROP TABLE IF EXISTS public._probe_diag;
CREATE TABLE public._probe_diag (k text, v text);
INSERT INTO public._probe_diag
  SELECT 'evt:'||evtname, evtevent||' -> '||(evtfoid::regprocedure)::text FROM pg_event_trigger;
INSERT INTO public._probe_diag VALUES ('exec_sql_lang', (SELECT l.lanname FROM pg_proc p JOIN pg_language l ON l.oid=p.prolang WHERE p.proname='exec_sql' LIMIT 1));
INSERT INTO public._probe_diag VALUES ('plpgsql_validator', (SELECT (lanvalidator::regprocedure)::text FROM pg_language WHERE lanname='plpgsql'));
INSERT INTO public._probe_diag VALUES ('cfb_setting', (SELECT current_setting('check_function_bodies')));
GRANT SELECT ON public._probe_diag TO anon, authenticated;`;

const CLEAN = `DROP FUNCTION IF EXISTS public._probe_cfb();`;

(async () => {
  await run('T1 check_function_bodies=off', T1);
  await run('T2 load diag table', T2);
  await run('CLEANUP fn', CLEAN);
  console.log('\n=== read diag via PostgREST ===');
  const r = await fetch(`${SUPABASE_URL}/rest/v1/_probe_diag?select=k,v`, { headers });
  console.log(r.status, await r.text());
})();
