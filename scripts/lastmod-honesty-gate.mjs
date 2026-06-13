#!/usr/bin/env node
/**
 * [SEO/정직] lastmod 거짓-today 재발 방지 게이트 — "오늘 빌드했으니 오늘 수정" 거짓 신선도를 영구 차단.
 *
 * 배경:
 *   prerender-seo.mjs 의 lastmodFor() 는 페이지 의미 콘텐츠 해시가 직전 빌드와 같으면 이전 lastmod 유지,
 *   다르면(신규 포함) today 로 찍는다(정직화). 누군가 이 정직 구조를 되돌려 매일 전 페이지를 today 로
 *   도배하면 Google 은 거짓 신선도 → scaled/조작 신호로 보고 색인을 약화시킨다.
 *   이 게이트는 그 정직 구조가 빌드 산출물(매니페스트·sitemap)에서 무너지지 않게 ★빌드마다 자동 검증한다.
 *
 * 검증 기준 = lastmodFor() 계약 그대로 (직전 매니페스트 .seo-lastmod.prev.json 의 ★동일 해시 기준):
 *   각 URL 에 대해 changed = (직전값 없음) 또는 (직전 해시 ≠ 현재 해시)
 *     · changed  → lastmod 은 ★반드시 today           (아니면 "정직성 누락")
 *     · !changed → lastmod 은 ★반드시 직전 lastmod 유지 (오늘로 바뀌었으면 "거짓-today 재발", 그 외는 lastmod 변조)
 *   추가: dist/sitemap.xml 의 각 <loc> lastmod 이 매니페스트 값과 일치해야 함(사이트맵 변조 차단).
 *
 *   ※ S_today == S_changed 는 직전 lastmod 이 ★과거 날짜일 때만 성립한다(평상시). 정직화 기능 도입 당일처럼
 *      직전값이 전부 today(시드)면 무변경 재빌드가 today 를 ★정당하게 유지하므로 S_today≠S_changed 가 정상.
 *      그래서 raw 집합 동치 대신 lastmodFor 계약(=실제 정직 규칙)을 직접 검증한다. 의도(거짓-today 차단) 동일·더 강함.
 *
 *   시드/최초 매니페스트(직전 스냅샷 없음) → 추적 시작점이라 예외 통과(PASS).
 *
 * ⚠️ 정직: 이 게이트는 lastmod 산출 구조만 검증한다. 어떤 수치/콘텐츠도 조작하지 않는다.
 * 양방향 검증: 정상 PASS + 위반(미변경 페이지 lastmod=today 위조 / 변경 페이지 lastmod 동결) 주입 시 FAIL.
 */
import fs from 'node:fs';
import path from 'node:path';

const CUR_PATH = path.resolve('scripts/.seo-lastmod.json');        // 이번 빌드 결과 {route:{hash,lastmod}}
const PREV_PATH = path.resolve('scripts/.seo-lastmod.prev.json');  // lastmodFor()가 비교한 직전값
const SITEMAP_PATH = path.resolve('dist/sitemap.xml');
// prerender-seo.mjs lastmodFor() 와 ★동일: const today = new Date().toISOString().slice(0,10)
const today = new Date().toISOString().slice(0, 10);

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
}

const current = readJson(CUR_PATH);
if (!current || Object.keys(current).length === 0) {
  console.error('\n❌ [SEO/정직] lastmod 정직 게이트 — 현재 매니페스트(.seo-lastmod.json)가 없음/비어있음. prerender 미실행?\n');
  process.exit(1);
}

const prev = readJson(PREV_PATH) || {};
if (Object.keys(prev).length === 0) {
  console.log(`✅ [SEO/정직] lastmod 정직 게이트 PASS — 직전 스냅샷 없음(시드/최초 추적 시작점) · ${Object.keys(current).length}개 추적 개시`);
  process.exit(0);
}

// ── lastmodFor() 계약 검증 ──
const falseToday = [];   // 미변경인데 lastmod=today 로 새로 찍힘(거짓 신선도 재발)
const tampered = [];     // 미변경인데 lastmod 이 직전값과 다름(today 도 아님 = 임의 변조)
const honestyMiss = [];  // 변경(신규 포함)인데 lastmod≠today(정직성 누락)
let sToday = 0, sChanged = 0;

for (const [route, cur] of Object.entries(current)) {
  if (cur.lastmod === today) sToday++;
  const p = prev[route];
  const changed = !p || p.hash !== cur.hash;
  if (changed) {
    sChanged++;
    if (cur.lastmod !== today) honestyMiss.push(`${route} (해시변경, lastmod=${cur.lastmod})`);
  } else {
    if (cur.lastmod !== p.lastmod) {
      if (cur.lastmod === today) falseToday.push(`${route} (직전 ${p.lastmod} → today 위조)`);
      else tampered.push(`${route} (직전 ${p.lastmod} → ${cur.lastmod})`);
    }
  }
}

// ── sitemap ↔ 매니페스트 lastmod 일치 (사이트맵 변조 차단) ──
const sitemapMismatch = [];
const sm = (() => { try { return fs.readFileSync(SITEMAP_PATH, 'utf8'); } catch { return ''; } })();
if (sm) {
  const BASE = 'https://nolcool.com';
  for (const m of sm.matchAll(/<url><loc>(.*?)<\/loc><lastmod>(.*?)<\/lastmod>/g)) {
    let route = m[1].replace(BASE, '').replace(/\/$/, '');  // trailing slash·BASE 제거 → 매니페스트 키
    if (route === '') route = '/';
    const cur = current[route];
    if (cur && cur.lastmod !== m[2]) sitemapMismatch.push(`${m[1]} sitemap=${m[2]} ≠ manifest=${cur.lastmod}`);
  }
}

const violations = falseToday.length + tampered.length + honestyMiss.length + sitemapMismatch.length;
if (violations) {
  console.error(`\n❌ [SEO/정직] lastmod 정직 게이트 FAIL (${violations}건) — S_today=${sToday} · S_changed=${sChanged}`);
  const dump = (title, arr) => {
    if (!arr.length) return;
    console.error(`\n  ${title} ${arr.length}건:`);
    arr.slice(0, 20).forEach(x => console.error(`     - ${x}`));
    if (arr.length > 20) console.error(`     ... 외 ${arr.length - 20}건`);
  };
  dump('🔴 거짓-today 재발 (미변경인데 lastmod=오늘):', falseToday);
  dump('🟠 lastmod 변조 (미변경인데 직전값과 다름):', tampered);
  dump('🟠 정직성 누락 (해시변경인데 lastmod≠오늘):', honestyMiss);
  dump('🔴 sitemap 변조 (매니페스트와 불일치):', sitemapMismatch);
  console.error('\nlastmod: 변경→오늘 / 미변경→직전값 유지. 거짓 신선도(매일 today 도배)는 Google 색인 약화. 배포 차단.\n');
  process.exit(1);
}

console.log(`✅ [SEO/정직] lastmod 정직 게이트 PASS — 변경 ${sChanged}개=today · 미변경 ${Object.keys(current).length - sChanged}개 직전 lastmod 유지 · 거짓-today 0 · sitemap 일치 (S_today=${sToday})`);
