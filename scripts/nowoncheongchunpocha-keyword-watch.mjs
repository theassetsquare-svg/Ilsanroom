/**
 * 노원청춘포차 단일 키워드 SEO 24h watch — 시즌144.
 * 매일 KST 13:10 — title/desc/body 회귀시만 메일.
 *
 * 측정 키워드:
 *   "노원청춘포차" — 단일 (지역+가게명 결합형)
 *
 * 11지표:
 *   1) HTTP 200
 *   2) title에 "노원청춘포차" 흡수
 *   3) title ≤60자
 *   4) title 중복단어 없음
 *   5) desc 80~150자
 *   6) desc에 "노원청춘포차" ≥3회
 *   7) "노원청춘포차" body 밀도 ≤3.5%
 *   8) "노원청춘포차" body 등장 ≥5회
 *   9) 후킹 5축 ≥1축 (title 또는 desc)
 *  10) 디테일 토큰 (마들역 4번 출구·빨간 천막·K-POP 떼창·소떡소떡·불암산 야경) 모두 등장
 *  11) "노원" + "포차" 동시 흡수 (검색 분리어 보조)
 *     — 시즌140 라퓨타~Jack 클럽 11 sibling과 톤·동선 완전 분리 (대학생/포차/K-POP)
 */
import https from 'https';
import { analyzeHook } from './lib/hook-detector.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const URL = 'https://nolcool.com/clubs/nowon/nowoncheongchunpocha/';
const KEYWORD = '노원청춘포차';
const DETAIL_TOKENS = ['마들역 4번 출구', '빨간 천막', 'K-POP 떼창', '소떡소떡', '불암산 야경'];

function fetchHtml(url) {
  return new Promise((res) => {
    const t = setTimeout(() => res({ status: 0, html: '' }), 20000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolNowonPochaWatch/1.0' } }, r => {
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

  const kwBody = (text.match(new RegExp(KEYWORD, 'g')) || []).length;
  const kwDesc = (desc.match(new RegExp(KEYWORD, 'g')) || []).length;
  const kwDensity = (kwBody * KEYWORD.length) / text.length;
  const titleWords = title.replace(/[—,.\-·]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  const dupTitle = titleWords.filter((w, i) => titleWords.indexOf(w) !== i);
  const hookTitle = analyzeHook(title);
  const hookDesc = analyzeHook(desc);
  const hookAxesHit = Math.max(hookTitle.axesHit, hookDesc.axesHit);

  const titleHasKw = title.includes(KEYWORD);
  const titleSplitHit = title.includes('노원') && title.includes('포차');

  if (!titleHasKw) issues.push(`title "${KEYWORD}" 흡수 X`);
  if (!titleSplitHit) issues.push('title 노원+포차 분리어 동시 흡수 X');
  if (title.length === 0 || title.length > 60) issues.push(`title ${title.length}자 (≤60)`);
  if (dupTitle.length > 0) issues.push(`title 중복 [${dupTitle.join(',')}]`);
  if (desc.length < 80 || desc.length > 150) issues.push(`desc ${desc.length}자 (80~150)`);
  if (kwDesc < 3) issues.push(`desc "${KEYWORD}" ${kwDesc}회 (≥3 필요)`);
  if (kwDensity > 0.035) issues.push(`"${KEYWORD}" 밀도 ${(kwDensity*100).toFixed(2)}% (≤3.5%)`);
  if (kwBody < 5) issues.push(`"${KEYWORD}" body ${kwBody}회 (≥5 필요)`);
  if (hookAxesHit === 0) issues.push('후킹 5축 0 (title/desc 모두)');
  for (const tok of DETAIL_TOKENS) {
    if (!text.includes(tok)) issues.push(`디테일 토큰 "${tok}" 누락`);
  }

  const snapshot = {
    title, desc,
    kwBody, kwDesc,
    kwDensity: (kwDensity*100).toFixed(2)+'%',
    hookCount: hookAxesHit, textLen: text.length,
    detailOk: DETAIL_TOKENS.filter(t => text.includes(t)).length + '/' + DETAIL_TOKENS.length,
    hookSamples: [...hookTitle.axes, ...hookDesc.axes].filter(a => a.hits > 0).map(a => `${a.axis}:${a.samples.join('|')}`).join(' / '),
  };

  console.log('노원청춘포차 SEO watch');
  console.log('  URL:', URL);
  console.log('  title:', title, `(${title.length}자)`);
  console.log('  desc:', desc, `(${desc.length}자)`);
  console.log(`  ${KEYWORD}:`, kwBody, '회 / 밀도', snapshot.kwDensity, '/ desc', kwDesc, '회');
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
    <h2 style="color:#DC2626">[⚠ 노원청춘포차 SEO 회귀] ${issues.length}건</h2>
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
    </table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 13:10 자동 — nowoncheongchunpocha-keyword-watch.mjs</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] 노원청춘포차 SEO 회귀 ${issues.length}건`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
