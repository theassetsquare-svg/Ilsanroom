/**
 * 시즌62 — 카테고리 페이지 중복 박스 24h watch (puppeteer 렌더 기반).
 * 매일 KST 07:30 — 6 카테고리 페이지를 실제 렌더 후 박스 발생 횟수 검증.
 *
 * 검사 룰 (per category page, hydration 후 DOM 텍스트 기준):
 *  R1. "프리미엄 추천 TOP 3" (TopPicksMini) <= 1
 *  R2. "다른 업종도 둘러보기" (BrowseOtherCategories) <= 1
 *  R3. ListMidHook 6개 후킹 문구 합산 <= 2
 *  R4. "아래에 전부 정리" 안내 박스 = 0 (시즌62 제거됨)
 *
 * 환경:
 *   RESEND_API_KEY     필수 (없으면 측정만)
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 *   ORIGIN             기본 https://nolcool.com
 *   CHROMIUM_PATH      필수 (CI에서 setup-chrome로 주입)
 */
import https from 'https';
import { existsSync } from 'node:fs';
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
const CHROMIUM_PATH = CHROMIUM_CANDIDATES.find(p => existsSync(p));
if (!CHROMIUM_PATH) { console.error('Chromium 없음 — 후보:', CHROMIUM_CANDIDATES); process.exit(2); }

const PAGES = ['/clubs/', '/nights/', '/lounges/', '/rooms/', '/yojeong/', '/hoppa/'];

const LIST_MID_HOOKS = [
  '아직 안 본 숨은 명소가 아래에 더 있다',
  '여기서부터 진짜 핵심이다',
  '이 아래 업소, 아는 사람만 간다',
  '끝까지 스크롤한 사람만 찾는 곳이 있다',
  '단골들은 오히려 아래쪽 업소를 더 좋아한다',
  '스크롤을 멈추면 후회할 수 있다',
];

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

async function checkPage(browser, path) {
  const url = ORIGIN + path;
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const violations = [];
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    // hydration 안정화 시간 (engagement hooks 등은 React 마운트 후 노출)
    await new Promise(r => setTimeout(r, 1500));
    // 페이지 전체 스크롤 — lazy idx>=14 hooks가 마운트되도록 끝까지 내려가게
    await page.evaluate(async () => {
      await new Promise(resolve => {
        let y = 0;
        const step = () => {
          window.scrollTo(0, y);
          y += 800;
          if (y < document.body.scrollHeight) setTimeout(step, 100);
          else resolve();
        };
        step();
      });
    });
    await new Promise(r => setTimeout(r, 800));

    const text = await page.evaluate(() => document.body.innerText || '');

    const topPicks = countOccurrences(text, '프리미엄 추천 TOP 3');
    if (topPicks > 1) violations.push({ path, rule: 'R1', detail: `TopPicksMini ${topPicks}회 (max 1)` });

    const browseOther = countOccurrences(text, '다른 업종도 둘러보기');
    if (browseOther > 1) violations.push({ path, rule: 'R2', detail: `BrowseOtherCategories ${browseOther}회 (max 1)` });

    let hookTotal = 0;
    for (const h of LIST_MID_HOOKS) hookTotal += countOccurrences(text, h);
    if (hookTotal > 2) violations.push({ path, rule: 'R3', detail: `ListMidHook 합산 ${hookTotal}회 (max 2)` });

    // R4 — 안내 박스 마커 (시즌62 제거 대상)
    const bannerMarkers = [
      '👇 룸 크기별 추천',
      '👇 코스 종류 · 접대 매너',
      '👇 혼술 가능한 곳',
      '👇 분위기 · 안전',
      '👇 부킹 시스템',
      '👇 클럽 별 분위기',
      '아래에 전부 정리',
    ];
    let bannerHits = 0;
    const matched = [];
    for (const m of bannerMarkers) {
      const c = countOccurrences(text, m);
      if (c > 0) { bannerHits += c; matched.push(`"${m}"×${c}`); }
    }
    if (bannerHits > 0) violations.push({ path, rule: 'R4', detail: `안내 박스 ${bannerHits}회 (${matched.join(', ')}) — 시즌62 제거됨, max 0` });

    return violations;
  } catch (e) {
    return [{ path, rule: 'ERR', detail: String(e.message || e) }];
  } finally {
    await page.close();
  }
}

async function sendEmail(violations) {
  if (!RESEND_API_KEY) {
    console.log('[skip] RESEND_API_KEY 없음 — 이메일 발송 생략');
    return;
  }
  const rows = violations.map(v => `<tr><td>${v.path}</td><td>${v.rule}</td><td>${v.detail}</td></tr>`).join('');
  const html = `
    <h2>놀쿨 — 중복 박스 회귀 ${violations.length}건</h2>
    <p>시즌62 dup-card-live-watch 검출. 카테고리 페이지에 중복 박스/제거된 안내 박스가 다시 나타남.</p>
    <table border="1" cellpadding="6" style="border-collapse:collapse">
      <tr><th>page</th><th>rule</th><th>detail</th></tr>${rows}
    </table>
  `;
  const body = JSON.stringify({
    from: 'onboarding@resend.dev',
    to: [TO],
    subject: `[놀쿨] 중복 박스 회귀 ${violations.length}건 (시즌62 dup-card-watch)`,
    html,
  });
  const resp = await new Promise((res, rej) => {
    const req = https.request('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => res({ status: r.statusCode, text: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', rej);
    req.write(body); req.end();
  });
  console.log(`[email] status=${resp.status} ${resp.text.slice(0, 200)}`);
}

(async () => {
  const t0 = Date.now();
  console.log(`[start] dup-card-live-watch ${PAGES.length} pages @ ${ORIGIN}`);
  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const all = [];
  try {
    for (const p of PAGES) {
      const v = await checkPage(browser, p);
      all.push(...v);
      console.log(`  ${p} — ${v.length === 0 ? 'OK' : `${v.length} 위반`}`);
      for (const x of v) console.log(`     · ${x.rule}: ${x.detail}`);
    }
  } finally {
    await browser.close();
  }
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[done] ${PAGES.length} pages, ${all.length} 위반, ${dt}s`);
  if (all.length > 0) {
    await sendEmail(all);
    process.exit(1);
  } else {
    console.log('[ok] 위반 0 — 이메일 skip');
  }
})();
