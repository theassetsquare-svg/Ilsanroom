#!/usr/bin/env node
/**
 * Google Search Analytics 리포트 — 지난 7일 인기 검색어 Top 30
 *
 * 의존성 0 (native fetch). google-reindex.mjs와 같은 시크릿 재사용.
 *
 * 실행:
 *   node scripts/google-analytics-report.mjs                # 기본 7일
 *   node scripts/google-analytics-report.mjs --days=30      # 30일
 */

const SITE_PROPERTY = 'sc-domain:nolcool.com';
const days = parseInt(process.argv.find(a => a.startsWith('--days='))?.split('=')[1] || '7', 10);

const {
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
} = process.env;

if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  console.log('⏭️  GOOGLE_OAUTH_* / GOOGLE_REFRESH_TOKEN 미설정 — Analytics 스킵');
  process.exit(0);
}

async function refreshAccessToken() {
  const body = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
    refresh_token: GOOGLE_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await r.json();
  if (!data.access_token) {
    console.error('❌ access_token 갱신 실패:', data);
    process.exit(1);
  }
  return data.access_token;
}

function fmtDate(d) { return d.toISOString().split('T')[0]; }

async function queryAnalytics(token, dimensions) {
  const endDate = fmtDate(new Date());
  const startDate = fmtDate(new Date(Date.now() - days * 86400000));
  const url = `https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(SITE_PROPERTY)}/searchAnalytics/query`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 30 }),
  });
  if (!r.ok) {
    console.error(`❌ query 실패 (${dimensions}):`, r.status, await r.text().catch(()=>''));
    return [];
  }
  const data = await r.json();
  return data.rows || [];
}

function table(rows, keyName) {
  if (rows.length === 0) return '  (데이터 없음 — 새 사이트이거나 권한 부족)';
  const w = Math.max(...rows.map(r => (r.keys[0] || '').length), keyName.length);
  let out = `  ${keyName.padEnd(w)}  ${'클릭'.padStart(6)}  ${'노출'.padStart(7)}  ${'CTR'.padStart(6)}  ${'평균순위'.padStart(7)}\n`;
  out += `  ${'─'.repeat(w)}  ${'─'.repeat(6)}  ${'─'.repeat(7)}  ${'─'.repeat(6)}  ${'─'.repeat(7)}\n`;
  for (const r of rows) {
    out += `  ${(r.keys[0] || '').padEnd(w)}  ${String(r.clicks).padStart(6)}  ${String(r.impressions).padStart(7)}  ${(r.ctr*100).toFixed(1).padStart(5)}%  ${r.position.toFixed(1).padStart(7)}\n`;
  }
  return out;
}

async function main() {
  console.log(`📊 nolcool.com — 지난 ${days}일 Search Analytics\n`);
  const token = await refreshAccessToken();

  console.log(`🔎 Top 30 검색어:`);
  const queries = await queryAnalytics(token, ['query']);
  console.log(table(queries, '검색어'));

  console.log(`📄 Top 30 페이지:`);
  const pages = await queryAnalytics(token, ['page']);
  const pagesShort = pages.map(p => ({ ...p, keys: [p.keys[0].replace('https://nolcool.com', '')] }));
  console.log(table(pagesShort, '경로'));

  const totalClicks = queries.reduce((a, r) => a + r.clicks, 0);
  const totalImpressions = queries.reduce((a, r) => a + r.impressions, 0);
  console.log(`📈 합계 (Top 30 기준): 클릭 ${totalClicks} / 노출 ${totalImpressions} / CTR ${totalImpressions ? (totalClicks/totalImpressions*100).toFixed(2) : '0.00'}%`);
}

main().catch(e => { console.error('❌ 실패:', e); process.exit(1); });
