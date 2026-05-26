#!/usr/bin/env node
/**
 * 놀쿨 Supabase 야간 보안 감사
 *
 * 매일 KST 03:00 (.github/workflows/security-audit-nightly.yml cron)
 * pg_catalog에서 6개 권고 지표 카운트:
 *   1) Function Search Path Mutable
 *   2) RLS Policy Always True (qual='true' OR with_check='true')
 *   3) SECDEF + PUBLIC EXECUTE
 *   4) RLS Enabled No Policy
 *   5) Public schema function without search_path
 *   6) Tables with RLS disabled
 *
 * 기준선과 비교 → 회귀 시 이메일 (Resend) + 워크플로 실패
 *
 * 환경변수: SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, NOTIFY_EMAIL
 */
import https from 'node:https';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rkqnblbajhnehmxfnvri.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || process.env.NOTIFICATION_EMAIL;

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
    method: 'POST', headers, body: JSON.stringify({ query }),
  });
  const t = await res.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t }; }
  if (!res.ok || j?.success === false) throw new Error(j?.error || t);
  return j;
}

async function selectDiag() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/_diag_sec_audit?select=k,v`, { headers });
  if (!res.ok) throw new Error(`SELECT _diag_sec_audit ${res.status}: ${await res.text()}`);
  return res.json();
}

// 베이스라인 — 2026-05-21 Phase1+Phase2 INSERT 잠금 후 측정값
const BASELINE = {
  search_path_missing: 0,
  always_true: 25,        // 익명 INSERT 3 (page_events/leads/waitlist) + 공개 SELECT 22
  secdef_public: 1,       // is_admin() 만 (RLS 평가 필요)
  rls_no_policy: 0,
  rls_disabled_count: 0,
};

const LABELS = {
  search_path_missing: 'Function Search Path Mutable',
  always_true: 'RLS Policy Always True',
  secdef_public: 'SECURITY DEFINER + PUBLIC EXECUTE',
  rls_no_policy: 'RLS Enabled No Policy',
  rls_disabled_count: 'Tables With RLS Disabled',
};

async function sendEmail(subject, html) {
  if (!RESEND_API_KEY || !NOTIFY_EMAIL) {
    console.log('⚠️  Resend 키/이메일 없음 — 메일 skip');
    return;
  }
  const body = JSON.stringify({
    from: 'NOLCOOL 보안봇 <onboarding@resend.dev>',
    to: [NOTIFY_EMAIL],
    subject,
    html,
  });
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  if (!res.ok) {
    console.error('❌ Resend 실패:', res.status, await res.text());
  } else {
    console.log('📧 메일 발송 완료');
  }
}

async function main() {
  console.log('🔍 Supabase 야간 보안 감사 시작\n');

  // 1) 진단 테이블 재생성 — exec_sql 은 결과를 안 돌려주므로 테이블 경유
  await execSql(`
    DROP TABLE IF EXISTS public._diag_sec_audit;
    CREATE TABLE public._diag_sec_audit (k text PRIMARY KEY, v int NOT NULL);
    INSERT INTO public._diag_sec_audit SELECT 'search_path_missing', count(*)::int
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.prokind='f'
        AND (p.proconfig IS NULL OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'));
    INSERT INTO public._diag_sec_audit SELECT 'always_true', count(*)::int
      FROM pg_policies WHERE schemaname='public' AND (qual='true' OR with_check='true');
    INSERT INTO public._diag_sec_audit SELECT 'secdef_public', count(*)::int
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      LEFT JOIN aclexplode(p.proacl) a ON true
      WHERE n.nspname='public' AND p.prokind='f' AND p.prosecdef=true AND a.grantee=0;
    INSERT INTO public._diag_sec_audit SELECT 'rls_no_policy', count(*)::int
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity=true
        AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname);
    INSERT INTO public._diag_sec_audit SELECT 'rls_disabled_count', count(*)::int
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity=false
        AND c.relname NOT LIKE '\\_%' ESCAPE '\\';
    NOTIFY pgrst, 'reload schema';
  `);

  // PostgREST 스키마 캐시 리로드 대기
  await new Promise(r => setTimeout(r, 2500));

  let rows = [];
  for (let i = 0; i < 5; i++) {
    try { rows = await selectDiag(); break; }
    catch (e) { if (i === 4) throw e; await new Promise(r => setTimeout(r, 2000)); }
  }
  const current = Object.fromEntries(rows.map(r => [r.k, r.v]));

  // 2) 회귀 검사
  const regressions = [];
  for (const k of Object.keys(BASELINE)) {
    const base = BASELINE[k];
    const cur = current[k] ?? null;
    if (cur === null) {
      regressions.push({ k, label: LABELS[k], base, cur, msg: 'MISSING' });
    } else if (cur > base) {
      regressions.push({ k, label: LABELS[k], base, cur, msg: `${cur - base} 증가` });
    }
  }

  console.log('📊 현재 측정값:');
  for (const k of Object.keys(BASELINE)) {
    const base = BASELINE[k], cur = current[k] ?? '?';
    const status = cur === base ? '✅' : cur > base ? '🛑' : 'ℹ️';
    console.log(`  ${status} ${LABELS[k]}: ${cur} (baseline ${base})`);
  }

  // 3) 메일 (회귀 있을 때만)
  // Cleanup — advisor에 잡히지 않도록 즉시 DROP
  try { await execSql(`DROP TABLE IF EXISTS public._diag_sec_audit;`); } catch {}

  if (regressions.length) {
    const today = new Date().toISOString().slice(0, 10);
    const html = `
      <div style="font-family:-apple-system,sans-serif;color:#111;max-width:600px;margin:0 auto;padding:20px">
        <h1 style="color:#DC2626;margin:0 0 8px">🛑 ${today} 보안 회귀 감지</h1>
        <p style="color:#666;margin:0 0 24px">${regressions.length}개 지표가 베이스라인을 초과했습니다.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <thead><tr style="background:#DC2626;color:#fff">
            <th style="text-align:left;padding:10px">지표</th>
            <th style="text-align:right;padding:10px">현재</th>
            <th style="text-align:right;padding:10px">기준</th>
            <th style="text-align:right;padding:10px">변동</th>
          </tr></thead>
          <tbody>
            ${regressions.map(r => `
              <tr style="border-bottom:1px solid #eee">
                <td style="padding:10px"><b>${r.label}</b></td>
                <td style="padding:10px;text-align:right;color:#DC2626">${r.cur}</td>
                <td style="padding:10px;text-align:right">${r.base}</td>
                <td style="padding:10px;text-align:right;color:#DC2626">${r.msg}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <p style="color:#666;font-size:14px">관리자: <a href="https://nolcool.com/admin">nolcool.com/admin</a></p>
      </div>`;
    await sendEmail(`🛑 ${today} 놀쿨 보안 회귀 ${regressions.length}건`, html);
    process.exit(1);
  }

  console.log('\n✅ 전체 정상 — 회귀 없음 (_diag_sec_audit cleanup 완료)');
}

main().catch(e => { console.error('❌', e); process.exit(1); });
