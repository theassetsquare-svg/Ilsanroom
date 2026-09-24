#!/usr/bin/env node
/**
 * [놀쿨11-6] 라이브 확인(읽기만) — node scripts/verify/nc11-6-live.mjs --base=<배포 전 사이트맵 xml> [--dist=dist] [--n=30] [--gap=1500] [--out=<json>]
 *  ① 라이브 사이트맵 = 배포 전 사이트맵(주소 빠짐·추가 0) ② robots·llms.txt·IndexNow 키 ③ 유형별 표본 N쪽: 200 · 새 판 표식 · 로컬 결과물과 같은 제목 · page-gate 막음 0
 *  사람 속도 — 쪽 사이 gap ms(기본 1.5초) · 동시 1개. 판정 낱말: 통과 / 실패 / 실행 불가 / 해당 없음.
 */
import fs from 'node:fs';
import path from 'node:path';
import { gatePage, pageTypeOf } from '../page-gate.mjs';

const arg = (k, d = '') => process.argv.find((a) => a.startsWith('--' + k + '='))?.slice(k.length + 3) || d;
const BASE = arg('base', ''), DIST = arg('dist', 'dist'), N = +arg('n', '30'), GAP = +arg('gap', '1500'), OUT = arg('out', '');
const SITE = 'https://nolcool.com';
const R = [];
const ck = (name, ok, note = '') => R.push({ name, r: ok === null ? '실행 불가' : ok === 'na' ? '해당 없음' : ok ? '통과' : '실패', note: String(note || '').slice(0, 180) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (u) => { try { const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 nolcool-owner-check', 'cache-control': 'no-cache' }, redirect: 'manual' }); return { status: r.status, text: await r.text() }; } catch (e) { return { status: 0, text: '', err: String(e.message) }; } };
const dec = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
const titleOf = (h) => (h.match(/<title>([^<]*)<\/title>/) || [])[1] || '';

const sm = await get(`${SITE}/sitemap.xml?nc=${Date.now()}`);
ck('라이브 sitemap.xml 200', sm.status === 200, String(sm.status));
const live = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
ck('라이브 사이트맵 466', live.length === 466, String(live.length));
if (BASE && fs.existsSync(BASE)) {
  const base = new Set([...fs.readFileSync(BASE, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  const L = new Set(live);
  ck('주소 빠짐 0(배포 전 → 라이브)', [...base].every((u) => L.has(u)), [...base].filter((u) => !L.has(u)).slice(0, 3).join(' '));
  ck('주소 추가 0', [...L].every((u) => base.has(u)), [...L].filter((u) => !base.has(u)).slice(0, 3).join(' '));
} else ck('배포 전 사이트맵', null, '--base 없음');
ck('라이브 lastmod 전부 날짜', [...sm.text.matchAll(/<url>([\s\S]*?)<\/url>/g)].every((m) => /<lastmod>\d{4}-\d{2}-\d{2}/.test(m[1])));
await sleep(GAP);
const rb = await get(`${SITE}/robots.txt`);
ck('robots.txt 200 · Disallow 0 · Sitemap 줄', rb.status === 200 && !/Disallow:\s*\/\S/.test(rb.text) && /Sitemap: https:\/\/nolcool\.com\/sitemap\.xml/.test(rb.text));
for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Bingbot']) ck(`robots ${bot} Allow`, new RegExp(`User-agent: ${bot}\\s*\\n\\s*Allow: /`).test(rb.text));
await sleep(GAP);
const ll = await get(`${SITE}/llms.txt`);
const full = (ll.text.split(/^## 전체 페이지/m)[1] || '').split('\n').filter((l) => /^- \[.*\): .{10,}/.test(l)).length;
ck('llms.txt 200 · 전체 페이지 466(제목+직답)', ll.status === 200 && full === 466, String(full));
await sleep(GAP);
const key = fs.readdirSync('public').find((x) => /^[0-9a-f]{32}\.txt$/i.test(x));
const kf = key ? await get(`${SITE}/${key}`) : { status: 0, text: '' };
ck('IndexNow 키 파일 200 · 값 일치', kf.status === 200 && kf.text.trim() === key.replace(/\.txt$/, ''));

// 유형별 표본
const byType = {};
for (const u of live) { const r = dec(u.replace(SITE, '')).replace(/\/$/, '') || '/'; (byType[pageTypeOf(r)] ||= []).push({ u, r }); }
const types = Object.keys(byType);
const per = Math.max(1, Math.ceil(N / types.length));
const sample = [];
for (const t of types) { const arr = byType[t]; for (let i = 0; i < per && i < arr.length; i++) sample.push(arr[Math.floor(i * arr.length / per)]); }
for (const { u, r } of sample.slice(0, Math.max(N, types.length))) {
  await sleep(GAP);
  const pg = await get(u);
  const localF = path.join(DIST, ...r.split('/').filter(Boolean), 'index.html');
  const local = fs.existsSync(localF) ? fs.readFileSync(localF, 'utf8') : '';
  const g = pg.text ? gatePage(pg.text, { route: r }) : { block: ['받지 못함'] };
  ck(`라이브 ${r} 200`, pg.status === 200, String(pg.status || pg.err));
  ck(`라이브 ${r} 새 판(첫 화면 표식 · 완독 뼈대)`, /data-nc-fold/.test(pg.text) && /id="nc-article"/.test(pg.text));
  ck(`라이브 ${r} 제목 = 로컬 결과물`, !!local && titleOf(pg.text) === titleOf(local), titleOf(pg.text).slice(0, 40));
  ck(`라이브 ${r} 쪽 게이트 막음 0`, g.block.length === 0, g.block.join(' | '));
}
const fails = R.filter((x) => x.r === '실패');
const out = { at: new Date().toISOString(), checks: R.length, pass: R.filter((x) => x.r === '통과').length, fails: fails.length, na: R.filter((x) => x.r === '실행 불가').length, list: R };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`라이브 확인: 검사 ${out.checks} · 통과 ${out.pass} · 실패 ${out.fails} · 실행 불가 ${out.na}`);
for (const f of fails) console.log('  실패:', f.name, f.note);
