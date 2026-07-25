#!/usr/bin/env node
/**
 * 노출0 가게이름 전수 원인분석 (온디맨드 workflow_dispatch 전용 — cron 없음)
 *
 * 사장님 요청(2026-07-25): "serp-loop A 노출0 55개 원인도 전수 분석해서 해결해"
 *
 * 노출0(최근 7일 가게이름 검색 노출 0)의 원인은 하나가 아니다. 유형을 갈라야 처방이 갈린다:
 *   T1 페이지깜깜  — venue URL이 90일간 '어떤 검색어로도' 노출 0 → 색인/크롤 문제 의심 (진짜 SEO 문제)
 *   T2 이름수요0   — 페이지는 다른 검색어로 노출되는데, 가게이름 검색 자체가 90일간 0
 *                    → 그 상호를 검색하는 사람이 아직 없음 (콘텐츠로 강제 불가 — 정직 보고)
 *   T3 간헐수요    — 가게이름 노출이 90일 안엔 있는데 최근 7일만 0 → 수요가 드문드문 (문제 아님)
 *
 * 동작(읽기 전용, GSC API 4콜 + 사이트 크롤 0):
 *   1) venues.ts 파싱 → 이름+별칭
 *   2) searchAnalytics: query 7d / query 90d / page 90d
 *   3) 최근 7d 이름노출 0인 venue 전수를 T1/T2/T3 분류 (90d 순위·URL노출 함께)
 *   4) 콘솔 표 + SERP_ZERO_FINDINGS_B64= 1줄 (base64 — GHA 마스킹 회피)
 *
 * 환경변수: GSC_SA_JSON
 */
import fs from 'node:fs';
import path from 'node:path';
import { getAccessToken, gscQuery, hasGscCredentials } from './lib/gsc-auth.mjs';

const BASE = 'https://nolcool.com';
const CAT_PATH = { club: 'clubs', night: 'nights', lounge: 'lounges', room: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa' };
const REGIONED = new Set(['club', 'room', 'yojeong']);

if (!hasGscCredentials()) { console.log('⏭️  GSC_SA_JSON 미설정 — 스킵'); process.exit(0); }

const norm = (s) => (s || '').replace(/\s+/g, '').toLowerCase();

function parseVenues() {
  const src = fs.readFileSync(path.join('src', 'data', 'venues.ts'), 'utf8');
  const out = [];
  for (const block of src.split(/\n  \{/)) {
    const slug = block.match(/slug:\s*'([^']+)'/)?.[1];
    const cat = block.match(/category:\s*'([^']+)'/)?.[1];
    const region = block.match(/region:\s*'([^']+)'/)?.[1];
    const nameKo = block.match(/nameKo:\s*'([^']+)'/)?.[1];
    const aliases = (block.match(/aliases:\s*\[([^\]]*)\]/)?.[1]?.match(/'([^']+)'/g) || []).map((a) => a.replace(/'/g, ''));
    if (!slug || !cat || !region || !nameKo) continue;
    const cp = CAT_PATH[cat] || cat;
    const url = REGIONED.has(cat) ? `${BASE}/${cp}/${region}/${slug}/` : `${BASE}/${cp}/${slug}/`;
    out.push({ slug, cat, region, nameKo, aliases, url });
  }
  return out;
}

function nameKeys(venues) {
  const keys = [];
  for (const v of venues) for (const n of [v.nameKo, ...v.aliases]) {
    const k = norm(n);
    if (k.length >= 3) keys.push({ v, key: k });
  }
  return keys.sort((a, b) => b.key.length - a.key.length);
}

function aggByName(venues, rows) {
  const keys = nameKeys(venues);
  const acc = new Map();
  for (const row of rows) {
    const q = norm(row.keys[0]);
    if (!q) continue;
    const hit = keys.find(({ key }) => q.includes(key) || key.includes(q));
    if (!hit) continue;
    const a = acc.get(hit.v.slug) || { imp: 0, clicks: 0, posW: 0, queries: new Set() };
    const imp = row.impressions || 0;
    a.imp += imp; a.clicks += row.clicks || 0; a.posW += (row.position || 0) * imp;
    a.queries.add(row.keys[0]);
    acc.set(hit.v.slug, a);
  }
  const out = new Map();
  for (const [k, a] of acc) out.set(k, { imp: a.imp, clicks: a.clicks, pos: a.imp ? a.posW / a.imp : 0, queries: [...a.queries] });
  return out;
}

