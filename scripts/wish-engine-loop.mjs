#!/usr/bin/env node
/**
 * 🌠 가게이름 상위노출 소원 엔진 — 주간 자동 루프 (2026-08-17 신설)
 *
 * 사장님 소원: 모든 페이지가 가게이름으로 구글 상위노출. 출발 실측(2026-08-17):
 * 가게이름 123곳 중 노출0 49곳 · 1페이지 35곳 (권위·깊이 문제, 색인은 448/457 정상).
 *
 * 매주 월요일 KST 12:00 (UTC 0 3 * * 1 — 월요일 기존 슬롯 09:00~11:45와 무충돌).
 * 하는 일 (전부 읽기전용 측정 + 기계적 화이트리스트 조치만, 콘텐츠 자동 창작 0):
 *   1) GSC 가게이름 검색(28d) + 페이지 노출(28d/90d) 전수 측정 → 티어 분류
 *      (1페이지 / 문턱 4~15위 / 미달 / 노출0)
 *   2) 노출0·미달 원인 자동 분류 — 도달0(색인 의심)·이름수요/스니펫·본문깊이·내부앵커·신선도
 *      (경쟁 강도는 SERP 크롤 없이 측정 불가 → ⚠️ 미측정으로 정직 표기)
 *   3) 기계적 처방 자동 실행: 도달0·신선도 미달 페이지 IndexNow 재크롤 핑 (상한 PING_CAP)
 *      콘텐츠성 처방(직답·FAQ·내부앵커·본문보강)은 큐로 기록만 — 대화형 세션·월간 지휘자가 소비
 *   4) 제목 실험실 판정: data/wish-engine/title-experiments.json 의 활성 실험을
 *      CTR 실측으로 판정. ★표본 안전핀: 최근 28일 노출 < MIN_IMP_FOR_VERDICT(50) 이면
 *      판정 보류(제목 유지·널뛰기 방지), 이력에 노출 수 병기.
 *      승자 유지/패자 롤백은 "판정 기록"까지만 자동 — 실제 title 교체는 watch 토큰
 *      동기화가 필요해 대화형 세션에서 적용(사이트 피해 0 원칙).
 *   5) 전주 스냅샷과 비교해 처방 효과 판정 → data/wish-engine/weekly/ 이력 축적
 *   6) 메일 0 (30일 1통 정책) — 요약은 monthly-inbox 로 축적, 지휘자 보고서가 소비
 *
 * H1a 6곳(9/1 판정 대기)·강남줄리아나나이트는 제목 실험 대상에서 영구 제외.
 * 환경: GSC_SA_JSON (Actions 전용), INDEXNOW_KEY(선택 — 없으면 핑 스킵)
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { getAccessToken, gscQuery, hasGscCredentials } from './lib/gsc-auth.mjs';
import { archiveInsteadOfSend } from './lib/monthly-inbox.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT_DIR = `${ROOT}data/wish-engine/weekly`;
const EXP_FILE = `${ROOT}data/wish-engine/title-experiments.json`;
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

const PING_CAP = 30;               // 주당 IndexNow 재크롤 상한 (스팸 방지)
const MIN_IMP_FOR_VERDICT = 50;    // ★제목 실험 표본 안전핀 — 28d 노출 미만이면 판정 보류
const MIN_DESC_DEPTH = 1700;       // venue 상세 본문 깊이 기준 (CLAUDE.md detail ≥1700자)
const MAX_NAME_ANCHORS_PER_PAGE = 12; // 내부 앵커 과최적화 방지 상한 (처방 적용 시 준수)
const STALE_DAYS = 45;             // sitemap lastmod 이보다 오래되면 신선도 미달

const kstDate = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const norm = (s) => (s || '').replace(/\s+/g, '').toLowerCase();

/* ── venues.ts 파싱 (읽기전용) — venue 블록은 id: 'v-NNN' 으로 시작 ── */
function loadVenues() {
  const src = readFileSync(`${ROOT}src/data/venues.ts`, 'utf8');
  const venues = [];
  for (const b of src.split(/\n\s*\{\s*\n\s*id:\s*'v-/).slice(1)) {
    const slug = (b.match(/slug:\s*['"]([^'"]+)['"]/) || [])[1];
    const nameKo = (b.match(/nameKo:\s*['"]([^'"]+)['"]/) || [])[1];
    if (!slug || !nameKo) continue;
    // 본문 깊이 = 상세에 SSR로 실리는 텍스트 필드 합산 (description + shortDescription + *Info)
    let descLen = 0;
    for (const m of b.matchAll(/\n\s*(?:description|shortDescription|liquorInfo|roomInfo|boothInfo|choiceInfo|lineupInfo|meetInfo|systemInfo):\s*'((?:[^'\\]|\\.)*)'/g)) {
      descLen += m[1].length;
    }
    venues.push({ slug, nameKo, descLen });
  }
  return venues;
}

