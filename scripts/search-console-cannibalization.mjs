#!/usr/bin/env node
/**
 * Google Search Console — 카니발리제이션 + 기회 키워드 진단 (참고용 리포트)
 *
 * 인증 (scripts/lib/gsc-auth.mjs):
 *   1순위 서비스계정 GSC_SA_JSON (만료 없음, 권장)
 *   2순위 OAuth GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN (폴백)
 *   RESEND_API_KEY / NOTIFICATION_EMAIL (메일 발송, 선택)
 *
 * 동작 (읽기 전용):
 *   1) ['query','page'] 전수 조회 → 같은 키워드를 2+ 페이지가 경쟁(카니발리제이션) 검출
 *   2) ['query'] → 4~15위 '곧 1페이지' 노다지 키워드
 *   3) ['device'] → PC/모바일 분리 요약
 *   콘솔 출력 + (RESEND 설정 시) 이메일 1통.
 */
import { getAccessToken, gscQuery, hasGscCredentials } from './lib/gsc-auth.mjs';

const DAYS = 28;

if (!hasGscCredentials()) {
  console.log('⏭️  GSC 인증정보 미설정 (GSC_SA_JSON 또는 GOOGLE_OAUTH_*) — 스킵');
  process.exit(0);
}

const query = (token, dimensions, rowLimit = 25000) => gscQuery(token, { dimensions, rowLimit, days: DAYS });

