#!/usr/bin/env node
/**
 * 놀쿨 Supabase 일일 상태 메일 — 매일 KST 09:00
 *
 * 매시간 audit 와 차이:
 *   - audit: 회귀 발견 시만 메일 (노이즈 최소)
 *   - 이 스크립트: 매일 1통 (정상이든 회귀든) — 사장님 안심용
 *
 * 환경변수: SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, NOTIFY_EMAIL
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rkqnblbajhnehmxfnvri.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || process.env.NOTIFICATION_EMAIL;

if (!SUPABASE_KEY || !RESEND_API_KEY || !NOTIFY_EMAIL) {
  console.error('❌ 필수 환경변수 누락 (SUPABASE_SERVICE_KEY / RESEND_API_KEY / NOTIFY_EMAIL)');
  process.exit(1);
}

// security-audit-nightly.mjs 와 동일 baseline (단일 출처)
const BASELINE = {
  search_path_missing: 0,
  always_true: 25,
  secdef_public: 1,
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
  const res = await fetch(`${SUPABASE_URL}/rest/v1/_diag_daily?select=k,v`, { headers });
  if (!res.ok) throw new Error(`SELECT _diag_daily ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  // 1) 측정 (audit-nightly 와 동일 쿼리, 테이블만 _diag_daily)
  await execSql(`
    DROP TABLE IF EXISTS public._diag_daily;
    CREATE TABLE public._diag_daily (k text PRIMARY KEY, v int NOT NULL);
    INSERT INTO public._diag_daily SELECT 'search_path_missing', count(*)::int
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.prokind='f'
        AND (p.proconfig IS NULL OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'));
    INSERT INTO public._diag_daily SELECT 'always_true', count(*)::int
      FROM pg_policies WHERE schemaname='public' AND (qual='true' OR with_check='true');
    INSERT INTO public._diag_daily SELECT 'secdef_public', count(*)::int
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      LEFT JOIN aclexplode(p.proacl) a ON true
      WHERE n.nspname='public' AND p.prokind='f' AND p.prosecdef=true AND a.grantee=0;
    INSERT INTO public._diag_daily SELECT 'rls_no_policy', count(*)::int
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity=true
        AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname);
    INSERT INTO public._diag_daily SELECT 'rls_disabled_count', count(*)::int
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity=false
        AND c.relname NOT LIKE '\\_%' ESCAPE '\\';
    NOTIFY pgrst, 'reload schema';
  `);

  await new Promise(r => setTimeout(r, 2500));

  let rows = [];
  for (let i = 0; i < 5; i++) {
    try { rows = await selectDiag(); break; }
    catch (e) { if (i === 4) throw e; await new Promise(r => setTimeout(r, 2000)); }
  }
  const current = Object.fromEntries(rows.map(r => [r.k, r.v]));

  // 2) cleanup
  try { await execSql(`DROP TABLE IF EXISTS public._diag_daily;`); } catch {}

  // 3) 상태 판정
  const allGreen = Object.keys(BASELINE).every(k => (current[k] ?? -1) <= BASELINE[k]);
  const today = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });

  // ★ 메일 정책 — 실패시만 발송 (회귀 시 보냄, 정상은 stdout만)
  if (allGreen) {
    console.log(`✅ ${today} 모든 지표 baseline 이하 — 메일 발송 안 함 (실패시만 정책)`);
    return;
  }

  const statusLabel = '🛑 회귀';
  const statusColor = '#DC2626';

  // 4) HTML 메일
  const rowsHtml = Object.keys(BASELINE).map(k => {
    const base = BASELINE[k];
    const cur = current[k] ?? '?';
    const ok = cur <= base;
    const color = ok ? '#059669' : '#DC2626';
    const mark = ok ? '✅' : '🛑';
    return `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:10px"><b>${LABELS[k]}</b></td>
        <td style="padding:10px;text-align:right;color:${color}">${mark} ${cur}</td>
        <td style="padding:10px;text-align:right;color:#666">${base}</td>
      </tr>`;
  }).join('');

  const html = `
    <div style="font-family:-apple-system,sans-serif;color:#111;max-width:600px;margin:0 auto;padding:20px">
      <h1 style="color:${statusColor};margin:0 0 8px">${statusLabel} ${today} 놀쿨 보안 일일 상태</h1>
      <p style="color:#666;margin:0 0 24px">매일 KST 09:00 자동 발송 — Supabase 5지표</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead><tr style="background:${statusColor};color:#fff">
          <th style="text-align:left;padding:10px">지표</th>
          <th style="text-align:right;padding:10px">현재</th>
          <th style="text-align:right;padding:10px">기준</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      ${allGreen ? `
        <div style="background:#ECFDF5;border-left:4px solid #059669;padding:12px;margin-bottom:16px">
          <b>모든 지표 baseline 이하 — 오늘도 정상.</b>
          <p style="margin:8px 0 0;color:#555;font-size:14px">매시간 자동 점검 활성, 회귀 시 즉시 별도 메일.</p>
        </div>` : `
        <div style="background:#FEF2F2;border-left:4px solid #DC2626;padding:12px;margin-bottom:16px">
          <b>회귀 감지됨 — Dashboard 확인 필요.</b>
          <p style="margin:8px 0 0"><a href="https://supabase.com/dashboard/project/rkqnblbajhnehmxfnvri/advisors/security">https://supabase.com/dashboard/project/rkqnblbajhnehmxfnvri/advisors/security</a></p>
        </div>`}

      <p style="color:#999;font-size:12px;margin:24px 0 0;text-align:center">
        놀쿨 보안 일일봇 · 매일 KST 09:00 발송<br>
        관리자: <a href="https://nolcool.com/admin">nolcool.com/admin</a>
      </p>
    </div>`;

  const emailBody = JSON.stringify({
    from: '놀쿨 보안일일봇 <onboarding@resend.dev>',
    to: [NOTIFY_EMAIL],
    subject: `${allGreen ? '✅' : '🛑'} ${today} 놀쿨 보안 일일 상태`,
    html,
  });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: emailBody,
  });

  if (!res.ok) {
    console.error('❌ Resend 실패:', res.status, await res.text());
    process.exit(1);
  }
  console.log(`📧 일일 메일 발송 완료 (${statusLabel}) — ${today}`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
