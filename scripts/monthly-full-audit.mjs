#!/usr/bin/env node
/**
 * monthly-full-audit — 매달 30일 전 페이지 GSC+GA4 전수 확인 + 자동해결 + 해결보고 1통
 *
 * 사장님 정책 (2026-07-12):
 *   - 문제 메일 X. "문제를 해결한 것"만 매달 30일 지메일 1통.
 *   - 해결할 문제가 없으면 메일 발송 안 함 (완전 침묵).
 *   - 사이트 피해 0: 읽기전용 API + 무해한 재크롤 신호(sitemap 재제출·IndexNow)만.
 *     콘텐츠/코드/설정 자동 변경 절대 없음 — 수치 조작·합성 이벤트 0 (정직 불변식).
 *
 * 확인 범위 (GSC/GA4 API 직접):
 *   1) GSC page 28d 전수 — venues.ts 123개 slug 페이지 실측 순위 (거짓 노출0 방지: page dimension)
 *   2) 타깃 8 키워드 query 28d 순위 (일산룸/일산명월관/일산요정/해운대고구려/강남호빠/장안동호빠/수원호빠/건대호빠)
 *   3) GA4 28d — 세션·페이지뷰·페이지/세션·이탈률·평균체류 (북극성 추적)
 *
 * 자동 해결 (실행한 것만 메일에 기록):
 *   - 노출0/순위 20위권 밖 venue URL → IndexNow 재크롤 핑
 *   - 노출0 존재 시 sitemap 재제출
 *
 * 환경: GSC_SA_JSON(필수) / INDEXNOW_KEY / RESEND_API_KEY / NOTIFICATION_EMAIL
 */
import fs from 'node:fs';
import { getAccessToken, hasGscCredentials } from './lib/gsc-auth.mjs';
import { getGaToken, runReport, gaErrorReason } from './lib/ga-auth.mjs';

const SITE = 'nolcool.com';
const BASE = 'https://nolcool.com';
const SITE_PROPERTY = 'https://nolcool.com/';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

const TARGET_KEYWORDS = ['일산룸', '일산명월관', '일산요정', '해운대고구려', '강남호빠', '장안동호빠', '수원호빠', '건대호빠'];

if (!hasGscCredentials()) { console.log('⏭️ GSC_SA_JSON 없음 — 스킵'); process.exit(0); }

const kstNow = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function parseVenues() {
  const src = fs.readFileSync(new URL('../src/data/venues.ts', import.meta.url), 'utf8');
  const out = [];
  for (const m of src.matchAll(/slug:\s*['"]([^'"]+)['"][\s\S]*?nameKo:\s*['"]([^'"]+)['"]/g)) {
    out.push({ slug: m[1], name: m[2] });
  }
  return out;
}

async function gscQuery(token, body) {
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_PROPERTY)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) { console.error('GSC query', r.status, (await r.text()).slice(0, 200)); return []; }
  return (await r.json()).rows || [];
}

function dateRange(days) {
  const end = new Date(Date.now() - 2 * 86400000); // GSC ~2일 지연
  const start = new Date(end.getTime() - days * 86400000);
  const d = (x) => x.toISOString().slice(0, 10);
  return { startDate: d(start), endDate: d(end) };
}

