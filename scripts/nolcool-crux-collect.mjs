#!/usr/bin/env node
/**
 * CrUX (Chrome UX Report) 일일 수집 — 실사용자 Core Web Vitals
 *
 * Google 검색 순위 기준은 Lab 점수가 아니라 CrUX의 실사용자 p75 값.
 *
 * 환경변수:
 *   CRUX_API_KEY          — https://console.cloud.google.com → Chrome UX Report API
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY  — RLS 우회용
 *
 * 사용:
 *   node scripts/nolcool-crux-collect.mjs
 *   node scripts/nolcool-crux-collect.mjs --dry  (Supabase 저장 X, 콘솔 출력만)
 *
 * v28.0 (2026-05-20)
 */

const CRUX_API_KEY = process.env.CRUX_API_KEY;
const SUPA_URL = process.env.VITE_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;
const DRY = process.argv.includes('--dry');

if (!CRUX_API_KEY) {
  console.error('❌ CRUX_API_KEY 없음. GitHub Secrets에 등록 필요.');
  process.exit(1);
}
if (!DRY && (!SUPA_URL || !SUPA_KEY)) {
  console.error('❌ VITE_SUPABASE_URL / SUPABASE_SERVICE_KEY 없음.');
  process.exit(1);
}

const TARGETS = [
  'https://nolcool.com/',
  'https://nolcool.com/clubs/',
  'https://nolcool.com/nights/',
  'https://nolcool.com/lounges/',
  'https://nolcool.com/rooms/',
  'https://nolcool.com/yojeong/',
  'https://nolcool.com/hoppa/',
  'https://nolcool.com/community/',
  'https://nolcool.com/magazine/',
];

const METRICS = [
  'largest_contentful_paint',
  'cumulative_layout_shift',
  'interaction_to_next_paint',
  'first_contentful_paint',
  'experimental_time_to_first_byte',
];

async function fetchCrUX(url, formFactor) {
  const res = await fetch(
    `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${CRUX_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formFactor, metrics: METRICS }),
    },
  );
  if (!res.ok) {
    if (res.status === 404) return null; // CrUX 데이터 부족 (트래픽 적음)
    const txt = await res.text();
    console.error(`⚠️  ${formFactor} ${url} → ${res.status} ${txt.slice(0, 120)}`);
    return null;
  }
  const json = await res.json();
  return parseRecord(json.record);
}

function parseRecord(record) {
  if (!record?.metrics) return null;
  const m = record.metrics;
  return {
    lcp_p75: m.largest_contentful_paint?.percentiles?.p75 ?? null,
    cls_p75: m.cumulative_layout_shift?.percentiles?.p75 ?? null,
    inp_p75: m.interaction_to_next_paint?.percentiles?.p75 ?? null,
    fcp_p75: m.first_contentful_paint?.percentiles?.p75 ?? null,
    ttfb_p75: m.experimental_time_to_first_byte?.percentiles?.p75 ?? null,
    lcp_good_pct: pct(m.largest_contentful_paint?.histogram?.[0]?.density),
    cls_good_pct: pct(m.cumulative_layout_shift?.histogram?.[0]?.density),
    inp_good_pct: pct(m.interaction_to_next_paint?.histogram?.[0]?.density),
  };
}

function pct(d) {
  return typeof d === 'number' ? Number((d * 100).toFixed(2)) : null;
}

async function insertSupabase(rows) {
  if (rows.length === 0) return;
  const res = await fetch(`${SUPA_URL}/rest/v1/crux_data`, {
    method: 'POST',
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    console.error(`❌ Supabase INSERT 실패: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
}

async function main() {
  console.log(`📊 CrUX 수집 시작 (dry=${DRY})  타깃 ${TARGETS.length}개 × 2 viewport`);
  const collectedAt = new Date().toISOString();
  const rows = [];
  let hit = 0;
  let miss = 0;

  for (const url of TARGETS) {
    for (const ff of ['PHONE', 'DESKTOP']) {
      const m = await fetchCrUX(url, ff);
      if (m) {
        hit++;
        rows.push({ url, form_factor: ff, ...m, collected_at: collectedAt });
        console.log(`  ✅ ${ff.padEnd(7)} ${url}  LCP=${m.lcp_p75}ms CLS=${m.cls_p75} INP=${m.inp_p75}ms`);
      } else {
        miss++;
        console.log(`  ⚪ ${ff.padEnd(7)} ${url}  (no data)`);
      }
      await new Promise((r) => setTimeout(r, 400)); // rate limit
    }
  }

  console.log(`\n수집 결과: HIT=${hit}  MISS=${miss}`);

  if (!DRY && rows.length > 0) {
    await insertSupabase(rows);
    console.log(`✅ Supabase crux_data 저장 ${rows.length} rows`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