(async () => {
  const token = await getAccessToken();
  if (!token) { console.log('⏭️  GSC 토큰 실패 — 스킵'); return; }
  const venues = parseVenues();
  const day = 86400 * 1000;
  const end = new Date(Date.now() - 2 * day);
  const ymd = (d) => d.toISOString().slice(0, 10);
  const d7 = new Date(end.getTime() - 6 * day);
  const d90 = new Date(end.getTime() - 89 * day);

  const [q7, q90, p90] = await Promise.all([
    gscQuery(token, { dimensions: ['query'], rowLimit: 25000, startDate: ymd(d7), endDate: ymd(end) }),
    gscQuery(token, { dimensions: ['query'], rowLimit: 25000, startDate: ymd(d90), endDate: ymd(end) }),
    gscQuery(token, { dimensions: ['page'], rowLimit: 25000, startDate: ymd(d90), endDate: ymd(end) }),
  ]);
  const name7 = aggByName(venues, q7.rows);
  const name90 = aggByName(venues, q90.rows);
  const pageImp90 = new Map(p90.rows.map((r) => [r.keys[0], r.impressions || 0]));

  const zero = venues.filter((v) => !(name7.get(v.slug)?.imp > 0));
  console.log(`📋 venue ${venues.length} · 최근7일(${ymd(d7)}~${ymd(end)}) 이름노출0 = ${zero.length}개 → 90일 유형분석`);

  const T1 = [], T2 = [], T3 = [];
  for (const v of zero) {
    const n90 = name90.get(v.slug);
    const pImp = pageImp90.get(v.url) || 0;
    if (n90?.imp > 0) T3.push({ ...v, imp90: n90.imp, pos90: +n90.pos.toFixed(1), pageImp90: pImp, queries: n90.queries.slice(0, 4) });
    else if (pImp > 0) T2.push({ ...v, pageImp90: pImp });
    else T1.push({ ...v, pageImp90: 0 });
  }
  console.log(`\n🔴 T1 페이지깜깜 — URL이 90일간 어떤 검색어로도 노출 0 (색인/크롤 의심, 진짜 문제) — ${T1.length}개`);
  for (const v of T1) console.log(`   ${v.nameKo} (${v.cat}) ${v.url}`);
  console.log(`\n🟡 T2 이름수요0 — 페이지는 다른 검색어로 노출되나 가게이름 검색이 90일간 0 (수요 자체 없음) — ${T2.length}개`);
  for (const v of T2) console.log(`   ${v.nameKo} (${v.cat}) — URL노출90d ${v.pageImp90}`);
  console.log(`\n🟢 T3 간헐수요 — 90일 안엔 이름노출 있음, 최근 7일만 0 (드문 수요, 문제 아님) — ${T3.length}개`);
  for (const v of T3) console.log(`   ${v.nameKo} — 90d 노출 ${v.imp90} · 평균순위 ${v.pos90} · q: ${v.queries.join(' | ')}`);

  const findings = {
    generatedAt: new Date().toISOString(), window7: `${ymd(d7)}~${ymd(end)}`, window90: `${ymd(d90)}~${ymd(end)}`,
    total: venues.length, zero7: zero.length,
    t1_dark_pages: T1.map((v) => ({ name: v.nameKo, slug: v.slug, cat: v.cat, url: v.url })),
    t2_no_name_demand: T2.map((v) => ({ name: v.nameKo, slug: v.slug, cat: v.cat, url: v.url, pageImp90: v.pageImp90 })),
    t3_sparse: T3.map((v) => ({ name: v.nameKo, slug: v.slug, imp90: v.imp90, pos90: v.pos90 })),
  };
  console.log('SERP_ZERO_FINDINGS_B64=' + Buffer.from(JSON.stringify(findings)).toString('base64'));
})().catch((e) => { console.error('❌ 실패:', e); process.exit(1); });