async function indexNowPing(urls) {
  if (!INDEXNOW_KEY) { console.log('⏭️ INDEXNOW_KEY 없음 — 재크롤 핑 스킵'); return false; }
  if (!urls.length) return false;
  const body = JSON.stringify({ host: SITE, key: INDEXNOW_KEY, keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`, urlList: urls.slice(0, 500) });
  let ok = false;
  for (const ep of ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow']) {
    const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => null);
    if (r && (r.status === 200 || r.status === 202)) ok = true;
    console.log(`  IndexNow ${ep.includes('bing') ? 'bing' : 'api'}: ${r ? r.status : 'ERR'}`);
  }
  return ok;
}

async function resubmitSitemap(token) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_PROPERTY)}/sitemaps/${encodeURIComponent(BASE + '/sitemap.xml')}`;
  const r = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
  const ok = r && (r.status === 200 || r.status === 204);
  console.log(`  sitemap 재제출: ${ok ? 'OK' : r ? r.status : 'ERR'}`);
  return !!ok;
}

async function main() {
  console.log(`📅 monthly-full-audit ${kstNow()}`);
  const token = await getAccessToken();
  if (!token) { console.error('❌ GSC 토큰 발급 실패'); process.exit(1); }

  const range = dateRange(28);
  console.log(`📈 GSC ${range.startDate}~${range.endDate}`);

  /* 1) 페이지 전수 실측 — venue slug 매칭 */
  const pageRows = await gscQuery(token, { ...range, dimensions: ['page'], rowLimit: 25000 });
  const venues = parseVenues();
  console.log(`   페이지 ${pageRows.length}행 / venue ${venues.length}개`);

  const perVenue = venues.map((v) => {
    let imp = 0, clicks = 0, posWeighted = 0, url = null;
    for (const r of pageRows) {
      const p = r.keys[0];
      if (p.includes(`/${v.slug}/`) || p.endsWith(`/${v.slug}`)) {
        imp += r.impressions; clicks += r.clicks; posWeighted += r.position * r.impressions;
        if (!url || p.length < url.length) url = p;
      }
    }
    return { ...v, imp, clicks, pos: imp ? posWeighted / imp : null, url };
  });
  const zero = perVenue.filter((v) => v.imp === 0);
  const weak = perVenue.filter((v) => v.imp > 0 && v.pos > 20);
  const strong = perVenue.filter((v) => v.imp > 0 && v.pos <= 10);
  console.log(`   🟢 10위내 ${strong.length} · 🟡 20위밖 ${weak.length} · 🚫 노출0 ${zero.length}`);
  for (const v of zero) console.log(`   🚫 ${v.name} (${v.slug})`);
  for (const v of weak) console.log(`   🟡 ${v.name} ${v.pos.toFixed(1)}위 (노출 ${v.imp})`);

  /* 2) 타깃 8 키워드 */
  const kwRows = await gscQuery(token, { ...range, dimensions: ['query'], rowLimit: 25000 });
  const norm = (s) => (s || '').replace(/\s+/g, '').toLowerCase();
  const kwResult = TARGET_KEYWORDS.map((kw) => {
    let imp = 0, clicks = 0, posW = 0;
    for (const r of kwRows) {
      if (norm(r.keys[0]).includes(norm(kw))) { imp += r.impressions; clicks += r.clicks; posW += r.position * r.impressions; }
    }
    return { kw, imp, clicks, pos: imp ? posW / imp : null };
  });
  console.log('🎯 타깃 8 키워드:');
  for (const k of kwResult) console.log(`   ${k.kw}: ${k.pos ? k.pos.toFixed(1) + '위' : '노출0'} (노출 ${k.imp}/클릭 ${k.clicks})`);

  /* 3) GA4 28d 북극성 */
  let ga = null;
  const gaToken = await getGaToken();
  if (gaToken) {
    const r = await runReport(gaToken, {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }],
      metrics: [
        { name: 'sessions' }, { name: 'screenPageViews' },
        { name: 'bounceRate' }, { name: 'averageSessionDuration' },
      ],
    });
    if (r.ok && r.body.rows?.length) {
      const m = r.body.rows[0].metricValues.map((x) => Number(x.value));
      ga = { sessions: m[0], pv: m[1], pps: m[0] ? m[1] / m[0] : 0, bounce: m[2], dur: m[3] };
      console.log(`📊 GA4 28d: 세션 ${ga.sessions} · PV ${ga.pv} · 페이지/세션 ${ga.pps.toFixed(2)} · 이탈 ${(ga.bounce * 100).toFixed(1)}% · 체류 ${Math.round(ga.dur)}초`);
    } else console.warn(`⚠️ GA4 실패 — ${gaErrorReason(r.status, r.body)}`);
  } else console.warn('⚠️ GA4 토큰 실패 — GSC만 진행');

  /* 4) 자동 해결 — 무해한 재크롤 신호만 (콘텐츠/설정 변경 0) */
  const resolved = [];
  const problemUrls = [
    ...zero.map((v) => v.url || `${BASE}/search?q=${encodeURIComponent(v.name)}`).filter((u) => u.startsWith(BASE)),
    ...weak.map((v) => v.url).filter(Boolean),
  ];
  // 노출0 venue는 GSC에 URL이 없으므로 sitemap에서 slug 매칭해 실URL 확보
  if (zero.length) {
    try {
      const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
      const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      for (const v of zero) {
        const hit = locs.find((l) => l.includes(`/${v.slug}/`));
        if (hit && !problemUrls.includes(hit)) problemUrls.push(hit);
      }
    } catch { /* sitemap 실패 시 스킵 */ }
  }
  const pingUrls = [...new Set(problemUrls.filter((u) => u && u.startsWith(BASE)))];

  if (pingUrls.length) {
    console.log(`🛠️ 자동 해결: 노출0 ${zero.length} + 20위밖 ${weak.length} → 재크롤 신호 ${pingUrls.length}개 URL`);
    if (await indexNowPing(pingUrls)) resolved.push(`노출 약한 페이지 ${pingUrls.length}개 IndexNow 재크롤 요청 (노출0 ${zero.length}곳 · 20위권 밖 ${weak.length}곳)`);
    if (zero.length && await resubmitSitemap(token)) resolved.push(`sitemap 재제출 — 노출0 ${zero.length}곳 재발견 유도`);
  } else {
    console.log('✅ 노출0/약순위 페이지 없음 — 해결할 문제 없음');
  }

  /* 5) 메일 — 해결한 것이 있을 때만 1통. 없으면 완전 침묵. */
  if (!resolved.length) { console.log('✅ 해결 조치 0건 — 메일 침묵 (사장님 정책)'); return; }
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 스킵'); return; }

  const kwTable = kwResult.map((k) => `<tr>
    <td style="border:1px solid #E5E7EB;padding:8px;font-size:13px">${esc(k.kw)}</td>
    <td style="border:1px solid #E5E7EB;padding:8px;font-size:13px;text-align:center;font-weight:bold;color:${k.pos && k.pos <= 10 ? '#059669' : k.pos ? '#D97706' : '#DC2626'}">${k.pos ? k.pos.toFixed(1) + '위' : '노출0'}</td>
    <td style="border:1px solid #E5E7EB;padding:8px;font-size:13px;text-align:center">${k.imp} / ${k.clicks}</td>
  </tr>`).join('');

  const html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px;color:#222">
    <h2 style="color:#059669">✅ [놀쿨] 월간 전수점검 — 문제 자동 해결 보고</h2>
    <p style="color:#666;font-size:13px">측정: ${kstNow()} · GSC/GA4 API 28일 전수 (venue ${venues.length}곳)</p>
    <h3>🛠️ 이번 달 자동 해결한 것</h3>
    <ul>${resolved.map((s) => `<li style="margin:6px 0">${esc(s)}</li>`).join('')}</ul>
    <h3>📊 현황 요약</h3>
    <p style="font-size:14px">가게이름 페이지 실측: 🟢 10위내 <b>${strong.length}</b> · 🟡 20위밖 <b>${weak.length}</b> · 🚫 노출0 <b>${zero.length}</b> / ${venues.length}곳</p>
    ${ga ? `<p style="font-size:14px">GA4 28일: 세션 <b>${ga.sessions}</b> · 페이지/세션 <b>${ga.pps.toFixed(2)}</b> · 이탈 <b>${(ga.bounce * 100).toFixed(1)}%</b> · 평균체류 <b>${Math.round(ga.dur)}초</b></p>` : ''}
    <h3>🎯 타깃 8 키워드 순위</h3>
    <table style="border-collapse:collapse;width:100%">
      <thead><tr style="background:#F3F4F6"><th align="left" style="border:1px solid #E5E7EB;padding:8px;font-size:13px">키워드</th><th style="border:1px solid #E5E7EB;padding:8px;font-size:13px">평균순위</th><th style="border:1px solid #E5E7EB;padding:8px;font-size:13px">노출/클릭</th></tr></thead>
      <tbody>${kwTable}</tbody>
    </table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매달 30일 KST 07:00 자동 — monthly-full-audit.mjs. 해결한 문제가 있을 때만 발송, 없으면 침묵. 콘텐츠·설정 자동 변경 없음(재크롤 신호만).</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL 월간점검 <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨] ✅ 월간 전수점검 — 자동 해결 ${resolved.length}건 (노출0 ${zero.length}곳 재크롤)`,
      html,
    }),
  });
  console.log('📧 해결 보고 메일:', r.status);
}

main().catch((e) => { console.error('❌', e); process.exit(1); });
