/**
 * 6 카테고리 SEO 24h watch — 시즌66 통합
 * 매일 KST 07:10 — 카테고리당 15지표 측정. ★ 실패(회귀)할 때만 메일 1통 ★
 *
 * 환경:
 *   RESEND_API_KEY     필수 (회귀시만 사용)
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
import https from 'https';
import { analyzeHook } from './lib/hook-detector.mjs';

const CATS = [
  { path: '/clubs/',   kw: '클럽' },
  { path: '/nights/',  kw: '나이트' },
  { path: '/lounges/', kw: '라운지' },
  { path: '/rooms/',   kw: '룸' },
  { path: '/yojeong/', kw: '요정' },
  { path: '/hoppa/',   kw: '호빠' },
];
const BASE = 'https://nolcool.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
// 시즌78: HOOK 화이트리스트 폐기. lib/hook-detector 5축 구조 패턴 사용.

function fetchHtml(url) {
  /* 시즌168 — 일시적 5xx/timeout 1회 재시도 (false-positive 메일 방지) */
  const _once = () => new Promise((res) => {
    const t = setTimeout(() => res({ status: 0, html: '' }), 30000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolCategoriesWatch/1.0' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, html: Buffer.concat(chunks).toString('utf8') }); });
    }).on('error', () => { clearTimeout(t); res({ status: 0, html: '' }); });
  });
  return _once().then(r => (r.status === 200 || (r.status >= 400 && r.status < 500))
    ? r
    : new Promise(rs => setTimeout(() => _once().then(rs), 5000)));
}

function pickAttr(html, re) { const m = html.match(re); return m ? m[1].trim() : null; }

function audit(html, KW) {
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
    hookAxesHit,
    nolcoolInTitle: /놀쿨/.test(title || ''),
    dupWordInTitle,
  };
}

function score(a, KW) {
  // 1글자 키워드(룸 등)는 char-weighted density가 자연 절반 → 임계 별도 적용
  const isShortKw = KW.length === 1;
  const densMin = isShortKw ? 0.008 : 0.015;
  const densMax = isShortKw ? 0.020 : 0.030;
  const densLabel = isShortKw ? '키워드 밀도 0.8~2.0% (1글자)' : '키워드 밀도 1.5~3.0%';
  const checks = [
    { k: 'HTTP 200', ok: true },
    { k: 'title 10~60자', ok: a.titleLen >= 10 && a.titleLen <= 60 },
    { k: `title에 "${KW}" 포함`, ok: a.kwInTitle },
    { k: 'title에 "놀쿨" 없음', ok: !a.nolcoolInTitle },
    { k: 'title 중복단어 없음', ok: !a.dupWordInTitle },
    { k: 'desc 50~155자', ok: a.descLen >= 50 && a.descLen <= 155 },
    { k: `desc에 "${KW}" 포함`, ok: a.kwInDesc },
    { k: 'og:image 존재', ok: !!a.ogImg },
    { k: 'canonical 존재', ok: !!a.canonical },
    { k: `h1 ≥10자 + "${KW}" 포함`, ok: a.h1Len >= 10 && a.kwInH1 },
    { k: 'h2 ≥10 (가이드 풍부)', ok: a.h2Count >= 10 },
    { k: 'JSON-LD ≥2', ok: a.jsonLdBlocks >= 2 },
    { k: 'img ≥1', ok: a.imgCount >= 1 },
    { k: densLabel, ok: a.density >= densMin && a.density <= densMax },
    { k: '후킹 5축 ≥1축 (title/desc)', ok: a.hookAxesHit >= 1 },
  ];
  const pass = checks.filter(c => c.ok).length;
  return { pass, total: checks.length, checks, fails: checks.filter(c => !c.ok) };
}

async function main() {
  console.log('🔍 6 카테고리 SEO watch');
  const results = [];
  for (const { path, kw } of CATS) {
    const url = BASE + path;
    let r;
    try { r = await fetchHtml(url); }
    catch (e) { console.log(`✗ ${path} fetch 실패: ${e.message}`); results.push({ path, kw, status: 0, audit: null, scoreRes: null, errMsg: e.message }); continue; }
    console.log(`\n${path} — HTTP ${r.status} / ${(r.html.length / 1024).toFixed(1)}KB`);
    if (r.status !== 200) { results.push({ path, kw, status: r.status, audit: null, scoreRes: null }); continue; }
    const a = audit(r.html, kw);
    const s = score(a, kw);
    console.log(`  점수: ${s.pass}/${s.total} / 밀도 ${(a.density * 100).toFixed(2)}% / H2 ${a.h2Count} / 후킹 5축 ${a.hookAxesHit}`);
    for (const c of s.fails) console.log(`    ✗ ${c.k}`);
    results.push({ path, kw, status: 200, audit: a, scoreRes: s });
  }

  const failing = results.filter(r => r.status !== 200 || (r.scoreRes && r.scoreRes.pass < r.scoreRes.total));
  if (failing.length === 0) {
    console.log('\n✅ 6 카테고리 모두 만점 — 메일 발송 안 함 (실패시만 정책)');
    return;
  }
  console.log(`\n⚠ ${failing.length}/6 카테고리 회귀 — 메일 발송`);
  await sendMail(results, failing);
  process.exit(1);
}

