/**
 * 대전원나이트 페이지 2 키워드 SEO 24h watch (시즌82).
 * 매일 KST 07:50 — title/desc/h1/body 검색 의도 매칭 측정 → 회귀시만 메일.
 *
 * 측정 키워드:
 *   ① "대전원나이트" — 정확 키워드 (브랜드 검색)
 *   ② "대전나이트"   — 일반 키워드 (지역 + 카테고리 검색)
 *
 * 추가 검증 (시즌82 신규):
 *   ⓐ 까치 010-3918-9414 PhoneBar tel: 링크 존재
 *   ⓑ 38세 / 22시 / 3만원 / 차비 핵심 정책 토큰 모두 등장
 *   ⓒ openHours "02:30" + "03:30" 모두 등장
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
const URL = 'https://nolcool.com/nights/daejeononenight/';
const PRIMARY = '대전원나이트';
const SECONDARY = '대전나이트';
const PHONE = '010-3918-9414';
// 대전원나이트는 사장님이 직접 넣은 광고주 정책 — "차비 3만원" 등 가격단어 의도적 허용(단일 예외).
const POLICY_TOKENS = ['38세', '22시', '3만원', '차비', '맥주', '02:30', '03:30'];

function fetchHtml(url) {
  /* 시즌168 — 일시적 5xx/timeout 1회 재시도 (false-positive 메일 방지) */
  const _once = () => new Promise((res) => {
      const t = setTimeout(() => res({ status: 0, html: '' }), 20000);
      https.get(url, { headers: { 'User-Agent': 'NolcoolDaejeonOneWatch/1.0' } }, r => {
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
  const titleWords = title.replace(/[—,.\-]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  const dupTitle = titleWords.filter((w, i) => titleWords.indexOf(w) !== i);
  const hookTitle = analyzeHook(title);
  const hookDesc = analyzeHook(desc);
  const hookAxesHit = Math.max(hookTitle.axesHit, hookDesc.axesHit);

  // SEO 10지표
  if (!title.includes(PRIMARY)) issues.push(`title 대전원나이트X`);
  if (!absorbsSecondary(title, SECONDARY)) issues.push(`title 대전나이트X`);
  if (title.length === 0 || title.length > 60) issues.push(`title ${title.length}자`);
  if (dupTitle.length > 0) issues.push(`title 중복 [${dupTitle.join(',')}]`);
  if (!desc.includes(PRIMARY)) issues.push(`desc 대전원나이트X`);
  if (desc.length === 0 || desc.length > 150) issues.push(`desc ${desc.length}자`);
  if (!desc.includes(SECONDARY)) issues.push(`desc 대전나이트X`);
  if (primaryDensity > 0.035) issues.push(`대전원나이트 밀도 ${(primaryDensity*100).toFixed(2)}%`);
  if (secondaryCount < 3) issues.push(`대전나이트 body ${secondaryCount}회 (≥3 필요)`);
  if (hookAxesHit === 0) issues.push('후킹 5축 0 (title/desc 모두)');

  // 시즌82 신규 — PhoneBar / 운영정책 / 영업시간 검증
  if (!html.includes(`tel:${PHONE.replace(/-/g, '')}`)) issues.push(`PhoneBar tel:${PHONE} 누락`);
  for (const tok of POLICY_TOKENS) {
    if (!text.includes(tok)) issues.push(`정책 토큰 "${tok}" 누락`);
  }

  const snapshot = {
    title, desc, primaryCount, secondaryCount,
    primaryDensity: (primaryDensity*100).toFixed(2)+'%',
    hookCount: hookAxesHit, textLen: text.length,
    phoneOk: html.includes(`tel:${PHONE.replace(/-/g, '')}`),
    policyOk: POLICY_TOKENS.filter(t => text.includes(t)).length + '/' + POLICY_TOKENS.length,
    hookSamples: [...hookTitle.axes, ...hookDesc.axes].filter(a => a.hits > 0).map(a => `${a.axis}:${a.samples.join('|')}`).join(' / '),
  };

  console.log('대전원나이트 SEO + 정책 watch');
  console.log('  URL:', URL);
  console.log('  title:', title);
  console.log('  desc:', desc);
  console.log('  대전원나이트:', primaryCount, '회 / 밀도', snapshot.primaryDensity);
  console.log('  대전나이트:', secondaryCount, '회');
  console.log('  후킹 5축:', hookAxesHit, '/ samples:', snapshot.hookSamples || '0');
  console.log('  PhoneBar:', snapshot.phoneOk ? 'OK' : '❌');
  console.log('  정책 토큰:', snapshot.policyOk);
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
    <h2 style="color:#DC2626">[⚠ 대전원나이트 SEO/정책 회귀] ${issues.length}건</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <p><a href="${URL}">${URL}</a></p>
    <h3>회귀 사유</h3>
    <ul>${issues.map(i => `<li style="color:#DC2626">${esc(i)}</li>`).join('')}</ul>
    <h3>현재 스냅샷</h3>
    <table style="border-collapse:collapse;width:100%;font-size:12px">
      <tr><td style="border:1px solid #E5E7EB;padding:6px">title</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.title || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">desc</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.desc || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">대전원나이트</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.primaryCount}회 / 밀도 ${esc(snapshot.primaryDensity || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">대전나이트</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.secondaryCount}회</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">PhoneBar</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.phoneOk ? 'OK' : '❌'}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">정책 토큰</td><td style="border:1px solid #E5E7EB;padding:6px">${esc(snapshot.policyOk || '')}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:6px">후킹</td><td style="border:1px solid #E5E7EB;padding:6px">${snapshot.hookCount}건</td></tr>
    </table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 07:50 자동 — daejeononenight-keyword-watch.mjs</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] 대전원나이트 SEO/정책 회귀 ${issues.length}건`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
