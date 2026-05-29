/**
 * 놀쿨 title 차별화 24h watch — 시즌78 (화이트리스트 0, 구조 패턴 + n-gram).
 * 매일 KST 07:35 — sitemap 전체 URL의:
 *   1) title 후미 5어절 중복 (≥2 URL 공유시)
 *   2) n-gram (3~5 어절) 사이트 전체 5회 초과 사용
 *   3) 후킹 5축 (숫자/질문/FOMO/구어체) 미달 페이지
 *
 * 환경:
 *  RESEND_API_KEY     필수
 *  NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
import https from 'https';
import { analyzeHook, ngramOverused, HOOK_PATTERNS } from './lib/hook-detector.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const SITEMAP = 'https://nolcool.com/sitemap.xml';
const MAX_PAGES = 200;
const NGRAM_OVER = 5; // n-gram 사이트 전체 5회 초과 알림

function fetchText(url) {
  const _once = () => new Promise(res => {
    const t = setTimeout(() => res(''), 20000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolTitleAudit/1.0' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res(Buffer.concat(chunks).toString('utf8')); });
    }).on('error', () => { clearTimeout(t); res(''); });
  });
  // 시즌176-2 — transient 빈 응답 1회 재시도
  return _once().then(r => r ? r : new Promise(rs => setTimeout(() => _once().then(rs), 5000)));
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

  // 2) n-gram 사이트 전체 5회 초과 (어떤 표현이든)
  const titlesArr = [...titles.values()];
  const urlsArr = [...titles.keys()];
  const overused = ngramOverused(titlesArr, urlsArr, NGRAM_OVER, 3, 5);
  for (const { phrase, count, urls: u } of overused.slice(0, 20)) {
    issues.push({ type: 'n-gram 남용', detail: `"${phrase}" ${count}회 (예: ${u.slice(0, 3).map(x => x.replace('https://nolcool.com', '')).join(', ')})` });
  }

  // 3) 후킹 5축 미달 (어떤 축도 자극 안한 title)
  const noHook = [];
  for (const [url, title] of titles) {
    const { passed, axes } = analyzeHook(title);
    if (!passed) noHook.push({ url, title });
  }
  if (noHook.length > 0) {
    issues.push({ type: '후킹 5축 0', detail: `${noHook.length}개 페이지 (예: ${noHook.slice(0, 5).map(n => n.url.replace('https://nolcool.com', '')).join(', ')})` });
  }

  // 축별 분포 통계
  const axisStat = HOOK_PATTERNS.map(p => ({ axis: p.axis, hits: 0 }));
  for (const t of titlesArr) {
    const { axes } = analyzeHook(t);
    axes.forEach((a, i) => { axisStat[i].hits += a.hits; });
  }

  console.log('\n=== title 차별화 감사 (구조 패턴) ===');
  console.log('  scan URL:', titles.size);
  console.log('  후미 5어절 중복:', dupSuffix.length, '건');
  console.log('  n-gram 남용 (≥6회):', overused.length, '건');
  console.log('  후킹 5축 미달:', noHook.length, '건');
  console.log('  5축 분포:', axisStat.map(a => `${a.axis}:${a.hits}`).join(' / '));
  console.log('  회귀:', issues.length, '건');

  if (issues.length > 0) {
    await sendMail({ issues, overused, noHook, axisStat, scannedCount: titles.size });
    process.exit(1);
  }
  console.log('✅ title 차별화 100% — 메일 발송 안 함');
}

async function sendMail({ issues, overused, noHook, axisStat, scannedCount }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const ngRows = overused.slice(0, 15).map(o =>
    `<tr><td style="border:1px solid #E5E7EB;padding:4px">${esc(o.phrase)}</td><td style="border:1px solid #E5E7EB;padding:4px;color:#DC2626">${o.count}회</td></tr>`,
  ).join('');
  const axisRows = axisStat.map(a =>
    `<tr><td style="border:1px solid #E5E7EB;padding:4px">${esc(a.axis)}</td><td style="border:1px solid #E5E7EB;padding:4px">${a.hits}</td></tr>`,
  ).join('');
  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[⚠ title 차별화 회귀] ${issues.length}건</h2>
    <p style="color:#666;font-size:13px">측정: ${kst} · 검사 ${scannedCount} URL · 시즌78 구조 패턴 (화이트리스트 0)</p>
    <h3>회귀</h3>
    <ul>${issues.map(i => `<li><b>${esc(i.type)}</b> — ${esc(i.detail)}</li>`).join('')}</ul>
    <h3>n-gram 남용 상위 15</h3>
    <table style="border-collapse:collapse;font-size:12px"><tr><th style="border:1px solid #E5E7EB;padding:4px">표현</th><th style="border:1px solid #E5E7EB;padding:4px">사용 횟수</th></tr>${ngRows}</table>
    <h3>후킹 5축 분포</h3>
    <table style="border-collapse:collapse;font-size:12px"><tr><th style="border:1px solid #E5E7EB;padding:4px">축</th><th style="border:1px solid #E5E7EB;padding:4px">매칭</th></tr>${axisRows}</table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 07:35 — title-uniqueness-audit.mjs (구조 패턴, 화이트리스트 0)</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] title 차별화 회귀 ${issues.length}건 (n-gram + 5축)`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
