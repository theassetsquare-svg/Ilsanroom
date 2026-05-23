/**
 * 시즌61 — PC + Mobile 하단 영역 fixed/sticky 회귀 + PhoneBar 모달 숨김 회귀 24h watch.
 * 매일 KST 07:15 — 대표 페이지 ~14개를 양 뷰포트로 puppeteer 렌더 → 화이트리스트 외 검출 시 메일.
 *
 * 환경:
 *   RESEND_API_KEY     필수 (없으면 측정만)
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 *   ORIGIN             기본 https://nolcool.com
 *   CHROMIUM_PATH      기본 puppeteer-core 시스템 경로 자동
 *
 * 화이트리스트 (data 속성 기준):
 *   - data-sticky-phone     PhoneBar (venue/magazine 페이지)
 *   - backToTop             dataset, 모든 페이지
 *   - secretToast           dataset, 첫 방문만
 *   - <nav class="fixed bottom-0"> MobileBottomNav (모바일만)
 */
import https from 'https';
import puppeteer from 'puppeteer-core';

const ORIGIN = process.env.ORIGIN || 'https://nolcool.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

const CHROMIUM_CANDIDATES = [
  process.env.CHROMIUM_PATH,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/nix/store/lpdrfl6n16q5zdf8acp4bni7yczzcx3h-idx-builtins/bin/chromium',
].filter(Boolean);

import { existsSync } from 'node:fs';
const CHROME = CHROMIUM_CANDIDATES.find(p => existsSync(p));
if (!CHROME) { console.error('Chromium 없음 — 후보:', CHROMIUM_CANDIDATES); process.exit(2); }

function fetchText(url) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout')), 20000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolOverlapWatch/1.0' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res(Buffer.concat(chunks).toString('utf8')); });
    }).on('error', e => { clearTimeout(t); rej(e); });
  });
}

/* sitemap에서 대표 페이지 선정 — 카테고리당 첫 detail 1개 */
async function pickPages() {
  const xml = await fetchText(`${ORIGIN}/sitemap.xml`);
  const all = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
  const pages = new Set([`${ORIGIN}/`, `${ORIGIN}/community/`]);

  /* 카테고리 인덱스 */
  for (const cat of ['clubs', 'nights', 'rooms', 'yojeong', 'lounges', 'hoppa']) {
    pages.add(`${ORIGIN}/${cat}/`);
  }
  /* 매거진 인덱스 + detail 1 */
  const mag = all.find(u => /\/magazine\/[^/]+\/$/.test(u));
  if (mag) pages.add(mag);
  pages.add(`${ORIGIN}/magazine/`);

  /* 카테고리당 첫 detail venue */
  const pickedCats = new Set();
  for (const u of all) {
    const m = u.match(/\/(clubs|nights|rooms|yojeong|lounges|hoppa)\/.+\/$/);
    if (!m) continue;
    const cat = m[1];
    if (pickedCats.has(cat)) continue;
    /* 카테고리 인덱스 (/clubs/) 제외 */
    if (u.replace(ORIGIN, '').split('/').filter(Boolean).length < 2) continue;
    pickedCats.add(cat);
    pages.add(u);
  }
  return [...pages];
}

const WHITELIST_TEST = {
  stickyPhone: el => el.matches?.('[data-sticky-phone]'),
  backToTop: el => el.dataset?.backToTop !== undefined,
  secretToast: el => el.dataset?.secretToast !== undefined,
  bottomNav: el => el.tagName === 'NAV' && el.className.includes('fixed') && el.className.includes('bottom-0'),
};

