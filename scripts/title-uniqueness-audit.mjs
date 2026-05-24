/**
 * 놀쿨 title 차별화 24h watch — 시즌77.
 * 매일 KST 07:35 — sitemap 전체 URL의 title 후미 5어절 + HOOK 단어 분포 검사.
 *
 * 회귀 사유:
 *  1) title 후미 5어절이 다른 페이지와 동일 (≥2 URL 공유)
 *  2) HOOK 14 단어 중 사이트 전체 5회 초과 사용
 *
 * 환경:
 *  RESEND_API_KEY     필수
 *  NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
import https from 'https';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const SITEMAP = 'https://nolcool.com/sitemap.xml';
const HOOK_WORDS = ['진짜', '솔직히', '직접', '한번', '왜', '이유', '한번쯤', '다녀온', '후기', '꿀팁', '이것만', '단골', '정석', '티어'];
const MAX_PAGES = 200;       // 안전 상한
const HOOK_OVER = 5;          // 단어별 5회 초과 알림

function fetchText(url) {
  return new Promise(res => {
    const t = setTimeout(() => res(''), 20000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolTitleAudit/1.0' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res(Buffer.concat(chunks).toString('utf8')); });
    }).on('error', () => { clearTimeout(t); res(''); });
  });
}

function lastNTokens(title, n = 5) {
  const cleaned = title.replace(/.*?[—\-:|]/, '').trim();
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  return tokens.slice(-n).join(' ');
}

async function main() {
  const sm = await fetchText(SITEMAP);
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
    .filter(u => !u.endsWith('.xml') && !u.endsWith('.txt') && !u.endsWith('.png') && !u.endsWith('.jpg'));
  const pick = urls.slice(0, MAX_PAGES);
  console.log(`sitemap ${urls.length}개 → ${pick.length}개 검사`);

  const titles = new Map();
  let scanned = 0;
  for (const url of pick) {
    const html = await fetchText(url);
    const m = html.match(/<title>([^<]+)<\/title>/);
    if (m) titles.set(url, m[1].trim());
    scanned++;
    if (scanned % 30 === 0) console.log(`  scan ${scanned}/${pick.length}`);
  }

  const issues = [];

  // 1) 후미 5어절 중복
  const suffixMap = new Map();
  for (const [url, title] of titles) {
    const sfx = lastNTokens(title, 5);
    if (!sfx || sfx.length < 5) continue;
    if (!suffixMap.has(sfx)) suffixMap.set(sfx, []);
    suffixMap.get(sfx).push({ url, title });
  }
  const dupSuffix = [...suffixMap.entries()].filter(([, arr]) => arr.length >= 2);
  for (const [sfx, arr] of dupSuffix) {
    issues.push({
      type: '후미 5어절 중복',
      detail: `"${sfx}" — ${arr.length}개 페이지: ${arr.map(a => a.url.replace('https://nolcool.com', '')).join(', ')}`,
    });
  }

  // 2) HOOK 단어 분포
  const hookCount = Object.fromEntries(HOOK_WORDS.map(w => [w, 0]));
  for (const title of titles.values()) {
    for (const w of HOOK_WORDS) {
      const c = (title.match(new RegExp(w, 'g')) || []).length;
      hookCount[w] += c;
    }
  }
  for (const [w, c] of Object.entries(hookCount)) {
    if (c > HOOK_OVER) issues.push({ type: 'HOOK 단어 남용', detail: `"${w}" ${c}회 (≥${HOOK_OVER + 1})` });
  }

  console.log('\n=== title 차별화 감사 ===');
  console.log('  scan URL:', titles.size);
  console.log('  후미 5어절 중복:', dupSuffix.length, '건');
  console.log('  HOOK 분포:', JSON.stringify(hookCount));
  console.log('  회귀:', issues.length, '건');

  if (issues.length > 0) {
    await sendMail({ issues, hookCount, scannedCount: titles.size });
    process.exit(1);
  }
  console.log('✅ title 차별화 100% — 메일 발송 안 함');
}

async function sendMail({ issues, hookCount, scannedCount }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const hookRows = Object.entries(hookCount).sort((a, b) => b[1] - a[1])
    .map(([w, c]) => `<tr><td style="border:1px solid #E5E7EB;padding:4px">${w}</td><td style="border:1px solid #E5E7EB;padding:4px;color:${c > 5 ? '#DC2626' : '#111'}">${c}</td></tr>`).join('');
  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[⚠ title 차별화 회귀] ${issues.length}건</h2>
    <p style="color:#666;font-size:13px">측정: ${kst} · 검사 ${scannedCount} URL</p>
    <h3>회귀</h3>
    <ul>${issues.map(i => `<li><b>${esc(i.type)}</b> — ${esc(i.detail)}</li>`).join('')}</ul>
    <h3>HOOK 단어 분포</h3>
    <table style="border-collapse:collapse;font-size:12px"><tr><th style="border:1px solid #E5E7EB;padding:4px">단어</th><th style="border:1px solid #E5E7EB;padding:4px">사용 횟수</th></tr>${hookRows}</table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 07:35 — title-uniqueness-audit.mjs (실패시만)</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] title 차별화 회귀 ${issues.length}건`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
