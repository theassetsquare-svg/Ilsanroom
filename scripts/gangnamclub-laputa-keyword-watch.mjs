/**
 * 강남청담클럽 라퓨타 DUAL 키워드 SEO 24h watch — 시즌132.
 * 매일 KST 12:15 — title/desc/body 회귀시만 메일.
 *
 * 측정 키워드:
 *   ① "강남클럽" — PRIMARY (강남 광역 검색)
 *   ② "청담클럽" — SECONDARY (청담 마이크로 검색)
 *   venue name "강남청담클럽 라퓨타"가 양쪽 키워드 흡수 + desc/body 명시 보강
 *
 * 12지표:
 *   1) HTTP 200
 *   2) title에 "강남" + "클럽" 동시 포함 (venue name "강남청담클럽" 흡수)
 *   3) title ≤60자
 *   4) title 중복단어 없음
 *   5) desc 80~150자
 *   6) desc에 "강남클럽" ≥3회
 *   7) desc에 "청담클럽" ≥3회
 *   8) "강남클럽" body 밀도 ≤3.5%
 *   9) "강남클럽" body 등장 ≥5회
 *  10) "청담클럽" body 등장 ≥3회
 *  11) 후킹 5축 ≥1축 (title 또는 desc)
 *  12) 디테일 토큰 (청담역·LED·트랜스·프로그레시브·롱셋) 모두 등장
 *     — 강남/청담 클럽 마니아 검색 의도 직격 (장르·시그니처·시간)
 *
 * 환경:
 *   RESEND_API_KEY     필수
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
import https from 'https';
import { analyzeHook } from './lib/hook-detector.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const URL = 'https://nolcool.com/clubs/gangnam/gangnamclub-laputa/';
const PRIMARY = '강남클럽';
const SECONDARY = '청담클럽';
const DETAIL_TOKENS = ['청담역', 'LED', '트랜스', '프로그레시브', '롱셋'];

function fetchHtml(url) {
  /* 시즌168 — 일시적 5xx/timeout 1회 재시도 (false-positive 메일 방지) */
  const _once = () => new Promise((res) => {
      const t = setTimeout(() => res({ status: 0, html: '' }), 20000);
      https.get(url, { headers: { 'User-Agent': 'NolcoolLaputaWatch/1.0' } }, r => {
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
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  const priBody = (text.match(new RegExp(PRIMARY, 'g')) || []).length;
  const secBody = (text.match(new RegExp(SECONDARY, 'g')) || []).length;
  const priDesc = (desc.match(new RegExp(PRIMARY, 'g')) || []).length;
  const secDesc = (desc.match(new RegExp(SECONDARY, 'g')) || []).length;
  const priDensity = (priBody * PRIMARY.length) / text.length;
  const titleWords = title.replace(/[—,.\-·]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  const dupTitle = titleWords.filter((w, i) => titleWords.indexOf(w) !== i);
  const hookTitle = analyzeHook(title);
  const hookDesc = analyzeHook(desc);
  const hookAxesHit = Math.max(hookTitle.axesHit, hookDesc.axesHit);

  // venue name "강남청담클럽 라퓨타"가 강남+클럽 동시 흡수 — 부분 매칭 검사
  const titleHasGangnamClub = title.includes('강남') && title.includes('클럽');

  if (!titleHasGangnamClub) issues.push('title 강남+클럽 동시 흡수 X');
  if (title.length === 0 || title.length > 60) issues.push(`title ${title.length}자 (≤60)`);
  if (dupTitle.length > 0) issues.push(`title 중복 [${dupTitle.join(',')}]`);
  if (desc.length < 80 || desc.length > 150) issues.push(`desc ${desc.length}자 (80~150)`);
  if (priDesc < 3) issues.push(`desc ${PRIMARY} ${priDesc}회 (≥3 필요)`);
  if (secDesc < 3) issues.push(`desc ${SECONDARY} ${secDesc}회 (≥3 필요)`);
  if (priDensity > 0.035) issues.push(`${PRIMARY} 밀도 ${(priDensity*100).toFixed(2)}% (≤3.5%)`);
  if (priBody < 5) issues.push(`${PRIMARY} body ${priBody}회 (≥5 필요)`);
  if (secBody < 3) issues.push(`${SECONDARY} body ${secBody}회 (≥3 필요)`);
  if (hookAxesHit === 0) issues.push('후킹 5축 0 (title/desc 모두)');
  for (const tok of DETAIL_TOKENS) {
    if (!text.includes(tok)) issues.push(`디테일 토큰 "${tok}" 누락`);
  }

  const snapshot = {
    title, desc,
    priBody, secBody, priDesc, secDesc,
    priDensity: (priDensity*100).toFixed(2)+'%',
    hookCount: hookAxesHit, textLen: text.length,
    detailOk: DETAIL_TOKENS.filter(t => text.includes(t)).length + '/' + DETAIL_TOKENS.length,
    hookSamples: [...hookTitle.axes, ...hookDesc.axes].filter(a => a.hits > 0).map(a => `${a.axis}:${a.samples.join('|')}`).join(' / '),
  };

  console.log('강남청담클럽 라퓨타 SEO watch');
  console.log('  URL:', URL);
  console.log('  title:', title, `(${title.length}자)`);
  console.log('  desc:', desc, `(${desc.length}자)`);
  console.log(`  ${PRIMARY}:`, priBody, '회 / 밀도', snapshot.priDensity, '/ desc', priDesc, '회');
  console.log(`  ${SECONDARY}:`, secBody, '회 / desc', secDesc, '회');
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
    <h2 style="color:#DC2626">[⚠ 강남청담클럽 라퓨타 SEO 회귀] ${issues.length}건</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <p><a href="${URL}">${URL}</a></p>
    <h3>회귀 사유</h3>
    <ul>${issues.map(i => `<li style="color:#DC2626">${esc(i)}</li>`).join('')}</ul>
    <h3>현재 스냅샷</h3>
    <table style="border-collapse:collapse;width:100%;font-size:12px">
      <tr><td style="border:1px solid #E5E7EB;padding:6px">title</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.title || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">desc</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.desc || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">${PRIMARY}</td><td style="border:1px solid #E5E7EB;padding:6px">body ${snapshot.priBody}회 / desc ${snapshot.priDesc}회 / 밀도 ${esc(snapshot.priDensity || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">${SECONDARY}</td><td style="border:1px solid #E5E7EB;padding:6px">body ${snapshot.secBody}회 / desc ${snapshot.secDesc}회</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">디테일</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.detailOk || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">후킹</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.hookCount}축</td></tr>
    </table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 12:15 자동 — gangnamclub-laputa-keyword-watch.mjs</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] 강남청담클럽 라퓨타 SEO 회귀 ${issues.length}건`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
