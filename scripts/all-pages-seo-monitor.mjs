/**
 * 전체 페이지 SEO 24h 풀체크 — sitemap.xml 전수 9 보편 지표 (PC + Mobile 동시)
 *
 * 9 보편 지표:
 *   ① HTTP 200
 *   ② title 존재 (1~65자)
 *   ③ meta description 존재 (50~180자)
 *   ④ H1 존재
 *   ⑤ canonical 존재 + URL 일치
 *   ⑥ og:title 존재
 *   ⑦ og:image 존재
 *   ⑧ JSON-LD ≥1 유효 블록
 *   ⑨ PC ≡ Mobile (title + desc 동일 SSR)
 *
 * 환경 변수:
 *   RESEND_API_KEY        필수
 *   NOTIFICATION_EMAIL    선택 (기본 theassetsquare@gmail.com)
 */
import https from 'https';

const BASE = 'https://nolcool.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36';
const UA_MO = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
const CONCURRENCY = 12;

function fetchText(url, ua) {
  return new Promise((res) => {
    const t = setTimeout(() => res({ status: 0, body: '', error: 'timeout' }), 15000);
    https.get(url, { headers: { 'User-Agent': ua, 'Accept': 'text/html,application/xml', 'Accept-Language': 'ko-KR' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, body: Buffer.concat(chunks).toString('utf8') }); });
    }).on('error', e => { clearTimeout(t); res({ status: 0, body: '', error: e.message }); });
  });
}

async function fetchSitemap() {
  const r = await fetchText(`${BASE}/sitemap.xml`, UA_PC);
  if (r.status !== 200) throw new Error(`sitemap HTTP ${r.status}`);
  const urls = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(r.body)) !== null) urls.push(m[1]);
  return urls;
}

