#!/usr/bin/env node
/**
 * Google Search Console 문제 자동 감지·해결 모니터 (의존성 없음)
 *
 * 배경: Search Console가 Gmail로 보내는 "사이트에 문제 있음" 메일들은 알림일 뿐이고,
 *       진짜 문제 데이터는 Search Console API(urlInspection)에 그대로 들어있다.
 *       메일을 기다려 파싱하는 것보다 API를 매일 직접 긁는 게 더 정확하고 누락이 없다.
 *
 * 환경변수 (GitHub Secrets):
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_REFRESH_TOKEN
 *   RESEND_API_KEY            (선택 — 문제 발견 시 리포트 메일)
 *   NOTIFICATION_EMAIL        (선택 — 기본 theassetsquare@gmail.com)
 *
 * 동작:
 *   1) refresh_token → access_token (만료 시 graceful skip + 안내 메일 1통)
 *   2) 라이브 sitemap.xml 전체 URL 파싱
 *   3) urlInspection.index.inspect 로 페이지별 색인 상태 수집 (concurrency 5)
 *   4) 구조화 enum 기준 3분류:
 *        🔴 CRITICAL (코드 버그): 404 / soft404 / noindex / robots 차단 / 서버오류 / canonical 불일치
 *        🟡 PENDING  (색인 대기): Discovered/Crawled - not indexed  → 자동 sitemap 재제출로 재크롤 유도
 *        🟢 OK       (정상 색인)
 *   5) 문제 있으면 sitemap 자동 재제출 + Resend 리포트 메일 (문제 0건이면 메일 X — season66 정책)
 *
 * 플래그:
 *   --request-indexing  CRITICAL/PENDING URL을 Indexing API publish (일반 페이지 회색지대, 자기 책임)
 */

const SITE = 'https://nolcool.com/';
const SITE_PROPERTY = 'sc-domain:nolcool.com';
const SITEMAP_URL = `${SITE}sitemap.xml`;

const {
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  RESEND_API_KEY,
} = process.env;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const CONCURRENCY = Number(process.env.INSPECT_CONCURRENCY || 5);
const MAX_INSPECT = Number(process.env.MAX_INSPECT || 1500); // 일일 quota 2000 안전선
const doRequestIndexing = process.argv.includes('--request-indexing');

if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  console.log('⏭️  GOOGLE_OAUTH_* / GOOGLE_REFRESH_TOKEN 미설정 — 모니터 스킵');
  process.exit(0);
}

function kstNow() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
}

async function sendMail(subject, html) {
  if (!RESEND_API_KEY) { console.log('⏭️  RESEND_API_KEY 없음 — 메일 스킵'); return; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO], subject, html }),
  }).catch(() => null);
  if (r) console.log(`📧 메일 발송: ${r.status}`);
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
    console.warn('⚠️  access_token 갱신 실패 — graceful skip:', JSON.stringify(data));
    await sendMail('[놀쿨][🔑] Google OAuth refresh_token 갱신 필요',
      `<div style="font-family:sans-serif;max-width:680px;margin:0 auto;padding:20px">
        <h2 style="color:#DC2626">[🔑 Google OAuth 토큰 만료] 문제 모니터 일시 중단</h2>
        <p style="color:#666;font-size:13px">측정: ${kstNow()}</p>
        <p>refresh_token이 만료/취소됨 — 서치콘솔 문제 자동 감지가 멈춥니다.</p>
        <p><strong>응답:</strong> ${JSON.stringify(data)}</p>
        <h3>🔧 갱신 (5분)</h3>
        <ol>
          <li>로컬: <code>GOOGLE_OAUTH_CLIENT_ID=… GOOGLE_OAUTH_CLIENT_SECRET=… node scripts/google-oauth-setup.mjs</code></li>
          <li>출력된 새 refresh_token 복사</li>
          <li>GitHub → Settings → Secrets → <code>GOOGLE_REFRESH_TOKEN</code> 교체</li>
        </ol>
      </div>`);
    return null;
  }
  return data.access_token;
}

async function fetchSitemapUrls() {
  const r = await fetch(SITEMAP_URL, { headers: { 'Cache-Control': 'no-cache' } });
  if (!r.ok) { console.warn(`⚠️  sitemap.xml ${r.status}`); return []; }
  const xml = await r.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

async function resubmitSitemap(token) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_PROPERTY)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
  const r = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
  console.log(`🗺️  sitemap 재제출: ${r.status === 200 || r.status === 204 ? 'OK' : r.status}`);
}

