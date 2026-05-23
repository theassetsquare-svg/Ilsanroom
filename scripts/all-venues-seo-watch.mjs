/**
 * 121업소 통합 24h SEO watch.
 * 매일 KST 07:15 — 라이브 sitemap → venue URL × 9지표 측정 → 회귀 시 이메일.
 *
 * 9지표:
 *   1) HTTP 200
 *   2) title ≤60자
 *   3) title에 가게이름 포함 + "놀쿨" 미포함
 *   4) title 중복단어 없음
 *   5) desc ≤150자 + 가게이름 포함
 *   6) og:image + canonical 존재
 *   7) h1 ≥10자
 *   8) JSON-LD ≥3 + img ≥1
 *   9) 키워드 밀도 ≤3.5% + 후킹 단어 ≥1
 *
 * 환경:
 *   RESEND_API_KEY     필수
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
import https from 'https';
import { readFileSync } from 'fs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const HOOK_WORDS = ['진짜', '솔직히', '직접', '한번', '왜', '이유', '한번쯤', '다녀온', '후기', '꿀팁', '이것만', '단골', '정석', '티어'];

function fetchHtml(url) {
  return new Promise((res) => {
    const t = setTimeout(() => res({ status: 0, html: '' }), 20000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolAllVenuesWatch/1.0' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, html: Buffer.concat(chunks).toString('utf8') }); });
    }).on('error', () => { clearTimeout(t); res({ status: 0, html: '' }); });
  });
}

function audit(html, venueName) {
  const get = re => { const m = html.match(re); return m ? m[1].trim() : null; };
  const title = get(/<title>([^<]+)<\/title>/);
  const desc = get(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const ogImg = get(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  const canonical = get(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [, ''])[1].replace(/<[^>]+>/g, '').trim();
  const ldCount = (html.match(/application\/ld\+json/g) || []).length;
  const imgCount = (html.match(/<img\s/gi) || []).length;
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const kwVisible = venueName ? (text.match(new RegExp(venueName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length : 0;
  const density = venueName && text.length ? (kwVisible * venueName.length) / text.length : 0;
  const hookHit = HOOK_WORDS.filter(w => (title || '').includes(w) || (desc || '').includes(w));
  const titleWords = (title || '').replace(/[—,.\-]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  const dupTitle = titleWords.filter((w, i) => titleWords.indexOf(w) !== i);

  return {
    title, desc, h1, titleLen: (title || '').length, descLen: (desc || '').length, h1Len: h1.length,
    ldCount, imgCount, density, hookCount: hookHit.length,
    kwInTitle: (title || '').includes(venueName),
    kwInDesc: (desc || '').includes(venueName),
    dupTitleCount: dupTitle.length,
    nolcoolInTitle: /놀쿨/.test(title || ''),
    hasOgImg: !!ogImg, hasCanonical: !!canonical,
  };
}

function reasons(r, venueName) {
  const out = [];
  if (r.status !== 200) { out.push(`HTTP ${r.status}`); return out; }
  if (!r.kwInTitle) out.push('title 가게이름X');
  if (r.nolcoolInTitle) out.push('title 놀쿨 박힘');
  if (r.titleLen === 0 || r.titleLen > 60) out.push(`title ${r.titleLen}자`);
  if (r.dupTitleCount > 0) out.push('title 중복단어');
  if (!r.kwInDesc) out.push('desc 가게이름X');
  if (r.descLen === 0 || r.descLen > 150) out.push(`desc ${r.descLen}자`);
  if (!r.hasOgImg) out.push('og:image X');
  if (!r.hasCanonical) out.push('canonical X');
  if (r.h1Len < 10) out.push(`h1 ${r.h1Len}자`);
  if (r.ldCount < 3) out.push(`JSON-LD ${r.ldCount}`);
  if (r.imgCount < 1) out.push('img 0');
  if (r.density > 0.035) out.push(`밀도 ${(r.density * 100).toFixed(2)}%`);
  if (r.hookCount === 0) out.push('후킹 0');
  return out;
}

async function main() {
  if (!RESEND_API_KEY) { console.error('RESEND_API_KEY 없음'); process.exit(1); }

  const vfile = readFileSync('src/data/venues.ts', 'utf8');
  const blocks = [...vfile.matchAll(/slug:\s*'([^']+)'[\s\S]*?nameKo:\s*'([^']+)'/g)];
  const slugToName = {};
  for (const m of blocks) slugToName[m[1]] = m[2];
  console.log('venues.ts:', Object.keys(slugToName).length);

  const sm = await fetch('https://nolcool.com/sitemap.xml');
  const xml = await sm.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(m => m[1].replace('https://nolcool.com', ''))
    .filter(u => /^\/(clubs|nights|rooms|yojeong|lounges|hoppa)\//.test(u) && u.split('/').filter(Boolean).length >= 2);
  const targets = urls.filter(u => {
    const slug = u.split('/').filter(Boolean).pop();
    return slugToName[slug];
  });
  console.log('대상:', targets.length);

  const results = [];
  for (let i = 0; i < targets.length; i += 8) {
    const batch = targets.slice(i, i + 8);
    const br = await Promise.all(batch.map(async (path) => {
      const slug = path.split('/').filter(Boolean).pop();
      const venueName = slugToName[slug];
      const r = await fetchHtml('https://nolcool.com' + path);
      if (r.status !== 200) return { path, slug, venueName, status: r.status };
      const a = audit(r.html, venueName);
      return { path, slug, venueName, status: 200, ...a };
    }));
    results.push(...br);
    process.stdout.write(`${Math.min(i + 8, targets.length)}/${targets.length}\r`);
  }
  console.log('\n진단 완료:', results.length);

  const issues = [];
  for (const r of results) {
    const rs = reasons(r, r.venueName);
    if (rs.length > 0) issues.push({ ...r, reasons: rs });
  }
  const pass = results.length - issues.length;
  console.log(`✓ 만점: ${pass}/${results.length} (${(pass / results.length * 100).toFixed(1)}%)`);
  console.log(`⚠ 회귀: ${issues.length}/${results.length}`);

  await sendMail({ total: results.length, pass, issues });
}

async function sendMail({ total, pass, issues }) {
  // ★ 메일 정책 — 실패시만 발송
  if (issues.length === 0) { console.log(`✅ 전 업소 ${pass}/${total} 통과 — 메일 발송 안 함`); return; }
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const urgent = issues.length > 0;
  const headerColor = urgent ? '#DC2626' : '#16A34A';
  const headerText = urgent ? '⚠ 회귀 감지' : '✅ 전 업소 정상';

  const issueRows = issues.slice(0, 50).map(r => `<tr>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px"><a href="https://nolcool.com${esc(r.path)}">${esc(r.venueName)}</a></td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;color:#DC2626">${esc(r.reasons.join(' / '))}</td>
  </tr>`).join('');

  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
    <h2 style="color:${headerColor}">[${headerText}] 121업소 SEO watch — ${pass}/${total}</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <h3 style="color:#111;margin-top:20px">9지표 회귀 ${issues.length}건${issues.length > 50 ? ' (상위 50)' : ''}</h3>
    ${issues.length ? `<table style="border-collapse:collapse;width:100%"><thead><tr style="background:#F3F4F6"><th style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:left">venue</th><th style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:left">사유</th></tr></thead><tbody>${issueRows}</tbody></table>` : '<p style="color:#16A34A">9지표 100% 통과</p>'}
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 07:15 자동 — all-venues-seo-watch.mjs</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: urgent ? `[놀쿨][⚠] 121업소 SEO 회귀 ${issues.length}건 — ${pass}/${total}` : `[놀쿨][✓] 121업소 SEO 정상 — ${pass}/${total}`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
