/**
 * /nights 카테고리 SEO 24h watch — 시즌66
 * 매일 KST 07:00 — 11지표 측정. ★ 실패(회귀)할 때만 메일 발송 ★
 *
 * 환경:
 *   RESEND_API_KEY     필수 (회귀시만 사용)
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 *   TARGET_URL         기본 https://nolcool.com/nights/
 */
import https from 'https';
import { analyzeHook } from './lib/hook-detector.mjs';

const TARGET = process.env.TARGET_URL || 'https://nolcool.com/nights/';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const KW = '나이트';
// 시즌78: HOOK 화이트리스트 폐기. lib/hook-detector 5축 구조 패턴 사용.

function fetchHtml(url) {
  /* 시즌168 — 일시적 5xx/timeout 1회 재시도 (false-positive 메일 방지) */
  const _once = () => new Promise((res) => {
    return new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('timeout')), 30000);
      https.get(url, { headers: { 'User-Agent': 'NolcoolNightsWatch/1.0' } }, r => {
        const chunks = [];
        r.on('data', d => chunks.push(d));
        r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, html: Buffer.concat(chunks).toString('utf8') }); });
      }).on('error', e => { clearTimeout(t); rej(e); });
  });
  return _once().then(r => (r.status === 200 || (r.status >= 400 && r.status < 500))
    ? r
    : new Promise(rs => setTimeout(() => _once().then(rs), 5000)));
}

function pickAttr(html, re) { const m = html.match(re); return m ? m[1].trim() : null; }