async function inspect(token, inspectionUrl) {
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl, siteUrl: SITE_PROPERTY, languageCode: 'ko-KR' }),
  });
  if (r.status === 429) return { url: inspectionUrl, quota: true };
  if (!r.ok) return { url: inspectionUrl, error: r.status };
  const data = await r.json();
  const idx = data.inspectionResult?.indexStatusResult || {};
  const richRes = data.inspectionResult?.richResultsResult;
  // 리치결과 FAIL 시 어떤 타입의 어떤 이슈인지 정확히 추출 (추측 제거)
  const richIssues = [];
  for (const di of richRes?.detectedItems || []) {
    for (const it of di.items || []) {
      for (const is of it.issues || []) {
        if (is.severity === 'ERROR') richIssues.push(`${di.richResultType}: ${is.issueMessage}`);
      }
    }
  }
  return {
    url: inspectionUrl,
    verdict: idx.verdict,
    coverageState: idx.coverageState,
    robotsTxtState: idx.robotsTxtState,
    indexingState: idx.indexingState,
    pageFetchState: idx.pageFetchState,
    googleCanonical: idx.googleCanonical,
    userCanonical: idx.userCanonical,
    mobile: data.inspectionResult?.mobileUsabilityResult?.verdict,
    rich: richRes?.verdict,
    richIssues,
  };
}

/** 구조화 enum 우선 분류 (지역화 문자열 의존 최소화) */
function classify(r) {
  if (r.error || r.quota) return { bucket: 'SKIP', reason: r.quota ? 'quota 초과' : `inspect ${r.error}` };
  const fix = (reason, hint) => ({ bucket: 'CRITICAL', reason, hint });

  if (r.pageFetchState === 'NOT_FOUND') return fix('404 (페이지 없음)', 'sitemap에 있는데 라우트가 사라짐 — 페이지 복구하거나 빌드 후 sitemap 자동정리 확인');
  if (r.pageFetchState === 'SOFT_404') return fix('소프트 404 (빈 콘텐츠로 인식)', '본문/SSR 콘텐츠 부족 — prerender 본문 보강');
  if (['SERVER_ERROR', 'INTERNAL_CRAWL_ERROR'].includes(r.pageFetchState)) return fix(`서버 오류 (${r.pageFetchState})`, 'CF Pages 배포/함수 오류 점검');
  if (['ACCESS_DENIED', 'ACCESS_FORBIDDEN', 'BLOCKED_4XX'].includes(r.pageFetchState)) return fix(`접근 차단 (${r.pageFetchState})`, '인증/4xx 응답 점검');
  if (r.pageFetchState === 'REDIRECT_ERROR') return fix('리다이렉트 오류', '_redirects 체인/루프 점검');
  if (r.indexingState === 'BLOCKED_BY_META_TAG') return fix('noindex 메타 태그', 'prerender/Helmet에서 robots noindex 제거');
  if (r.indexingState === 'BLOCKED_BY_HTTP_HEADER') return fix('X-Robots-Tag 헤더 차단', 'CF 응답 헤더 점검');
  if (r.indexingState === 'BLOCKED_BY_ROBOTS_TXT' || r.robotsTxtState === 'DISALLOWED' || r.pageFetchState === 'BLOCKED_ROBOTS_TXT')
    return fix('robots.txt 차단', 'robots.txt Disallow 제거 (CLAUDE.md: Allow ALL bots)');
  if (r.googleCanonical && r.userCanonical && r.googleCanonical !== r.userCanonical)
    return { bucket: 'CRITICAL', reason: 'canonical 불일치', hint: `Google 선택=${r.googleCanonical} / 우리 지정=${r.userCanonical} — 중복 콘텐츠/canonical 점검` };

  if (r.verdict === 'PASS') {
    // PASS인데 모바일/리치결과 문제만 있는 경우
    if (r.mobile === 'FAIL') return { bucket: 'WARN', reason: '모바일 사용성 문제', hint: '터치 타깃/뷰포트 점검' };
    if (r.rich === 'FAIL') return { bucket: 'WARN', reason: '리치 결과(구조화 데이터) 오류', hint: r.richIssues?.length ? r.richIssues.join(' · ') : 'JSON-LD 스키마 점검 (상세 이슈 없음 — FAQ 비적격/일시적 가능)' };
    return { bucket: 'OK' };
  }
  // verdict NEUTRAL/PARTIAL + 색인 안 됨 → 대기 (재제출로 유도)
  return { bucket: 'PENDING', reason: r.coverageState || '색인 대기', hint: 'sitemap 재제출 + 내부링크/콘텐츠로 크롤 유도' };
}

async function mapLimit(items, limit, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

async function requestIndexing(token, urls) {
  console.log(`🚨 --request-indexing: ${urls.length}개 publish (회색지대, 자기 책임)`);
  for (const u of urls) {
    const r = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: u, type: 'URL_UPDATED' }),
    });
    console.log(`  publish ${u}: ${r.status}`);
  }
}

