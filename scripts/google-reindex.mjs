#!/usr/bin/env node
/**
 * Google 자동 재인덱싱 — refresh_token 기반 (의존성 없음)
 *
 * 환경변수 (GitHub Secrets):
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_REFRESH_TOKEN
 *
 * 동작:
 *   1) refresh_token → access_token 갱신
 *   2) Search Console Sitemaps.submit (sitemap.xml 재크롤링 큐 등록) ← 안전, 공식
 *   3) urlInspection.index.inspect 로 샘플 5 URL 현재 색인 상태 점검 (모니터링)
 *
 * Indexing API publish 는 정책상 일반 페이지 미지원 (JobPosting/BroadcastEvent/Livestream 한정).
 * 사용하려면 `--unsafe-indexing-api` 플래그 명시 (자기 위험).
 */

const SITE = 'https://nolcool.com/';
const SITE_PROPERTY = 'sc-domain:nolcool.com'; // Search Console 속성 형식: sc-domain 또는 https://...

const {
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
} = process.env;

if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  console.log('⏭️  GOOGLE_OAUTH_* / GOOGLE_REFRESH_TOKEN 미설정 — Google 재인덱싱 스킵');
  process.exit(0);
}

const useUnsafeIndexing = process.argv.includes('--unsafe-indexing-api');

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

async function submitSitemap(accessToken) {
  const sitemapUrl = `${SITE}sitemap.xml`;
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_PROPERTY)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  const r = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (r.status === 200 || r.status === 204) {
    console.log(`✅ Sitemap 재제출 → Search Console: ${r.status}`);
  } else {
    console.log(`⚠️  Sitemap 재제출 응답: ${r.status} ${await r.text().catch(()=>'')}`);
  }
}

async function inspectUrl(accessToken, inspectionUrl) {
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inspectionUrl,
      siteUrl: SITE_PROPERTY,
      languageCode: 'ko-KR',
    }),
  });
  if (!r.ok) {
    console.log(`  ⚠️  inspect ${inspectionUrl}: ${r.status}`);
    return;
  }
  const data = await r.json();
  const idx = data.inspectionResult?.indexStatusResult;
  console.log(`  ${idx?.verdict || '?'} | ${idx?.coverageState || '?'} | ${inspectionUrl}`);
}

async function publishIndexing(accessToken, urls) {
  console.log('⚠️  Indexing API publish — 일반 페이지는 정책상 미지원, 위험 부담 사용자 책임');
  for (const u of urls) {
    const r = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: u, type: 'URL_UPDATED' }),
    });
    console.log(`  publish ${u}: ${r.status}`);
  }
}

async function main() {
  console.log('🔑 access_token 갱신...');
  const token = await refreshAccessToken();

  console.log('🗺️  Sitemap 재제출...');
  await submitSitemap(token);

  console.log('\n🔍 샘플 5 URL 색인 상태 검사...');
  const sampleUrls = [
    'https://nolcool.com/',
    'https://nolcool.com/rooms/ilsan/ilsanroom/',
    'https://nolcool.com/clubs/gangnam/gangnamclub-race/',
    'https://nolcool.com/rooms/busan-haeundae/haeundaegoguryeo/',
    'https://nolcool.com/nights/ansandontellmamanight/',
  ];
  for (const u of sampleUrls) {
    await inspectUrl(token, u);
  }

  if (useUnsafeIndexing) {
    // 사용자가 명시한 경우에만 (회색지대)
    console.log('\n🚨 --unsafe-indexing-api 플래그 감지 — Indexing API publish 시도');
    await publishIndexing(token, sampleUrls);
  } else {
    console.log('\n💡 Indexing API publish 는 일반 페이지 비공식 — 사용하려면 `--unsafe-indexing-api` 플래그');
  }

  console.log('\n✅ Google 재인덱싱 시그널 완료');
}

main().catch(e => {
  console.error('❌ 실패:', e);
  process.exit(1);
});