function audit(html) {
  const get = re => pickAttr(html, re);
  const title = get(/<title>([^<]+)<\/title>/);
  const desc = get(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const ogImg = get(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  const canonical = get(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [, ''])[1].replace(/<[^>]+>/g, '').trim();
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const jsonLdBlocks = (html.match(/<script[^>]*type="application\/ld\+json"[^>]*>/g) || []).length;
  const imgCount = (html.match(/<img\s/gi) || []).length;

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
    ogImg, canonical,
    h1, h1Len: h1.length, h2Count,
    jsonLdBlocks, imgCount,
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
    { k: 'title 10~60자', ok: a.titleLen >= 10 && a.titleLen <= 60 },
    { k: 'title에 "나이트" 포함', ok: a.kwInTitle },
    { k: 'title에 "놀쿨" 없음', ok: !a.nolcoolInTitle },
    { k: 'title 중복단어 없음', ok: !a.dupWordInTitle },
    { k: 'desc 50~155자', ok: a.descLen >= 50 && a.descLen <= 155 },
    { k: 'desc에 "나이트" 포함', ok: a.kwInDesc },
    { k: 'og:image 존재', ok: !!a.ogImg },
    { k: 'canonical 존재', ok: !!a.canonical },
    { k: 'h1 ≥10자 + "나이트" 포함', ok: a.h1Len >= 10 && a.kwInH1 },
    { k: 'h2 ≥10 (가이드 풍부)', ok: a.h2Count >= 10 },
    { k: 'JSON-LD ≥2', ok: a.jsonLdBlocks >= 2 },
    { k: 'img ≥1', ok: a.imgCount >= 1 },
    { k: '키워드 밀도 1.5~3.0%', ok: a.density >= 0.015 && a.density <= 0.030 },
    { k: '후킹 5축 ≥1축 (title/desc)', ok: a.hookAxesHit >= 1 },
  ];
  const pass = checks.filter(c => c.ok).length;
  return { pass, total: checks.length, checks, fails: checks.filter(c => !c.ok) };
}

async function main() {
  console.log('🔍 /nights SEO watch —', TARGET);
  const r = await fetchHtml(TARGET);
  console.log(`HTTP ${r.status} / ${(r.html.length / 1024).toFixed(1)}KB`);

  if (r.status !== 200) {
    console.log(`✗ HTTP ${r.status} — 회귀 메일 발송`);
    await sendMail({ status: r.status, scoreRes: null, audit: null });
    process.exit(1);
  }

  const a = audit(r.html);
  const s = score(a);
  console.log(`점수: ${s.pass}/${s.total}`);
  for (const c of s.checks) console.log(`  ${c.ok ? '✓' : '✗'} ${c.k}`);
  console.log(`title (${a.titleLen}자): ${a.title}`);
  console.log(`desc (${a.descLen}자): ${a.desc}`);
  console.log(`키워드 밀도: ${(a.density * 100).toFixed(2)}% (visible ${a.kwVisible}회 / ${a.textLen}자)`);
  console.log(`H2 블록: ${a.h2Count}개 / JSON-LD: ${a.jsonLdBlocks}블록`);
  console.log(`후킹 5축: ${a.hookAxesHit}축 — ${a.hookSamples.join(', ') || '(없음)'}`);

  if (s.pass < s.total) {
    console.log(`\n⚠ ${s.fails.length}건 회귀 — 메일 발송`);
    await sendMail({ status: 200, scoreRes: s, audit: a });
    process.exit(1);
  }
  console.log('\n✅ 전체 통과 — 메일 발송 안 함 (실패시만 발송 정책)');
}

async function sendMail({ status, scoreRes, audit: a }) {
  if (!RESEND_API_KEY) { console.error('RESEND_API_KEY 없음 — 메일 스킵'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  let html;
  if (a && scoreRes) {
    const rows = scoreRes.checks.map(c => `<tr><td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">${c.ok ? '<span style="color:#16A34A">✓</span>' : '<span style="color:#DC2626">✗</span>'}</td><td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">${esc(c.k)}</td></tr>`).join('');
    html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px">
      <h2 style="color:#DC2626">⚠ /nights SEO 회귀 — ${scoreRes.pass}/${scoreRes.total}</h2>
      <p style="color:#666;font-size:13px">측정 시각: ${kst} / 대상: <a href="${esc(TARGET)}">${esc(TARGET)}</a></p>
      <h3 style="color:#111;margin-top:20px">15지표</h3>
      <table style="border-collapse:collapse;margin:8px 0"><tbody>${rows}</tbody></table>
      <h3 style="color:#111;margin-top:20px">상세</h3>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600;width:160px">title (${a.titleLen}자)</td><td style="padding:6px 12px">${esc(a.title)}</td></tr>
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600">meta desc (${a.descLen}자)</td><td style="padding:6px 12px">${esc(a.desc)}</td></tr>
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600">h1 (${a.h1Len}자)</td><td style="padding:6px 12px">${esc(a.h1)}</td></tr>
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600">og:image</td><td style="padding:6px 12px">${esc(a.ogImg)}</td></tr>
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600">canonical</td><td style="padding:6px 12px">${esc(a.canonical)}</td></tr>
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600">H2 / JSON-LD</td><td style="padding:6px 12px">H2 ${a.h2Count}개 / JSON-LD ${a.jsonLdBlocks}블록</td></tr>
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600">키워드 밀도</td><td style="padding:6px 12px"><b>${(a.density * 100).toFixed(2)}%</b> (${a.kwVisible}회 / ${a.textLen}자)</td></tr>
        <tr><td style="padding:6px 12px;background:#F3F4F6;font-weight:600">후킹 5축</td><td style="padding:6px 12px">${a.hookAxesHit}축 — ${esc(a.hookSamples.join(', ') || '(없음)')}</td></tr>
      </table>
      <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 07:00 자동 — nights-seo-audit.mjs (실패시만 발송)</p>
    </div>`;
  } else {
    html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px">
      <h2 style="color:#DC2626">⚠ /nights 페이지 오류 — HTTP ${status}</h2>
      <p>대상: <a href="${esc(TARGET)}">${esc(TARGET)}</a></p>
      <p>측정 시각: ${kst}</p>
      <p style="color:#9CA3AF;font-size:11px">매일 KST 07:00 자동 — nights-seo-audit.mjs (실패시만 발송)</p>
    </div>`;
  }

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: scoreRes
        ? `[놀쿨][⚠] /nights SEO 회귀 — ${scoreRes.pass}/${scoreRes.total}`
        : `[놀쿨][⚠] /nights 오류 — HTTP ${status}`,
      html,
    }),
  });
  console.log(`이메일 HTTP ${r.status}`);
}

main().catch(e => { console.error(e); process.exit(1); });