function reportHtml(crit, warn, pending, okCount, skip) {
  const li = (arr) => arr.map(x => `<li style="margin:6px 0"><code style="color:#111">${x.url}</code><br><span style="color:#DC2626;font-weight:600">${x.reason}</span> — <span style="color:#555">${x.hint || ''}</span></li>`).join('');
  return `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px;color:#222">
    <h2 style="color:#111">[🔍 Google 서치콘솔 문제 자동 점검]</h2>
    <p style="color:#666;font-size:13px">측정: ${kstNow()} · 정상 ${okCount} · 점검불가 ${skip.length}</p>
    ${crit.length ? `<h3 style="color:#DC2626">🔴 코드 수정 필요 — ${crit.length}건</h3><ul>${li(crit)}</ul>` : ''}
    ${warn.length ? `<h3 style="color:#D97706">🟡 사용성/스키마 경고 — ${warn.length}건</h3><ul>${li(warn)}</ul>` : ''}
    ${pending.length ? `<h3 style="color:#2563EB">🟦 색인 대기 — ${pending.length}건 (sitemap 자동 재제출함)</h3><ul>${li(pending.slice(0, 40))}</ul>${pending.length > 40 ? `<p style="color:#888">…외 ${pending.length - 40}건</p>` : ''}` : ''}
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">메일 알림을 기다리지 않고 Search Console API를 직접 긁어 감지합니다. 🔴 항목은 자동 수정 대신 정확한 위치를 알려드립니다(가드 충돌 방지).</p>
  </div>`;
}

async function main() {
  console.log('🔑 access_token 갱신...');
  const token = await refreshAccessToken();
  if (!token) { console.log('⏭️  토큰 만료 — graceful skip'); return; }

  console.log('🗺️  sitemap URL 수집...');
  let urls = await fetchSitemapUrls();
  console.log(`   총 ${urls.length}개 URL`);
  if (urls.length > MAX_INSPECT) {
    console.log(`   quota 보호 — ${MAX_INSPECT}개로 제한`);
    urls = urls.slice(0, MAX_INSPECT);
  }
  if (urls.length === 0) { console.log('⏭️  검사할 URL 없음'); return; }

  console.log(`🔍 색인 상태 검사 (concurrency ${CONCURRENCY})...`);
  const results = await mapLimit(urls, CONCURRENCY, (u) => inspect(token, u));

  const crit = [], warn = [], pending = [], skip = [];
  let okCount = 0;
  for (const r of results) {
    const c = classify(r);
    const row = { url: r.url, reason: c.reason, hint: c.hint };
    if (c.bucket === 'CRITICAL') crit.push(row);
    else if (c.bucket === 'WARN') warn.push(row);
    else if (c.bucket === 'PENDING') pending.push(row);
    else if (c.bucket === 'SKIP') skip.push(row);
    else okCount++;
  }

  console.log(`\n📊 결과: 🔴 ${crit.length} · 🟡 ${warn.length} · 🟦 ${pending.length} · 🟢 ${okCount} · ⏭️ ${skip.length}`);
  for (const c of crit) console.log(`🔴 ${c.url}\n     ${c.reason} — ${c.hint || ''}`);
  for (const w of warn) console.log(`🟡 ${w.url}\n     ${w.reason} — ${w.hint || ''}`);

  const hasProblem = crit.length || warn.length || pending.length;
  if (hasProblem) {
    // 색인 대기/리치결과는 정상·구글측 상태라 자동 처리만 하고 메일은 보내지 않음.
    // (sitemap 재제출 + 강제 재크롤로 자동 해소 유도)
    await resubmitSitemap(token);
    if (doRequestIndexing) {
      await requestIndexing(token, [...crit, ...warn, ...pending].map(x => x.url).slice(0, 100));
    }
  }

  // ★ 메일은 🔴 CRITICAL(실제 코드 버그)일 때만 — PENDING/WARN 매 run 메일 스팸 제거
  // (season66 "실패시만 메일" 정책: 색인대기 139건은 정상 steady-state, 버그 아님)
  if (crit.length) {
    await sendMail(
      `[놀쿨][🔴] 서치콘솔 코드 수정 필요 ${crit.length}건`,
      reportHtml(crit, warn, pending, okCount, skip),
    );
  } else {
    console.log(`✅ CRITICAL 0건 — 메일 생략 (WARN ${warn.length}/PENDING ${pending.length}는 자동 처리, 정상)`);
  }

  // CRITICAL은 사이트 코드 버그 신호 → 워크플로 빨간불로 눈에 띄게
  if (crit.length) process.exit(1);
}

main().catch(e => { console.error('❌ 실패:', e); process.exit(1); });
