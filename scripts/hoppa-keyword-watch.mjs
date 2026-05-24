/**
 * /hoppa 카테고리 페이지 SEO 전용 24h watch (시즌109).
 * 매일 KST 10:00 — 호빠 키워드 단일 검색 상위노출 13지표 측정 → 회귀시만 메일.
 *
 * 통합 categories-seo-audit (KST 07:10)와 별개로 /hoppa/만 깊게 측정.
 *
 * 13지표:
 *   1) HTTP 200
 *   2) title에 "호빠" 포함
 *   3) title 10~60자
 *   4) title 중복단어 없음
 *   5) title에 "놀쿨" 없음
 *   6) desc에 "호빠" ≥3회 (long-tail 부스터)
 *   7) desc 50~155자
 *   8) "호빠" body 등장 ≥30회
 *   9) "호빠" 키워드 밀도 1.5~2.5% (스터핑 방지)
 *  10) H2 ≥10개 (체류시간 10분 보장)
 *  11) 후킹 5축 ≥2축 (title + desc 누적)
 *  12) 지역 long-tail ≥3 (강남/홍대/일산/해운대/대구 중 ≥3개)
 *  13) 검색의도 토큰 ≥3 (여자혼자/실장/매너/안전/처음/케어 중 ≥3개)
 *
 * 환경:
 *   RESEND_API_KEY     필수
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
import https from 'https';
import { analyzeHook } from './lib/hook-detector.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const URL = 'https://nolcool.com/hoppa/';
const KW = '호빠';
const REGIONS = ['강남', '홍대', '일산', '해운대', '대구'];
const INTENT_TOKENS = ['여자 혼자', '실장', '매너', '안전', '처음', '케어'];

function fetchHtml(url) {
  return new Promise((res) => {
    const t = setTimeout(() => res({ status: 0, html: '' }), 20000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolHoppaWatch/1.0' } }, r => {
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
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  const kwBody = (text.match(new RegExp(KW, 'g')) || []).length;
  const kwDesc = (desc.match(new RegExp(KW, 'g')) || []).length;
  const density = (kwBody * KW.length) / text.length;
  const titleWords = title.replace(/[—,.\-·]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  const dupTitle = titleWords.filter((w, i) => titleWords.indexOf(w) !== i);
  const hookTitle = analyzeHook(title);
  const hookDesc = analyzeHook(desc);
  const hookAxesHit = Math.max(hookTitle.axesHit, hookDesc.axesHit);
  const regionHits = REGIONS.filter(r => text.includes(r));
  const intentHits = INTENT_TOKENS.filter(t => text.includes(t));

  if (!title.includes(KW)) issues.push(`title 호빠X`);
  if (title.length < 10 || title.length > 60) issues.push(`title ${title.length}자 (10~60)`);
  if (dupTitle.length > 0) issues.push(`title 중복 [${dupTitle.join(',')}]`);
  if (/놀쿨/.test(title)) issues.push(`title 놀쿨 포함 (홈외 금지)`);
  if (kwDesc < 3) issues.push(`desc 호빠 ${kwDesc}회 (≥3)`);
  if (desc.length < 50 || desc.length > 155) issues.push(`desc ${desc.length}자 (50~155)`);
  if (kwBody < 30) issues.push(`body 호빠 ${kwBody}회 (≥30)`);
  if (density < 0.015 || density > 0.025) issues.push(`밀도 ${(density*100).toFixed(2)}% (1.5~2.5%)`);
  if (h2Count < 10) issues.push(`H2 ${h2Count}개 (≥10)`);
  if (hookAxesHit < 2) issues.push(`후킹 5축 ${hookAxesHit} (≥2)`);
  if (regionHits.length < 3) issues.push(`지역 long-tail ${regionHits.length}/${REGIONS.length} (≥3)`);
  if (intentHits.length < 3) issues.push(`검색의도 ${intentHits.length}/${INTENT_TOKENS.length} (≥3)`);

  const snapshot = {
    title, desc, kwBody, kwDesc,
    density: (density*100).toFixed(2)+'%',
    h2Count, hookCount: hookAxesHit, textLen: text.length,
    regionHits: regionHits.join('·') + ` (${regionHits.length}/${REGIONS.length})`,
    intentHits: intentHits.join('·') + ` (${intentHits.length}/${INTENT_TOKENS.length})`,
    hookSamples: [...hookTitle.axes, ...hookDesc.axes].filter(a => a.hits > 0).map(a => `${a.axis}:${a.samples.join('|')}`).join(' / '),
  };

  console.log('/hoppa/ SEO watch (호빠 단일 키워드 상위노출)');
  console.log('  URL:', URL);
  console.log('  title:', title);
  console.log('  desc:', desc);
  console.log('  호빠 body:', kwBody, '회 / 밀도', snapshot.density);
  console.log('  호빠 desc:', kwDesc, '회');
  console.log('  H2:', h2Count, '개');
  console.log('  후킹 5축:', hookAxesHit);
  console.log('  지역:', snapshot.regionHits);
  console.log('  검색의도:', snapshot.intentHits);
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
    <h2 style="color:#DC2626">[⚠ /hoppa 호빠 SEO 회귀] ${issues.length}건</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <p><a href="${URL}">${URL}</a></p>
    <h3>회귀 사유</h3>
    <ul>${issues.map(i => `<li style="color:#DC2626">${esc(i)}</li>`).join('')}</ul>
    <h3>현재 스냅샷</h3>
    <table style="border-collapse:collapse;width:100%;font-size:12px">
      <tr><td style="border:1px solid #E5E7EB;padding:6px">title</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.title || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">desc</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.desc || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">호빠 body</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.kwBody}회 / 밀도 ${esc(snapshot.density || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">호빠 desc</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.kwDesc}회</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">H2</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.h2Count}개</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">후킹</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.hookCount}축</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">지역</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.regionHits || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">검색의도</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.intentHits || '')}</td></tr>
    </table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 10:00 자동 — hoppa-keyword-watch.mjs</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] /hoppa 호빠 SEO 회귀 ${issues.length}건`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
