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
 *   3.3) ★리텐션 — 주간 코호트(8주) 평탄화 지점 % (cohortSpec, 소표본 제외)
 *   3.4) ★아하 모먼트 — 재방문자 과대표집(1.5x+) 이벤트·페이지 역추적
 *   7) Microsoft Clarity — project-live-insights 실API (최대 3일·10req/day 중 5콜):
 *      Traffic(봇 제외)·체류·스크롤·rage/dead/quickback·JS오류 + URL/Device/OS/Source 분해
 *      + ★놀쿨 프로젝트 분리검증(응답 URL 전부 nolcool.com 확인)
 *   PMF 기록 — 매달 메일에 동일 지표 스냅샷(재방문비중·코호트커브·아하후보) = 메일 히스토리가 추이
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

  /* 3.3) ★리텐션 — 주간 코호트 평탄화 지점 (GA4 cohortSpec, 읽기전용)
   *      최근 8주 주간 코호트 × 0~5주차 재방문율 → 주차별 평균 커브 → 낙폭<1pp 되는 지점 = 평탄화 % */
  let retention = null;
  if (gaToken) {
    const wk = 7 * 86400000;
    const monday = (d) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x; };
    const iso = (x) => x.toISOString().slice(0, 10);
    const lastMon = monday(new Date(Date.now() - wk)); // 마지막 완결 주
    const cohorts = Array.from({ length: 8 }, (_, i) => {
      const s = new Date(lastMon.getTime() - (7 - i) * wk);
      return { name: `w${iso(s)}`, dimension: 'firstSessionDate', dateRange: { startDate: iso(s), endDate: iso(new Date(s.getTime() + 6 * 86400000)) } };
    });
    const r = await runReport(gaToken, {
      dimensions: [{ name: 'cohort' }, { name: 'cohortNthWeek' }],
      metrics: [{ name: 'cohortActiveUsers' }],
      cohortSpec: { cohorts, cohortsRange: { granularity: 'WEEKLY', startOffset: 0, endOffset: 5 } },
      limit: 200,
    });
    axisCount += cohorts.length * 6;
    if (r.ok && r.body.rows?.length) {
      const grid = {}; // {cohort: {week: users}}
      for (const row of r.body.rows) {
        const [c, w] = row.dimensionValues.map((d) => d.value);
        (grid[c] ||= {})[Number(w)] = Number(row.metricValues[0].value);
      }
      const curve = []; // 주차별 평균 재방문율 (코호트 규모≥10만, 소표본 착시 제외)
      for (let w = 0; w <= 5; w++) {
        const vals = Object.values(grid).filter((g) => (g[0] || 0) >= 10 && g[w] != null && w <= 5).map((g) => (g[w] / g[0]) * 100);
        curve.push(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
      }
      let flatWeek = null;
      for (let w = 2; w <= 5; w++) {
        if (curve[w] != null && curve[w - 1] != null && curve[w - 1] - curve[w] < 1) { flatWeek = w; break; }
      }
      retention = { curve, flatWeek, flatPct: flatWeek != null ? curve[flatWeek] : curve.filter((v) => v != null).at(-1) };
      console.log(`📈 리텐션 코호트(8주·규모≥10): 주차별 ${curve.map((v, i) => `W${i}=${v == null ? '-' : v.toFixed(1) + '%'}`).join(' · ')}`);
      console.log(`📈 평탄화 지점: ${flatWeek != null ? `W${flatWeek}부터 ≈${retention.flatPct.toFixed(1)}%` : `미평탄(마지막 ${retention.flatPct?.toFixed(1) ?? '-'}%)`}`);
    } else if (!r.ok) console.warn(`⚠️ GA4 코호트 실패 — ${gaErrorReason(r.status, r.body)}`);
  }

  /* 3.4) ★아하 모먼트 — 재방문자가 신규 대비 과도하게 하는 행동 역추적 (읽기전용)
   *      returning 비중이 전체 평균의 1.5배 이상인 이벤트·페이지 = 재방문을 만드는 행동 후보 */
  let aha = [];
  let baseRet = null; // 전체 재방문 사용자 비중 (PMF 기록에도 사용)
  if (gaToken) {
    const RANGE = [{ startDate: '28daysAgo', endDate: 'yesterday' }];
    {
      const r = await runReport(gaToken, { dateRanges: RANGE, dimensions: [{ name: 'newVsReturning' }], metrics: [{ name: 'totalUsers' }] });
      if (r.ok && r.body.rows?.length) {
        let neu = 0, ret = 0;
        for (const row of r.body.rows) {
          const k = row.dimensionValues[0].value, v = Number(row.metricValues[0].value);
          if (k === 'returning') ret += v; else if (k === 'new') neu += v;
        }
        baseRet = ret + neu ? ret / (ret + neu) : null;
      }
    }
    if (baseRet) {
      for (const [label, dim] of [['이벤트', 'eventName'], ['페이지', 'pagePath']]) {
        const r = await runReport(gaToken, {
          dateRanges: RANGE,
          dimensions: [{ name: dim }, { name: 'newVsReturning' }],
          metrics: [{ name: 'totalUsers' }],
          limit: 500,
        });
        axisCount += 2;
        if (!r.ok || !r.body.rows?.length) continue;
        const agg = {};
        for (const row of r.body.rows) {
          const [k, nvr] = row.dimensionValues.map((d) => d.value);
          const v = Number(row.metricValues[0].value);
          const a = (agg[k] ||= { new: 0, ret: 0 });
          if (nvr === 'returning') a.ret += v; else if (nvr === 'new') a.new += v;
        }
        for (const [k, a] of Object.entries(agg)) {
          const tot = a.new + a.ret;
          if (tot < 20) continue; // 소표본 착시 제외
          const share = a.ret / tot;
          if (share >= baseRet * 1.5) aha.push({ type: label, key: k, share, over: share / baseRet, users: tot });
        }
      }
      aha.sort((a, b) => b.over - a.over);
      aha = aha.slice(0, 8);
      console.log(`💡 아하 모먼트 후보 (전체 재방문비중 ${(baseRet * 100).toFixed(1)}% 대비 1.5x+·사용자≥20):`);
      for (const a of aha) console.log(`   ${a.type} ${a.key} — 재방문비중 ${(a.share * 100).toFixed(1)}% (${a.over.toFixed(1)}x · 사용자 ${a.users})`);
      if (!aha.length) console.log('   후보 없음 (재방문 표본 부족)');
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

  /* 7) Microsoft Clarity — UX 행동 데이터 (읽기전용 Data Export API, 실제 스펙)
   *    실API: GET https://www.clarity.ms/export-data/api/v1/project-live-insights
   *           ?numOfDays=1~3 (최대 3일) &dimension1..3 · Bearer 토큰(프로젝트 내장)
   *    제한: 프로젝트당 10 성공요청/일 → 5콜만 사용 (예산 절반)
   *    metricName: Traffic/EngagementTime/ScrollDepth/RageClickCount/DeadClickCount/
   *                ExcessiveScroll/QuickbackClick/ScriptErrorCount/ErrorClickCount 등 */
  const clarity = {};
  if (CLARITY_TOKEN) {
    console.log(`🔍 Clarity UX 스윕 시작 (최근 3일 · 프로젝트 ${CLARITY_PROJECT})...`);
    const clarityFetch = async (label, params = {}) => {
      const qs = new URLSearchParams({ numOfDays: '3', ...params }).toString();
      const r = await fetch(`https://www.clarity.ms/export-data/api/v1/project-live-insights?${qs}`, {
        headers: { Authorization: `Bearer ${CLARITY_TOKEN}`, Accept: 'application/json' },
      }).catch(() => null);
      if (!r || !r.ok) {
        console.warn(`⚠️ Clarity ${label}: ${r ? r.status : 'ERR'} ${r ? (await r.text().catch(() => '')).slice(0, 150) : ''}`);
        return null;
      }
      return r.json().catch(() => null);
    };
    const num = (v) => Number(v || 0);

    // 7.1) 전체 메트릭 (dimension 없음) — Traffic/체류/스크롤/rage/dead/quickback/JS오류 총괄
    const totals = await clarityFetch('totals');
    if (Array.isArray(totals)) {
      clarity.totals = totals;
      for (const m of totals) {
        const info = m.information?.[0] || {};
        axisCount += Object.keys(info).length || 1;
        if (m.metricName === 'Traffic') {
          const real = num(info.totalSessionCount) - num(info.totalBotSessionCount);
          console.log(`🔍 Clarity Traffic(3d): 실세션 ${real} (봇 ${num(info.totalBotSessionCount)} 제외) · 사용자 ${info.distinctUserCount ?? info.distantUserCount ?? '?'} · PV ${info.pagesViews ?? info.PagesViews ?? '?'}`);
        } else {
          console.log(`🔍 Clarity ${m.metricName}: ${JSON.stringify(info).slice(0, 160)}`);
        }
      }
    }

    // 7.2) URL별 — rage/dead/quickback이 어느 페이지에서 나는지 + ★놀쿨 프로젝트 분리 검증
    const byUrl = await clarityFetch('URL별', { dimension1: 'URL' });
    if (Array.isArray(byUrl)) {
      clarity.byUrl = byUrl;
      const urls = new Set();
      for (const m of byUrl) {
        const rows = m.information || [];
        axisCount += rows.length;
        for (const row of rows) if (row.URL || row.Url || row.url) urls.add(row.URL || row.Url || row.url);
        if (/RageClick|DeadClick|Quickback|ScriptError|ErrorClick|ExcessiveScroll/i.test(m.metricName)) {
          // ★필드 실측 스펙 (2026-07-22 거짓양성 근본수정): sessionsCount=그 URL 총세션(문제수 아님!),
          //   문제세션 = round(sessionsCount × sessionsWithMetricPercentage/100), 문제 이벤트수 = subTotal.
          const probN = (r2) => { const pct = num(r2.sessionsWithMetricPercentage); return pct > 0 ? Math.max(1, Math.round((num(r2.sessionsCount) * pct) / 100)) : num(r2.subTotal) > 0 ? 1 : 0; };
          const top = rows.slice().sort((a, b) => probN(b) - probN(a)).filter((r2) => probN(r2) > 0).slice(0, 5);
          for (const t of top) console.log(`🔍 Clarity ${m.metricName}: ${t.URL || t.Url || t.url || '?'} — 문제세션 ${probN(t)} (이벤트 ${t.subTotal ?? '?'} / 총세션 ${t.sessionsCount ?? '?'})`);
          clarity[m.metricName] = rows.map((r2) => ({ url: r2.URL || r2.Url || r2.url, n: probN(r2) }));
        }
      }
      // ★분리 검증 — 응답 URL이 전부 nolcool.com이어야 함 (theassetsquare 교차 0)
      const foreign = [...urls].filter((u) => !String(u).includes('nolcool.com') && String(u).startsWith('http'));
      clarity.separationOk = urls.size > 0 && foreign.length === 0;
      console.log(`🔍 Clarity 프로젝트 분리검증: URL ${urls.size}개 중 놀쿨 외 도메인 ${foreign.length}개 ${clarity.separationOk ? '✅ 놀쿨 전용' : urls.size ? '❌ 교차 의심!' : '(URL 데이터 없음)'}`);
      if (foreign.length) console.warn(`❌ 놀쿨 외 URL 발견: ${foreign.slice(0, 3).join(', ')}`);
    }

    // 7.3~7.5) Device / OS / Source 별 (각 1콜, 총 5콜 = 예산 10의 절반)
    for (const [label, dim] of [['Device', 'Device'], ['OS', 'OS'], ['Source', 'Source']]) {
      const data = await clarityFetch(label, { dimension1: dim });
      if (Array.isArray(data)) {
        clarity[`by${label}`] = data;
        const traffic = data.find((m) => m.metricName === 'Traffic');
        const rows = traffic?.information || [];
        axisCount += data.reduce((s, m) => s + (m.information?.length || 0), 0);
        console.log(`🔍 Clarity ${label}별: ${rows.slice(0, 5).map((r2) => `${r2[dim] || '?'}=${r2.totalSessionCount ?? '?'}`).join(' · ')}`);
      }
    }
  } else {
    console.log('⏭️ CLARITY_API_TOKEN 없음 — Clarity 스윕 스킵 (Clarity 놀쿨 프로젝트 Settings→Data Export→토큰 생성 후 GH Secret CLARITY_API_TOKEN 등록)');
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

  // Clarity UX 문제 요약 (rage/dead/quickback/JS오류 실수치가 있으면 메일에 첨부)
  let clarityHtml = '';
  {
    const sections = [];
    const CL = [['RageClickCount', 'Rage Click'], ['DeadClickCount', 'Dead Click'], ['QuickbackClick', 'Quick Back'], ['ScriptErrorCount', 'JS Error'], ['ExcessiveScroll', 'Excessive Scroll']];
    for (const [key, label] of CL) {
      const rows = (clarity[key] || []).filter((r2) => r2.n > 0);
      if (rows.length) sections.push(`<b>${label}</b> 세션 ${rows.reduce((s, r2) => s + r2.n, 0)} — ${rows.slice(0, 3).map((r2) => esc(String(r2.url || '?').replace(BASE, ''))).join(', ')}`);
    }
    if (sections.length) clarityHtml = `<h3>🔍 Clarity UX 행동 (최근 3일)</h3><ul>${sections.map((s) => `<li style="margin:6px 0">${s}</li>`).join('')}</ul>`;
  }

  // ★PMF 기록 — 매달 메일에 같은 지표를 남겨 메일 히스토리 자체가 월별 PMF 추이가 되게 함
  const pmfRows = [];
  if (ga) pmfRows.push(`페이지/세션 ${ga.pps.toFixed(2)} · 이탈 ${(ga.bounce * 100).toFixed(1)}% · 평균체류 ${Math.round(ga.dur)}초 (세션 ${ga.sessions})`);
  if (baseRet != null) pmfRows.push(`재방문 사용자 비중 ${(baseRet * 100).toFixed(1)}%`);
  if (retention) pmfRows.push(`주간 코호트 리텐션: ${retention.curve.map((v, i) => `W${i} ${v == null ? '-' : v.toFixed(1) + '%'}`).join(' → ')} · 평탄화 ${retention.flatWeek != null ? `W${retention.flatWeek}≈${retention.flatPct.toFixed(1)}%` : '미도달'}`);
  if (aha.length) pmfRows.push(`아하 모먼트 후보: ${aha.slice(0, 3).map((a) => `${a.key}(재방문 ${(a.share * 100).toFixed(0)}%·${a.over.toFixed(1)}x)`).join(' · ')}`);
  const pmfHtml = pmfRows.length
    ? `<h3>📈 PMF 기록 (월별 히스토리)</h3><ul>${pmfRows.map((s) => `<li style="margin:6px 0">${esc(s)}</li>`).join('')}</ul>`
    : '';

  const html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px;color:#222">
    <h2 style="color:#059669">✅ [놀쿨] 월간 전수점검 — 문제 자동 해결 보고</h2>
    <p style="color:#666;font-size:13px">${kstNow()} · GSC/GA4/Clarity API 28~30일 전수 (venue ${venues.length}곳 · ${axisCount}축 분석)</p>
    <h3>🛠️ 이번 달 자동 해결한 것</h3>
    <ul>${resolved.map((s) => `<li style="margin:6px 0">${esc(s)}</li>`).join('')}</ul>
    ${pmfHtml}
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
