#!/usr/bin/env node
/**
 * Google 색인 커버리지 전수 점검 — 색인 안 된 페이지 자동 발견 + 색인 유도
 *
 * 동작:
 *   1) https://nolcool.com/sitemap.xml 의 전 URL(<loc>) 파싱 (~542)
 *   2) URL Inspection API 로 전수 검사 (throttle, 429 백오프) → verdict/coverageState 수집
 *   3) 색인 안 됨 분류:
 *        - PASS 가 아닌 verdict
 *        - coverageState 가 "Crawled - currently not indexed",
 *          "Discovered - currently not indexed",
 *          "Duplicate without user-selected canonical" 등
 *   4) 색인 유도 (정직한 레버):
 *        - Sitemaps.submit 재제출 (공식·안전, 항상 실행)
 *        - --nudge-indexing-api 플래그 시: 색인 안 된 URL만 Indexing API publish (일 180 캡)
 *          ※ 일반 페이지는 비공식(JobPosting/Broadcast 한정) → 회색지대, 사용자 선택
 *   5) Resend 로 색인 안 된 URL 전체 목록 + 사유별 카운트 메일
 *
 * 환경변수: GSC_SA_JSON  / RESEND_API_KEY / NOTIFICATION_EMAIL
 *
 * ※ 색인 여부는 최종적으로 Google이 결정한다. 본 스크립트는 정직한 레버
 *   (sitemap 재제출 + 크롤 가능성 보장 + 보고)만 당기고, 조작은 하지 않는다.
 */

import { getAccessToken, hasGscCredentials, SITE_PROPERTY } from './lib/gsc-auth.mjs';

const SITE = 'https://nolcool.com';
const SITEMAP_URL = `${SITE}/sitemap.xml`;
const INSPECT_THROTTLE_MS = 200;          // ~5 req/s (URL Inspection 쿼터 2000/일)
const MAX_INSPECT = Number(process.env.MAX_INSPECT || 600); // 안전 상한
const INDEXING_API_DAILY_CAP = 180;       // 공식 200/일 중 여유
const nudgeIndexingApi = process.argv.includes('--nudge-indexing-api');

// coverageState 중 "색인 안 됨"으로 분류할 패턴
const NOT_INDEXED_STATES = [
  'currently not indexed',
  'Duplicate',
  'Excluded',
  'not found',
  'Soft 404',
  'Redirect',
  'blocked',
  'noindex',
  'Crawl anomaly',
  'Discovered',
];

if (!hasGscCredentials()) {
  console.log('⏭️  GSC 인증정보 미설정 (GSC_SA_JSON) — 색인 커버리지 점검 스킵');
  process.exit(0);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchSitemapUrls() {
  const r = await fetch(SITEMAP_URL, { headers: { 'User-Agent': 'nolcool-index-coverage' } });
  if (!r.ok) throw new Error(`sitemap fetch ${r.status}`);
  const xml = await r.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  // 중복 제거, sitemap.xml 자기 자신 제외
  return [...new Set(locs)].filter((u) => u && !u.endsWith('/sitemap.xml'));
}

async function inspectUrl(token, inspectionUrl, attempt = 0) {
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl, siteUrl: SITE_PROPERTY, languageCode: 'ko-KR' }),
  });
  if (r.status === 429) {
    if (attempt >= 4) return { error: '429 (쿼터 소진)' };
    const wait = 2000 * (attempt + 1);
    console.log(`  ⏳ 429 쿼터 — ${wait}ms 백오프 후 재시도 (${inspectionUrl})`);
    await sleep(wait);
    return inspectUrl(token, inspectionUrl, attempt + 1);
  }
  if (!r.ok) return { error: `${r.status}` };
  const data = await r.json();
  const idx = data.inspectionResult?.indexStatusResult || {};
  return {
    verdict: idx.verdict || 'UNKNOWN',
    coverageState: idx.coverageState || '?',
    lastCrawl: idx.lastCrawlTime || null,
    robotsState: idx.robotsTxtState || null,
    indexingState: idx.indexingState || null,
  };
}

function isNotIndexed(res) {
  if (res.error) return false; // 점검 실패는 별도 집계
  if (res.verdict === 'PASS') return false;
  const cs = (res.coverageState || '').toLowerCase();
  return NOT_INDEXED_STATES.some((p) => cs.includes(p.toLowerCase())) || res.verdict !== 'PASS';
}

async function submitSitemap(token) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_PROPERTY)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
  const r = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
  console.log(`🗺️  Sitemap 재제출 → Search Console: ${r.status}`);
  return r.status === 200 || r.status === 204;
}

async function publishIndexing(token, urls) {
  const capped = urls.slice(0, INDEXING_API_DAILY_CAP);
  console.log(`\n🚨 --nudge-indexing-api — 색인 안 된 ${capped.length}개 URL Indexing API publish (회색지대, 일 ${INDEXING_API_DAILY_CAP} 캡)`);
  let ok = 0;
  for (const u of capped) {
    const r = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: u, type: 'URL_UPDATED' }),
    });
    if (r.ok) ok++;
    else console.log(`  publish ${u}: ${r.status}`);
    await sleep(100);
  }
  console.log(`  ✅ publish 성공 ${ok}/${capped.length}`);
  return ok;
}

