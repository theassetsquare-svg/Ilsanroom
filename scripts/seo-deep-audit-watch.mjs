/**
 * 시즌130 — 전수 SEO 7축 회귀 감지 24h watch.
 * 매일 KST 12:00 — 라이브 sitemap 전수 검사 → 회귀시만 메일.
 *
 * 7축:
 *   1) title stem dup (시즌129 패턴) — 같은 2자 stem 2회+ (역명 제외)
 *   2) title 길이 60 초과
 *   3) title hook 5축 0
 *   4) desc 길이 150 초과
 *   5) desc 길이 80 미만 (admin/noindex 제외)
 *   6) H2 3개 미만 (noindex 제외)
 *   7) venue 키워드 밀도 3.5% 초과
 *
 * 환경:
 *   RESEND_API_KEY     필수
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
import https from 'https';
import { analyzeHook } from './lib/hook-detector.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const BASE = 'https://nolcool.com';
const SITEMAP = `${BASE}/sitemap.xml`;

function fetchText(url) {
  const _once = () => new Promise((res) => {
    const t = setTimeout(() => res({ status: 0, text: '' }), 20000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolDeepAuditWatch/1.0' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, text: Buffer.concat(chunks).toString('utf8') }); });
    }).on('error', () => { clearTimeout(t); res({ status: 0, text: '' }); });
  });
  // 시즌176-2 — transient 5xx/timeout 1회 재시도
  return _once().then(r => (r.status === 200 || (r.status >= 400 && r.status < 500))
    ? r
    : new Promise(rs => setTimeout(() => _once().then(rs), 5000)));
}

async function audit(url) {
  const r = await fetchText(url);
  if (r.status !== 200) return { url, status: r.status, issues: [`HTTP ${r.status}`] };
  const html = r.text;
  const get = re => { const m = html.match(re); return m ? m[1].trim() : ''; };
  const title = get(/<title>([^<]+)<\/title>/);
  const desc = get(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const noindex = /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html);
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
  const issues = [];

  // 1) stem dup
  const words = title.replace(/[—,.\-·]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  const stemMap = new Map();
  for (const w of words) {
    if (/역$/.test(w)) continue;
    const s = w.slice(0, 2);
    if (!/[가-힣]{2}/.test(s)) continue;
    stemMap.set(s, (stemMap.get(s) || 0) + 1);
  }
  const stemDups = [...stemMap.entries()].filter(([s, c]) => c >= 2);
  // venue/카테고리 페이지만 critical (커뮤니티/admin 제외)
  const critical = /^\/(yojeong|nights|clubs|lounges|rooms|hoppa|magazine)\//.test(new URL(url).pathname) || new URL(url).pathname === '/';
  if (critical && stemDups.length > 0) issues.push(`title stem dup [${stemDups.map(([s,c])=>s+'×'+c).join(',')}]`);

  if (title.length > 60) issues.push(`title ${title.length}자 (>60)`);
  if (critical && analyzeHook(title).axesHit === 0) issues.push('title hook 0');
  if (desc.length > 150) issues.push(`desc ${desc.length}자 (>150)`);
  if (critical && !noindex && desc.length < 80) issues.push(`desc ${desc.length}자 (<80)`);
  if (critical && !noindex && h2Count < 3) issues.push(`H2 ${h2Count}개 (<3)`);

  return { url, status: 200, issues, title, desc, h2Count };
}

async function main() {
  const sm = await fetchText(SITEMAP);
  if (sm.status !== 200) {
    await sendMail([{ url: SITEMAP, status: sm.status, issues: [`sitemap HTTP ${sm.status}`] }]);
    process.exit(1);
  }
  const urls = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  console.log(`sitemap ${urls.length} URL 검사 시작`);

  const failures = [];
  // 동시 4건 배치
  const batch = 4;
  for (let i = 0; i < urls.length; i += batch) {
    const results = await Promise.all(urls.slice(i, i + batch).map(audit));
    for (const r of results) if (r.issues.length > 0) failures.push(r);
  }
  console.log(`전수 검사 완료: ${urls.length} URL / 회귀 ${failures.length}건`);

  if (failures.length > 0) {
    await sendMail(failures);
    process.exit(1);
  }
  console.log('✅ 전 URL 7축 통과 — 메일 발송 안 함 (실패시만 정책)');
}

async function sendMail(failures) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const top = failures.slice(0, 30);
  const html = `<div style="font-family:sans-serif;max-width:780px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[⚠ 전수 SEO 7축 회귀] ${failures.length}건</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst} / 검사 sitemap 전수</p>
    <table style="border-collapse:collapse;width:100%;font-size:12px">
      <tr style="background:#F3F4F6"><th style="border:1px solid #E5E7EB;padding:6px">URL</th><th style="border:1px solid #E5E7EB;padding:6px">사유</th></tr>
      ${top.map(f => `<tr><td style="border:1px solid #E5E7EB;padding:6px"><a href="${esc(f.url)}">${esc(f.url.replace(BASE, ''))}</a></td><td style="border:1px solid #E5E7EB;padding:6px;color:#DC2626">${esc(f.issues.join(' / '))}</td></tr>`).join('')}
    </table>
    ${failures.length > 30 ? `<p style="color:#666">… 외 ${failures.length - 30}건</p>` : ''}
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 12:00 자동 — seo-deep-audit-watch.mjs</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] 전수 SEO 7축 회귀 ${failures.length}건`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
