#!/usr/bin/env node
/**
 * Google Search Console 문제 자동 감지·해결 모니터 (의존성 없음)
 *
 * 배경: Search Console가 Gmail로 보내는 "사이트에 문제 있음" 메일들은 알림일 뿐이고,
 *       진짜 문제 데이터는 Search Console API(urlInspection)에 그대로 들어있다.
 *       메일을 기다려 파싱하는 것보다 API를 매일 직접 긁는 게 더 정확하고 누락이 없다.
 *
 * 인증 (scripts/lib/gsc-auth.mjs):
 *   1순위 서비스계정 GSC_SA_JSON (만료 없음, 권장)
 *   2순위 OAuth GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN (폴백)
 *   RESEND_API_KEY            (선택 — 문제 발견 시 리포트 메일)
 *   NOTIFICATION_EMAIL        (선택 — 기본 theassetsquare@gmail.com)
 *
 * 동작:
 *   1) access_token 발급 (서비스계정 우선, 만료 시 graceful skip + 안내 메일 1통)
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

import { getAccessToken, hasGscCredentials } from './lib/gsc-auth.mjs';

const { RESEND_API_KEY } = process.env;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const CONCURRENCY = Number(process.env.INSPECT_CONCURRENCY || 5);
const MAX_INSPECT = Number(process.env.MAX_INSPECT || 1500); // 일일 quota 2000 안전선
const doRequestIndexing = process.argv.includes('--request-indexing');

if (!hasGscCredentials()) {
  console.log('⏭️  GSC 인증정보 미설정 (GSC_SA_JSON 또는 GOOGLE_OAUTH_*) — 모니터 스킵');
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
  const token = await getAccessToken();
  if (!token) {
    console.warn('⚠️  access_token 발급 실패 — graceful skip');
    await sendMail('[놀쿨][🔑] Google 인증 갱신 필요',
      `<div style="font-family:sans-serif;max-width:680px;margin:0 auto;padding:20px">
        <h2 style="color:#DC2626">[🔑 Google 인증 실패] 문제 모니터 일시 중단</h2>
        <p style="color:#666;font-size:13px">측정: ${kstNow()}</p>
        <p>서치콘솔 인증 토큰을 발급하지 못했습니다 — 자동 감지가 멈춥니다.</p>
        <h3>🔧 점검</h3>
        <ol>
          <li><b>서비스계정(권장):</b> GitHub Secret <code>GSC_SA_JSON</code> 확인 + 서치콘솔 nolcool.com 속성에 <code>gsc-mcp@theasset-gsc.iam.gserviceaccount.com</code> 사용자 추가됐는지 확인</li>
          <li><b>OAuth(폴백):</b> <code>node scripts/google-oauth-setup.mjs</code> 로 새 refresh_token 발급 → <code>GOOGLE_REFRESH_TOKEN</code> 교체</li>
        </ol>
      </div>`);
    return null;
  }
  return token;
}

async function fetchSitemapUrls() {
  const r = await fetch(SITEMAP_URL, { headers: { 'Cache-Control': 'no-cache' } });
  if (!r.ok) { console.warn(`⚠️  sitemap.xml ${r.status}`); return []; }
  const xml = await r.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

/** 라이브 페이지의 실제 <link rel="canonical"> 추출 (캐시지연 false-positive 재검증용). */
async function fetchLiveCanonical(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'NolcoolIssueMonitor/1.0', 'Cache-Control': 'no-cache' } });
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
    if (!m) return null;
    const href = m[0].match(/href=["']([^"']+)["']/i);
    return href ? href[1].trim() : null;
  } catch { return null; }
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
    // canonical 불일치는 라이브 재검증을 위해 Google/우리 canonical 보관
    const row = { url: r.url, reason: c.reason, hint: c.hint, _gcanon: r.googleCanonical, _ucanon: r.userCanonical };
    if (c.bucket === 'CRITICAL') crit.push(row);
    else if (c.bucket === 'WARN') warn.push(row);
    else if (c.bucket === 'PENDING') pending.push(row);
    else if (c.bucket === 'SKIP') skip.push(row);
    else okCount++;
  }

  // ★ 라이브 재검증 — Google 캐시 지연 false-positive 제거.
  // urlInspection은 Google이 "마지막으로 크롤한" 상태라, 우리가 이미 코드를 고쳐 배포했어도
  // 재크롤 전까지 옛 오류로 잡힌다(특히 canonical 불일치). 메일 쏘기 전에 라이브 HTML을 직접 봐서
  // 지금도 진짜 깨졌는지 확인하고, 캐시 지연일 뿐이면 메일 X·재크롤만(자가치유).
  const lagResolved = [];
  const realCrit = [];
  for (const c of crit) {
    if (c.reason === 'canonical 불일치') {
      const live = await fetchLiveCanonical(c.url);
      // Google이 선택한 canonical(= 보통 정답 trailing-slash)과 라이브가 이미 일치하면 코드 정상.
      if (live && c._gcanon && live === c._gcanon) {
        console.log(`   ↺ ${c.url} — 라이브 canonical 이미 정상(${live}) = Google 캐시 지연 → 메일 생략, 재크롤만`);
        lagResolved.push(c);
        continue;
      }
    }
    realCrit.push(c);
  }

  console.log(`\n📊 결과: 🔴 ${realCrit.length}(+캐시지연 ${lagResolved.length}) · 🟡 ${warn.length} · 🟦 ${pending.length} · 🟢 ${okCount} · ⏭️ ${skip.length}`);
  for (const c of realCrit) console.log(`🔴 ${c.url}\n     ${c.reason} — ${c.hint || ''}`);
  for (const w of warn) console.log(`🟡 ${w.url}\n     ${w.reason} — ${w.hint || ''}`);

  const hasProblem = crit.length || warn.length || pending.length;
  if (hasProblem) {
    // 색인 대기/리치결과/캐시지연은 정상·구글측 상태라 자동 처리만 하고 메일은 보내지 않음.
    // (sitemap 재제출 + 강제 재크롤로 자동 해소 유도)
    await resubmitSitemap(token);
    if (doRequestIndexing) {
      await requestIndexing(token, [...crit, ...warn, ...pending].map(x => x.url).slice(0, 100));
    }
  }

  // ★ 메일 정책 (사용자 요청 2026-06-01): 사장님이 매일 안심 확인하도록 0건이어도 한 줄 요약 1통.
  //   - 라이브 진짜 버그(realCrit) → 🔴 상세 리포트 (행동 필요)
  //   - 0건 → ✅ 한 줄 요약 (캐시지연/WARN/PENDING은 자동 재크롤됨, 행동 불필요)
  //   season66 "실패시만" 정책의 명시적 예외 — 이 모니터만 매일 요약 발송.
  const inspected = okCount + crit.length + warn.length + pending.length; // 실제 검사된 URL 수
  const total = inspected + skip.length;
  const quotaExhausted = total > 0 && inspected < total * 0.2; // 80%+ 점검불가 = 할당량 소진

  if (realCrit.length) {
    await sendMail(
      `[놀쿨][🔴] 서치콘솔 코드 수정 필요 ${realCrit.length}건`,
      reportHtml(realCrit, warn, pending, okCount, skip),
    );
  } else if (quotaExhausted) {
    // 실제 검사가 거의 안 됨(할당량 소진) → "정상"이라 거짓 안심 주지 말고 점검불가로 정직하게 보고.
    console.log(`⏭️ 점검불가 ${skip.length}/${total} — 할당량 소진, "정상" 대신 점검불가 메일 발송`);
    await sendMail(
      `[놀쿨][⏭️] 서치콘솔 점검불가 — 할당량 소진 (내일 자동 재시도)`,
      `<div style="font-family:sans-serif;max-width:680px;margin:0 auto;padding:20px;color:#222">
        <h2 style="color:#D97706">⏭️ 오늘은 점검 불가 — 할당량 소진</h2>
        <p style="color:#666;font-size:13px">측정: ${kstNow()}</p>
        <p style="font-size:14px">Google 서치콘솔 검사 API의 하루 할당량(~2000건)이 소진되어 <b>${total}개 중 ${inspected}개만 검사</b>되고 ${skip.length}개는 점검하지 못했습니다.</p>
        <p style="font-size:14px;color:#16A34A">검사된 ${inspected}개 중 🔴 코드 버그는 <b>0건</b>입니다. 할당량은 매일 자동 초기화되므로 <b>내일 정기 실행에서 전체 재검사</b>됩니다 — 행동 필요 없음.</p>
        <p style="color:#9CA3AF;font-size:12px;margin-top:16px">"정상"이 아니라 "점검불가"로 보내는 이유: 검사를 못 한 페이지를 정상이라 단정하지 않기 위함입니다.</p>
      </div>`,
    );
  } else {
    console.log(`✅ 라이브 CRITICAL 0건 — 요약 메일 발송 (검사 ${inspected}/${total}, 캐시지연 ${lagResolved.length}/WARN ${warn.length}/PENDING ${pending.length}는 자동 재크롤, 정상)`);
    await sendMail(
      `[놀쿨][✅] 서치콘솔 정상 — 코드 버그 0건`,
      `<div style="font-family:sans-serif;max-width:680px;margin:0 auto;padding:20px;color:#222">
        <h2 style="color:#16A34A">✅ 서치콘솔 정상 — 행동 필요 없음</h2>
        <p style="color:#666;font-size:13px">측정: ${kstNow()}</p>
        <table style="border-collapse:collapse;font-size:14px;margin-top:8px">
          <tr><td style="padding:4px 12px 4px 0">🔴 라이브 코드 버그</td><td style="font-weight:700;color:#16A34A">0건</td></tr>
          <tr><td style="padding:4px 12px 4px 0">↺ 구글 캐시지연(자동 재크롤)</td><td>${lagResolved.length}건</td></tr>
          <tr><td style="padding:4px 12px 4px 0">🟡 스키마 경고(자동 재크롤)</td><td>${warn.length}건</td></tr>
          <tr><td style="padding:4px 12px 4px 0">🟦 색인 대기(자동 재크롤)</td><td>${pending.length}건</td></tr>
          <tr><td style="padding:4px 12px 4px 0">🟢 정상 색인</td><td>${okCount}건</td></tr>
          <tr><td style="padding:4px 12px 4px 0">⏭️ 점검불가(할당량/일시)</td><td>${skip.length}건</td></tr>
        </table>
        <p style="color:#9CA3AF;font-size:12px;margin-top:16px">이 메일은 "오늘도 이상 없음" 확인용입니다. 캐시지연·경고·색인대기는 매일 자동 재크롤로 해소되며 행동 불필요. 🔴 0건이면 안심하셔도 됩니다.</p>
      </div>`,
    );
  }

  // 워크플로는 항상 초록불 — 🔴 코드버그는 위 상세 메일로 행동 신호를 보냈고,
  // exit 1로 워크플로를 빨갛게 만들면 actions-digest가 "워크플로 실패"로 또 메일을 보내 이중 알림이 된다.
  // 진짜 인프라 크래시(OAuth/네트워크)만 main().catch에서 exit 1 → 그때만 디지스트가 정당하게 보고.
}

main().catch(e => { console.error('❌ 실패:', e); process.exit(1); });