/* ── 내부 앵커 근사 측정: 정적 소스에서 slug 언급 횟수 (listing/region 구조 링크는 전 venue 공통 1+) ── */
function anchorMentions(slug) {
  let count = 0;
  for (const f of ['src/data/magazine-articles.ts', 'src/data/venue-events.ts']) {
    try { count += (readFileSync(`${ROOT}${f}`, 'utf8').split(slug).length - 1); } catch { /* skip */ }
  }
  return count;
}

/* ── 라이브 sitemap lastmod (읽기 1회 — 사이트 부하 최소) ── */
async function fetchLastmods() {
  try {
    const xml = await (await fetch('https://nolcool.com/sitemap.xml')).text();
    const map = new Map();
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>\s*(?:<lastmod>([^<]+)<\/lastmod>)?/g)) {
      map.set(m[1], m[2] || null);
    }
    return map;
  } catch (e) {
    console.log(`⚠️ sitemap 조회 실패(신선도 판정 보류): ${e.message}`);
    return new Map();
  }
}

async function indexNowPing(urls) {
  if (!INDEXNOW_KEY) { console.log('⏭️  INDEXNOW_KEY 없음 — 재크롤 핑 스킵'); return { sent: 0, status: 'no-key' }; }
  if (!urls.length) return { sent: 0, status: 'no-urls' };
  const list = urls.slice(0, PING_CAP);
  const payload = { host: 'nolcool.com', key: INDEXNOW_KEY, keyLocation: `https://nolcool.com/${INDEXNOW_KEY}.txt`, urlList: list };
  const codes = [];
  for (const ep of ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow']) {
    try {
      const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(payload) });
      codes.push(`${ep.includes('bing') ? 'bing' : 'indexnow'}:${r.status}`);
    } catch { codes.push('ERR'); }
  }
  return { sent: list.length, dropped: Math.max(0, urls.length - PING_CAP), status: codes.join(' ') };
}

function prevSnapshot() {
  try {
    const files = readdirSync(OUT_DIR).filter((f) => f.endsWith('.json')).sort();
    if (!files.length) return null;
    return JSON.parse(readFileSync(`${OUT_DIR}/${files[files.length - 1]}`, 'utf8'));
  } catch { return null; }
}

/* ── 제목 실험 판정 (표본 안전핀 포함) ── */
function judgeExperiments(pageRows28) {
  if (!existsSync(EXP_FILE)) return { active: 0, judged: [], note: '등록된 실험 없음' };
  const reg = JSON.parse(readFileSync(EXP_FILE, 'utf8'));
  const judged = [];
  for (const exp of reg.experiments || []) {
    if (exp.status !== 'active') continue;
    const matched = pageRows28.filter((r) => (r.keys?.[0] || '').includes(exp.pagePath));
    let imp = 0, clicks = 0;
    for (const r of matched) { imp += r.impressions || 0; clicks += r.clicks || 0; }
    const ctr = imp ? (clicks / imp) * 100 : 0;
    const entry = { date: kstDate(), imp, clicks, ctr: +ctr.toFixed(2) };
    exp.history = [...(exp.history || []), entry];
    if (imp < MIN_IMP_FOR_VERDICT) {
      entry.verdict = `hold(표본부족 ${imp}<${MIN_IMP_FOR_VERDICT} — 제목 유지)`;
    } else if (ctr >= exp.baselineCtr) {
      entry.verdict = `winner-so-far(변형 CTR ${ctr.toFixed(2)}% ≥ 기준 ${exp.baselineCtr}%)`;
    } else {
      entry.verdict = `rollback-candidate(변형 CTR ${ctr.toFixed(2)}% < 기준 ${exp.baselineCtr}% — 대화형 세션에서 원복)`;
    }
    judged.push({ slug: exp.slug, ...entry });
  }
  if (judged.length) writeFileSync(EXP_FILE, JSON.stringify(reg, null, 2) + '\n');
  return { active: judged.length, judged };
}