async function sendMail(all, failing) {
  if (!RESEND_API_KEY) { console.error('RESEND_API_KEY 없음 — 메일 스킵'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';

  const summaryRows = all.map(r => {
    const passText = r.scoreRes ? `${r.scoreRes.pass}/${r.scoreRes.total}` : `HTTP ${r.status}`;
    const color = (r.scoreRes && r.scoreRes.pass === r.scoreRes.total) ? '#16A34A' : '#DC2626';
    const density = r.audit ? `${(r.audit.density * 100).toFixed(2)}%` : '-';
    const h2 = r.audit ? r.audit.h2Count : '-';
    return `<tr>
      <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;font-family:monospace">${esc(r.path)}</td>
      <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;color:${color};font-weight:600">${passText}</td>
      <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">${density}</td>
      <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">${h2}</td>
    </tr>`;
  }).join('');

  const detailBlocks = failing.map(r => {
    if (!r.scoreRes) {
      return `<div style="margin:16px 0;padding:12px;border-left:4px solid #DC2626;background:#FEF2F2">
        <h3 style="margin:0;color:#991B1B">${esc(r.path)} — HTTP ${r.status}</h3>
        ${r.errMsg ? `<p style="margin:6px 0;font-size:12px;color:#666">${esc(r.errMsg)}</p>` : ''}
      </div>`;
    }
    const failRows = r.scoreRes.fails.map(c => `<li style="font-size:12px;color:#991B1B">${esc(c.k)}</li>`).join('');
    const a = r.audit;
    return `<div style="margin:16px 0;padding:12px;border-left:4px solid #DC2626;background:#FEF2F2">
      <h3 style="margin:0;color:#991B1B">${esc(r.path)} — ${r.scoreRes.pass}/${r.scoreRes.total}</h3>
      <ul style="margin:6px 0 6px 20px;padding:0">${failRows}</ul>
      <table style="border-collapse:collapse;width:100%;margin-top:8px;font-size:12px">
        <tr><td style="padding:4px 8px;background:#F3F4F6;font-weight:600;width:120px">title</td><td style="padding:4px 8px">${esc(a.title)}</td></tr>
        <tr><td style="padding:4px 8px;background:#F3F4F6;font-weight:600">desc</td><td style="padding:4px 8px">${esc(a.desc)}</td></tr>
        <tr><td style="padding:4px 8px;background:#F3F4F6;font-weight:600">밀도</td><td style="padding:4px 8px"><b>${(a.density * 100).toFixed(2)}%</b> (${a.kwVisible}회 / ${a.textLen}자)</td></tr>
      </table>
    </div>`;
  }).join('');

  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">⚠ 6 카테고리 SEO 회귀 — ${failing.length}/6 회귀</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <h3 style="color:#111;margin-top:20px">요약</h3>
    <table style="border-collapse:collapse;margin:8px 0">
      <thead><tr>
        <th style="border:1px solid #E5E7EB;padding:6px;background:#F9FAFB;font-size:12px">경로</th>
        <th style="border:1px solid #E5E7EB;padding:6px;background:#F9FAFB;font-size:12px">점수</th>
        <th style="border:1px solid #E5E7EB;padding:6px;background:#F9FAFB;font-size:12px">밀도</th>
        <th style="border:1px solid #E5E7EB;padding:6px;background:#F9FAFB;font-size:12px">H2</th>
      </tr></thead>
      <tbody>${summaryRows}</tbody>
    </table>
    <h3 style="color:#111;margin-top:20px">회귀 상세</h3>
    ${detailBlocks}
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 07:10 자동 — categories-seo-audit.mjs (실패시만 발송)</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] 카테고리 SEO 회귀 — ${failing.length}/6`,
      html,
    }),
  });
  console.log(`이메일 HTTP ${r.status}`);
}

main().catch(e => { console.error(e); process.exit(1); });
