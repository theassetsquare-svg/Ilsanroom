#!/usr/bin/env node
/**
 * 광고주 세트 대조(읽기만) — node scripts/verify/adv-set-check.mjs [--dist=dist] [--live] [--ledger=<advertisers.json>]
 *  광고주마다: 가게 쪽에 그 광고주 닉네임·번호가 있나 · 다른 광고주 번호가 없나 · og 카드 파일이 그 가게 것인가.
 *  전 쪽: 명단 밖 금지 번호(--forbid=번호,번호) 0.
 *  --live 면 dist 대신 라이브(https://nolcool.com)를 1.5초 간격으로 받는다.
 */
import fs from 'node:fs';
import path from 'node:path';
const arg = (k, d = '') => process.argv.find((a) => a.startsWith('--' + k + '='))?.slice(k.length + 3) || d;
const DIST = arg('dist', 'dist');
const LIVE = process.argv.includes('--live');
const LEDGER = arg('ledger', 'C:/Users/admin/naver-watch/data/advertisers.json');
const FORBID = arg('forbid', '').split(',').filter(Boolean);
const R = [];
const ck = (name, ok, note = '') => R.push({ name, r: ok ? '통과' : '실패', note: String(note).slice(0, 160) });
const adv = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
const list = Array.isArray(adv) ? adv : (adv.advertisers || adv['광고주'] || Object.values(adv).find(Array.isArray));
const venuesSrc = fs.readFileSync('src/data/venues.ts', 'utf8');
const blocks = venuesSrc.split('\n  {');
const routeOf = (b) => { const slug = (b.match(/slug:\s*'([^']+)'/) || [])[1]; const cat = (b.match(/category:\s*'([^']+)'/) || [])[1]; const region = (b.match(/\bregion:\s*'([^']+)'/) || [])[1]; const map = { club: `/clubs/${region}/${slug}`, night: `/nights/${slug}`, lounge: `/lounges/${slug}`, room: `/rooms/${region}/${slug}`, yojeong: `/yojeong/${region}/${slug}`, hoppa: `/hoppa/${slug}` }; return { slug, route: map[cat] }; };
const phones = list.map((a) => a.phone);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function page(route) {
  if (LIVE) { await sleep(1500); const r = await fetch(`https://nolcool.com${route}/?nc=${Date.now()}`, { headers: { 'cache-control': 'no-cache' } }); return r.status === 200 ? r.text() : ''; }
  const f = path.join(DIST, ...route.split('/').filter(Boolean), 'index.html');
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
}
for (const a of list) {
  const nick = a.nickname || a.name;
  const b = blocks.find((x) => new RegExp(`nameKo:\\s*'${a.shop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`).test(x)) || blocks.find((x) => x.includes(`staffPhone: '${a.phone}'`));
  if (!b) { ck(`${a.shop} 장부에 가게`, false, '못 찾음'); continue; }
  const { slug, route } = routeOf(b);
  ck(`${a.shop} 장부 닉네임 = ${nick}`, (b.match(/staffNickname:\s*'([^']*)'/) || [])[1] === nick);
  ck(`${a.shop} 장부 번호 = ${a.phone}`, (b.match(/staffPhone:\s*'([^']*)'/) || [])[1] === a.phone);
  const h = await page(route);
  ck(`${a.shop} 쪽 받음 ${route}`, !!h);
  ck(`${a.shop} 쪽에 번호 ${a.phone}`, h.includes(a.phone));
  ck(`${a.shop} 쪽에 닉네임 ${nick}`, h.includes(nick));
  const others = phones.filter((p) => p !== a.phone && h.includes(p));
  ck(`${a.shop} 쪽에 다른 광고주 번호 0`, others.length === 0, others.join(' '));
  const og = (h.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || '';
  ck(`${a.shop} og 카드 = 이 가게 파일(${slug})`, og.includes(`/og/${slug}`), og);
  for (const fp of FORBID) ck(`${a.shop} 쪽에 금지 번호 ${fp} 0`, !h.includes(fp));
}
const fails = R.filter((x) => x.r === '실패');
console.log(`광고주 대조(${LIVE ? '라이브' : 'dist'}): 광고주 ${list.length}명 · 검사 ${R.length} · 실패 ${fails.length}`);
for (const f of fails) console.log('  실패:', f.name, f.note);
const out = arg('out', ''); if (out) fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), live: LIVE, checks: R.length, fails: fails.length, list: R }, null, 1));
