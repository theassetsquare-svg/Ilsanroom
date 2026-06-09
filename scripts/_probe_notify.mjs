#!/usr/bin/env node
// 일회용 진단 v4 — 함수 DDL stack depth 원인(이벤트 트리거?) 식별. 실행 후 삭제 예정.
const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(label, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST', headers, body: JSON.stringify({ query }),
  });
  const text = await res.text();
  let j; try { j = JSON.parse(text); } catch { j = { raw: text }; }
  const ok = res.ok && j?.success !== false;
  console.log(`=== ${label} === ${ok ? 'OK' : 'FAIL'} ${ok ? '' : '| ' + (j?.error || j?.message || text)}`);
  return ok;
}

const LOAD = `DROP TABLE IF EXISTS public._probe_diag;
CREATE TABLE public._probe_diag (id serial primary key, k text, v text);
INSERT INTO public._probe_diag (k, v)
  SELECT 'EVT', evtname||' | '||evtevent||' | enabled='||evtenabled::text||' | '||(evtfoid::regprocedure)::text
  FROM pg_event_trigger ORDER BY evtname;
INSERT INTO public._probe_diag (k, v)
  SELECT 'EVT_SRC:'||evtname, pg_get_functiondef(evtfoid)
  FROM pg_event_trigger;
INSERT INTO public._probe_diag (k, v) VALUES
  ('exec_sql_src', (SELECT pg_get_functiondef('public.exec_sql'::regprocedure)));
NOTIFY pgrst, 'reload schema';`;

(async () => {
  await run('LOAD diag', LOAD);
  for (let i = 0; i < 6; i++) {
    await sleep(2500);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/_probe_diag?select=k,v&order=id`, { headers });
    if (r.ok) {
      const rows = await r.json();
      console.log(`\n--- diag (${rows.length} rows) ---`);
      for (const row of rows) console.log(`\n[${row.k}]\n${row.v}`);
      break;
    }
    console.log(`read retry ${i}: ${r.status}`);
  }
})();
