#!/usr/bin/env node
/**
 * 일산명월관/일산요정 키워드 SEO 24h 자동 모니터링
 *
 * 매일 1회 (GH Actions cron) 실행:
 *   1. 라이브 페이지 fetch (PC + mobile UA)
 *   2. title/meta-desc/H1/JSON-LD 추출 → 키워드 포함 검증
 *   3. 키워드 밀도 측정 (1.5~2.5% 정상 범위)
 *   4. IndexNow 재제출 (일일 재크롤 요청)
 *   5. 결과 HTML 이메일 (Resend) — 성공/회귀 모두 발송
 *
 * env:
 *   RESEND_API_KEY      필수 — Resend 발송 키
 *   NOTIFICATION_EMAIL  필수 — 수신자 (theassetsquare@gmail.com)
 *   INDEXNOW_KEY        선택 — 있으면 IndexNow 재제출
 */

const TARGET_PAGES = [
  {
    url: 'https://nolcool.com/yojeong/ilsan/ilsanmyeongwolgwanyojeong/',
    label: '일산명월관요정 상세',
    requiredKeywords: ['일산요정', '일산명월관'],
    minDensity: 1.0,
    maxDensity: 3.0,
    minTitleKeywords: 2, /* title 안에 두 키워드 모두 — 일산명월관 + 일산요정 동시 노출 (SEO #1 듀얼 상위) */
    /* 합성어 흡수 — '일산요정'은 '일산명월관요정'처럼 가운데 단어가 끼어도 region+category 둘 다 등장하면 인정 (Google 동의어/형태소 인식) */
    titleAbsorbs: {
      '일산요정': ['일산', '요정'],
      '일산명월관': ['일산', '명월관'],
    },
  },
];

const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36';
const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

const RESEND_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '';

async function fetchHtml(url, ua) {
  /* 시즌168 — 일시적 5xx/timeout 1회 재시도 */
  const once = async () => {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': ua } });
      return { ok: res.ok, status: res.status, text: res.ok ? await res.text() : '' };
    } catch (e) {
      return { ok: false, status: 0, text: '' };
    }
  };
  let r = await once();
  if (!r.ok && (r.status === 0 || r.status >= 500)) {
    await new Promise(rs => setTimeout(rs, 5000));
    r = await once();
  }
  if (!r.ok) throw new Error(`fetch ${url} ${r.status}`);
  return r.text;
}

function extractTitle(html) {
  return (html.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
}
function extractMetaDesc(html) {
  return (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/) || [])[1] || '';
}
function extractH1(html) {
  return (html.match(/<h1[^>]*>([^<]+)<\/h1>/) || [])[1] || '';
}
function extractAlternateName(html) {
  const m = html.match(/"alternateName"\s*:\s*\[([^\]]+)\]/);
  if (!m) return [];
  return (m[1].match(/"([^"]+)"/g) || []).map(s => s.slice(1, -1));
}
function countKeyword(text, kw) {
  let n = 0; let i = 0;
  while ((i = text.indexOf(kw, i)) !== -1) { n++; i += kw.length; }
  return n;
}
function stripHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

