/**
 * 전 페이지 5축 종합 품질 watch (시즌173).
 *
 * 매일 KST 06:25 — sitemap 전수 × 5축 정적 검증.
 *
 * 검사 룰:
 *   Axis 1) Anchor href HTTP 200 — 내부 링크 깨짐 0건 (404/410 즉시 fail)
 *   Axis 2) <img> alt 속성 — alt 누락 0건 (a11y + SEO)
 *   Axis 3) <h1> 정확히 1개 — SEO 구조 무결성
 *   Axis 4) <html lang> + <meta viewport> 존재 — a11y + 모바일 기본
 *   Axis 5) <link rel="canonical"> + og:url 일관성 — 중복 색인 방지
 *
 * 환경: RESEND_API_KEY 필수
 */
import https from 'https';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

const UA = 'Mozilla/5.0 (compatible; nolcool-quality-watch/1.0; +https://nolcool.com)';

function fetchOnce(url, method = 'GET') {
  return new Promise((res) => {
    const t = setTimeout(() => res({ status: 0, html: '' }), 20000);
    const opts = { method, headers: { 'User-Agent': UA } };
    https.get(url, opts, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, html: Buffer.concat(chunks).toString('utf8') }); });
    }).on('error', () => { clearTimeout(t); res({ status: 0, html: '' }); });
  });
}

function fetchHtml(url) {
  return fetchOnce(url).then(r => (r.status === 200 || (r.status >= 400 && r.status < 500))
    ? r
    : new Promise(rs => setTimeout(() => fetchOnce(url).then(rs), 5000)));
}

function fetchStatus(url) {
  // HEAD first, fallback to GET (Cloudflare sometimes 405 HEAD)
  return new Promise((res) => {
    const t = setTimeout(() => res(0), 12000);
    https.get(url, { method: 'HEAD', headers: { 'User-Agent': UA } }, r => {
      clearTimeout(t); res(r.statusCode);
    }).on('error', () => { clearTimeout(t); res(0); });
  }).then(s => {
    if (s === 0 || s === 405 || s === 403) {
      // retry as GET
      return fetchOnce(url).then(r => r.status);
    }
    return s;
  });
}

function audit(html, pageUrl) {
  const issues = [];

  // Axis 2: img alt 누락
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  let missingAlt = 0;
  for (const img of imgs) {
    if (!/\salt\s*=/.test(img)) missingAlt++;
  }
  if (missingAlt > 0) issues.push(`img alt 누락 ${missingAlt}건`);

  // Axis 3: H1 정확히 1개
  const h1s = html.match(/<h1\b[^>]*>/gi) || [];
  if (h1s.length !== 1) issues.push(`H1 ${h1s.length}개`);

  // Axis 4: lang + viewport
  if (!/<html\b[^>]*\blang\s*=/i.test(html)) issues.push('html lang 누락');
  if (!/<meta\s+name=["']viewport["']/i.test(html)) issues.push('viewport meta 누락');

  // Axis 5: canonical + og:url 일관성
  const canonical = (html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) || [])[1];
  const ogUrl = (html.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i) || [])[1];
  if (!canonical) issues.push('canonical 누락');
  if (canonical && ogUrl && canonical !== ogUrl) issues.push(`canonical≠og:url`);

  return issues;
}

function extractInternalAnchors(html, baseUrl) {
  const out = new Set();
  const re = /<a\b[^>]*\shref=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    let href = m[1];
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    // absolute external
    if (/^https?:\/\//i.test(href)) {
      if (!href.startsWith(baseUrl)) continue;
      href = href.slice(baseUrl.length);
    }
    if (!href.startsWith('/')) continue;
    // strip query/hash for status check
    href = href.split('#')[0].split('?')[0];
    if (href.length === 0) continue;
    out.add(href);
  }
  return [...out];
}

