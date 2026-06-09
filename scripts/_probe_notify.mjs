#!/usr/bin/env node
// 일회용 진단 — notify_on_comment stack depth 원인 격리. 실행 후 삭제 예정. (run2)
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
  else console.log('  ->', JSON.stringify(j).slice(0, 300));
  return ok;
}

const P1 = `CREATE OR REPLACE FUNCTION public._probe_noop() RETURNS trigger AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;`;
const P2 = `CREATE OR REPLACE FUNCTION public._probe_body() RETURNS trigger AS $$
DECLARE a uuid; t text;
BEGIN
  SELECT user_id, title INTO a, t FROM public.posts WHERE id = NEW.post_id;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;`;
const P3 = `CREATE OR REPLACE FUNCTION public._probe_ins() RETURNS trigger AS $$
DECLARE a uuid;
BEGIN
  SELECT user_id INTO a FROM public.posts WHERE id = NEW.post_id;
  IF a IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (a, 'comment', 'x', 'y', '/z');
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;`;
const P4 = `DROP TRIGGER IF EXISTS _probe_trg ON public.comments;
CREATE TRIGGER _probe_trg AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public._probe_noop();`;
const CLEAN = `DROP TRIGGER IF EXISTS _probe_trg ON public.comments;
DROP FUNCTION IF EXISTS public._probe_noop();
DROP FUNCTION IF EXISTS public._probe_body();
DROP FUNCTION IF EXISTS public._probe_ins();`;

(async () => {
  await run('P1 trivial trigger fn', P1);
  await run('P2 fn with SELECT body', P2);
  await run('P3 fn with INSERT notifications', P3);
  await run('P4 CREATE TRIGGER on comments', P4);
  await run('CLEANUP', CLEAN);
})();