async function checkPage(page) {
  const issues = [];
  const stats = {};
  const htmlPc = await fetchHtml(page.url, UA_PC);
  const htmlMobile = await fetchHtml(page.url, UA_MOBILE);

  const title = extractTitle(htmlPc);
  const desc = extractMetaDesc(htmlPc);
  const h1 = extractH1(htmlPc);
  const altName = extractAlternateName(htmlPc);
  const textPc = stripHtml(htmlPc);
  const textMobile = stripHtml(htmlMobile);

  stats.title = title;
  stats.desc = desc;
  stats.h1 = h1;
  stats.alternateName = altName;
  stats.textLengthPc = textPc.length;
  stats.textLengthMobile = textMobile.length;
  stats.keywords = {};

  let titleHits = 0;
  for (const kw of page.requiredKeywords) {
    const cPc = countKeyword(textPc, kw);
    const cMobile = countKeyword(textMobile, kw);
    const density = (cPc / Math.max(textPc.length, 1)) * 100 * kw.length;
    /* titleHit: 정확 매칭 OR titleAbsorbs 분리 매칭 (순서 보존) */
    const absorbParts = page.titleAbsorbs?.[kw];
    let titleHit = title.includes(kw);
    if (!titleHit && absorbParts && absorbParts.length >= 2) {
      let cursor = 0;
      let allFound = true;
      for (const part of absorbParts) {
        const idx = title.indexOf(part, cursor);
        if (idx < 0) { allFound = false; break; }
        cursor = idx + part.length;
      }
      if (allFound) titleHit = true;
    }
    if (titleHit) titleHits++;
    stats.keywords[kw] = { pc: cPc, mobile: cMobile, density: density.toFixed(2), titleHit };

    if (cPc === 0) issues.push(`PC body에 "${kw}" 0회 — SEO 매칭 실패`);
    if (cMobile === 0) issues.push(`Mobile body에 "${kw}" 0회 — SEO 매칭 실패`);
    if (density > page.maxDensity) issues.push(`"${kw}" 밀도 ${density.toFixed(2)}% — keyword stuffing 위험 (max ${page.maxDensity}%)`);
    if (density < page.minDensity && cPc < 3) issues.push(`"${kw}" 밀도 ${density.toFixed(2)}% — 매칭 약함 (min ${page.minDensity}%)`);
  }

  if (titleHits < page.minTitleKeywords) {
    issues.push(`title에 키워드 ${titleHits}/${page.minTitleKeywords}개 포함 — title 회귀 의심: "${title}"`);
  }

  /* JSON-LD alternateName 회귀 검사 */
  for (const kw of page.requiredKeywords) {
    if (!altName.includes(kw) && !title.includes(kw)) {
      issues.push(`JSON-LD alternateName에 "${kw}" 누락 + title에도 없음 — Google 동의어 매핑 약화`);
    }
  }

  /* H1 회귀 */
  if (!h1) issues.push('H1 추출 실패 — SSR 회귀');

  return { page, stats, issues };
}

async function submitIndexNow(urls) {
  if (!INDEXNOW_KEY) return { skipped: true, reason: 'INDEXNOW_KEY 미설정' };
  const body = {
    host: 'nolcool.com',
    key: INDEXNOW_KEY,
    urlList: urls,
  };
  const endpoints = ['https://api.indexnow.org/indexnow', 'https://yandex.com/indexnow'];
  const results = [];
  for (const ep of endpoints) {
    try {
      const r = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      results.push({ ep, status: r.status });
    } catch (e) {
      results.push({ ep, error: e.message });
    }
  }
  return { results };
}

