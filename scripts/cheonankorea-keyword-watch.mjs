/**
 * 천안코리아나이트 페이지 2 키워드 SEO 24h watch (시즌107).
 * 매일 KST 09:50 — title/desc/h1/body 검색 의도 매칭 측정 → 회귀시만 메일.
 *
 * 측정 키워드:
 *   ① "천안코리아나이트" — venue 정식명 (PRIMARY)
 *   ② "천안나이트"      — 사용자 일반 검색 키워드 (SECONDARY, SSR auto-inject + 본문 수동)
 *
 * 10지표 + 디테일 토큰:
 *   1) HTTP 200
 *   2) title에 "천안코리아나이트" 포함
 *   3) title에 "천안나이트" 포함
 *   4) title ≤60자
 *   5) title 중복단어 없음
 *   6) desc 150자 이내 + "천안코리아나이트" 포함
 *   7) desc에 "천안나이트" 포함
 *   8) "천안코리아나이트" 밀도 ≤3.5%
 *   9) "천안나이트" body 등장 ≥3회
 *  10) 후킹 5축 ≥1축 (title 또는 desc)
 *  +) 디테일 토큰 (쌍용역/색소폰/이문세/왈츠/1인석) 모두 등장
 *
 * 환경:
 *   RESEND_API_KEY     필수
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
import https from 'https';
import { analyzeHook } from './lib/hook-detector.mjs';
import { absorbsSecondary } from './lib/keyword-absorb.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const URL = 'https://nolcool.com/nights/cheonankoreanight/';
const PRIMARY = '천안코리아나이트';
const SECONDARY = '천안나이트';
const DETAIL_TOKENS = ['쌍용역', '색소폰', '이문세', '왈츠', '1인석'];

function fetchHtml(url) {
  /* 시즌168 — 일시적 5xx/timeout 1회 재시도 (false-positive 메일 방지) */
  const _once = () => new Promise((res) => {
      const t = setTimeout(() => res({ status: 0, html: '' }), 20000);
      https.get(url, { headers: { 'User-Agent': 'NolcoolCheonanKoreaWatch/1.0' } }, r => {
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

  const primaryCount = (text.match(new RegExp(PRIMARY, 'g')) || []).length;
  const secondaryCount = (text.match(new RegExp(SECONDARY, 'g')) || []).length;
  const primaryDensity = (primaryCount * PRIMARY.length) / text.length;
  const titleWords = title.replace(/[—,.\-·]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  const dupTitle = titleWords.filter((w, i) => titleWords.indexOf(w) !== i);
  const hookTitle = analyzeHook(title);
  const hookDesc = analyzeHook(desc);
  const hookAxesHit = Math.max(hookTitle.axesHit, hookDesc.axesHit);

  if (!title.includes(PRIMARY)) issues.push(`title 천안코리아나이트X`);
  if (!absorbsSecondary(title, SECONDARY)) issues.push(`title 천안나이트X`);
  if (title.length === 0 || title.length > 60) issues.push(`title ${title.length}자`);
  if (dupTitle.length > 0) issues.push(`title 중복 [${dupTitle.join(',')}]`);
  if (!desc.includes(PRIMARY)) issues.push(`desc 천안코리아나이트X`);
  if (desc.length === 0 || desc.length > 150) issues.push(`desc ${desc.length}자`);
  if (!desc.includes(SECONDARY)) issues.push(`desc 천안나이트X`);
  if (primaryDensity > 0.035) issues.push(`천안코리아나이트 밀도 ${(primaryDensity*100).toFixed(2)}%`);
  if (secondaryCount < 3) issues.push(`천안나이트 body ${secondaryCount}회 (≥3 필요)`);
  if (hookAxesHit === 0) issues.push('후킹 5축 0 (title/desc 모두)');
  for (const tok of DETAIL_TOKENS) {
    if (!text.includes(tok)) issues.push(`디테일 토큰 "${tok}" 누락`);
  }

  const snapshot = {
    title, desc, primaryCount, secondaryCount,
    primaryDensity: (primaryDensity*100).toFixed(2)+'%',
    hookCount: hookAxesHit, textLen: text.length,
    detailOk: DETAIL_TOKENS.filter(t => text.includes(t)).length + '/' + DETAIL_TOKENS.length,
    hookSamples: [...hookTitle.axes, ...hookDesc.axes].filter(a => a.hits > 0).map(a => `${a.axis}:${a.samples.join('|')}`).join(' / '),
  };

  console.log('천안코리아나이트 SEO watch');
  console.log('  URL:', URL);
  console.log('  title:', title);
  console.log('  desc:', desc);
  console.log('  천안코리아나이트:', primaryCount, '회 / 밀도', snapshot.primaryDensity);
  console.log('  천안나이트:', secondaryCount, '회');
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
    <h2 style="color:#DC2626">[⚠ 천안코리아나이트 SEO 회귀] ${issues.length}건</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <p><a href="${URL}">${URL}</a></p>
    <h3>회귀 사유</h3>
    <ul>${issues.map(i => `<li style="color:#DC2626">${esc(i)}</li>`).join('')}</ul>
    <h3>현재 스냅샷</h3>
    <table style="border-collapse:collapse;width:100%;font-size:12px">
      <tr><td style="border:1px solid #E5E7EB;padding:6px">title</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.title || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">desc</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.desc || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">천안코리아나이트</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.primaryCount}회 / 밀도 ${esc(snapshot.primaryDensity || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">천안나이트</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.secondaryCount}회</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">디테일</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.detailOk || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">후킹</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.hookCount}건</td></tr>
    </table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 09:50 자동 — cheonankorea-keyword-watch.mjs</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] 천안코리아나이트 SEO 회귀 ${issues.length}건`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
