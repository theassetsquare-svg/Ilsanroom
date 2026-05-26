/**
 * 홈페이지 "놀쿨" 단일 키워드 SEO 24h watch — 시즌154.
 * 매일 KST 14:00 — title/desc/body/JSON-LD 회귀시만 메일.
 *
 * 14지표:
 *   1) HTTP 200
 *   2) title에 "놀쿨" 흡수
 *   3) title ≤60자
 *   4) title 중복단어 없음
 *   5) desc 80~150자
 *   6) desc에 "놀쿨" ≥3회
 *   7) "놀쿨" body 밀도 ≤3.5% (스터핑 상한)
 *   8) "놀쿨" body 등장 ≥10회
 *   9) 후킹 5축 ≥1축 (title 또는 desc)
 *  10) 디테일 토큰 (121+ 업소·6업종·1줄·20년·주말 망치기) 모두 등장
 *  11) JSON-LD WebSite 존재
 *  12) JSON-LD Organization 존재
 *  13) canonical = https://nolcool.com/
 *  14) H2 ≥5개
 */
import https from 'https';
import { analyzeHook } from './lib/hook-detector.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const URL = 'https://nolcool.com/';
const KEYWORD = '놀쿨';
const DETAIL_TOKENS = ['+ 업소', '6업종', '1줄', '20년', '주말 망치기'];

function fetchHtml(url) {
  /* 시즌168 — 일시적 5xx/timeout 1회 재시도 (false-positive 메일 방지) */
  const _once = () => new Promise((res) => {
      const t = setTimeout(() => res({ status: 0, html: '' }), 20000);
      https.get(url, { headers: { 'User-Agent': 'NolcoolHomeWatch/1.0' } }, r => {
        const chunks = [];
        r.on('data', d => chunks.push(d));
        r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, html: Buffer.concat(chunks).toString('utf8') }); });
      }).on('error', () => { clearTimeout(t); res({ status: 0, html: '' }); });
  });
  return _once().then(r => (r.status === 200 || (r.status >= 400 && r.status < 500))
    ? r
    : new Promise(rs => setTimeout(() => _once().then(rs), 5000)));
}