async function sendReport({ total, inspected, notIndexed, errors, byState, sitemapOk, nudged }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
  if (!RESEND_API_KEY) {
    console.log('⏭️  RESEND_API_KEY 없음 — 메일 스킵 (로그로 보고)');
    return;
  }
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const stateRows = Object.entries(byState)
    .sort((a, b) => b[1] - a[1])
    .map(([s, n]) => `<tr><td style="padding:4px 10px;border-bottom:1px solid #eee">${s}</td><td style="padding:4px 10px;border-bottom:1px solid #eee;text-align:right">${n}</td></tr>`)
    .join('');
  const niList = notIndexed.length
    ? notIndexed.slice(0, 200).map((x) => `<li style="font-size:12px;color:#444"><code>${x.url.replace(SITE, '')}</code> — <span style="color:#B45309">${x.coverageState}</span></li>`).join('')
    : '<li style="color:#16A34A">없음 — 전 페이지 색인됨 🎉</li>';
  const errLine = errors.length ? `<p style="color:#9CA3AF;font-size:12px">점검 실패(쿼터/일시오류) ${errors.length}건 — 다음 회차 재검사</p>` : '';
  const headColor = notIndexed.length ? '#B45309' : '#16A34A';
  const html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px">
    <h2 style="color:${headColor}">[🔍 Google 색인 커버리지] 색인 안 된 페이지 ${notIndexed.length}개</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst} · 검사 ${inspected}/${total}</p>
    <table style="border-collapse:collapse;font-size:13px;margin:10px 0"><tbody>
      <tr><td style="padding:4px 10px">sitemap 총 URL</td><td style="padding:4px 10px;text-align:right">${total}</td></tr>
      <tr><td style="padding:4px 10px">검사 완료</td><td style="padding:4px 10px;text-align:right">${inspected}</td></tr>
      <tr><td style="padding:4px 10px;color:#16A34A">색인됨(PASS)</td><td style="padding:4px 10px;text-align:right">${inspected - notIndexed.length - errors.length}</td></tr>
      <tr><td style="padding:4px 10px;color:#B45309">색인 안 됨</td><td style="padding:4px 10px;text-align:right;font-weight:bold">${notIndexed.length}</td></tr>
    </tbody></table>
    <h3 style="font-size:14px">사유별 분포</h3>
    <table style="border-collapse:collapse;font-size:13px"><tbody>${stateRows || '<tr><td>—</td></tr>'}</tbody></table>
    <h3 style="font-size:14px">색인 안 된 페이지 (최대 200)</h3>
    <ul style="margin:0;padding-left:18px">${niList}</ul>
    ${errLine}
    <h3 style="font-size:14px">취한 조치</h3>
    <ul style="font-size:13px">
      <li>Sitemap 재제출 → Search Console: ${sitemapOk ? '✅ 성공' : '⚠️ 응답 확인'}</li>
      ${nudged != null ? `<li>Indexing API 크롤 유도 publish: ${nudged}개</li>` : '<li>Indexing API publish: 미사용 (sitemap 재제출만 — 일반 페이지 정책 안전)</li>'}
    </ul>
    <p style="color:#9CA3AF;font-size:11px;margin-top:16px">색인 여부는 Google이 최종 결정. 본 점검은 정직한 레버(sitemap 재제출·크롤 가능성·보고)만 당깁니다. "Discovered/Crawled - not indexed"는 대개 시간이 지나면 색인되며, 반복되면 콘텐츠 고유성·내부링크 보강이 정답입니다.</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][🔍] Google 색인 안 된 페이지 ${notIndexed.length}개`,
      html,
    }),
  });
  console.log(`📧 보고 메일: ${r.status}`);
}

async function main() {
  console.log('🔑 GSC access_token 발급...');
  const token = await getAccessToken();
  if (!token) {
    console.log('⏭️  토큰 발급 실패 — graceful skip');
    return;
  }

  console.log(`🗺️  sitemap 파싱: ${SITEMAP_URL}`);
  const allUrls = await fetchSitemapUrls();
  const urls = allUrls.slice(0, MAX_INSPECT);
  console.log(`   총 ${allUrls.length}개 (검사 ${urls.length}개, 쿼터 상한 ${MAX_INSPECT})`);

  const notIndexed = [];
  const errors = [];
  const byState = {};
  let inspected = 0;

  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    const res = await inspectUrl(token, u);
    if (res.error) {
      errors.push({ url: u, error: res.error });
    } else {
      inspected++;
      if (isNotIndexed(res)) {
        notIndexed.push({ url: u, coverageState: res.coverageState, verdict: res.verdict });
        byState[res.coverageState] = (byState[res.coverageState] || 0) + 1;
      }
    }
    if ((i + 1) % 50 === 0) {
      console.log(`   …${i + 1}/${urls.length} 검사 (색인안됨 ${notIndexed.length}, 오류 ${errors.length})`);
    }
    // 쿼터 소진 조기 종료
    if (res.error && res.error.includes('429')) {
      console.log('   ⛔ URL Inspection 쿼터 소진 — 검사 중단, 여기까지 집계');
      break;
    }
    await sleep(INSPECT_THROTTLE_MS);
  }

  console.log(`\n📊 검사 ${inspected}/${urls.length} · 색인 안 됨 ${notIndexed.length} · 오류 ${errors.length}`);
  for (const x of notIndexed) console.log(`   ❌ ${x.coverageState} | ${x.url}`);

  console.log('\n🔧 색인 유도...');
  const sitemapOk = await submitSitemap(token);
  let nudged = null;
  if (nudgeIndexingApi && notIndexed.length) {
    nudged = await publishIndexing(token, notIndexed.map((x) => x.url));
  } else if (notIndexed.length) {
    console.log('💡 Indexing API publish 미사용 — sitemap 재제출만 (일반 페이지 안전). 강제 유도하려면 `--nudge-indexing-api`');
  }

  await sendReport({
    total: allUrls.length,
    inspected,
    notIndexed,
    errors,
    byState,
    sitemapOk,
    nudged,
  });

  console.log('\n✅ Google 색인 커버리지 점검 완료');
}

main().catch((e) => {
  console.error('❌ 실패:', e);
  process.exit(1);
});
