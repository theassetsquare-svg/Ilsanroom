/**
 * 해운대고구려 단일 페이지 24h SEO watch.
 * 매일 KST 07:00 — 11지표 측정 + 회귀 시 이메일.
 *
 * 환경:
 *   RESEND_API_KEY     필수
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 *   TARGET_URL         기본 https://nolcool.com/rooms/busan-haeundae/haeundaegoguryeo/
 */
import https from 'https';
import { analyzeHook } from './lib/hook-detector.mjs';

const TARGET = process.env.TARGET_URL || 'https://nolcool.com/rooms/busan-haeundae/haeundaegoguryeo/';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const KW = '해운대고구려';
// 시즌78: HOOK 화이트리스트 폐기. lib/hook-detector 5축 구조 패턴 사용.

function fetchHtml(url) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout')), 30000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolHaeundaeWatch/1.0' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, html: Buffer.concat(chunks).toString('utf8') }); });
    }).on('error', e => { clearTimeout(t); rej(e); });
  });
}

function pickAttr(html, re) { const m = html.match(re); return m ? m[1].trim() : null; }

function audit(html) {
  const get = re => pickAttr(html, re);
  const title = get(/<title>([^<]+)<\/title>/);
  const desc = get(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const ogTitle = get(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  const ogDesc = get(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
  const ogImg = get(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  const canonical = get(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [, ''])[1].replace(/<[^>]+>/g, '').trim();
  const jsonLdBlocks = (html.match(/<script[^>]*type="application\/ld\+json"[^>]*>/g) || []).length;
  const imgCount = (html.match(/<img\s/gi) || []).length;
  const ssrHero = /class="ssr-hero"/.test(html);

  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  const kwVisible = (text.match(new RegExp(KW, 'g')) || []).length;
  const density = (kwVisible * KW.length) / text.length;

  const hookTitle = analyzeHook(title);
  const hookDesc = analyzeHook(desc);
  const hookAxesHit = Math.max(hookTitle.axesHit, hookDesc.axesHit);
  const hookSamples = [...hookTitle.axes, ...hookDesc.axes].filter(a => a.hits > 0).map(a => `${a.axis}(${a.samples.join('|')})`);
  const titleWords = (title || '').split(/\s+/).filter(w => w.length >= 2);
  const dupWordInTitle = titleWords.some((w, i) => titleWords.indexOf(w) !== i);

  return {
    title, titleLen: (title || '').length,
    desc, descLen: (desc || '').length,
    ogTitle, ogDesc, ogImg, canonical,
    h1, h1Len: h1.length,
    jsonLdBlocks, imgCount, ssrHero,
    kwInTitle: (title || '').includes(KW),
    kwInDesc: (desc || '').includes(KW),
    kwInH1: h1.includes(KW),
    kwVisible, textLen: text.length, density,
    hookAxesHit, hookSamples,
    nolcoolInTitle: /놀쿨/.test(title || ''),
    dupWordInTitle,
  };
}

function score(a) {
  const checks = [
    { k: 'HTTP 200', ok: true },
    { k: 'title ≤60자', ok: a.titleLen > 0 && a.titleLen <= 60 },
    { k: 'title에 해운대고구려 포함', ok: a.kwInTitle },
    { k: 'title에 "놀쿨" 없음', ok: !a.nolcoolInTitle },
    { k: 'title 중복단어 없음', ok: !a.dupWordInTitle },
    { k: 'desc ≤150자', ok: a.descLen > 0 && a.descLen <= 150 },
    { k: 'desc에 해운대고구려 포함', ok: a.kwInDesc },
    { k: 'og:image 존재', ok: !!a.ogImg },
    { k: 'canonical 존재', ok: !!a.canonical && a.canonical.includes(KW.toLowerCase()) || !!a.canonical },
    { k: 'h1 ≥10자', ok: a.h1Len >= 10 },
    { k: 'JSON-LD ≥3', ok: a.jsonLdBlocks >= 3 },
    { k: 'SSR hero 박힘', ok: a.ssrHero },
    { k: 'img ≥1', ok: a.imgCount >= 1 },
    { k: '키워드 밀도 ≤3.5%', ok: a.density <= 0.035 },
    { k: '후킹 5축 ≥1축 (title/desc)', ok: a.hookAxesHit >= 1 },
  ];
  const pass = checks.filter(c => c.ok).length;
  return { pass, total: checks.length, checks };
}

async function main() {
  if (!RESEND_API_KEY) { console.error('RESEND_API_KEY 없음'); process.exit(1); }
  console.log('🔍 해운대고구려 SEO watch —', TARGET);
  const r = await fetchHtml(TARGET);
  console.log(`HTTP ${r.status} / ${(r.html.length / 1024).toFixed(1)}KB`);
  if (r.status !== 200) {
    // 페이지 404 등 회귀 — 긴급 메일
    await sendMail({ urgent: true, status: r.status, scoreRes: null, audit: null });
    process.exit(1);
  }
  const a = audit(r.html);
  const s = score(a);
  console.log(`점수: ${s.pass}/${s.total}`);
  for (const c of s.checks) console.log(`  ${c.ok ? '✓' : '✗'} ${c.k}`);
  console.log(`title (${a.titleLen}자): ${a.title}`);
  console.log(`desc (${a.descLen}자): ${a.desc}`);
  console.log(`키워드 밀도: ${(a.density * 100).toFixed(2)}% (visible ${a.kwVisible}회 / ${a.textLen}자)`);
  console.log(`후킹 5축: ${a.hookAxesHit}축 — ${a.hookSamples.join(', ') || '(없음)'}`);

  // ★ 메일 정책 — 실패시만 발송 (전체 통과시 stdout만)
  if (s.pass >= s.total) {
    console.log('\n✅ 전체 통과 — 메일 발송 안 함 (실패시만 정책)');
    return;
  }
  await sendMail({ urgent: true, status: 200, scoreRes: s, audit: a });
}

async function sendMail({ urgent, status, scoreRes, audit: a }) {
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  let html;
  if (a) {
    const rows = scoreRes.checks.map(c => `<tr><td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">${c.ok ? '<span style="color:#16A34A">✓</span>' : '<span style="color:#DC2626">✗</span>'}</td><td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">${esc(c.k)}</td></tr>`).join('');
    const headerColor = urgent ? '#DC2626' : '#16A34A';
    const headerText = urgent ? '⚠ 회귀 감지' : '✅ 정상';
    html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px">
      <h2 style="color:${headerColor}">[${headerText}] 해운대고구려 SEO watch — ${scoreRes.pass}/${scoreRes.total}</h2>
      <p style="color:#666;font-size:13px">측정 시각: ${kst} / 대상: <a href="${esc(TARGET)}">${esc(TARGET)}</a></p>
      <h3 style="color:#111;margin-top:20px">11지표 + 후킹·밀도</h3>
      <table style="border-collapse:collapse;margin:8px 0"><tbody>${rows}</tbody></table>
      <h3 style="color:#111;margin-top:20px">상세</h3>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600;width:160px">title (${a.titleLen}자)</td><td style="padding:6px 12px">${esc(a.title)}</td></tr>
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600">meta desc (${a.descLen}자)</td><td style="padding:6px 12px">${esc(a.desc)}</td></tr>
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600">h1 (${a.h1Len}자)</td><td style="padding:6px 12px">${esc(a.h1)}</td></tr>
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600">og:image</td><td style="padding:6px 12px"><a href="${esc(a.ogImg)}">${esc(a.ogImg)}</a></td></tr>
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600">canonical</td><td style="padding:6px 12px">${esc(a.canonical)}</td></tr>
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600">JSON-LD 블록</td><td style="padding:6px 12px">${a.jsonLdBlocks}</td></tr>
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600">키워드 밀도</td><td style="padding:6px 12px"><b style="color:${a.density > 0.035 ? '#DC2626' : '#16A34A'}">${(a.density * 100).toFixed(2)}%</b> (${a.kwVisible}회 / ${a.textLen}자)</td></tr>
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600">후킹 5축</td><td style="padding:6px 12px">${a.hookAxesHit}축 — ${esc(a.hookSamples.join(', ') || '(없음)')}</td></tr>
      </table>
      <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 07:00 자동 — haeundaegoguryeo-seo-watch.mjs<br>회귀 기준: title>60자, desc>150자, JSON-LD&lt;3, img=0, 밀도&gt;3.5%, 후킹=0, "놀쿨" 박힘, 중복단어, 404</p>
    </div>`;
  } else {
    html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px">
      <h2 style="color:#DC2626">⚠ 해운대고구려 페이지 404/오류 — HTTP ${status}</h2>
      <p>대상: <a href="${esc(TARGET)}">${esc(TARGET)}</a></p>
      <p>측정 시각: ${kst}</p>
      <p style="color:#9CA3AF;font-size:11px">매일 KST 07:00 자동 — haeundaegoguryeo-seo-watch.mjs</p>
    </div>`;
  }

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: urgent
        ? `[놀쿨][⚠] 해운대고구려 SEO 회귀 — ${scoreRes ? scoreRes.pass + '/' + scoreRes.total : 'HTTP ' + status}`
        : `[놀쿨][✓] 해운대고구려 SEO 정상 — ${scoreRes.pass}/${scoreRes.total}`,
      html,
    }),
  });
  console.log(`이메일 HTTP ${r.status}`);
}

main().catch(e => { console.error(e); process.exit(1); });