(async () => {
  console.log(`🌠 소원 엔진 주간 루프 — ${kstDate()}`);
  if (!hasGscCredentials()) { console.log('⏭️  GSC_SA_JSON 없음 — 측정 스킵(Actions 전용)'); process.exit(0); }
  const token = await getAccessToken();
  if (!token) { console.log('⏭️  access_token 발급 실패'); process.exit(0); }

  const venues = loadVenues();
  console.log(`🏪 venue ${venues.length}곳 로드`);

  const [q28, p28, p90, lastmods] = [
    await gscQuery(token, { dimensions: ['query'], rowLimit: 25000, days: 28 }),
    await gscQuery(token, { dimensions: ['page'], rowLimit: 25000, days: 28 }),
    await gscQuery(token, { dimensions: ['page'], rowLimit: 25000, days: 90 }),
    await fetchLastmods(),
  ];

  const now = Date.now();
  const rows = [];
  for (const v of venues) {
    const key = norm(v.nameKo);
    const nameRows = q28.rows.filter((r) => norm(r.keys?.[0]).includes(key));
    let nImp = 0, nClicks = 0, posW = 0;
    for (const r of nameRows) { const i = r.impressions || 0; nImp += i; nClicks += r.clicks || 0; posW += (r.position || 0) * i; }
    const pos = nImp ? posW / nImp : null;
    const pageMatch = (rs) => rs.filter((r) => { const p = r.keys?.[0] || ''; return p.includes(`/${v.slug}/`) || p.endsWith(`/${v.slug}`); });
    const pImp28 = pageMatch(p28.rows).reduce((s, r) => s + (r.impressions || 0), 0);
    const pImp90 = pageMatch(p90.rows).reduce((s, r) => s + (r.impressions || 0), 0);
    const pageUrl = [...lastmods.keys()].find((u) => u.includes(`/${v.slug}/`) || u.endsWith(`/${v.slug}`)) || null;
    const lastmod = pageUrl ? lastmods.get(pageUrl) : null;
    const staleDays = lastmod ? Math.round((now - Date.parse(lastmod)) / 86400e3) : null;

    const tier = pos === null ? 'zero' : pos <= 10 ? 'page1' : pos <= 15 ? 'striking' : 'below';
    const causes = [];
    if (tier === 'zero' && pImp90 === 0) causes.push('no_reach(90일 페이지 노출 0 — 색인/도달 의심)');
    if (tier === 'zero' && pImp90 > 0) causes.push('name_demand_or_snippet(페이지는 노출되나 이름 검색 미노출 — 직답/FAQ 보강 대상)');
    if (tier === 'below' || tier === 'striking') causes.push('authority(순위 미달 — 내부앵커/본문 보강 대상)');
    if (v.descLen && v.descLen < MIN_DESC_DEPTH) causes.push(`depth(본문 ${v.descLen}자 < ${MIN_DESC_DEPTH})`);
    if (anchorMentions(v.slug) === 0 && tier !== 'page1') causes.push('anchor(매거진/이벤트 언급 0 — 구조 링크만 존재)');
    if (staleDays !== null && staleDays > STALE_DAYS) causes.push(`stale(lastmod ${staleDays}일 경과)`);
    causes.push('competition:⚠️미측정(SERP 크롤 없이 판정 불가)');

    rows.push({ slug: v.slug, nameKo: v.nameKo, tier, pos: pos ? +pos.toFixed(1) : null, nameImp28: nImp, nameClicks28: nClicks, pageImp28: pImp28, pageImp90: pImp90, staleDays, causes, pageUrl });
  }

  const tally = { page1: 0, striking: 0, below: 0, zero: 0 };
  rows.forEach((r) => tally[r.tier]++);
  console.log(`📊 분류: 1페이지 ${tally.page1} · 문턱 ${tally.striking} · 미달 ${tally.below} · 노출0 ${tally.zero}`);

  // 기계적 처방: 도달0 또는 신선도 미달 → IndexNow 재크롤
  const pingTargets = rows
    .filter((r) => r.pageUrl && (r.causes.some((c) => c.startsWith('no_reach')) || r.causes.some((c) => c.startsWith('stale'))))
    .map((r) => r.pageUrl);
  const ping = await indexNowPing(pingTargets);
  console.log(`🔁 IndexNow 재크롤: ${ping.sent}개 (${ping.status})${ping.dropped ? ` · 상한 초과 드롭 ${ping.dropped}` : ''}`);

  // 전주 대비 효과 판정
  const prev = prevSnapshot();
  let effects = null;
  if (prev?.rows) {
    const prevMap = new Map(prev.rows.map((r) => [r.slug, r]));
    const moved = rows.filter((r) => prevMap.has(r.slug) && prevMap.get(r.slug).tier !== r.tier)
      .map((r) => ({ slug: r.slug, from: prevMap.get(r.slug).tier, to: r.tier }));
    effects = { comparedTo: prev.date, tierMoves: moved, prevTally: prev.tally };
    console.log(`📈 전주(${prev.date}) 대비 티어 이동 ${moved.length}건`);
  } else {
    console.log('📈 전주 스냅샷 없음 — 이번 주가 기준선');
  }

  // 제목 실험 판정
  const expResult = judgeExperiments(p28.rows);
  console.log(`🧪 제목 실험: 활성 ${expResult.active}건 판정 기록`);

  // 콘텐츠성 처방 큐 (자동 창작 0 — 기록만)
  const prescriptions = rows
    .filter((r) => r.tier !== 'page1' && r.causes.some((c) => !c.startsWith('competition') && !c.startsWith('no_reach') && !c.startsWith('stale')))
    .map((r) => ({ slug: r.slug, nameKo: r.nameKo, tier: r.tier, causes: r.causes.filter((c) => !c.startsWith('competition')), whitelist: '직답/FAQ 보강·내부앵커 추가(페이지당 ≤' + MAX_NAME_ANCHORS_PER_PAGE + ')·본문 실데이터 보강' }));

  mkdirSync(OUT_DIR, { recursive: true });
  const snapshot = { date: kstDate(), window: `${q28.start}~${q28.end}`, tally, ping, effects, experiments: expResult, prescriptionsQueued: prescriptions.length, rows };
  writeFileSync(`${OUT_DIR}/${kstDate()}.json`, JSON.stringify(snapshot, null, 2) + '\n');
  writeFileSync(`${ROOT}data/wish-engine/prescriptions-latest.json`, JSON.stringify({ date: kstDate(), prescriptions }, null, 2) + '\n');
  console.log(`💾 스냅샷: data/wish-engine/weekly/${kstDate()}.json · 처방 큐 ${prescriptions.length}건`);

  archiveInsteadOfSend('wish-engine',
    `[놀쿨][🌠] 소원 루프 — 1p ${tally.page1} · 문턱 ${tally.striking} · 미달 ${tally.below} · 노출0 ${tally.zero} · 핑 ${ping.sent}`,
    `<div>티어 이동 ${effects?.tierMoves?.length ?? '기준선'}건 · 제목실험 ${expResult.active}건 · 처방 큐 ${prescriptions.length}건 (경쟁 강도 ⚠️미측정)</div>`);
})().catch((e) => { console.error('❌', e); process.exit(1); });
