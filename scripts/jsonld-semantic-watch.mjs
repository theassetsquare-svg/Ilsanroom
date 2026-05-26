/**
 * JSON-LD Schema 의미 유효성 24h watch (시즌174).
 *
 * 매일 KST 06:30 — 라이브 sitemap 전수 × Schema.org 의미 규칙 검사.
 *
 * 검사 룰 (Google Rich Results 회귀 방지):
 *   - BreadcrumbList: itemListElement ≥1 / position 1..n 연속 / name+item 존재
 *   - NightClub/BarOrPub/Restaurant/EntertainmentBusiness: name+address 필수, address.streetAddress 또는 addressLocality
 *   - FAQPage: mainEntity ≥1 / q.name + q.acceptedAnswer.text 필수
 *   - Article: headline+author+datePublished
 *   - WebPage/CollectionPage: @id == url (일관성)
 *   - ItemList: itemListElement ≥1
 *
 * 환경: RESEND_API_KEY 필수
 */
import https from 'https';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const BASE = 'https://nolcool.com';

const UA = 'Mozilla/5.0 (compatible; nolcool-jsonld-watch/1.0; +https://nolcool.com)';

function fetchOnce(url) {
  return new Promise((res) => {
    const t = setTimeout(() => res({ status: 0, html: '' }), 20000);
    https.get(url, { headers: { 'User-Agent': UA } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, html: Buffer.concat(chunks).toString('utf8') }); });
    }).on('error', () => { clearTimeout(t); res({ status: 0, html: '' }); });
  });
}

function fetchHtml(url) {
  return fetchOnce(url).then(r => r.status === 200 ? r : new Promise(rs => setTimeout(() => fetchOnce(url).then(rs), 5000)));
}

function flatten(obj) {
  const arr = Array.isArray(obj) ? obj : [obj];
  return arr.filter(x => x && typeof x === 'object');
}

function validateLd(ld) {
  const errors = [];
  const t = Array.isArray(ld['@type']) ? ld['@type'][0] : ld['@type'];

  if (t === 'BreadcrumbList') {
    const items = ld.itemListElement || [];
    if (!Array.isArray(items) || items.length === 0) errors.push('BreadcrumbList.itemListElement empty');
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.position) errors.push(`Breadcrumb[${i}].position missing`);
      if (it.position && it.position !== i + 1) errors.push(`Breadcrumb[${i}].position=${it.position} (expected ${i+1})`);
      if (!it.name) errors.push(`Breadcrumb[${i}].name missing`);
      if (!it.item) errors.push(`Breadcrumb[${i}].item missing`);
    }
  }
  if (['NightClub', 'BarOrPub', 'Restaurant', 'EntertainmentBusiness'].includes(t)) {
    if (!ld.name) errors.push(`${t}.name missing`);
    if (!ld.address) errors.push(`${t}.address missing`);
    if (ld.address && typeof ld.address === 'object' && !ld.address.streetAddress && !ld.address.addressLocality) {
      errors.push(`${t}.address has no streetAddress/addressLocality`);
    }
  }
  if (t === 'FAQPage') {
    const me = ld.mainEntity || [];
    if (!Array.isArray(me) || me.length === 0) errors.push('FAQPage.mainEntity empty');
    for (let i = 0; i < me.length; i++) {
      const q = me[i];
      if (!q.name) errors.push(`FAQPage.q[${i}].name missing`);
      if (!q.acceptedAnswer || !q.acceptedAnswer.text) errors.push(`FAQPage.q[${i}].acceptedAnswer.text missing`);
    }
  }
  if (t === 'Article') {
    if (!ld.headline) errors.push('Article.headline missing');
    if (!ld.author) errors.push('Article.author missing');
    if (!ld.datePublished) errors.push('Article.datePublished missing');
  }
  if (t === 'WebPage' || t === 'CollectionPage') {
    if (ld['@id'] && ld.url && ld['@id'] !== ld.url) errors.push(`${t}.@id≠url`);
  }
  if (t === 'ItemList') {
    if (!ld.itemListElement || !Array.isArray(ld.itemListElement) || ld.itemListElement.length === 0) {
      errors.push('ItemList.itemListElement empty');
    }
  }
  return errors;
}

async function main() {
  const sm = await fetch(`${BASE}/sitemap.xml`);
  const xml = await sm.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(BASE, ''));
  console.log('대상 URL:', urls.length);

  const issues = [];
  for (let i = 0; i < urls.length; i += 6) {
    const batch = urls.slice(i, i + 6);
    const br = await Promise.all(batch.map(async (path) => {
      const r = await fetchHtml(BASE + path);
      if (r.status !== 200) return { path, reasons: [`HTTP ${r.status}`] };
      const errs = [];
      const ldRe = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let m;
      while ((m = ldRe.exec(r.html))) {
        try {
          const obj = JSON.parse(m[1]);
          for (const ld of flatten(obj)) {
            errs.push(...validateLd(ld));
          }
        } catch (e) {
          errs.push(`JSON parse ${e.message.slice(0, 60)}`);
        }
      }
      return { path, reasons: errs };
    }));
    issues.push(...br.filter(x => x.reasons.length));
    process.stdout.write(`${Math.min(i + 6, urls.length)}/${urls.length}\r`);
  }

  const pass = urls.length - issues.length;
  console.log(`\n✓ 통과: ${pass}/${urls.length} (${(pass / urls.length * 100).toFixed(1)}%)`);
  console.log(`⚠ 회귀: ${issues.length}`);
  if (issues.length) {
    issues.slice(0, 20).forEach(i => console.log('  ', i.path, '→', i.reasons.slice(0, 3).join(' / ')));
  }

  await sendMail({ total: urls.length, pass, issues });
  if (issues.length > 0) process.exit(1);
}

async function sendMail({ total, pass, issues }) {
  if (issues.length === 0) { console.log(`✅ ${pass}/${total} 통과 — 메일 발송 안 함`); return; }
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const rows = issues.slice(0, 80).map(r => `<tr>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px"><a href="https://nolcool.com${esc(r.path)}">${esc(r.path)}</a></td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;color:#DC2626">${esc(r.reasons.slice(0, 5).join(' / '))}</td>
  </tr>`).join('');
  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[⚠ JSON-LD Schema 회귀] ${pass}/${total}</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <p>회귀 ${issues.length}건${issues.length > 80 ? ' (상위 80)' : ''}. Google Rich Results 노출 위협.</p>
    <table style="border-collapse:collapse;width:100%"><thead><tr style="background:#F3F4F6"><th style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:left">URL</th><th style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:left">사유</th></tr></thead><tbody>${rows}</tbody></table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 06:30 자동 — jsonld-semantic-watch.mjs (BreadcrumbList/NightClub/FAQPage/Article/WebPage/ItemList Schema.org 의미 검사)</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] JSON-LD Schema 회귀 ${issues.length}건 — ${pass}/${total}`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
