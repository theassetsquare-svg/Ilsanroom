#!/usr/bin/env node
// 놀쿨 콘텐츠 freshness 감사
// 1) magazine-articles.ts date 가 N일 이상 stale 인지
// 2) sitemap.xml lastmod 가 오늘(KST)인지
// 3) /(홈) meta date 가 오늘인지
import { readFileSync } from 'node:fs';

const STALE_DAYS = 90; // 90일 이상 미갱신 매거진 경고
const today = new Date();
const kst = new Date(today.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);

const issues = [];
const add = (sev, msg) => issues.push({ sev, msg });

// 1) magazine
try {
  const mag = readFileSync('src/data/magazine-articles.ts', 'utf8');
  const items = [...mag.matchAll(/id:\s*['"]([^'"]+)['"][^}]*?date:\s*['"](\d{4}-\d{2}-\d{2})['"]/gs)];
  let stale = 0;
  for (const m of items) {
    const id = m[1], d = m[2];
    const age = Math.floor((today - new Date(d)) / 86400000);
    if (age > STALE_DAYS) { add('WARN', `magazine "${id}" ${age}일 stale (${d})`); stale++; }
  }
  console.log(`\ud83d\udcd6 magazine ${items.length}\uac1c / stale ${stale}\uac1c`);
} catch (e) { add('ERR', `magazine read fail: ${e.message}`); }

// 2) sitemap lastmod
try {
  const r = await fetch('https://nolcool.com/sitemap.xml');
  const sm = await r.text();
  const lastmods = [...sm.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)].map(m => m[1]);
  const todayLm = lastmods.filter(d => d === kst).length;
  const total = lastmods.length;
  console.log(`\ud83d\uddc2\ufe0f  sitemap lastmod ${total}\uac1c / \uc624\ub298(${kst}) ${todayLm}\uac1c`);
  if (todayLm === 0 && total > 0) add('WARN', `sitemap lastmod \uc624\ub298(${kst}) \uc5c6\uc74c \u2014 \uc7ac\ube4c\ub4dc \ud544\uc694`);
} catch (e) { add('ERR', `sitemap fail: ${e.message}`); }

// 3) home meta date
try {
  const r = await fetch(`https://nolcool.com/?ts=${Date.now()}`);
  const html = await r.text();
  const m = html.match(/<meta\s+name=["']date["']\s+content=["'](\d{4}-\d{2}-\d{2})["']/);
  if (!m) add('WARN', '\ud648 meta date \ub204\ub77d');
  else {
    if (m[1] !== kst) add('WARN', `\ud648 meta date ${m[1]} \u2260 \uc624\ub298(${kst})`);
    else console.log(`\ud83c\udfe0 home meta date == ${kst} (\u2713)`);
  }
} catch (e) { add('ERR', `home fetch: ${e.message}`); }

const err = issues.filter(i => i.sev === 'ERR').length;
const warn = issues.filter(i => i.sev === 'WARN').length;
console.log(`\n\ud83d\udcca freshness: \ud83d\uded1 ${err} / \u26a0\ufe0f ${warn}`);
for (const i of issues) console.log(`  ${i.sev === 'ERR' ? '\ud83d\uded1' : '\u26a0\ufe0f'} ${i.msg}`);

process.exit(err > 0 ? 1 : 0);
