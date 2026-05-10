#!/usr/bin/env node
// 시즌28-C — 내부 검색 라이브 동작 (가게이름 → 결과 도달)
import puppeteer from 'puppeteer-core';

const QUERIES = ['일산룸', '강남클럽', '레이스', '명월관', '해운대', '호빠'];

const browser = await puppeteer.launch({
  executablePath: '/nix/store/lpdrfl6n16q5zdf8acp4bni7yczzcx3h-idx-builtins/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const results = [];
for (const q of QUERIES) {
  const page = await browser.newPage();
  try {
    const url = `https://nolcool.com/search/?q=${encodeURIComponent(q)}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const r = await page.evaluate((q) => {
      const text = document.body.innerText;
      // 결과 anchor (a[href*="/clubs/" or "/rooms/"…]) 카운트
      const venueLinks = Array.from(document.querySelectorAll('a[href]'))
        .filter(a => /\/(clubs|nights|rooms|yojeong|lounges|hoppa)\/[^/]+/.test(a.getAttribute('href') || ''));
      const hasNoResultMsg = /검색 결과가 없|결과 없음|no results/i.test(text);
      return {
        venueLinkCount: venueLinks.length,
        firstVenueHref: venueLinks[0]?.getAttribute('href') || null,
        hasInputWithQuery: !!document.querySelector(`input[value*="${q}"], input[value*="${encodeURIComponent(q)}"]`),
        bodyTextLen: text.length,
        hasNoResultMsg,
      };
    }, q);
    results.push({ q, ...r, ok: r.venueLinkCount > 0 || r.hasNoResultMsg });
  } catch (e) {
    results.push({ q, err: e.message.slice(0, 80) });
  }
  await page.close();
}
await browser.close();

console.log(`Internal search live test (${QUERIES.length} queries):\n`);
console.log(`q              venueLinks  firstHref                              ok`);
console.log(`-------------  ----------  -------------------------------------  --`);
for (const r of results) {
  if (r.err) {
    console.log(`${r.q.padEnd(13)}  ERR ${r.err}`);
    continue;
  }
  console.log(`${r.q.padEnd(13)}  ${String(r.venueLinkCount).padStart(10)}  ${(r.firstVenueHref || '-').slice(0, 37).padEnd(37)}  ${r.ok ? 'Y' : 'N'}`);
}

const okCount = results.filter(r => r.ok).length;
console.log(`\n${okCount}/${results.length} queries returned venue links or proper "no results" UI`);
