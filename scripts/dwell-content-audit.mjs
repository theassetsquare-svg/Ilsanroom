/**
 * 놀쿨 체류 10분 보장 콘텐츠 분량 24h watch — 시즌77.
 * 매일 KST 07:40 — sitemap 전체 페이지 본문 글자 수 측정.
 *
 * 회귀 사유:
 *  - 본문 미달 (detail<1700 / listing<2000자) 페이지 알림
 *  - H2 5개 미만 페이지 알림
 *
 * 환경:
 *  RESEND_API_KEY     필수
 *  NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
import https from 'https';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const SITEMAP = 'https://nolcool.com/sitemap.xml';
// 시즌159 — page-type별 임계값 정밀화
//  venue/magazine 상세 = 1700자 / listing = 2000자
// ★ 구조 지문(structural fingerprint) 정합 (2026-06): venue 상세 floor를 3000→1700으로 내림.
//   사유: Google 2026 scaled-content-abuse 집행은 "분량"이 아니라 "프로그래매틱 복붙(구조 지문)"을 본다.
//   3000자를 채우려면 가게별 templated 보일러플레이트가 필요 → 그게 바로 48% Jaccard 지문의 원인이었다.
//   가게별 100% 고유 데이터(description/liquorInfo/roomInfo/features)만으로 본문을 짜니 1850~2800자.
//   고유성(<10% Jaccard) > 패딩 분량. SSR 본문은 크롤러 프록시(숨김 div)라 실제 체류는 React 본문이 만든다.
const MIN_CHARS_DETAIL = 1700;
const MIN_CHARS_LISTING = 2000;
const MIN_H2 = 5;
const MAX_PAGES = 200;
const TOP_N_ALERT = 20;       // 미달 상위 20개만 메일

// 자동 면제: legal/admin/auth/내부 페이지 (체류 10분 불필요)
const EXEMPT_PATTERNS = [
  /\/legal\//, /\/admin\//, /\/auth\//, /\/my\//, /\/profile\//, /\/business\//, /\/contact/,
  /\/sitemap/, /\/robots/, /\/llms/, /\/404/, /\/search\?/,
];

function classifyPath(url) {
  const path = url.replace('https://nolcool.com', '');
  // venue 상세: /clubs/<region>/<slug>
  if (/^\/(clubs|nights|lounges|rooms|yojeong|hoppa)\/[^/]+\/[^/]+\/?$/.test(path)) return 'detail';
  // magazine article
  if (/^\/magazine\/[^/]+\/?$/.test(path)) return 'detail';
  // 그 외(listing/index/aggregation/landing)
  return 'listing';
}

function minCharsFor(url) {
  return classifyPath(url) === 'detail' ? MIN_CHARS_DETAIL : MIN_CHARS_LISTING;
}

function fetchText(url) {
  const _once = () => new Promise(res => {
    const t = setTimeout(() => res(''), 20000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolDwellAudit/1.0' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res(Buffer.concat(chunks).toString('utf8')); });
    }).on('error', () => { clearTimeout(t); res(''); });
  });
  // 시즌176-2 — transient 빈 응답 1회 재시도 (5xx/timeout false-positive 차단)
  return _once().then(r => r ? r : new Promise(rs => setTimeout(() => _once().then(rs), 5000)));
}

async function main() {
  const sm = await fetchText(SITEMAP);
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
    .filter(u => !u.endsWith('.xml') && !u.endsWith('.txt') && !u.endsWith('.png') && !u.endsWith('.jpg'))
    .filter(u => !EXEMPT_PATTERNS.some(re => re.test(u)));
  const pick = urls.slice(0, MAX_PAGES);
  console.log(`sitemap ${urls.length}개 → ${pick.length}개 검사 (면제 제외)`);

  const results = [];
  let scanned = 0;
  for (const url of pick) {
    const html = await fetchText(url);
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const chars = text.length;
    const h2Count = (html.match(/<h2/gi) || []).length;
    const kind = classifyPath(url);
    const minChars = minCharsFor(url);
    results.push({ url, chars, h2: h2Count, kind, minChars });
    scanned++;
    if (scanned % 30 === 0) console.log(`  scan ${scanned}/${pick.length}`);
  }

  const under = results.filter(r => r.chars < r.minChars).sort((a, b) => a.chars - b.chars);
  const lowH2 = results.filter(r => r.h2 < MIN_H2).sort((a, b) => a.h2 - b.h2);

  const issues = [];
  if (under.length > 0) issues.push({ type: `본문 미달 (detail<${MIN_CHARS_DETAIL}/listing<${MIN_CHARS_LISTING})`, count: under.length });
  if (lowH2.length > 0) issues.push({ type: 'H2 5개 미만', count: lowH2.length });

  console.log('\n=== 체류 10분 콘텐츠 감사 (시즌159 page-type별) ===');
  console.log('  검사 URL:', results.length);
  console.log('  본문 미달:', under.length, `개 (detail<${MIN_CHARS_DETAIL} / listing<${MIN_CHARS_LISTING})`);
  console.log('  H2 5개 미만:', lowH2.length, '개');
  console.log('  회귀:', issues.length, '건');

  if (issues.length > 0) {
    await sendMail({ issues, under, lowH2, total: results.length });
    process.exit(1);
  }
  console.log('✅ 모든 페이지 체류 10분 분량 통과 — 메일 발송 안 함');
}

async function sendMail({ issues, under, lowH2, total }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const underRows = under.slice(0, 20).map(r =>
    `<tr><td style="border:1px solid #E5E7EB;padding:4px"><a href="${r.url}">${esc(r.url.replace('https://nolcool.com', ''))}</a></td><td style="border:1px solid #E5E7EB;padding:4px;color:#DC2626">${r.chars}자 / 기준 ${r.minChars}</td><td style="border:1px solid #E5E7EB;padding:4px">${r.kind}</td><td style="border:1px solid #E5E7EB;padding:4px">${r.h2}</td></tr>`,
  ).join('');
  const lowH2Rows = lowH2.slice(0, 20).map(r =>
    `<tr><td style="border:1px solid #E5E7EB;padding:4px"><a href="${r.url}">${esc(r.url.replace('https://nolcool.com', ''))}</a></td><td style="border:1px solid #E5E7EB;padding:4px;color:#DC2626">${r.h2}</td></tr>`,
  ).join('');
  const html = `<div style="font-family:sans-serif;max-width:780px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[⚠ 체류 10분 콘텐츠 회귀]</h2>
    <p style="color:#666;font-size:13px">측정: ${kst} · 총 ${total} URL · 본문 미달(detail<${MIN_CHARS_DETAIL}/listing<${MIN_CHARS_LISTING}) ${under.length}개 · H2 5↓ ${lowH2.length}개</p>
    <h3>본문 미달 (보강 큐 상위 ${Math.min(20, under.length)}개)</h3>
    <table style="border-collapse:collapse;width:100%;font-size:12px">
      <tr><th style="border:1px solid #E5E7EB;padding:4px">URL</th><th style="border:1px solid #E5E7EB;padding:4px">글자수/기준</th><th style="border:1px solid #E5E7EB;padding:4px">타입</th><th style="border:1px solid #E5E7EB;padding:4px">H2</th></tr>${underRows}
    </table>
    <h3>H2 5개 미만 (보강 큐 상위 ${Math.min(20, lowH2.length)}개)</h3>
    <table style="border-collapse:collapse;width:100%;font-size:12px">
      <tr><th style="border:1px solid #E5E7EB;padding:4px">URL</th><th style="border:1px solid #E5E7EB;padding:4px">H2</th></tr>${lowH2Rows}
    </table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 07:40 — dwell-content-audit.mjs (실패시만, 면제: legal/admin/auth/my)</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] 체류10분 콘텐츠 회귀 (본문↓${under.length} / H2↓${lowH2.length})`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
