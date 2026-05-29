/**
 * 시즌61 — 전 페이지 title 중복단어/홈외 놀쿨/venue nameFirst 24h watch.
 * 매일 KST 07:15 — sitemap.xml 전수 fetch → <title> 룰 검증 → 위반 시만 이메일.
 *
 * 환경:
 *   RESEND_API_KEY     필수 (없으면 측정만 하고 메일 skip)
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 *   ORIGIN             기본 https://nolcool.com
 *   CONCURRENCY        기본 10
 */
import https from 'https';
import { readFileSync } from 'node:fs';

const ORIGIN = process.env.ORIGIN || 'https://nolcool.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const CONCURRENCY = Number(process.env.CONCURRENCY || 10);

function fetchText(url) {
  // 시즌176-2 — transient 5xx/timeout 1회 재시도 후 reject (external 시그니처 보존)
  const _once = () => new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout ' + url)), 20000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolTitleDupWatch/1.0' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, text: Buffer.concat(chunks).toString('utf8') }); });
    }).on('error', e => { clearTimeout(t); rej(e); });
  });
  return _once().then(
    r => (r.status === 200 || (r.status >= 400 && r.status < 500))
      ? r
      : new Promise((rs, rj) => setTimeout(() => _once().then(rs, rj), 5000)),
    () => new Promise((rs, rj) => setTimeout(() => _once().then(rs, rj), 5000))
  );
}

/* venues.ts 파싱 — slug → { nameKo, category } */
function parseVenues() {
  const src = readFileSync('src/data/venues.ts', 'utf8');
  const map = new Map();
  const re = /\{\s*id:[^}]+?slug:\s*['"]([^'"]+)['"][^]*?nameKo:\s*['"]([^'"]+)['"][^]*?category:\s*['"]([^'"]+)['"][^]*?regionKo:\s*['"]([^'"]+)['"][^]*?\}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    map.set(m[1], { nameKo: m[2], category: m[3], regionKo: m[4] });
  }
  return map;
}

/* sitemap.xml에서 모든 <loc> 추출 */
async function loadSitemap() {
  const r = await fetchText(`${ORIGIN}/sitemap.xml`);
  if (r.status !== 200) throw new Error('sitemap status ' + r.status);
  return [...r.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

/* title 토큰화 — 한글/영문 2자 이상 단어만 (구분자: 공백, dash, 콜론 등) */
function tokenize(title) {
  return title
    .replace(/[—–\-·:|/()\[\]"',.!?]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2);
}

function findDupWords(tokens) {
  const seen = new Map();
  const dup = new Set();
  for (const t of tokens) {
    if (seen.has(t)) dup.add(t);
    else seen.set(t, true);
  }
  return [...dup];
}

const VENUE_CATS = ['clubs', 'nights', 'rooms', 'yojeong', 'lounges', 'hoppa'];

function checkUrl(url, html, venueMap) {
  const tm = html.match(/<title>([^<]+)<\/title>/);
  if (!tm) return { url, errors: ['title 태그 없음'] };
  const title = tm[1].trim();
  const errors = [];
  const path = new URL(url).pathname;
  const isHome = path === '/' || path === '';

  /* 룰1: 홈 외 "놀쿨" 박힘 */
  if (!isHome && /놀쿨/.test(title)) errors.push(`"놀쿨" 박힘 (홈 외 금지)`);

  /* 룰2: 토큰 중복 */
  const tokens = tokenize(title);
  const dup = findDupWords(tokens);
  if (dup.length > 0) errors.push(`중복단어: ${dup.join(', ')}`);

  /* 룰3: title 길이 */
  if (title.length > 60) errors.push(`title ${title.length}자 (60 초과)`);
  if (title.length === 0) errors.push('title 빈 값');

  /* 룰4: venue 페이지면 nameKo 맨앞 (idx 0~3) */
  const segs = path.split('/').filter(Boolean);
  if (segs.length >= 3 && VENUE_CATS.includes(segs[0])) {
    const slug = segs[segs.length - 1];
    const v = venueMap.get(slug);
    if (v) {
      const idx = title.indexOf(v.nameKo);
      if (idx < 0 || idx > 3) errors.push(`nameKo "${v.nameKo}" idx=${idx} (≤3 필요)`);
    }
  }

  return { url, title, errors };
}

async function runWithConcurrency(items, fn, concurrency) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      try {
        out[idx] = await fn(items[idx]);
      } catch (e) {
        out[idx] = { url: items[idx], errors: [`fetch 실패: ${e.message}`] };
      }
    }
  });
  await Promise.all(workers);
  return out;
}

async function sendMail(violations, total) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  if (violations.length === 0) { console.log('✅ 정상 — 메일 skip (noise 0)'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const rows = violations.slice(0, 100).map(v => `
    <tr>
      <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;vertical-align:top"><a href="${esc(v.url)}">${esc(v.url.replace(ORIGIN, ''))}</a></td>
      <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;vertical-align:top">${esc(v.title || '(없음)')}</td>
      <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;vertical-align:top;color:#DC2626">${esc(v.errors.join(' / '))}</td>
    </tr>`).join('');
  const html = `<div style="font-family:sans-serif;max-width:980px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">⚠ 놀쿨 title 회귀 — ${violations.length}/${total} 위반</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst} / 기준: 홈외 "놀쿨" 없음 + 중복단어 없음 + ≤60자 + venue=nameKo 맨앞</p>
    <table style="border-collapse:collapse;width:100%;margin-top:12px">
      <thead><tr style="background:#F3F4F6"><th style="border:1px solid #E5E7EB;padding:6px;text-align:left">path</th><th style="border:1px solid #E5E7EB;padding:6px;text-align:left">title</th><th style="border:1px solid #E5E7EB;padding:6px;text-align:left">위반</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 07:15 자동 — title-dup-live-watch.mjs</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] title 회귀 ${violations.length}건 / ${total} 페이지`,
      html,
    }),
  });
  console.log(`이메일 HTTP ${r.status}`);
}

async function main() {
  console.log(`🔍 title-dup-live-watch — origin ${ORIGIN}`);
  const venueMap = parseVenues();
  console.log(`📂 venues.ts 파싱: ${venueMap.size}개`);
  const urls = await loadSitemap();
  console.log(`🗺️  sitemap URL: ${urls.length}개`);

  /* 1회 재시도 — transient timeout 대비 */
  const fetchWithRetry = async url => {
    try { return await fetchText(url); }
    catch (e) {
      await new Promise(r => setTimeout(r, 800));
      return await fetchText(url);
    }
  };

  const results = await runWithConcurrency(urls, async url => {
    const r = await fetchWithRetry(url);
    if (r.status !== 200) return { url, errors: [`HTTP ${r.status}`] };
    return checkUrl(url, r.text, venueMap);
  }, CONCURRENCY);

  const violations = results.filter(r => r.errors && r.errors.length > 0);
  console.log(`\n📊 결과: ${urls.length} 페이지 / 위반 ${violations.length}건`);
  for (const v of violations.slice(0, 20)) {
    console.log(`  ✗ ${v.url}`);
    console.log(`     title: ${v.title || '(없음)'}`);
    console.log(`     - ${v.errors.join(' / ')}`);
  }

  await sendMail(violations, urls.length);
  process.exit(violations.length > 0 ? 1 : 0);
}

main().catch(e => { console.error('💥', e); process.exit(2); });
