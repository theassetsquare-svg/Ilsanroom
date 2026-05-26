/**
 * 전 페이지 × PC+Mobile 키워드 스터핑 24h watch (시즌172).
 *
 * 매일 KST 06:20 — 라이브 sitemap 전수(약 543 URL) × PC+Mobile UA 2회 측정.
 *   - PC UA      : Chrome 124 데스크탑
 *   - Mobile UA  : Chrome 124 안드로이드 (Pixel 7)
 *
 * 검사 룰:
 *   1) HTTP 200 (PC+Mobile 동일 응답)
 *   2) 최빈 단어 밀도 ≤ 3.5% (스터핑 한계)
 *   3) 최빈 단어 밀도 권고 1.0~2.5% (1.5% 미만은 warn, ≤3.5%면 fail 아님)
 *   4) title ≤60자 + 중복단어 없음
 *   5) desc ≤150자
 *   6) 본문 텍스트 ≥ 800자 (정책/util 페이지는 예외 적용)
 *   7) PC와 Mobile body length 차이 < 20% (모바일 콘텐츠 누락 방지)
 *
 * 환경: RESEND_API_KEY 필수
 */
import https from 'https';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

const UA_PC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const UA_MOBILE = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

// 정책/유틸 페이지 — 본문 분량 검사 면제 (시즌52 trust-rules 우선)
const SHORT_OK = /^\/(legal|privacy|terms|about|contact|sitemap|llms|robots|404|admin|auth|my\/|search|roulette|tonight|weekend|budget|occasion|share|recent|favorites|stats|customize|onboarding)/;

function fetchHtml(url, ua) {
  const _once = () => new Promise((res) => {
    const t = setTimeout(() => res({ status: 0, html: '' }), 20000);
    https.get(url, { headers: { 'User-Agent': ua } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, html: Buffer.concat(chunks).toString('utf8') }); });
    }).on('error', () => { clearTimeout(t); res({ status: 0, html: '' }); });
  });
  return _once().then(r => (r.status === 200 || (r.status >= 400 && r.status < 500))
    ? r
    : new Promise(rs => setTimeout(() => _once().then(rs), 5000)));
}

function audit(html) {
  const get = re => { const m = html.match(re); return m ? m[1].trim() : ''; };
  const title = get(/<title>([^<]+)<\/title>/);
  const desc = get(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  // 단어 빈도 — 2자 이상 한국어/영문 단어
  const tokens = text.match(/[가-힣A-Za-z][가-힣A-Za-z0-9]{1,}/g) || [];
  const freq = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  const topEntry = Object.entries(freq).sort((a, b) => b[1] - a[1])[0] || ['', 0];
  const [topWord, topCount] = topEntry;
  const density = text.length ? (topCount * topWord.length) / text.length : 0;
  // title 중복단어
  const titleWords = title.replace(/[—,.\-·]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  const dupTitle = titleWords.filter((w, i) => titleWords.indexOf(w) !== i);
  return { title, desc, textLen: text.length, topWord, topCount, density, dupTitle };
}

function reasons(pc, mb, path) {
  const out = [];
  if (pc.status !== 200) out.push(`PC HTTP ${pc.status}`);
  if (mb.status !== 200) out.push(`Mobile HTTP ${mb.status}`);
  if (pc.status !== 200 || mb.status !== 200) return out;
  // PC 기준 검사
  if (pc.a.density > 0.035) out.push(`PC 스터핑 ${pc.a.topWord}:${pc.a.topCount}회/밀도 ${(pc.a.density*100).toFixed(2)}%`);
  if (mb.a.density > 0.035) out.push(`Mobile 스터핑 ${mb.a.topWord}:${mb.a.topCount}회/밀도 ${(mb.a.density*100).toFixed(2)}%`);
  if (pc.a.title.length > 60) out.push(`PC title ${pc.a.title.length}자`);
  if (pc.a.dupTitle.length > 0) out.push(`PC title 중복 [${pc.a.dupTitle.join(',')}]`);
  if (pc.a.desc.length > 150) out.push(`PC desc ${pc.a.desc.length}자`);
  if (!SHORT_OK.test(path)) {
    if (pc.a.textLen < 800) out.push(`PC 본문 ${pc.a.textLen}자 (≥800)`);
    if (mb.a.textLen < 800) out.push(`Mobile 본문 ${mb.a.textLen}자 (≥800)`);
  }
  // PC vs Mobile 본문 일치도
  if (pc.a.textLen > 0 && mb.a.textLen > 0) {
    const diff = Math.abs(pc.a.textLen - mb.a.textLen) / Math.max(pc.a.textLen, mb.a.textLen);
    if (diff > 0.2) out.push(`PC/Mobile body 차 ${(diff*100).toFixed(0)}% (≤20%)`);
  }
  return out;
}

async function main() {
  const sm = await fetch('https://nolcool.com/sitemap.xml');
  const xml = await sm.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace('https://nolcool.com', ''));
  console.log('대상 URL:', urls.length);

  const results = [];
  for (let i = 0; i < urls.length; i += 6) {
    const batch = urls.slice(i, i + 6);
    const br = await Promise.all(batch.map(async (path) => {
      const url = 'https://nolcool.com' + path;
      const [pc, mb] = await Promise.all([fetchHtml(url, UA_PC), fetchHtml(url, UA_MOBILE)]);
      const out = { path, status: pc.status };
      if (pc.status === 200) out.pcA = audit(pc.html);
      if (mb.status === 200) out.mbA = audit(mb.html);
      const rs = reasons({ status: pc.status, a: out.pcA }, { status: mb.status, a: out.mbA }, path);
      return { path, reasons: rs };
    }));
    results.push(...br);
    process.stdout.write(`${Math.min(i + 6, urls.length)}/${urls.length}\r`);
  }
  console.log('\n진단 완료:', results.length);

  const issues = results.filter(r => r.reasons.length > 0);
  const pass = results.length - issues.length;
  console.log(`✓ 통과: ${pass}/${results.length} (${(pass / results.length * 100).toFixed(1)}%)`);
  console.log(`⚠ 회귀: ${issues.length}`);
  if (issues.length) {
    issues.slice(0, 20).forEach(i => console.log('  ', i.path, '→', i.reasons.join(' / ')));
  }

  await sendMail({ total: results.length, pass, issues });
}

async function sendMail({ total, pass, issues }) {
  if (issues.length === 0) { console.log(`✅ ${pass}/${total} 통과 — 메일 발송 안 함`); return; }
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const rows = issues.slice(0, 100).map(r => `<tr>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px"><a href="https://nolcool.com${esc(r.path)}">${esc(r.path)}</a></td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;color:#DC2626">${esc(r.reasons.join(' / '))}</td>
  </tr>`).join('');
  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[⚠ 스터핑/콘텐츠 회귀] PC+Mobile 전수 — ${pass}/${total}</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <p>회귀 ${issues.length}건${issues.length > 100 ? ' (상위 100)' : ''}</p>
    <table style="border-collapse:collapse;width:100%"><thead><tr style="background:#F3F4F6"><th style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:left">URL</th><th style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:left">사유</th></tr></thead><tbody>${rows}</tbody></table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 06:20 자동 — keyword-stuffing-pc-mobile-watch.mjs</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] PC+Mobile 스터핑/콘텐츠 회귀 ${issues.length}건 — ${pass}/${total}`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