async function main() {
  const r = await fetchHtml(URL);
  const issues = [];

  if (r.status !== 200) {
    issues.push(`HTTP ${r.status}`);
    await sendMail({ issues, snapshot: {} });
    process.exit(1);
  }

  const html = r.html;
  const get = re => { const m = html.match(re); return m ? m[1].trim() : ''; };
  const title = get(/<title>([^<]+)<\/title>/);
  const desc = get(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const canonical = get(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  const kwBody = (text.match(new RegExp(KEYWORD, 'g')) || []).length;
  const kwDesc = (desc.match(new RegExp(KEYWORD, 'g')) || []).length;
  const kwDensity = (kwBody * KEYWORD.length) / text.length;
  const titleWords = title.replace(/[—,.\-·]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  const dupTitle = titleWords.filter((w, i) => titleWords.indexOf(w) !== i);
  const hookTitle = analyzeHook(title);
  const hookDesc = analyzeHook(desc);
  const hookAxesHit = Math.max(hookTitle.axesHit, hookDesc.axesHit);

  const hasWebSite = /"@type"\s*:\s*"WebSite"/.test(html);
  const hasOrg = /"@type"\s*:\s*"Organization"/.test(html);
  const h2Count = (html.match(/<h2[^>]*>/g) || []).length;
  const titleHasKw = title.includes(KEYWORD);

  if (!titleHasKw) issues.push(`title "${KEYWORD}" 흡수 X`);
  if (title.length === 0 || title.length > 60) issues.push(`title ${title.length}자 (≤60)`);
  if (dupTitle.length > 0) issues.push(`title 중복 [${dupTitle.join(',')}]`);
  if (desc.length < 80 || desc.length > 150) issues.push(`desc ${desc.length}자 (80~150)`);
  if (kwDesc < 3) issues.push(`desc "${KEYWORD}" ${kwDesc}회 (≥3 필요)`);
  if (kwDensity > 0.035) issues.push(`"${KEYWORD}" 밀도 ${(kwDensity*100).toFixed(2)}% (≤3.5%)`);
  if (kwBody < 10) issues.push(`"${KEYWORD}" body ${kwBody}회 (≥10 필요)`);
  if (hookAxesHit === 0) issues.push('후킹 5축 0 (title/desc 모두)');
  for (const tok of DETAIL_TOKENS) {
    if (!text.includes(tok)) issues.push(`디테일 토큰 "${tok}" 누락`);
  }
  if (!hasWebSite) issues.push('JSON-LD WebSite 누락');
  if (!hasOrg) issues.push('JSON-LD Organization 누락');
  if (canonical !== 'https://nolcool.com/') issues.push(`canonical 불일치 (현재: ${canonical})`);
  if (h2Count < 5) issues.push(`H2 ${h2Count}개 (≥5 필요)`);

  const snapshot = {
    title, desc,
    kwBody, kwDesc,
    kwDensity: (kwDensity*100).toFixed(2)+'%',
    hookCount: hookAxesHit, textLen: text.length,
    detailOk: DETAIL_TOKENS.filter(t => text.includes(t)).length + '/' + DETAIL_TOKENS.length,
    h2Count, hasWebSite, hasOrg, canonical,
    hookSamples: [...hookTitle.axes, ...hookDesc.axes].filter(a => a.hits > 0).map(a => `${a.axis}:${a.samples.join('|')}`).join(' / '),
  };

  console.log('홈페이지 놀쿨 SEO watch');
  console.log('  URL:', URL);
  console.log('  title:', title, `(${title.length}자)`);
  console.log('  desc:', desc, `(${desc.length}자)`);
  console.log(`  ${KEYWORD}:`, kwBody, '회 / 밀도', snapshot.kwDensity, '/ desc', kwDesc, '회');
  console.log('  후킹 5축:', hookAxesHit, '/ samples:', snapshot.hookSamples || '0');
  console.log('  디테일 토큰:', snapshot.detailOk);
  console.log('  JSON-LD:', hasWebSite ? 'WebSite✓' : 'WebSite✗', hasOrg ? 'Org✓' : 'Org✗');
  console.log('  H2:', h2Count, '개');
  console.log('  canonical:', canonical);
  console.log('  회귀:', issues.length, '건');

  if (issues.length > 0) {
    await sendMail({ issues, snapshot });
    process.exit(1);
  }
  console.log('✅ 전 지표 통과 — 메일 발송 안 함 (실패시만 정책)');
}

async function sendMail({ issues, snapshot }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const html = `<div style="font-family:sans-serif;max-width:680px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[⚠ 홈 놀쿨 SEO 회귀] ${issues.length}건</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <p><a href="${URL}">${URL}</a></p>
    <h3>회귀 사유</h3>
    <ul>${issues.map(i => `<li style="color:#DC2626">${esc(i)}</li>`).join('')}</ul>
    <h3>현재 스냅샷</h3>
    <table style="border-collapse:collapse;width:100%;font-size:12px">
      <tr><td style="border:1px solid #E5E7EB;padding:6px">title</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.title || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">desc</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.desc || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">${KEYWORD}</td><td style="border:1px solid #E5E7EB;padding:6px">body ${snapshot.kwBody}회 / desc ${snapshot.kwDesc}회 / 밀도 ${esc(snapshot.kwDensity || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">디테일</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.detailOk || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">후킹</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.hookCount}축</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">JSON-LD</td><td style="border:1px solid #E5E7EB;padding:6px">WebSite ${snapshot.hasWebSite} / Org ${snapshot.hasOrg}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">H2</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.h2Count}개</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">canonical</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.canonical || '')}</td></tr>
    </table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 14:00 자동 — home-nolcool-keyword-watch.mjs</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] 홈 놀쿨 SEO 회귀 ${issues.length}건`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