function buildEmailHtml(allResults, indexNowResult, hasIssues) {
  const status = hasIssues ? '⚠️ 회귀 감지' : '✅ 정상';
  const headerColor = hasIssues ? '#DC2626' : '#059669';

  let body = `<div style="font-family:sans-serif;max-width:680px;margin:0 auto">`;
  body += `<h2 style="color:${headerColor};margin:0 0 12px">${status} — 일산요정/일산명월관 SEO 일일 점검</h2>`;
  body += `<p style="color:#666;margin:0 0 24px">측정 시각: ${new Date().toISOString()} (UTC)</p>`;

  for (const r of allResults) {
    body += `<div style="border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin-bottom:16px">`;
    body += `<h3 style="margin:0 0 8px"><a href="${r.page.url}" style="color:#7C3AED">${r.page.label}</a></h3>`;
    body += `<p style="margin:4px 0;font-size:13px"><b>Title</b>: ${r.stats.title}</p>`;
    body += `<p style="margin:4px 0;font-size:13px"><b>Meta desc</b>: ${r.stats.desc.slice(0, 200)}${r.stats.desc.length > 200 ? '…' : ''}</p>`;
    body += `<p style="margin:4px 0;font-size:13px"><b>H1</b>: ${r.stats.h1}</p>`;
    body += `<p style="margin:4px 0;font-size:13px"><b>JSON-LD alternateName</b>: ${r.stats.alternateName.join(', ') || '<없음>'}</p>`;
    body += `<p style="margin:4px 0;font-size:13px"><b>본문 길이</b>: PC ${r.stats.textLengthPc}자 / Mobile ${r.stats.textLengthMobile}자</p>`;
    body += `<table style="border-collapse:collapse;margin-top:8px;font-size:13px"><tr><th style="border:1px solid #E5E7EB;padding:6px;background:#F9FAFB">키워드</th><th style="border:1px solid #E5E7EB;padding:6px;background:#F9FAFB">PC</th><th style="border:1px solid #E5E7EB;padding:6px;background:#F9FAFB">Mobile</th><th style="border:1px solid #E5E7EB;padding:6px;background:#F9FAFB">밀도(%)</th><th style="border:1px solid #E5E7EB;padding:6px;background:#F9FAFB">Title</th></tr>`;
    for (const [kw, k] of Object.entries(r.stats.keywords)) {
      body += `<tr><td style="border:1px solid #E5E7EB;padding:6px"><b>${kw}</b></td><td style="border:1px solid #E5E7EB;padding:6px">${k.pc}회</td><td style="border:1px solid #E5E7EB;padding:6px">${k.mobile}회</td><td style="border:1px solid #E5E7EB;padding:6px">${k.density}%</td><td style="border:1px solid #E5E7EB;padding:6px">${k.titleHit ? '✅' : '❌'}</td></tr>`;
    }
    body += `</table>`;
    if (r.issues.length > 0) {
      body += `<ul style="margin:12px 0 0;color:#DC2626;font-size:13px">`;
      for (const iss of r.issues) body += `<li>${iss}</li>`;
      body += `</ul>`;
    } else {
      body += `<p style="margin:12px 0 0;color:#059669;font-size:13px">✅ 회귀 없음 — 정상 노출 유지</p>`;
    }
    body += `</div>`;
  }

  body += `<div style="border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin-bottom:16px;background:#F9FAFB">`;
  body += `<h4 style="margin:0 0 8px">IndexNow 재제출</h4>`;
  if (indexNowResult.skipped) {
    body += `<p style="margin:0;font-size:13px;color:#666">${indexNowResult.reason}</p>`;
  } else {
    body += `<ul style="margin:0;font-size:13px">`;
    for (const r of indexNowResult.results) body += `<li>${r.ep}: ${r.status || r.error}</li>`;
    body += `</ul>`;
  }
  body += `</div>`;

  body += `<p style="color:#999;font-size:11px;margin-top:24px">매일 KST 06:00 자동 실행 — keyword-seo-monitor 워크플로</p>`;
  body += `</div>`;
  return body;
}

async function sendEmail(html, hasIssues) {
  if (!RESEND_KEY) {
    console.log('::warning::RESEND_API_KEY 미설정 — 이메일 스킵');
    return;
  }
  const subject = hasIssues
    ? '[놀쿨] ⚠️ 일산요정/일산명월관 SEO 회귀 감지'
    : '[놀쿨] ✅ 일산요정/일산명월관 SEO 정상';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'onboarding@resend.dev', to: TO_EMAIL, subject, html }),
  });
  console.log(`이메일 발송 HTTP ${r.status}`);
  if (!r.ok) console.log(await r.text());
}

(async () => {
  const allResults = [];
  let hasIssues = false;
  for (const page of TARGET_PAGES) {
    try {
      const r = await checkPage(page);
      allResults.push(r);
      if (r.issues.length > 0) hasIssues = true;
      console.log(`[${page.label}]`);
      console.log(`  Title: ${r.stats.title}`);
      for (const [kw, k] of Object.entries(r.stats.keywords)) {
        console.log(`  ${kw}: PC ${k.pc}회 / Mobile ${k.mobile}회 / density ${k.density}% / title ${k.titleHit ? 'YES' : 'NO'}`);
      }
      if (r.issues.length > 0) {
        console.log(`  ⚠️ Issues:`);
        for (const iss of r.issues) console.log(`    - ${iss}`);
      } else {
        console.log(`  ✅ 회귀 없음`);
      }
    } catch (e) {
      console.log(`::error::${page.label} 검사 실패 — ${e.message}`);
      hasIssues = true;
      allResults.push({ page, stats: { title: '', desc: '', h1: '', alternateName: [], textLengthPc: 0, textLengthMobile: 0, keywords: {} }, issues: [`fetch 실패: ${e.message}`] });
    }
  }

  // ★ 메일 정책 — 실패시만 발송
  if (!hasIssues) {
    console.log(`✅ 회귀 없음 — 메일 발송 안 함 (실패시만 정책)`);
    return;
  }
  const indexNowResult = await submitIndexNow(TARGET_PAGES.map(p => p.url));
  const html = buildEmailHtml(allResults, indexNowResult, hasIssues);
  await sendEmail(html, hasIssues);
  process.exit(1);
})();
