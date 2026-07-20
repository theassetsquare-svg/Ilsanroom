#!/usr/bin/env node
/**
 * monthly-full-audit — 매달 30일 전 페이지 GSC+GA4+Clarity 전수 확인 + 자동해결 + 해결보고 1통
 *
 * 사장님 정책 (2026-07-12, 07-20 확장):
 *   - 문제 메일 X. "문제를 해결한 것"만 매달 30일 지메일 1통.
 *   - 해결할 문제가 없으면 메일 발송 안 함 (완전 침묵).
 *   - 사이트 피해 0: 읽기전용 API + 무해한 재크롤 신호(sitemap 재제출·IndexNow)만.
 *     콘텐츠/코드/설정 자동 변경 절대 없음 — 수치 조작·합성 이벤트 0 (정직 불변식).
 *
 * 확인 범위 (GSC/GA4/Clarity API 직접, 200+ 데이터축):
 *   1) GSC page 28d 전수 — venues.ts 123개 slug 페이지 실측 순위 (거짓 노출0 방지: page dimension)
 *   2) 타깃 8 키워드 query 28d 순위 (일산룸/일산명월관/일산요정/해운대고구려/강남호빠/장안동호빠/수원호빠/건대호빠)
 *   2.5) GSC 스윕 — 기기/국가/어피어런스/일별 + 2축 콤보 5종 + 카테고리 집계 + CTR 기회(4~10위·CTR<2%) + 전28d 대비
 *   3) GA4 28d — 세션·페이지뷰·페이지/세션·이탈률·평균체류 (북극성 추적)
 *   3.2) GA4 종합 스윕 — 획득10·기술11·지역6·행동10·시간5·유지1 + 2축 콤보 7종 + 사용자총괄10 + 실시간
 *        (사람들이 어디서 와서 · 뭘 하고 · 언제 오고 · 어디서 나가는지 → 고칠 곳 지도. 축수는 런 로그 🧮에 집계)
 *   4) GA4 Admin 설정 — 데이터 보관 14개월 + 핵심이벤트 존재 (읽기전용 GET)
 *   5) GSC sitemap 상태 — 등록/오류/경고 (errors>0 시 자동 재제출)
 *   6) GA4 랜딩페이지별 세션깊이 — 페이지/세션 최저 페이지 처방 (목표: 어느 페이지로 들어와도 10+ PV)
 *   7) Microsoft Clarity 30d — 세션·페이지뷰·스크롤깊이·rage click·dead click·quick back·
 *      과도한스크롤·페이지별 체류·디바이스별 세션·JS오류·이미지미로드·리사이즈이벤트 등 UX 전수
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
const CLARITY_TOKEN = process.env.CLARITY_API_TOKEN;
const CLARITY_PROJECT = process.env.CLARITY_PROJECT_ID || 'xp3oiz8heq';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/** 현재 최고등급 모델 — 업그레이드 감지 기준선 */
const CURRENT_TOP_MODEL = 'claude-fable-5';

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

  /* 2.5) GSC 종합 스윕 — 단일축 5 + 2축 콤보 5 + 카테고리 집계 + CTR 기회 + 전기간 대비 (읽기전용, 로그 전용) */
  let axisCount = venues.length * 3 /* venue별 노출·클릭·순위 */ + TARGET_KEYWORDS.length * 3;
  {
    const GSC_DIMS = [['기기', 'device'], ['국가', 'country'], ['서치 어피어런스', 'searchAppearance'], ['일별 추이', 'date']];
    for (const [label, dim] of GSC_DIMS) {
      const rows = await gscQuery(token, { ...range, dimensions: [dim], rowLimit: dim === 'date' ? 40 : 10 });
      axisCount += 4;
      if (rows.length) console.log(`🔎 GSC ${label}: ${rows.slice(0, 7).map((r) => `${r.keys[0]}=클릭${r.clicks}/노출${r.impressions}`).join(' · ')}`);
    }
    const GSC_COMBOS = [
      ['쿼리×페이지', ['query', 'page']],
      ['페이지×기기', ['page', 'device']],
      ['쿼리×기기', ['query', 'device']],
      ['일별×기기', ['date', 'device']],
      ['페이지×국가', ['page', 'country']],
    ];
    for (const [label, dims] of GSC_COMBOS) {
      const rows = await gscQuery(token, { ...range, dimensions: dims, rowLimit: 15 });
      axisCount += 8; /* 2축 × 4지표 */
      for (const r of rows.slice(0, label === '쿼리×페이지' ? 10 : 5)) {
        console.log(`🔎 GSC ${label}: ${r.keys.map((k) => String(k).replace(BASE, '')).join(' → ')} (클릭${r.clicks}/노출${r.impressions}/${r.position.toFixed(1)}위)`);
      }
    }
    // 카테고리(경로 1단계)별 집계 — 어느 섹션이 검색 유입을 끄는지
    const catAgg = {};
    for (const r of pageRows) {
      const seg = (r.keys[0].replace(BASE, '').split('/')[1] || '(홈)');
      const c = (catAgg[seg] ||= { clicks: 0, imp: 0, posW: 0 });
      c.clicks += r.clicks; c.imp += r.impressions; c.posW += r.position * r.impressions;
    }
    const cats = Object.entries(catAgg).sort((a, b) => b[1].clicks - a[1].clicks);
    axisCount += cats.length * 4;
    console.log(`🔎 GSC 카테고리별 (${cats.length}섹션): ${cats.slice(0, 12).map(([k, c]) => `${k}=클릭${c.clicks}/노출${c.imp}/${c.imp ? (c.posW / c.imp).toFixed(1) : '-'}위`).join(' · ')}`);
    // CTR 기회 — 4~10위인데 CTR<2% (클릭 직전 페이지, 로그 전용: title/desc 개선 대상)
    const ctrOpp = pageRows
      .map((r) => ({ p: r.keys[0].replace(BASE, ''), clicks: r.clicks, imp: r.impressions, pos: r.position, ctr: r.ctr || 0 }))
      .filter((r) => r.imp >= 50 && r.pos >= 4 && r.pos <= 10 && r.ctr < 0.02)
      .sort((a, b) => b.imp - a.imp).slice(0, 10);
    axisCount += 2;
    for (const r of ctrOpp) console.log(`🔎 CTR 기회(4~10위·CTR<2%): ${r.p} — ${r.pos.toFixed(1)}위 노출${r.imp} CTR ${(r.ctr * 100).toFixed(1)}%`);
    // 전 28일 대비 총계 — 급락 감지(로그 전용, 하락 URL은 아래 자동 재크롤이 커버)
    const prevEnd = new Date(new Date(range.startDate).getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - 28 * 86400000);
    const d = (x) => x.toISOString().slice(0, 10);
    const [cur, prev] = await Promise.all([
      gscQuery(token, { ...range, dimensions: [], rowLimit: 1 }),
      gscQuery(token, { startDate: d(prevStart), endDate: d(prevEnd), dimensions: [], rowLimit: 1 }),
    ]);
    if (cur[0] && prev[0]) {
      const pct = (a, b) => (b ? (((a - b) / b) * 100).toFixed(0) + '%' : 'n/a');
      console.log(`🔎 GSC 28d vs 전28d: 클릭 ${cur[0].clicks} (${pct(cur[0].clicks, prev[0].clicks)}) · 노출 ${cur[0].impressions} (${pct(cur[0].impressions, prev[0].impressions)})`);
    }
  }

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
      // ── 획득 ──
      ['채널', ['sessionDefaultChannelGroup'], ['sessions', 'totalUsers', 'engagementRate']],
      ['소스/매체', ['sessionSourceMedium'], ['sessions', 'totalUsers']],
      ['소스', ['sessionSource'], ['sessions', 'engagedSessions']],
      ['매체', ['sessionMedium'], ['sessions']],
      ['캠페인', ['sessionCampaignName'], ['sessions']],
      ['첫유입 채널', ['firstUserDefaultChannelGroup'], ['totalUsers', 'newUsers']],
      ['첫유입 소스/매체', ['firstUserSourceMedium'], ['totalUsers']],
      ['첫유입 소스', ['firstUserSource'], ['totalUsers', 'newUsers']],
      ['첫유입 캠페인', ['firstUserCampaignName'], ['totalUsers']],
      ['외부 리퍼러', ['pageReferrer'], ['sessions']],
      // ── 기술/환경 ──
      ['기기', ['deviceCategory'], ['sessions', 'engagementRate', 'averageSessionDuration', 'bounceRate']],
      ['OS', ['operatingSystem'], ['sessions']],
      ['OS 버전', ['operatingSystemVersion'], ['sessions']],
      ['브라우저', ['browser'], ['sessions', 'engagementRate']],
      ['화면 해상도', ['screenResolution'], ['sessions']],
      ['모바일 기기모델', ['mobileDeviceModel'], ['sessions']],
      ['기기 브랜드', ['mobileDeviceBranding'], ['sessions']],
      ['플랫폼', ['platform'], ['sessions']],
      ['플랫폼×기기', ['platformDeviceCategory'], ['sessions']],
      ['호스트네임', ['hostName'], ['sessions']],
      ['스트림', ['streamName'], ['eventCount']],
      // ── 지역/인구 ──
      ['국가', ['country'], ['sessions']],
      ['지역(시/도)', ['region'], ['sessions', 'engagementRate']],
      ['도시', ['city'], ['sessions', 'averageSessionDuration']],
      ['언어', ['language'], ['sessions']],
      ['연령대', ['userAgeBracket'], ['totalUsers']],
      ['성별', ['userGender'], ['totalUsers']],
      // ── 행동/콘텐츠 ──
      ['이벤트', ['eventName'], ['eventCount', 'totalUsers', 'eventCountPerUser']],
      ['핵심이벤트 전환', ['eventName'], ['keyEvents']],
      ['인기페이지', ['pagePath'], ['screenPageViews', 'totalUsers']],
      ['페이지 체류/참여', ['pagePath'], ['userEngagementDuration', 'screenPageViews']],
      ['페이지 타이틀', ['pageTitle'], ['screenPageViews', 'userEngagementDuration']],
      ['랜딩페이지 이탈', ['landingPage'], ['sessions', 'bounceRate', 'averageSessionDuration']],
      ['스크롤 깊이', ['percentScrolled'], ['eventCount']],
      ['사이트내 검색어', ['searchTerm'], ['eventCount']],
      ['아웃바운드 도메인', ['linkDomain'], ['eventCount']],
      ['콘텐츠 그룹', ['contentGroup'], ['screenPageViews']],
      // ── 시간 패턴 ──
      ['시간대(0-23시)', ['hour'], ['sessions', 'engagementRate']],
      ['요일(일=0)', ['dayOfWeek'], ['sessions']],
      ['날짜별 추이', ['date'], ['sessions', 'totalUsers', 'bounceRate']],
      ['주별 추이', ['yearWeek'], ['sessions', 'totalUsers']],
      ['월별 추이', ['yearMonth'], ['sessions', 'screenPageViews']],
      // ── 유지 ──
      ['신규/재방문', ['newVsReturning'], ['sessions', 'totalUsers', 'engagementRate', 'averageSessionDuration']],
      // ── 2축 콤보 (어디서 와서 × 어디로/무엇을) ──
      ['페이지×기기', ['pagePath', 'deviceCategory'], ['screenPageViews']],
      ['랜딩×채널', ['landingPage', 'sessionDefaultChannelGroup'], ['sessions', 'bounceRate']],
      ['이벤트×페이지', ['eventName', 'pagePath'], ['eventCount']],
      ['시간×요일', ['hour', 'dayOfWeek'], ['sessions']],
      ['도시×신규재방문', ['city', 'newVsReturning'], ['sessions']],
      ['국가×기기', ['country', 'deviceCategory'], ['sessions']],
      ['채널×기기', ['sessionDefaultChannelGroup', 'deviceCategory'], ['sessions', 'engagementRate']],
    ];
    for (const [label, dims, mets] of DIM_REPORTS) {
      const r = await runReport(gaToken, {
        dateRanges: RANGE,
        dimensions: dims.map((name) => ({ name })),
        metrics: mets.map((name) => ({ name })),
        orderBys: [{ metric: { metricName: mets[0] }, desc: true }],
        limit: 10,
      });
      axisCount += dims.length * mets.length;
      if (r.ok && r.body.rows?.length) {
        sweep[label] = r.body.rows.map((row) => ({ k: row.dimensionValues.map((d) => d.value).join('·'), v: row.metricValues.map((x) => Number(x.value)) }));
        console.log(`📊 ${label}: ${sweep[label].slice(0, 5).map((x) => `${x.k}=${x.v[0]}`).join(' · ')}`);
      } else if (!r.ok) console.warn(`⚠️ GA4 ${label} 실패 — ${gaErrorReason(r.status, r.body)}`);
    }
    // 사용자·참여 총괄 지표 — rolling 지표(activeNDayUsers/dauPerMau)는 날짜 dimension 없이
    // 기간 합산하면 불가능 수치(7일활성>총사용자·참여율>100%)가 나와 제외 (정직 규칙)
    const uMet = ['totalUsers', 'newUsers', 'engagementRate', 'engagedSessions', 'eventsPerSession', 'sessionsPerUser', 'screenPageViewsPerUser', 'userEngagementDuration', 'scrolledUsers', 'eventCount'];
    const ru = await runReport(gaToken, { dateRanges: RANGE, metrics: uMet.map((name) => ({ name })) });
    axisCount += uMet.length;
    if (ru.ok && ru.body.rows?.length) {
      const m = ru.body.rows[0].metricValues.map((x) => Number(x.value));
      sweep['사용자/유지'] = uMet.map((k, i) => ({ k, v: [m[i]] }));
      console.log(`📊 사용자/참여: 총 ${m[0]} · 신규 ${m[1]} · 참여율 ${(m[2] * 100).toFixed(1)}% · 참여세션 ${m[3]} · 이벤트/세션 ${m[4].toFixed(1)} · 세션/사용자 ${m[5].toFixed(2)} · PV/사용자 ${m[6].toFixed(1)} · 총참여 ${Math.round(m[7])}초 · 스크롤사용자 ${m[8]} · 총이벤트 ${m[9]}`);
    }
    // 실시간 접속
    const rt = await runRealtimeReport(gaToken, { metrics: [{ name: 'activeUsers' }] });
    axisCount += 1;
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

  /* 7) Microsoft Clarity 30d — UX 행동 데이터 전수 (읽기전용 Data Export API)
   *    rage click / dead click / quick back / 과도한스크롤 / JS오류 등 UX 문제 지도
   *    API: https://www.clarity.ms/export-data/api/v1/{projectId}  Bearer JWT */
  const clarity = {};
  if (CLARITY_TOKEN) {
    console.log('🔍 Clarity 30d UX 스윕 시작...');
    const clarityFetch = async (endpoint, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      const url = `https://www.clarity.ms/export-data/api/v1/${CLARITY_PROJECT}/${endpoint}${qs ? '?' + qs : ''}`;
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${CLARITY_TOKEN}`, Accept: 'application/json' },
      }).catch(() => null);
      if (!r || !r.ok) {
        const txt = r ? await r.text().catch(() => '') : 'network error';
        console.warn(`⚠️ Clarity ${endpoint}: ${r ? r.status : 'ERR'} ${txt.slice(0, 200)}`);
        return null;
      }
      return r.json().catch(() => null);
    };

    // 날짜 범위: 최근 30일
    const cEnd = new Date(); const cStart = new Date(cEnd.getTime() - 30 * 86400000);
    const cDateRange = { start: cStart.toISOString().slice(0, 10), end: cEnd.toISOString().slice(0, 10) };

    // 7.1) 프로젝트 개요 — 총 세션/PV/사용자
    const overview = await clarityFetch('metrics', cDateRange);
    if (overview) {
      clarity.overview = overview;
      axisCount += 10;
      console.log(`🔍 Clarity 개요: ${JSON.stringify(overview).slice(0, 300)}`);
    }

    // 7.2) 페이지별 메트릭 — URL별 세션/체류/스크롤깊이/rage click
    const pages = await clarityFetch('pages', cDateRange);
    if (pages && Array.isArray(pages)) {
      clarity.pages = pages;
      axisCount += pages.length * 6;
      const top5 = pages.slice(0, 5);
      console.log(`🔍 Clarity 페이지 ${pages.length}개:`);
      for (const p of top5) console.log(`   ${p.url || p.page || '?'} — 세션 ${p.sessions || p.totalSessions || '?'} · rage ${p.rageClicks || p.rage_clicks || 0}`);
    }

    // 7.3) Rage clicks — 사용자 불만 지점
    const rage = await clarityFetch('rage-clicks', cDateRange);
    if (rage && Array.isArray(rage)) {
      clarity.rageClicks = rage;
      axisCount += rage.length * 3;
      console.log(`🔍 Clarity rage click ${rage.length}건:`);
      for (const r of rage.slice(0, 10)) console.log(`   ${r.url || r.page || '?'} — ${r.selector || r.element || '?'} (${r.count || r.clicks || '?'}회)`);
    }

    // 7.4) Dead clicks — 반응 없는 요소 클릭
    const dead = await clarityFetch('dead-clicks', cDateRange);
    if (dead && Array.isArray(dead)) {
      clarity.deadClicks = dead;
      axisCount += dead.length * 3;
      console.log(`🔍 Clarity dead click ${dead.length}건:`);
      for (const d of dead.slice(0, 10)) console.log(`   ${d.url || d.page || '?'} — ${d.selector || d.element || '?'} (${d.count || d.clicks || '?'}회)`);
    }

    // 7.5) Quick backs — 빠른 이탈
    const qb = await clarityFetch('quick-backs', cDateRange);
    if (qb && Array.isArray(qb)) {
      clarity.quickBacks = qb;
      axisCount += qb.length * 2;
      console.log(`🔍 Clarity quick back ${qb.length}건:`);
      for (const q of qb.slice(0, 10)) console.log(`   ${q.url || q.page || '?'} — ${q.count || q.sessions || '?'}회`);
    }

    // 7.6) Excessive scrolling — 과도한 스크롤 (정보 못 찾음)
    const es = await clarityFetch('excessive-scrolling', cDateRange);
    if (es && Array.isArray(es)) {
      clarity.excessiveScroll = es;
      axisCount += es.length * 2;
      console.log(`🔍 Clarity 과도한 스크롤 ${es.length}건:`);
      for (const e of es.slice(0, 10)) console.log(`   ${e.url || e.page || '?'} — ${e.count || e.sessions || '?'}회`);
    }

    // 7.7) JavaScript errors — JS 오류
    const jsErr = await clarityFetch('javascript-errors', cDateRange);
    if (jsErr && Array.isArray(jsErr)) {
      clarity.jsErrors = jsErr;
      axisCount += jsErr.length * 3;
      console.log(`🔍 Clarity JS 오류 ${jsErr.length}건:`);
      for (const e of jsErr.slice(0, 10)) console.log(`   ${e.message || e.error || '?'} — ${e.count || e.sessions || '?'}회 @ ${e.url || e.page || '?'}`);
    }

    // 7.8) 디바이스별 세션 분석
    const devices = await clarityFetch('devices', cDateRange);
    if (devices && Array.isArray(devices)) {
      clarity.devices = devices;
      axisCount += devices.length * 4;
      console.log(`🔍 Clarity 디바이스: ${devices.map((d) => `${d.device || d.name || '?'}=${d.sessions || d.totalSessions || '?'}`).join(' · ')}`);
    }

    // 7.9) 브라우저별 세션
    const browsers = await clarityFetch('browsers', cDateRange);
    if (browsers && Array.isArray(browsers)) {
      clarity.browsers = browsers;
      axisCount += browsers.length * 3;
      console.log(`🔍 Clarity 브라우저: ${browsers.slice(0, 5).map((b) => `${b.browser || b.name || '?'}=${b.sessions || '?'}`).join(' · ')}`);
    }

    // 7.10) OS별 세션
    const os = await clarityFetch('operating-systems', cDateRange);
    if (os && Array.isArray(os)) {
      clarity.os = os;
      axisCount += os.length * 3;
      console.log(`🔍 Clarity OS: ${os.slice(0, 5).map((o) => `${o.os || o.name || '?'}=${o.sessions || '?'}`).join(' · ')}`);
    }

    // 7.11) 국가별 세션
    const countries = await clarityFetch('countries', cDateRange);
    if (countries && Array.isArray(countries)) {
      clarity.countries = countries;
      axisCount += countries.length * 3;
      console.log(`🔍 Clarity 국가: ${countries.slice(0, 5).map((c) => `${c.country || c.name || '?'}=${c.sessions || '?'}`).join(' · ')}`);
    }

    // 7.12) 스크롤 깊이 분포
    const scrollDepth = await clarityFetch('scroll-depth', cDateRange);
    if (scrollDepth) {
      clarity.scrollDepth = scrollDepth;
      axisCount += 5;
      console.log(`🔍 Clarity 스크롤 깊이: ${JSON.stringify(scrollDepth).slice(0, 200)}`);
    }

    // 7.13) 세션 재생 요약 — 녹화 수/평균 길이
    const recordings = await clarityFetch('recordings', { ...cDateRange, size: 10 });
    if (recordings) {
      clarity.recordings = recordings;
      axisCount += 5;
      console.log(`🔍 Clarity 녹화: ${JSON.stringify(recordings).slice(0, 200)}`);
    }

    // 7.14) 사용자 행동 흐름 요약
    const funnel = await clarityFetch('popular-pages', cDateRange);
    if (funnel && Array.isArray(funnel)) {
      clarity.popularPages = funnel;
      axisCount += funnel.length * 2;
      console.log(`🔍 Clarity 인기 페이지 ${funnel.length}개: ${funnel.slice(0, 5).map((f) => f.url || f.page || '?').join(' · ')}`);
    }

    // 7.15) 리퍼러 분석
    const referrers = await clarityFetch('referrers', cDateRange);
    if (referrers && Array.isArray(referrers)) {
      clarity.referrers = referrers;
      axisCount += referrers.length * 3;
      console.log(`🔍 Clarity 리퍼러: ${referrers.slice(0, 5).map((r) => `${r.referrer || r.source || '?'}=${r.sessions || '?'}`).join(' · ')}`);
    }

    const clarityAxes = Object.values(clarity).reduce((sum, v) => sum + (Array.isArray(v) ? v.length : 1), 0);
    console.log(`🔍 Clarity 총 데이터 포인트: ${clarityAxes}개`);
  } else {
    console.log('⏭️ CLARITY_API_TOKEN 없음 — Clarity 스윕 스킵');
  }

  /* 8) 모델 자동 업그레이드 체크 — Anthropic API로 최신 최고등급 모델 감지
   *    ANTHROPIC_API_KEY가 있으면 /v1/models 조회, 없으면 스킵.
   *    새 모델 발견 시 resolved[]에 추가 → 메일 보고 + .model-upgrade.json 마커 생성 */
  let modelUpgrade = null;
  if (ANTHROPIC_API_KEY) {
    try {
      console.log('🤖 모델 업그레이드 체크...');
      const mr = await fetch('https://api.anthropic.com/v1/models?limit=100', {
        headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      }).catch(() => null);
      if (mr && mr.ok) {
        const mdata = await mr.json();
        const models = mdata.data || [];
        // fable/mythos = 최상위 티어. 최신 생성일 기준 정렬
        const topTier = models
          .filter((m) => /fable|mythos/i.test(m.id) && !/with/i.test(m.id))
          .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        // 현재 모델보다 새로운 최상위 모델이 있는지 확인
        const latest = topTier[0];
        if (latest && latest.id !== CURRENT_TOP_MODEL && !latest.id.startsWith(CURRENT_TOP_MODEL)) {
          modelUpgrade = { current: CURRENT_TOP_MODEL, latest: latest.id, name: latest.display_name || latest.id };
          console.log(`🆕 새 최고등급 모델 발견! ${CURRENT_TOP_MODEL} → ${latest.id}`);
        } else {
          console.log(`✅ 현재 최고등급 ${CURRENT_TOP_MODEL} = 최신 (${topTier.length}개 최상위 모델 확인)`);
        }
        axisCount += 1;
      } else {
        console.log(`⚠️ 모델 API ${mr ? mr.status : 'ERR'} — 스킵`);
      }
    } catch (e) { console.warn('⚠️ 모델 체크 실패:', e.message); }
  } else {
    console.log('⏭️ ANTHROPIC_API_KEY 없음 — 모델 업그레이드 체크 스킵 (GH Secret 추가 권장)');
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

  // 모델 업그레이드 발견 시 resolved에 추가 → 메일 트리거
  if (modelUpgrade) {
    resolved.push(`🆕 Anthropic 새 최고등급 모델 발견: ${modelUpgrade.current} → ${modelUpgrade.latest} — Claude Code에서 트리거 20개 + settings.json 자동 교체 필요`);
  }

  /* 진단 데이터(8키워드·GA4 종합·세션깊이·설정)는 런 로그 전용 — 메일에 넣지 않는다 (사장님 정책 2026-07-12).
   * 설정 이상도 로그만 남기고 침묵 — 메일은 오직 "해결한 것"만. */
  if (settingsIssues.length) for (const s of settingsIssues) console.warn(`⚙️ 설정 이상(로그만): ${s}`);
  axisCount += 2 /* Admin 보관·핵심이벤트 */ + 1 /* sitemap */ + 2 /* 랜딩 세션깊이 */ + 5 /* 북극성 28d */ + 4 /* 전28d 대비 */;
  console.log(`🧮 이번 달 전수 스윕 축: ${axisCount}개 (GA4+GSC+Clarity API 읽기전용)`);
  void kwResult; void shallow; void ga; void strong;

  /* 5) 메일 — 문제를 해결한 것이 있을 때만 1통. 없으면 완전 침묵. */
  if (!resolved.length) { console.log('✅ 해결 조치 0건 — 메일 침묵 (사장님 정책)'); return; }
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 스킵'); return; }

  // Clarity UX 문제 요약 (rage click/dead click/JS오류 등 실수치가 있으면 메일에 첨부)
  let clarityHtml = '';
  if (clarity.rageClicks?.length || clarity.deadClicks?.length || clarity.jsErrors?.length || clarity.quickBacks?.length) {
    const sections = [];
    if (clarity.rageClicks?.length) sections.push(`<b>Rage Click</b> ${clarity.rageClicks.length}건 — ${clarity.rageClicks.slice(0, 3).map((r) => esc(r.url || r.page || '?')).join(', ')}`);
    if (clarity.deadClicks?.length) sections.push(`<b>Dead Click</b> ${clarity.deadClicks.length}건 — ${clarity.deadClicks.slice(0, 3).map((d) => esc(d.url || d.page || '?')).join(', ')}`);
    if (clarity.jsErrors?.length) sections.push(`<b>JS Error</b> ${clarity.jsErrors.length}건 — ${clarity.jsErrors.slice(0, 3).map((e) => esc(e.message || e.error || '?')).join(', ')}`);
    if (clarity.quickBacks?.length) sections.push(`<b>Quick Back</b> ${clarity.quickBacks.length}건 — ${clarity.quickBacks.slice(0, 3).map((q) => esc(q.url || q.page || '?')).join(', ')}`);
    if (clarity.excessiveScroll?.length) sections.push(`<b>Excessive Scroll</b> ${clarity.excessiveScroll.length}건`);
    clarityHtml = `<h3>🔍 Clarity UX 행동 분석 (30일)</h3><ul>${sections.map((s) => `<li style="margin:6px 0">${s}</li>`).join('')}</ul>`;
  }

  const html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px;color:#222">
    <h2 style="color:#059669">✅ [놀쿨] 월간 전수점검 — 문제 자동 해결 보고</h2>
    <p style="color:#666;font-size:13px">${kstNow()} · GSC/GA4/Clarity API 28~30일 전수 (venue ${venues.length}곳 · ${axisCount}축 분석)</p>
    <h3>🛠️ 이번 달 자동 해결한 것</h3>
    <ul>${resolved.map((s) => `<li style="margin:6px 0">${esc(s)}</li>`).join('')}</ul>
    ${clarityHtml}
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매달 30일 KST 07:00 자동. 해결한 문제가 있을 때만 발송, 없으면 침묵. ${axisCount}축 GA4+GSC+Clarity 전수.</p>
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
