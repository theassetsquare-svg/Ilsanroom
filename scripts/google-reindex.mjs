#!/usr/bin/env node
/**
 * Google 자동 재인덱싱 — 서비스계정(GSC_SA_JSON) 기반 (의존성 없음)
 *
 * 환경변수 (GitHub Secrets):
 *   GSC_SA_JSON  (서비스계정 키 JSON — 만료 없음)
 *
 * 동작:
 *   1) 서비스계정 JWT → access_token 발급
 *   2) Search Console Sitemaps.submit (sitemap.xml 재크롤링 큐 등록) ← 안전, 공식
 *   3) urlInspection.index.inspect 로 샘플 5 URL 현재 색인 상태 점검 (모니터링)
 *
 * Indexing API publish 는 정책상 일반 페이지 미지원 (JobPosting/BroadcastEvent/Livestream 한정).
 * 사용하려면 `--unsafe-indexing-api` 플래그 명시 (자기 위험).
 */

import { getAccessToken, hasGscCredentials } from './lib/gsc-auth.mjs';

const SITE = 'https://nolcool.com/';
const SITE_PROPERTY = 'https://nolcool.com/'; // SA(gsc-mcp@theasset-gsc) siteOwner 속성 (sc-domain 은 SA 권한 없음)

if (!hasGscCredentials()) {
  console.log('⏭️  GSC 인증정보 미설정 (GSC_SA_JSON) — Google 재인덱싱 스킵');
  process.exit(0);
}

const useUnsafeIndexing = process.argv.includes('--unsafe-indexing-api');

async function notifyTokenExpired(reason) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
  if (!RESEND_API_KEY) return;
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const html = `<div style="font-family:sans-serif;max-width:680px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[🔑 Google 서비스계정 인증 실패] 재인덱싱 일시 중단</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <p>서비스계정 토큰을 발급하지 못했습니다 — Google 자동 재인덱싱이 일시 중단됩니다.</p>
    <p><strong>응답:</strong> ${reason}</p>
    <h3>🔧 점검</h3>
    <ol>
      <li>GitHub Secret <code>GSC_SA_JSON</code> 키 JSON이 유효한지 확인</li>
      <li>서비스계정 <code>gsc-mcp@theasset-gsc.iam.gserviceaccount.com</code> 이 서치콘솔 <code>https://nolcool.com/</code> 속성의 소유자로 남아있는지 확인</li>
      <li>다음 KST 07:30 cron에서 자동 복구</li>
    </ol>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">중단 중에도 사이트 콘텐츠는 정상 — sitemap.xml은 Google이 매일 알아서 크롤. 재인덱싱은 부스터일 뿐.</p>
  </div>`;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: '[놀쿨][🔑] Google 서비스계정 인증 갱신 필요',
      html,
    }),
  }).catch(() => {});
}

async function refreshAccessToken() {
  /* 서비스계정(GSC_SA_JSON)로 토큰 발급. 실패 시 graceful skip + 안내 메일. */
  const token = await getAccessToken();
  if (!token) {
    console.warn('⚠️  access_token 발급 실패 — graceful skip');
    await notifyTokenExpired('서비스계정 토큰 발급 실패');
    return null;
  }
  return token;
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
  if (!token) {
    console.log('⏭️  토큰 만료 — graceful skip (워크플로 success, 가이드 메일 발송 완료)');
    return;
  }

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