async function scanPage(page, url, viewport) {
  await page.setViewport(viewport);
  let loadErr = null;
  /* 1회 재시도 — networkidle2 transient timeout 대비 */
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      loadErr = null;
      break;
    } catch (e) {
      loadErr = e.message;
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
    }
  }
  if (loadErr) return { url, viewport: viewport.label, errors: [`LOAD: ${loadErr}`] };

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 1200));

  /* 1) 바닥 100px (viewport.h-100 ~ h) 영역의 fixed/sticky 화이트리스트 외 검출 */
  const violators = await page.evaluate((vh) => {
    const out = [];
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
      if (r.bottom < vh - 100 || r.top > vh) continue;

      /* 화이트리스트 */
      const isPhone = el.matches('[data-sticky-phone]') || el.closest('[data-sticky-phone]');
      const isBackToTop = el.dataset?.backToTop !== undefined || el.closest('[data-back-to-top]');
      const isSecretToast = el.dataset?.secretToast !== undefined || el.closest('[data-secret-toast]');
      const isBottomNav = el.tagName === 'NAV' && el.className.includes && el.className.includes('fixed') && el.className.includes('bottom-0');
      if (isPhone || isBackToTop || isSecretToast || isBottomNav) continue;

      /* 자식 요소가 화이트리스트 안에 들어있으면 skip (중복 추적) */
      const inWhitelistAncestor = el.closest('[data-sticky-phone],[data-back-to-top],[data-secret-toast]');
      if (inWhitelistAncestor && inWhitelistAncestor !== el) continue;

      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (typeof el.className === 'string' ? el.className : '').slice(0, 80),
        id: el.id || '',
        z: cs.zIndex,
        top: Math.round(r.top), bottom: Math.round(r.bottom),
        text: (el.innerText || '').slice(0, 60).replace(/\s+/g, ' '),
      });
    }
    return out;
  }, viewport.height);

  const errors = [];
  for (const v of violators) {
    errors.push(`unknown fixed/sticky <${v.tag}.${v.cls.split(' ').slice(0, 2).join('.')}> z=${v.z} top=${v.top} bot=${v.bottom} "${v.text}"`);
  }

  /* 2) PhoneBar 모달 회귀 — venue/magazine처럼 phone 있는 페이지만.
        CSS 룰은 Tailwind 클래스(.fixed.inset-0.z-[100]) 셀렉터로 body:has() 매칭하므로
        테스트도 동일 클래스를 박아야 함 (inline style만으로는 셀렉터 미매칭). */
  const hasPhone = await page.evaluate(() => !!document.querySelector('[data-sticky-phone]'));
  if (hasPhone) {
    const modalHidden = await page.evaluate(() => {
      const m = document.createElement('div');
      m.id = '__nolcool_test_modal__';
      m.className = 'fixed inset-0 z-[100]';
      m.style.cssText = 'position:fixed;inset:0;z-index:100;background:white';
      document.body.appendChild(m);
      const phone = document.querySelector('[data-sticky-phone]');
      const cs = getComputedStyle(phone);
      const hidden = cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0';
      m.remove();
      return hidden;
    });
    if (!modalHidden) {
      errors.push('PhoneBar 모달 회귀 — z-100 모달 띄워도 [data-sticky-phone] 보임');
    }
  }

  return { url, viewport: viewport.label, errors, hasPhone };
}

async function sendMail(results, pages) {
  const violations = results.filter(r => r.errors.length > 0);
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  if (violations.length === 0) { console.log('✅ 정상 — 메일 skip (noise 0)'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const rows = violations.map(v => `
    <tr>
      <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;vertical-align:top"><a href="${esc(v.url)}">${esc(v.url.replace(ORIGIN, ''))}</a></td>
      <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;vertical-align:top">${esc(v.viewport)}</td>
      <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;vertical-align:top;color:#DC2626">${v.errors.map(e => esc(e)).join('<br>')}</td>
    </tr>`).join('');
  const html = `<div style="font-family:sans-serif;max-width:980px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">⚠ 놀쿨 하단 fixed/sticky 회귀 — ${violations.length}건 / ${pages.length} 페이지 × 2뷰포트</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <p style="color:#666;font-size:12px">화이트리스트: data-sticky-phone, data-back-to-top, data-secret-toast, &lt;nav class="fixed bottom-0"&gt;.<br>외 모든 fixed/sticky가 화면 하단 100px에 진입하면 위반. + PhoneBar 모달 숨김 회귀 동시 검사.</p>
    <table style="border-collapse:collapse;width:100%;margin-top:12px">
      <thead><tr style="background:#F3F4F6"><th style="border:1px solid #E5E7EB;padding:6px;text-align:left">path</th><th style="border:1px solid #E5E7EB;padding:6px;text-align:left">뷰포트</th><th style="border:1px solid #E5E7EB;padding:6px;text-align:left">위반</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 07:15 자동 — mobile-fixed-overlap-watch.mjs</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] 하단 overlap 회귀 ${violations.length}건`,
      html,
    }),
  });
  console.log(`이메일 HTTP ${r.status}`);
}

async function main() {
  console.log(`🔍 mobile-fixed-overlap-watch — origin ${ORIGIN} / chrome ${CHROME}`);
  const pages = await pickPages();
  console.log(`📂 검사 페이지: ${pages.length}개`);
  for (const p of pages) console.log(`   - ${p}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const VIEWPORTS = [
    { label: 'PC', width: 1280, height: 800, isMobile: false, deviceScaleFactor: 1, hasTouch: false },
    { label: 'Mobile', width: 390, height: 844, isMobile: true, deviceScaleFactor: 2, hasTouch: true },
  ];

  const results = [];
  for (const vp of VIEWPORTS) {
    for (const url of pages) {
      const page = await browser.newPage();
      try {
        const r = await scanPage(page, url, vp);
        results.push(r);
        if (r.errors.length === 0) console.log(`  ✓ [${vp.label}] ${url.replace(ORIGIN, '')}${r.hasPhone ? ' (phone)' : ''}`);
        else {
          console.log(`  ✗ [${vp.label}] ${url.replace(ORIGIN, '')}`);
          for (const e of r.errors) console.log(`      ${e}`);
        }
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();

  const violations = results.filter(r => r.errors.length > 0);
  console.log(`\n📊 결과: ${pages.length} 페이지 × 2뷰포트 = ${results.length} / 위반 ${violations.length}`);

  await sendMail(results, pages);
  process.exit(violations.length > 0 ? 1 : 0);
}

main().catch(e => { console.error('💥', e); process.exit(2); });