function extract(html) {
  const m = (re) => (html.match(re) || [])[1] || '';
  const title = m(/<title>([^<]*)<\/title>/);
  const desc = m(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const ogTitle = m(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
  const ogImage = m(/<meta\s+property="og:image"\s+content="([^"]*)"/i);
  const canonical = m(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
  let jsonLdCount = 0;
  const ldMatches = html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
  for (const lm of ldMatches) {
    try {
      const j = JSON.parse(lm[1]);
      const items = Array.isArray(j) ? j : [j];
      for (const it of items) if (it && it['@type']) jsonLdCount++;
    } catch {}
  }
  return { title, desc, ogTitle, ogImage, canonical, h1, jsonLdCount };
}

async function auditUrl(url) {
  const [pc, mo] = await Promise.all([fetchText(url, UA_PC), fetchText(url, UA_MO)]);
  const checks = [];
  /* ① HTTP 200 */
  checks.push({ k: 'HTTP 200', ok: pc.status === 200 && mo.status === 200, detail: `PC ${pc.status} / Mo ${mo.status}` });
  if (pc.status !== 200) {
    return { url, checks, score: 0, max: 9, fails: ['HTTP'] };
  }
  const exPc = extract(pc.body);
  const exMo = mo.status === 200 ? extract(mo.body) : exPc;
  /* ② title 1~65자 */
  checks.push({ k: 'title 1~65자', ok: exPc.title.length >= 1 && exPc.title.length <= 65, detail: `${exPc.title.length}자` });
  /* ③ meta desc 50~180자 */
  checks.push({ k: 'meta desc 50~180자', ok: exPc.desc.length >= 50 && exPc.desc.length <= 180, detail: `${exPc.desc.length}자` });
  /* ④ H1 존재 */
  checks.push({ k: 'H1', ok: exPc.h1.length >= 1, detail: exPc.h1.slice(0, 30) });
  /* ⑤ canonical URL 일치 (trailing slash 무관) */
  const norm = (u) => u.replace(/\/$/, '');
  checks.push({ k: 'canonical', ok: !!exPc.canonical && norm(exPc.canonical) === norm(url), detail: exPc.canonical });
  /* ⑥ og:title */
  checks.push({ k: 'og:title', ok: exPc.ogTitle.length >= 1 });
  /* ⑦ og:image */
  checks.push({ k: 'og:image', ok: exPc.ogImage.length >= 1 });
  /* ⑧ JSON-LD ≥1 */
  checks.push({ k: 'JSON-LD ≥1', ok: exPc.jsonLdCount >= 1, detail: `${exPc.jsonLdCount}개` });
  /* ⑨ PC ≡ Mobile */
  checks.push({ k: 'PC≡Mobile', ok: exPc.title === exMo.title && exPc.desc === exMo.desc });

  const fails = checks.filter(c => !c.ok).map(c => c.k);
  const score = checks.filter(c => c.ok).length;
  return { url, checks, score, max: checks.length, fails, title: exPc.title };
}

async function runAudit(urls) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < urls.length) {
      const my = idx++;
      results[my] = await auditUrl(urls[my]);
      if ((my + 1) % 50 === 0) console.log(`  ${my + 1}/${urls.length} 검사 완료`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results;
}

function buildEmail(results, urlsCount) {
  const total = results.length;
  const perfect = results.filter(r => r.score === r.max).length;
  const failed = results.filter(r => r.score < r.max);
  const rate = ((perfect / total) * 100).toFixed(1);
  const status = perfect === total ? `✅ ${total}/${total} 만점` : `⚠️ ${perfect}/${total} 만점 (${rate}%)`;
  const color = perfect === total ? '#059669' : '#DC2626';

  /* 9지표별 통계 */
  const checkStats = {};
  for (const r of results) {
    if (!r.checks) continue;
    for (const c of r.checks) {
      checkStats[c.k] = checkStats[c.k] || { ok: 0, fail: 0 };
      if (c.ok) checkStats[c.k].ok++; else checkStats[c.k].fail++;
    }
  }

  let html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto">
    <h2 style="color:${color}">${status}</h2>
    <p><strong>전체 페이지 SEO 9 보편 지표 풀체크</strong> (PC + Mobile)</p>
    <p>sitemap URL ${urlsCount}개 / 검사 ${total}개 / 일자: ${new Date().toISOString()}</p>

    <h3>📊 9지표별 통과 통계</h3>
    <table style="border-collapse:collapse;width:100%">
      <thead><tr style="background:#F3F4F6"><th align="left" style="padding:6px;border:1px solid #E5E7EB">지표</th><th style="padding:6px;border:1px solid #E5E7EB">통과</th><th style="padding:6px;border:1px solid #E5E7EB">실패</th></tr></thead><tbody>`;
  for (const [k, s] of Object.entries(checkStats)) {
    const pct = ((s.ok / (s.ok + s.fail)) * 100).toFixed(0);
    const c = s.fail === 0 ? '#059669' : '#DC2626';
    html += `<tr><td style="padding:6px;border:1px solid #E5E7EB">${k}</td><td align="center" style="padding:6px;border:1px solid #E5E7EB;color:${c}">${s.ok} (${pct}%)</td><td align="center" style="padding:6px;border:1px solid #E5E7EB">${s.fail}</td></tr>`;
  }
  html += `</tbody></table>`;

  if (failed.length > 0) {
    html += `<h3>⚠️ 미달 ${failed.length}개 (상위 50개)</h3>
      <table style="border-collapse:collapse;width:100%;font-size:12px">
        <thead><tr style="background:#FEF2F2"><th align="left" style="padding:6px;border:1px solid #E5E7EB">URL</th><th align="left" style="padding:6px;border:1px solid #E5E7EB">실패 지표</th><th style="padding:6px;border:1px solid #E5E7EB">점수</th></tr></thead><tbody>`;
    for (const r of failed.slice(0, 50)) {
      const u = r.url.replace(BASE, '');
      html += `<tr><td style="padding:6px;border:1px solid #E5E7EB"><a href="${r.url}">${u}</a></td><td style="padding:6px;border:1px solid #E5E7EB;color:#DC2626">${r.fails.join(', ')}</td><td align="center" style="padding:6px;border:1px solid #E5E7EB">${r.score}/${r.max}</td></tr>`;
    }
    html += `</tbody></table>`;
  } else {
    html += `<p style="color:#059669;font-size:18px"><strong>✅ 전체 페이지 9지표 만점 — 완벽</strong></p>`;
  }

  html += `<p style="color:#9CA3AF;font-size:11px;margin-top:24px">매일 KST 06:15 자동 실행 — all-pages-seo-monitor.mjs</p></div>`;
  return html;
}

async function sendEmail(html, subject) {
  if (!RESEND_API_KEY) { console.warn('::warning::RESEND_API_KEY 미설정 — 이메일 스킵'); return false; }
  const body = JSON.stringify({ from: '놀쿨 자동감사 <onboarding@resend.dev>', to: [TO], subject, html });
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body,
  });
  const t = await r.text();
  console.log(`이메일 발송 HTTP ${r.status}: ${t.slice(0, 200)}`);
  return r.ok;
}

(async () => {
  console.log('📋 sitemap.xml 로드 중…');
  const urls = await fetchSitemap();
  console.log(`   sitemap URL ${urls.length}개`);

  console.log(`📋 전체 페이지 9지표 풀체크 시작 (PC + Mobile 동시, 동시성 ${CONCURRENCY})`);
  const results = await runAudit(urls);
  const total = results.length;
  const perfect = results.filter(r => r.score === r.max).length;
  const failed = results.filter(r => r.score < r.max);
  console.log(`\n📊 결과: ${perfect}/${total} 만점 / 미달 ${failed.length}건`);

  const subject = perfect === total
    ? `[놀쿨] 전체 SEO 9지표 ✅ ${total}/${total} 만점`
    : `[놀쿨] 전체 SEO ⚠️ ${perfect}/${total} 만점 (미달 ${failed.length}건)`;
  const html = buildEmail(results, urls.length);
  await sendEmail(html, subject);

  if (failed.length > 0) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
