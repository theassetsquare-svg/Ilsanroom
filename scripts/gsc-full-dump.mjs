#!/usr/bin/env node
/**
 * 놀쿨 GSC 전 데이터 덤프 (★100% 읽기전용 — sitemap 재제출·메일·변경 0).
 *
 * search-console-report.mjs(top25)의 후속. 대표님 "전 URL·전 검색어·색인" 요청용.
 * 커버: ① 전 페이지(URL) ② 전 검색어 ③ 기기 ④ 국가 — searchAnalytics.query(읽기)
 *       ⑤ 색인 커버리지 — URL Inspection API(index:inspect, 읽기전용. sitemap submit·indexing publish 0)
 * 인증: GH Secret GSC_SA_JSON. 속성 https://nolcool.com/ 고정.
 */
import { getAccessToken, gscQuery, hasGscCredentials, SITE_PROPERTY } from './lib/gsc-auth.mjs';

const SITEMAP = 'https://nolcool.com/sitemap.xml';
const MAX_INSPECT = Number(process.env.MAX_INSPECT || 650);
const THROTTLE_MS = 200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!hasGscCredentials()) { console.log('⏭️ GSC 인증정보 미설정 (GSC_SA_JSON) — 스킵'); process.exit(0); }

function table(title, rows) {
  console.log(`\n══════ ${title} (행 ${rows.length}) ══════`);
  console.log('  클릭 | 노출 | CTR | 평균순위 | 키');
  for (const r of rows) {
    const ctr = ((r.ctr || 0) * 100).toFixed(1) + '%';
    const pos = (r.position || 0).toFixed(1);
    console.log(`  ${String(r.clicks || 0).padStart(4)} | ${String(r.impressions || 0).padStart(5)} | ${ctr.padStart(6)} | ${pos.padStart(6)} | ${r.keys[0]}`);
  }
  if (!rows.length) console.log('  (데이터 없음)');
}

async function inspect(token, url) {
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE_PROPERTY }),
  }).catch(() => null);
  if (!r || !r.ok) return { verdict: r ? `HTTP ${r.status}` : 'ERR', state: '' };
  const j = await r.json().catch(() => ({}));
  const s = j.inspectionResult?.indexStatusResult || {};
  return { verdict: s.verdict || '?', state: s.coverageState || '?' };
}

(async () => {
  const token = await getAccessToken();
  if (!token) { console.error('❌ GSC 토큰 발급 실패'); process.exit(1); }

  // ── 검색분석 전수 ──
  const page = await gscQuery(token, { dimensions: ['page'], rowLimit: 1000 });
  const query = await gscQuery(token, { dimensions: ['query'], rowLimit: 1000 });
  const device = await gscQuery(token, { dimensions: ['device'], rowLimit: 10 });
  const country = await gscQuery(token, { dimensions: ['country'], rowLimit: 30 });
  console.log(`📊 놀쿨 GSC 전 데이터  ${page.start} ~ ${page.end} (28일)`);
  const tot = query.rows.reduce((a, r) => ({ c: a.c + (r.clicks || 0), i: a.i + (r.impressions || 0) }), { c: 0, i: 0 });
  console.log(`총 클릭 ${tot.c} · 총 노출 ${tot.i} · 평균 CTR ${tot.i ? ((tot.c / tot.i) * 100).toFixed(1) : 0}%`);
  table('① 전 페이지(URL)', page.rows);
  table('② 전 검색어', query.rows);
  table('③ 기기', device.rows);
  table('④ 국가', country.rows);

  // ── 색인 커버리지 (URL Inspection, 읽기전용) ──
  console.log(`\n══════ ⑤ 색인 커버리지 (URL Inspection · 읽기전용 · 최대 ${MAX_INSPECT}) ══════`);
  let urls = [];
  try {
    const xml = await (await fetch(SITEMAP)).text();
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  } catch { console.log('  ⚠️ sitemap 읽기 실패'); }
  console.log(`  sitemap URL ${urls.length}개 · 검사 ${Math.min(urls.length, MAX_INSPECT)}개`);
  const tally = {}; const notIndexed = [];
  let done = 0;
  for (const u of urls.slice(0, MAX_INSPECT)) {
    const { verdict, state } = await inspect(token, u);
    const key = `${verdict} / ${state}`;
    tally[key] = (tally[key] || 0) + 1;
    if (verdict !== 'PASS') notIndexed.push(`${u}  [${state || verdict}]`);
    done++;
    await sleep(THROTTLE_MS);
  }
  console.log(`  검사 완료 ${done}개`);
  console.log('  ── 상태별 집계 ──');
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`    ${String(v).padStart(4)} · ${k}`);
  console.log(`  ── 미색인/문제 URL (${notIndexed.length}) ──`);
  for (const u of notIndexed.slice(0, 200)) console.log(`    ${u}`);
  if (notIndexed.length > 200) console.log(`    … 외 ${notIndexed.length - 200}개`);

  console.log('\n※ 전부 GSC API 실측. sitemap 재제출·indexing publish·메일 0 (읽기전용).');
})();
