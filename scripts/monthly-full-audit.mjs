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
 *   4) GA4 Admin 설정 — 데이터 보관 14개월 + 핵심이벤트 존재 (읽기전용 GET)
 *   5) GSC sitemap 상태 — 등록/오류/경고 (errors>0 시 자동 재제출)
 *   6) GA4 랜딩페이지별 세션깊이 — 페이지/세션 최저 페이지 처방 (목표: 어느 페이지로 들어와도 10+ PV)
 *
 * 자동 해결 (실행한 것만 메일에 기록):
 *   - 노출0/순위 20위권 밖 venue URL → IndexNow 재크롤 핑
 *   - 노출0 존재 시 sitemap 재제출
 *   - sitemap errors>0 시 재제출
 *   - 설정 이상(보관기간/핵심이벤트)은 자동수정 불가(SA 뷰어=안전선) → 행동필요 신호로만 메일 포함
 *
 * 환경: GSC_SA_JSON(필수) / INDEXNOW_KEY / RESEND_API_KEY / NOTIFICATION_EMAIL
 */
import fs from 'node:fs';
import { getAccessToken, hasGscCredentials } from './lib/gsc-auth.mjs';
import { getGaToken, runReport, runRealtimeReport, gaErrorReason } from './lib/ga-auth.mjs';

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

  /* 3.2) GA4 종합 스윕 — 획득/이벤트/기기/지역/시간패턴/신규재방문/유지/실시간 전 축 (읽기전용)
   *      목적: 사람들이 어디서 와서 · 뭘 하고 · 언제 오고 · 다시 오는지 → 고칠 곳 지도 */
  const sweep = {}; // { label: [{k, v: [..]}] }
  if (gaToken) {
    const RANGE = [{ startDate: '28daysAgo', endDate: 'yesterday' }];
    const DIM_REPORTS = [
      ['채널', 'sessionDefaultChannelGroup', ['sessions', 'totalUsers', 'engagementRate']],
      ['소스/매체', 'sessionSourceMedium', ['sessions', 'totalUsers']],
      ['기기', 'deviceCategory', ['sessions', 'engagementRate', 'averageSessionDuration']],
      ['OS', 'operatingSystem', ['sessions']],
      ['브라우저', 'browser', ['sessions']],
      ['국가', 'country', ['sessions']],
      ['도시', 'city', ['sessions']],
      ['신규/재방문', 'newVsReturning', ['sessions', 'totalUsers']],
      ['이벤트', 'eventName', ['eventCount', 'totalUsers']],
      ['핵심이벤트 전환', 'eventName', ['keyEvents']],
      ['인기페이지', 'pagePath', ['screenPageViews']],
      ['시간대(0-23시)', 'hour', ['sessions']],
      ['요일(일=0)', 'dayOfWeek', ['sessions']],
    ];
    for (const [label, dim, mets] of DIM_REPORTS) {
      const r = await runReport(gaToken, {
        dateRanges: RANGE,
        dimensions: [{ name: dim }],
        metrics: mets.map((name) => ({ name })),
        orderBys: [{ metric: { metricName: mets[0] }, desc: true }],
        limit: 10,
      });
      if (r.ok && r.body.rows?.length) {
        sweep[label] = r.body.rows.map((row) => ({ k: row.dimensionValues[0].value, v: row.metricValues.map((x) => Number(x.value)) }));
        console.log(`📊 ${label}: ${sweep[label].slice(0, 5).map((x) => `${x.k}=${x.v[0]}`).join(' · ')}`);
      } else if (!r.ok) console.warn(`⚠️ GA4 ${label} 실패 — ${gaErrorReason(r.status, r.body)}`);
    }
    // 사용자·참여 총괄 지표 — rolling 지표(activeNDayUsers/dauPerMau)는 날짜 dimension 없이
    // 기간 합산하면 불가능 수치(7일활성>총사용자·참여율>100%)가 나와 제외 (정직 규칙)
    const uMet = ['totalUsers', 'newUsers', 'engagementRate', 'engagedSessions', 'eventsPerSession', 'sessionsPerUser'];
    const ru = await runReport(gaToken, { dateRanges: RANGE, metrics: uMet.map((name) => ({ name })) });
    if (ru.ok && ru.body.rows?.length) {
      const m = ru.body.rows[0].metricValues.map((x) => Number(x.value));
      sweep['사용자/유지'] = uMet.map((k, i) => ({ k, v: [m[i]] }));
      console.log(`📊 사용자/참여: 총 ${m[0]} · 신규 ${m[1]} · 참여율 ${(m[2] * 100).toFixed(1)}% · 참여세션 ${m[3]} · 이벤트/세션 ${m[4].toFixed(1)} · 세션/사용자 ${m[5].toFixed(2)}`);
    }
    // 실시간 접속
    const rt = await runRealtimeReport(gaToken, { metrics: [{ name: 'activeUsers' }] });
    if (rt.ok && rt.body.rows?.length) {
      sweep['실시간'] = [{ k: 'activeUsers', v: [Number(rt.body.rows[0].metricValues[0].value)] }];
      console.log(`📊 실시간 접속자: ${sweep['실시간'][0].v[0]}명`);
    }
  }

  /* 3.5) GA4 Admin 설정 점검 — 읽기전용 GET (보관 14개월 · 핵심이벤트) */
  const settingsIssues = [];
  if (gaToken) {
    const adminGet = async (path) => {
      const r = await fetch(`https://analyticsadmin.googleapis.com/v1beta/properties/540830544/${path}`, {
        headers: { Authorization: `Bearer ${gaToken}`, 'x-goog-user-project': process.env.GA_QUOTA_PROJECT || 'theassetsquare-search-console' },
      }).catch(() => null);
      return r && r.ok ? r.json() : null;
    };
    const retention = await adminGet('dataRetentionSettings');
    if (retention) {
      const ok = retention.eventDataRetention === 'FOURTEEN_MONTHS';
      console.log(`⚙️ GA4 보관기간: ${retention.eventDataRetention} ${ok ? '✅' : '❌'}`);
      if (!ok) settingsIssues.push(`GA4 데이터 보관기간이 ${retention.eventDataRetention} (14개월 아님) — ga4-admin-apply.yml로 정정 필요`);
    }
    const ke = await adminGet('keyEvents');
    if (ke) {
      const names = (ke.keyEvents || []).map((k) => k.eventName);
      console.log(`⚙️ GA4 핵심이벤트 ${names.length}개: ${names.join(', ') || '없음'}`);
      if (!names.length) settingsIssues.push('GA4 핵심이벤트 0개 — 전환 측정 불가, ga4-admin-apply.yml로 등록 필요');
    }
  }

  /* 3.6) GSC sitemap 상태 점검 */
  let sitemapErrors = 0;
  {
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_PROPERTY)}/sitemaps`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    if (r && r.ok) {
      const list = (await r.json()).sitemap || [];
      for (const sm of list) {
        const errs = (sm.contents || []).reduce((a, c) => a + Number(c.errors || 0), 0) + Number(sm.errors || 0);
        const warns = (sm.contents || []).reduce((a, c) => a + Number(c.warnings || 0), 0) + Number(sm.warnings || 0);
        sitemapErrors += errs;
        console.log(`🗺️ sitemap ${sm.path}: 오류 ${errs} · 경고 ${warns} · pending ${sm.isPending ? 'Y' : 'N'}`);
      }
      if (!list.length) { sitemapErrors = 1; console.warn('🗺️ 등록된 sitemap 없음!'); }
    }
  }

  /* 3.7) GA4 랜딩페이지별 세션깊이 — 목표 10+ PV/세션, 최저 페이지 처방 (측정만, 조작 0) */
  let shallow = [];
  if (gaToken) {
    const r = await runReport(gaToken, {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }],
      dimensions: [{ name: 'landingPagePlusQueryString' }],
      metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }],
      limit: 10000,
    });
    if (r.ok && r.body.rows?.length) {
      const pages = r.body.rows
        .map((row) => {
          const path = row.dimensionValues[0].value.split('?')[0];
          const sessions = Number(row.metricValues[0].value);
          const pv = Number(row.metricValues[1].value);
          return { path, sessions, pps: sessions ? pv / sessions : 0 };
        })
        .filter((p) => p.sessions >= 5 && p.path.startsWith('/'));
      shallow = pages.filter((p) => p.pps < 10).sort((a, b) => a.pps - b.pps).slice(0, 10);
      const deep = pages.filter((p) => p.pps >= 10).length;
      console.log(`🔗 랜딩페이지 세션깊이 (세션≥5인 ${pages.length}p): 10+PV 달성 ${deep}p / 미달 ${pages.length - deep}p`);
      for (const p of shallow) console.log(`   📉 ${p.path} — ${p.pps.toFixed(1)} PV/세션 (세션 ${p.sessions})`);
    }
  }

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
  if (sitemapErrors > 0 && !zero.length && await resubmitSitemap(token)) {
    resolved.push(`sitemap 오류 ${sitemapErrors}건 감지 → 재제출로 재처리 유도`);
  }

  /* 진단 데이터(8키워드·GA4 종합·세션깊이·설정)는 런 로그 전용 — 메일에 넣지 않는다 (사장님 정책 2026-07-12).
   * 설정 이상도 로그만 남기고 침묵 — 메일은 오직 "해결한 것"만. */
  if (settingsIssues.length) for (const s of settingsIssues) console.warn(`⚙️ 설정 이상(로그만): ${s}`);
  void kwResult; void shallow; void ga; void strong;

  /* 5) 메일 — 문제를 해결한 것이 있을 때만 1통. 없으면 완전 침묵. */
  if (!resolved.length) { console.log('✅ 해결 조치 0건 — 메일 침묵 (사장님 정책)'); return; }
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 스킵'); return; }

  const html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px;color:#222">
    <h2 style="color:#059669">✅ [놀쿨] 월간 전수점검 — 문제 자동 해결 보고</h2>
    <p style="color:#666;font-size:13px">${kstNow()} · GSC/GA4 API 28일 전수 (venue ${venues.length}곳)</p>
    <h3>🛠️ 이번 달 자동 해결한 것</h3>
    <ul>${resolved.map((s) => `<li style="margin:6px 0">${esc(s)}</li>`).join('')}</ul>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매달 30일 KST 07:00 자동. 해결한 문제가 있을 때만 발송, 없으면 침묵.</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL 월간점검 <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨] ✅ 월간 전수점검 — 문제 자동 해결 ${resolved.length}건`,
      html,
    }),
  });
  console.log('📧 해결 보고 메일:', r.status);
}

main().catch((e) => { console.error('❌', e); process.exit(1); });