async function main() {
  const BASE = 'https://nolcool.com';
  const sm = await fetch(`${BASE}/sitemap.xml`);
  const xml = await sm.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(BASE, ''));
  console.log('대상 URL:', urls.length);

  const allAnchors = new Set();
  const pageIssues = [];

  // pass 1 — 페이지별 axis 2~5 검사 + anchor 수집
  for (let i = 0; i < urls.length; i += 6) {
    const batch = urls.slice(i, i + 6);
    const br = await Promise.all(batch.map(async (path) => {
      const r = await fetchHtml(BASE + path);
      if (r.status !== 200) return { path, reasons: [`HTTP ${r.status}`] };
      const reasons = audit(r.html, BASE + path);
      const anchors = extractInternalAnchors(r.html, BASE);
      anchors.forEach(a => allAnchors.add(a));
      return { path, reasons };
    }));
    pageIssues.push(...br.filter(x => x.reasons.length));
    process.stdout.write(`pass1: ${Math.min(i + 6, urls.length)}/${urls.length}\r`);
  }
  console.log(`\npass1 완료. 페이지 회귀: ${pageIssues.length}건. 수집 anchor: ${allAnchors.size}개`);

  // pass 2 — anchor href HTTP 200 검증 (Axis 1)
  const anchorList = [...allAnchors];
  const brokenAnchors = [];
  for (let i = 0; i < anchorList.length; i += 10) {
    const batch = anchorList.slice(i, i + 10);
    const br = await Promise.all(batch.map(async (href) => {
      const s = await fetchStatus(BASE + href);
      return { href, status: s };
    }));
    for (const x of br) {
      // 200, 301, 302, 308 OK / 4xx 5xx fail
      if (!(x.status === 200 || x.status === 301 || x.status === 302 || x.status === 308)) {
        brokenAnchors.push(x);
      }
    }
    process.stdout.write(`pass2: ${Math.min(i + 10, anchorList.length)}/${anchorList.length}\r`);
  }
  console.log(`\npass2 완료. 깨진 anchor: ${brokenAnchors.length}건`);

  const totalIssues = pageIssues.length + brokenAnchors.length;
  const pageOk = urls.length - pageIssues.length;
  console.log(`\n✓ 페이지 통과: ${pageOk}/${urls.length} (${(pageOk / urls.length * 100).toFixed(1)}%)`);
  console.log(`✓ anchor 통과: ${anchorList.length - brokenAnchors.length}/${anchorList.length}`);

  if (pageIssues.length) {
    console.log('\n페이지 회귀 (상위 20):');
    pageIssues.slice(0, 20).forEach(i => console.log('  ', i.path, '→', i.reasons.join(' / ')));
  }
  if (brokenAnchors.length) {
    console.log('\n깨진 anchor (상위 20):');
    brokenAnchors.slice(0, 20).forEach(b => console.log('  ', b.href, '→ HTTP', b.status));
  }

  await sendMail({ totalUrls: urls.length, pageOk, pageIssues, anchorTotal: anchorList.length, brokenAnchors });

  if (totalIssues > 0) process.exit(1);
}

async function sendMail({ totalUrls, pageOk, pageIssues, anchorTotal, brokenAnchors }) {
  const totalIssues = pageIssues.length + brokenAnchors.length;
  if (totalIssues === 0) { console.log(`✅ 전수 통과 — 메일 발송 안 함`); return; }
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const pageRows = pageIssues.slice(0, 60).map(r => `<tr>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px"><a href="https://nolcool.com${esc(r.path)}">${esc(r.path)}</a></td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;color:#DC2626">${esc(r.reasons.join(' / '))}</td>
  </tr>`).join('');
  const anchorRows = brokenAnchors.slice(0, 60).map(b => `<tr>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">${esc(b.href)}</td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;color:#DC2626">HTTP ${esc(b.status)}</td>
  </tr>`).join('');
  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[⚠ 5축 품질 회귀] 페이지 ${pageOk}/${totalUrls} · anchor 깨짐 ${brokenAnchors.length}/${anchorTotal}</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    ${pageIssues.length ? `<h3>페이지 회귀 ${pageIssues.length}건${pageIssues.length > 60 ? ' (상위 60)' : ''}</h3>
    <table style="border-collapse:collapse;width:100%"><thead><tr style="background:#F3F4F6"><th style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:left">URL</th><th style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:left">사유</th></tr></thead><tbody>${pageRows}</tbody></table>` : ''}
    ${brokenAnchors.length ? `<h3>깨진 내부 링크 ${brokenAnchors.length}건${brokenAnchors.length > 60 ? ' (상위 60)' : ''}</h3>
    <table style="border-collapse:collapse;width:100%"><thead><tr style="background:#F3F4F6"><th style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:left">href</th><th style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:left">상태</th></tr></thead><tbody>${anchorRows}</tbody></table>` : ''}
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 06:25 자동 — all-pages-quality-watch.mjs (5축: anchor 200/img alt/H1/lang+viewport/canonical)</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] 5축 품질 회귀 페이지 ${pageIssues.length} · anchor ${brokenAnchors.length}건`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
