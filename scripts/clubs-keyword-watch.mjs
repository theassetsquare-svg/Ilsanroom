/**
 * /clubs 카테고리 단일 키워드(클럽) SEO 24h watch — 시즌131.
 * 매일 KST 12:10 — title/desc/body/디테일 토큰 회귀시만 메일.
 *
 * 측정 키워드: "클럽" (PRIMARY, 단일)
 *
 * 12지표:
 *   1) HTTP 200
 *   2) title에 "클럽" 포함
 *   3) title 의미중복 stem 없음 (시즌129 패턴)
 *   4) title ≤60자
 *   5) title 중복단어 없음
 *   6) desc 80~150자
 *   7) desc에 "클럽" ≥3회
 *   8) "클럽" body 밀도 ≤3.5%
 *   9) "클럽" body 등장 ≥30회 (카테고리 페이지 121업소 집계)
 *  10) 후킹 5축 ≥1축 (title 또는 desc)
 *  11) H2 ≥10개 (CAT_GUIDE 27 H2 + 카드)
 *  12) 디테일 토큰 (Funktion-One·드레스코드·게스트 DJ·VIP 테이블·새벽 3시·EDM·하우스·테크노) 모두 등장
 *     — 강남·홍대·이태원 클럽 검색 의도 직격
 *
 * 환경:
 *   RESEND_API_KEY     필수
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
import https from 'https';
import { analyzeHook } from './lib/hook-detector.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const URL = 'https://nolcool.com/clubs/';
const PRIMARY = '클럽';
const DETAIL_TOKENS = ['Funktion-One', '드레스코드', '게스트 DJ', 'VIP 테이블', '새벽 3시', 'EDM', '하우스', '테크노'];

function fetchHtml(url) {
  return new Promise((res) => {
    const t = setTimeout(() => res({ status: 0, html: '' }), 20000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolClubsWatch/1.0' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, html: Buffer.concat(chunks).toString('utf8') }); });
    }).on('error', () => { clearTimeout(t); res({ status: 0, html: '' }); });
  });
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
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const h2Count = (html.match(/<h2[\s>]/gi) || []).length;

  const priBody = (text.match(new RegExp(PRIMARY, 'g')) || []).length;
  const priDesc = (desc.match(new RegExp(PRIMARY, 'g')) || []).length;
  const priDensity = (priBody * PRIMARY.length) / text.length;
  const titleWords = title.replace(/[—,.\-·]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  const dupTitle = titleWords.filter((w, i) => titleWords.indexOf(w) !== i);
  const hookTitle = analyzeHook(title);
  const hookDesc = analyzeHook(desc);
  const hookAxesHit = Math.max(hookTitle.axesHit, hookDesc.axesHit);

  // stem dup (역명 제외)
  const stemMap = new Map();
  for (const w of titleWords) {
    if (/역$/.test(w)) continue;
    const s = w.slice(0, 2);
    if (!/[가-힣]{2}/.test(s)) continue;
    stemMap.set(s, (stemMap.get(s) || 0) + 1);
  }
  const stemDup = [...stemMap.entries()].filter(([, c]) => c >= 2);

  if (!title.includes(PRIMARY)) issues.push(`title ${PRIMARY} X`);
  if (title.length === 0 || title.length > 60) issues.push(`title ${title.length}자 (≤60)`);
  if (dupTitle.length > 0) issues.push(`title 중복 [${dupTitle.join(',')}]`);
  if (stemDup.length > 0) issues.push(`title 의미중복 stem [${stemDup.map(([s, c]) => s + '×' + c).join(',')}]`);
  if (desc.length < 80 || desc.length > 150) issues.push(`desc ${desc.length}자 (80~150)`);
  if (priDesc < 3) issues.push(`desc ${PRIMARY} ${priDesc}회 (≥3 필요)`);
  if (priDensity > 0.035) issues.push(`${PRIMARY} 밀도 ${(priDensity*100).toFixed(2)}% (≤3.5%)`);
  if (priBody < 30) issues.push(`${PRIMARY} body ${priBody}회 (≥30 필요)`);
  if (hookAxesHit === 0) issues.push('후킹 5축 0 (title/desc 모두)');
  if (h2Count < 10) issues.push(`H2 ${h2Count}개 (≥10 필요)`);
  for (const tok of DETAIL_TOKENS) {
    if (!text.includes(tok)) issues.push(`디테일 토큰 "${tok}" 누락`);
  }

  const snapshot = {
    title, desc,
    priBody, priDesc,
    priDensity: (priDensity*100).toFixed(2)+'%',
    hookCount: hookAxesHit, textLen: text.length, h2Count,
    detailOk: DETAIL_TOKENS.filter(t => text.includes(t)).length + '/' + DETAIL_TOKENS.length,
    hookSamples: [...hookTitle.axes, ...hookDesc.axes].filter(a => a.hits > 0).map(a => `${a.axis}:${a.samples.join('|')}`).join(' / '),
  };

  console.log('/clubs SEO watch');
  console.log('  URL:', URL);
  console.log('  title:', title, `(${title.length}자)`);
  console.log('  desc:', desc, `(${desc.length}자)`);
  console.log(`  ${PRIMARY}:`, priBody, '회 / 밀도', snapshot.priDensity, '/ desc', priDesc, '회');
  console.log('  H2:', h2Count, '/ 본문', text.length, '자');
  console.log('  후킹 5축:', hookAxesHit, '/ samples:', snapshot.hookSamples || '0');
  console.log('  디테일 토큰:', snapshot.detailOk);
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
    <h2 style="color:#DC2626">[⚠ /clubs SEO 회귀] ${issues.length}건</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <p><a href="${URL}">${URL}</a></p>
    <h3>회귀 사유</h3>
    <ul>${issues.map(i => `<li style="color:#DC2626">${esc(i)}</li>`).join('')}</ul>
    <h3>현재 스냅샷</h3>
    <table style="border-collapse:collapse;width:100%;font-size:12px">
      <tr><td style="border:1px solid #E5E7EB;padding:6px">title</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.title || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">desc</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.desc || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">${PRIMARY}</td><td style="border:1px solid #E5E7EB;padding:6px">body ${snapshot.priBody}회 / desc ${snapshot.priDesc}회 / 밀도 ${esc(snapshot.priDensity || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">H2 / 본문</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.h2Count}개 / ${snapshot.textLen}자</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">디테일</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.detailOk || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">후킹</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.hookCount}축</td></tr>
    </table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 12:10 자동 — clubs-keyword-watch.mjs</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] /clubs SEO 회귀 ${issues.length}건`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