(async () => {
  const token = await getAccessToken();
  if (!token) process.exit(0);

  const qp = await query(token, ['query', 'page']);
  const q = await query(token, ['query']);
  const dev = await query(token, ['device'], 10);
  const range = { start: qp.start, end: qp.end };

  // query -> 페이지 목록
  const byQuery = new Map();
  for (const row of qp.rows) {
    const [kw, page] = row.keys;
    if (!byQuery.has(kw)) byQuery.set(kw, []);
    byQuery.get(kw).push({
      page,
      clicks: row.clicks || 0,
      imp: row.impressions || 0,
      pos: row.position || 0,
    });
  }

  // 🔴 진짜 자기잠식만: "같은 페이지"가 2+ 서로 다른 URL(슬래시/파라미터/인코딩)로 갈려 자기랑 경쟁.
  //    이름 다른 가게끼리 같은 generic 검색에 뜨는 건 카니발 아님 → 제외 (#0 규칙).
  const normPath = (u) => {
    let s = u;
    try { s = decodeURIComponent(u); } catch { /* keep */ }
    return (s.replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase()) || '/';
  };
  const cannibal = [];
  for (const [kw, pages] of byQuery) {
    const groups = new Map();
    for (const p of pages) {
      const k = normPath(p.page);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(p);
    }
    for (const [path, variants] of groups) {
      if (variants.length < 2) continue; // 같은 페이지가 2+ URL일 때만 = 진짜 자기잠식
      const imp = variants.reduce((a, p) => a + p.imp, 0);
      variants.sort((a, b) => a.pos - b.pos);
      cannibal.push({ kw, path, variants, imp, clicks: variants.reduce((a, p) => a + p.clicks, 0), n: variants.length });
    }
  }
  cannibal.sort((a, b) => b.imp - a.imp);

  // 2) 4~15위 노다지
  const opp = q.rows
    .map((r) => ({ kw: r.keys[0], clicks: r.clicks || 0, imp: r.impressions || 0, ctr: (r.ctr || 0) * 100, pos: r.position || 0 }))
    .filter((r) => r.pos >= 3.5 && r.pos <= 15 && r.imp >= 20)
    .sort((a, b) => b.imp - a.imp)
    .slice(0, 20);

  // 3) device
  const deviceRows = dev.rows.map((r) => ({
    device: r.keys[0],
    clicks: r.clicks || 0,
    imp: r.impressions || 0,
    ctr: ((r.ctr || 0) * 100).toFixed(1),
    pos: (r.position || 0).toFixed(1),
  }));

  // ===== 콘솔 출력 =====
  console.log(`\n📊 놀쿨 카니발리제이션 진단  ${range.start} ~ ${range.end} (최근 ${DAYS}일)`);
  console.log(`전체 키워드 ${byQuery.size}개 · 진짜 자기잠식(같은 페이지 多URL) ${cannibal.length}건`);

  console.log(`\n=== 🔴 진짜 자기잠식 — 같은 페이지가 여러 URL로 갈려 자기랑 경쟁 ===`);
  console.log(`(이름 다른 가게끼리 경쟁은 제외 = #0 규칙. 슬래시/파라미터/인코딩 중복만)`);
  if (cannibal.length === 0) console.log('  ✅ 없음 — 깨끗함');
  for (const c of cannibal) {
    console.log(`\n  "${c.kw}" → 같은 페이지 [${c.path}] 가 ${c.n}개 URL로 갈림 · 노출 ${c.imp} 클릭 ${c.clicks}`);
    for (const v of c.variants) {
      console.log(`     ${v.pos.toFixed(1).padStart(5)}위 | 노출 ${String(v.imp).padStart(4)} 클릭 ${String(v.clicks).padStart(3)} | ${v.page}`);
    }
  }

  console.log(`\n=== 🎯 '곧 1페이지' 노다지 (4~15위, 노출≥20) TOP20 ===`);
  console.log('순위   노출  클릭   CTR    키워드');
  for (const r of opp) {
    console.log(`${r.pos.toFixed(1).padStart(5)}  ${String(r.imp).padStart(5)}  ${String(r.clicks).padStart(4)}  ${(r.ctr.toFixed(1) + '%').padStart(6)}   ${r.kw}`);
  }

  console.log(`\n=== 📱 디바이스별 (PC/모바일/태블릿) ===`);
  for (const d of deviceRows) {
    console.log(`  ${d.device.padEnd(8)} 클릭 ${String(d.clicks).padStart(4)} · 노출 ${String(d.imp).padStart(5)} · CTR ${d.ctr}% · 평균순위 ${d.pos}`);
  }

  // ===== 이메일 (기본 비발송 — 실패시만/인박스0 정책) =====
  // 이 리포트가 잡는 자기잠식은 "같은 페이지가 URL 변형(슬래시/인코딩)으로 갈린" 경우뿐 —
  // canonical이 이미 합치는 양성 신호다. 매일 메일 = 인박스 노이즈이므로 기본 비발송.
  // 진단은 CI 콘솔 로그에 항상 남고, 정말 메일이 필요하면 CANNIBALIZATION_EMAIL=1로 옵트인.
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY && process.env.CANNIBALIZATION_EMAIL === '1') {
    const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
    const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' KST';
    const cannHtml = cannibal.map((c) => {
      const rows = c.variants.map((p) => `<tr><td style="text-align:right">${p.pos.toFixed(1)}위</td><td style="text-align:right">${p.imp}</td><td style="text-align:right">${p.clicks}</td><td style="padding-left:10px;color:#374151;font-size:11px">${p.page}</td></tr>`).join('');
      return `<div style="margin:14px 0;padding:10px;background:#FEF2F2;border-radius:8px"><b>"${c.kw}"</b> → 같은 페이지 <code>${c.path}</code> <span style="color:#DC2626">${c.n}개 URL로 갈림</span> · 노출 ${c.imp} · 클릭 ${c.clicks}<table style="width:100%;font-size:12px;margin-top:6px">${rows}</table></div>`;
    }).join('');
    const oppHtml = opp.map((r) => `<tr><td style="text-align:right;font-weight:600">${r.pos.toFixed(1)}위</td><td style="text-align:right">${r.imp}</td><td style="text-align:right">${r.clicks}</td><td style="text-align:right">${r.ctr.toFixed(1)}%</td><td style="padding-left:10px">${r.kw}</td></tr>`).join('');
    const devHtml = deviceRows.map((d) => `<tr><td>${d.device}</td><td style="text-align:right">${d.clicks}</td><td style="text-align:right">${d.imp}</td><td style="text-align:right">${d.ctr}%</td><td style="text-align:right">${d.pos}</td></tr>`).join('');
    const html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px;color:#111">
      <h2 style="color:#DC2626">🔴 놀쿨 자기잠식 진단 (${range.start} ~ ${range.end})</h2>
      <p style="color:#666;font-size:12px">발송 ${kst} · 전체 키워드 ${byQuery.size} · 진짜 자기잠식 ${cannibal.length}건 (같은 페이지 多URL만)</p>
      <h3>같은 페이지가 여러 URL로 갈려 자기랑 경쟁</h3>
      ${cannHtml || '<p>✅ 없음 — 깨끗함</p>'}
      <h3 style="margin-top:24px">🎯 곧 1페이지 노다지 (4~15위)</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="color:#6B7280"><th>순위</th><th>노출</th><th>클릭</th><th>CTR</th><th style="text-align:left;padding-left:10px">키워드</th></tr></thead><tbody>${oppHtml}</tbody></table>
      <h3 style="margin-top:24px">📱 디바이스별</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="color:#6B7280"><th style="text-align:left">기기</th><th>클릭</th><th>노출</th><th>CTR</th><th>평균순위</th></tr></thead><tbody>${devHtml}</tbody></table>
      <p style="color:#9CA3AF;font-size:11px;margin-top:24px">읽기 전용 참고 리포트 · 데이터는 Google 정책상 약 2일 지연.</p>
    </div>`;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'NOLCOOL auto <onboarding@resend.dev>',
        to: [TO],
        subject: `[놀쿨][🩸] 카니발리제이션 ${cannibal.length}건 · 노다지 ${opp.length}건`,
        html,
      }),
    }).catch(() => null);
    console.log(`\n📧 메일 발송: ${r ? r.status : '실패'} → ${TO}`);
  }
})();
