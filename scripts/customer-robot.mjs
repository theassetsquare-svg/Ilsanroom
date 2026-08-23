#!/usr/bin/env node
/**
 * 🤖 손님 로봇 — 3인격(모바일 390·PC 1440·재방문) 상시 순찰 (2026-08-23 신설)
 *
 * 진짜 손님처럼 전 페이지를 사용(클릭·스크롤·검색·기여 "시도")하며
 * 죽은 버튼·깨짐·느림·막힘·모바일 격차 5유형을 자동 색출한다.
 * 빌드 명부(dist 스캔)를 7조각으로 나눠 매일 1조각(KST 요일) = 주 1바퀴 완주.
 *
 * ★3대 오염 방지 (전부 네트워크 계층에서 강제 + 로그 증명):
 *  1) 분석 오염 0 — google-analytics.com·googletagmanager.com·clarity.ms 등
 *     분석 도메인 요청을 요청단에서 차단(BLOCK_ANALYTICS) → 통계 유입 물리적 0.
 *     보조: headless의 navigator.webdriver=true → 사이트 자체 audit 차단(시즌161) 겹.
 *  2) 데이터 오염 0 — supabase·/api/ 로 가는 쓰기 요청(POST 등) 전부 차단.
 *     유일 예외 = /auth/v1/token (기존 테스트 계정 로그인 전용, 행 생성 없음).
 *     투표·후기·가입은 "클릭 → 카드/모달 렌더 확인"까지만. 제출은 물리적으로 불가능.
 *  3) 구글 흉내 0 — 순찰은 직접 URL 진입만. 검색엔진 접근 0.
 *
 * ★위험 클릭 차단(보강6): tel:·외부 링크·제출성 버튼(신고/삭제/전송/발행 등)은
 *   클릭하지 않는다 — 존재·href·렌더 검증까지만. 적중 내역은 riskSkips 로그로 증명.
 * ★재방문 로그인(보강7): 신규 계정 생성 절대 금지. ROBOT_TEST_EMAIL/PASSWORD 있을 때만
 *   기존 테스트 계정으로 로그인해 즐겨찾기·글쓰기 화면 도달 검증(제출 0). 없으면 ⚠️ 정직 표기.
 * ★시간 예산(보강8): 기본 180분. 초과 시 체크포인트 저장 → 다음 실행이 이어받음(누락 0).
 *   심층(클릭 전수+여정)=모바일 인격 전 페이지, PC=페이지 유형별 대표 3장.
 * ★느림 판정(보강9): 절대값 X — 페이지 자기 기준선(EMA) 대비 악화율(+80%)로만.
 *   기준선 축적 14일까지는 수집 모드(판정 보류). 스크린샷은 /tmp(저장소 밖).
 *
 * 사용:
 *   node scripts/customer-robot.mjs                       # 오늘(KST 요일) 조각 라이브 순찰
 *   node scripts/customer-robot.mjs --shard 3             # 조각 지정(0=일 ~ 6=토)
 *   node scripts/customer-robot.mjs --base http://localhost:4173 --no-save   # 로컬 드릴
 *   node scripts/customer-robot.mjs --refresh-manifest    # dist/ 스캔 → 명부 갱신(매주 월)
 *   node scripts/customer-robot.mjs --limit 10            # 상한(디버그)
 *   node scripts/customer-robot.mjs --budget-min 60       # 시간 예산(분) 변경
 *
 * 환경: CHROMIUM_PATH(선택) · RESEND_API_KEY+SUPABASE_SERVICE_KEY(치명 즉시메일+데둡)
 *       ROBOT_TEST_EMAIL/ROBOT_TEST_PASSWORD(선택 — 재방문 로그인 검증)
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const arg = (k, dflt) => { const i = args.indexOf(k); return i < 0 ? dflt : args[i + 1]; };
const has = (k) => args.includes(k);

const BASE = arg('--base', 'https://nolcool.com');
const LIMIT = parseInt(arg('--limit', '0'), 10);
const NO_SAVE = has('--no-save');
const BUDGET_MS = parseInt(arg('--budget-min', '180'), 10) * 60e3;
const DATA_DIR = `${ROOT}data/customer-robot`;
const MANIFEST = `${DATA_DIR}/manifest.json`;
const BASELINE = `${DATA_DIR}/baseline.json`;
const CHECKPOINT = `${DATA_DIR}/checkpoint.json`;
const SHOT_DIR = '/tmp/robot-shots'; // 저장소 밖(비대화 방지)

// ── 상한 상수 (정직: 초과분은 dropped 로 기록, 침묵 컷 없음) ──
const MAX_CLICK_TESTS_PER_PAGE = 25;   // 실클릭 판정 상한
const MAX_SCREENSHOTS = 30;            // 채증 상한/런
const NAV_TIMEOUT = 25000;
const SLOW_WORSEN_RATIO = 1.8;         // 기준선 대비 +80% 악화 = 느림
const BASELINE_WARMUP_DAYS = 14;       // 초기 2주 = 수집 모드(판정 보류)
const BASELINE_MIN_SAMPLES = 3;

// 분석 도메인(요청 차단 = 통계 유입 0) — 보강9 명시 3종 + 광고 계열
const BLOCK_ANALYTICS = ['google-analytics.com', 'googletagmanager.com', 'analytics.google.com', 'clarity.ms', 'doubleclick.net', 'googleadservices.com', 'stats.g.doubleclick'];
// 쓰기 차단 대상 호스트/경로 (GET/HEAD/OPTIONS 만 허용, 유일 예외 = 로그인 토큰)
const WRITE_GUARD = ['supabase.co', '/api/'];
const WRITE_ALLOW_PATHS = ['/auth/v1/token']; // 기존 계정 로그인만(행 생성 없음). signup 등은 계속 차단
// 제출성·위험 버튼 — 클릭 금지, 존재 검증만 (보강6)
const RISK_CLICK_RE = /신고|삭제|전송|발행|제출|보내기|탈퇴|결제|구매|주문|발신|통화/;
// 자급자족 감사 허용 외부 링크 (tel: 별도)
const EXTERNAL_ALLOW = ['nolcool.com', 'ilsanroom.pages.dev'];

const kstNow = () => new Date(Date.now() + 9 * 3600e3);
const kstDate = () => kstNow().toISOString().slice(0, 10);
const monthKey = () => kstDate().slice(0, 7);

function findChromium() {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) return process.env.CHROMIUM_PATH;
  for (const c of ['/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']) if (existsSync(c)) return c;
  try {
    const w = execSync('which chromium 2>/dev/null || which google-chrome 2>/dev/null || which chromium-browser 2>/dev/null', { encoding: 'utf8' }).trim().split('\n')[0];
    if (w && existsSync(w)) return w;
  } catch { /* none */ }
  throw new Error('chromium 실행파일을 못 찾음 — CHROMIUM_PATH 지정 필요');
}

/* ── 명부: dist/ 스캔 (매주 월요일 워크플로가 빌드 후 갱신) ── */
function refreshManifest() {
  const dist = `${ROOT}dist`;
  if (!existsSync(dist)) throw new Error('dist/ 없음 — npm run build 먼저');
  const routes = [];
  (function walk(dir, rel) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(`${dir}/${e.name}`, `${rel}${e.name}/`);
      else if (e.name === 'index.html') routes.push(rel || '/');
    }
  })(dist, '/');
  // /admin 은 비번 게이트라 순찰 제외(로그인 시도 오염 방지) — 제외분도 정직 기록
  const excluded = routes.filter((r) => r.startsWith('/admin'));
  const included = routes.filter((r) => !r.startsWith('/admin')).sort();
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify({ generatedAt: kstDate(), total: included.length, excludedAdmin: excluded.length, routes: included }, null, 2) + '\n');
  console.log(`📇 명부 갱신: ${included.length}장 (admin 제외 ${excluded.length}) → data/customer-robot/manifest.json`);
  return included;
}

/* ── 느림 기준선(보강9): 페이지별 EMA — 절대값 판정 금지 ── */
function loadBaseline() {
  if (existsSync(BASELINE)) return JSON.parse(readFileSync(BASELINE, 'utf8'));
  return { startedAt: kstDate(), routes: {} };
}
function baselineActive(bl) {
  return (Date.now() - new Date(bl.startedAt).getTime()) >= BASELINE_WARMUP_DAYS * 86400e3;
}
function judgeSlow(bl, key, ms) {
  const b = bl.routes[key];
  const judgeable = baselineActive(bl) && b && b.n >= BASELINE_MIN_SAMPLES;
  const slow = judgeable && ms > b.ema * SLOW_WORSEN_RATIO ? 1 : 0;
  // EMA 갱신(느림 감지된 이상치는 기준선을 오염시키지 않게 제외)
  if (!slow) {
    if (!bl.routes[key]) bl.routes[key] = { ema: ms, n: 1 };
    else { const e = bl.routes[key]; e.ema = Math.round(e.ema * 0.7 + ms * 0.3); e.n++; }
  }
  return { slow, mode: judgeable ? 'active' : 'collecting' };
}

/* ── PC 인격 대표 표본(보강8): 페이지 유형별 3장 ── */
function pageType(route) {
  if (route === '/') return 'home';
  if (/^\/(clubs|nights|rooms|yojeong|lounges|hoppa)\/$/.test(route)) return 'hub';
  if (/^\/(clubs|nights|rooms|yojeong|lounges|hoppa)\//.test(route)) return 'venue';
  if (route.startsWith('/community/')) return 'community';
  if (route.startsWith('/magazine/')) return 'magazine';
  if (route.startsWith('/guide/')) return 'guide';
  if (/^\/[^/]+\/$/.test(route)) return 'top';
  return 'etc';
}
function pickPcSample(routes) {
  const byType = {};
  for (const r of routes) { const t = pageType(r); (byType[t] ||= []).push(r); }
  const set = new Set();
  for (const t of Object.keys(byType)) for (const r of byType[t].slice(0, 3)) set.add(r);
  return set;
}

/* ── venues.ts: 전화바 기대 목록(staffPhone 있는 업소) — 읽기만, 번호 불가침 ── */
function phoneVenueSlugs() {
  const src = readFileSync(`${ROOT}src/data/venues.ts`, 'utf8');
  const set = new Set();
  for (const b of src.split(/\n\s*\{\s*\n\s*id:\s*'v-/).slice(1)) {
    const slug = (b.match(/slug:\s*['"]([^'"]+)['"]/) || [])[1];
    if (slug && /staffPhone:\s*['"]01\d/.test(b)) set.add(slug);
  }
  return set;
}

/* ── 네트워크 가드(공통): 분석 차단 + 쓰기 차단(로그인 토큰만 예외) ── */
function armNetworkGuard(page, ctx) {
  page.on('request', (req) => {
    const u = req.url();
    if (BLOCK_ANALYTICS.some((d) => u.includes(d))) { ctx.blockedAnalytics.push(u.slice(0, 90)); return req.abort(); }
    const isWriteTarget = WRITE_GUARD.some((d) => u.includes(d));
    const isLoginToken = WRITE_ALLOW_PATHS.some((p) => u.includes(p));
    if (isWriteTarget && !isLoginToken && !['GET', 'HEAD', 'OPTIONS'].includes(req.method())) {
      ctx.blockedWrites.push(`${req.method()} ${u.slice(0, 90)}`); return req.abort();
    }
    req.continue();
  });
}

/* ── 페이지 1장 심층 순찰 ── */
async function patrolPage(browser, route, persona, ctx) {
  const url = `${BASE}${route}`;
  const page = await browser.newPage();
  const result = { route, persona: persona.name, loadMs: null, slowMode: null, status: null, consoleErrors: [], jsErrors: [], failedReqs: [], brokenImgs: 0, overflowPx: 0, deadButtons: [], redirectLinks: [], externalLinks: [], telLinks: 0, riskSkips: [], journey: {}, clickStats: null, screenshots: [] };
  try {
    await page.setViewport(persona.viewport);
    if (persona.ua) await page.setUserAgent(persona.ua);
    await page.setRequestInterception(true);
    armNetworkGuard(page, ctx);
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      // 우리가 의도적으로 차단(abort)한 분석·쓰기 요청의 ERR_FAILED 잔향은 깨짐이 아님
      const locUrl = m.location()?.url || '';
      if (m.text().includes('net::ERR_FAILED') && (BLOCK_ANALYTICS.some((d) => locUrl.includes(d)) || WRITE_GUARD.some((d) => locUrl.includes(d)) || locUrl === '')) return;
      result.consoleErrors.push(m.text().slice(0, 140));
    });
    page.on('pageerror', (e) => result.jsErrors.push(String(e).slice(0, 140)));
    page.on('response', (r) => {
      const s = r.status();
      if (s >= 400 && !BLOCK_ANALYTICS.some((d) => r.url().includes(d))) result.failedReqs.push(`${s} ${r.url().slice(0, 90)}`);
    });

    const t0 = Date.now();
    const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT });
    result.loadMs = Date.now() - t0;
    result.status = resp ? resp.status() : null;
    await new Promise((r) => setTimeout(r, 600));

    // ① 기술: 깨진 이미지 · 가로 넘침
    // (글자박스 겹침 휴리스틱은 라이브 실측에서 디자인 스택 오탐만 생산 → 폐기.
    //  "하단 고정바가 본문 마지막 줄 가림" 실함정은 여정 끝스크롤 후 bottomCovered 로 정밀 검사)
    const tech = await page.evaluate(() => {
      const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src.startsWith('http')).length;
      const overflow = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
      return { broken, overflow };
    });
    result.brokenImgs = tech.broken; result.overflowPx = tech.overflow;

    if (persona.deep) {
      // ② 클릭 전수: 링크=명부 대조(클릭 X — 이동 낭비 0), 비링크 클릭러블=핸들러+실클릭 판정
      const clickables = await page.evaluate(() => {
        const out = [];
        const seen = new Set();
        // summary 는 네이티브 토글(핸들러 불필요)이라 죽음 후보에서 제외
        for (const el of document.querySelectorAll('a,button,[role="button"],[role="tab"]')) {
          const r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) continue;
          const key = (el.tagName + '|' + (el.getAttribute('href') || '') + '|' + el.textContent.trim().slice(0, 30));
          if (seen.has(key)) continue; seen.add(key);
          const hasReactHandler = Object.keys(el).some((k) => k.startsWith('__reactProps') && el[k]?.onClick) ||
            Object.keys(el).some((k) => k.startsWith('__reactEventHandlers') && el[k]?.onClick);
          out.push({
            tag: el.tagName, text: el.textContent.trim().slice(0, 40),
            href: el.getAttribute('href'), type: el.getAttribute('type'),
            hasHandler: !!(hasReactHandler || el.onclick || el.closest('form')),
          });
        }
        // cursor:pointer 인데 위 목록에 없는 유사 버튼(칩/카드) — 상한 초과분은 dropped 로 정직 기록
        let extra = 0, pointerDropped = 0;
        for (const el of document.querySelectorAll('div,span,li')) {
          if (getComputedStyle(el).cursor !== 'pointer') continue;
          if (el.closest('a,button,[role="button"]')) continue;
          if (el.parentElement && getComputedStyle(el.parentElement).cursor === 'pointer') continue; // cursor 상속 자식 — 최외곽 pointer 요소로 대표
          const r = el.getBoundingClientRect(); if (r.width < 20 || r.height < 14) continue;
          if (extra >= 150) { pointerDropped++; continue; }
          const hasReactHandler = Object.keys(el).some((k) => k.startsWith('__reactProps') && el[k]?.onClick);
          out.push({ tag: el.tagName + '.pointer', text: el.textContent.trim().slice(0, 40), href: null, hasHandler: !!(hasReactHandler || el.onclick) });
          extra++;
        }
        return { list: out, pointerDropped };
      });
      const { list: clickList, pointerDropped } = clickables;
      const links = clickList.filter((c) => c.href);
      const nonLinks = clickList.filter((c) => !c.href);
      for (const l of links) {
        const h = l.href;
        if (h.startsWith('tel:')) { result.telLinks++; continue; }            // 보강6: 존재 검증만, 클릭 절대 X
        if (/^(mailto:|#)/.test(h)) continue;
        if (/^https?:\/\//.test(h) && !EXTERNAL_ALLOW.some((d) => h.includes(d))) result.externalLinks.push(h.slice(0, 100)); // ④ 자급자족(클릭 X)
        else if (h.startsWith('/')) {
          const clean = h.split('?')[0].split('#')[0];
          const norm = clean.endsWith('/') ? clean : clean + '/';
          if (!ctx.routeSet.has(norm) && !ctx.routeSet.has(clean) && !ctx.dynamicOk(clean)) {
            // 명부 밖 = 실제 fetch 최종 판정(읽기 1회·캐시): 3xx 자동연결=죽음 아님(정식 URL 직결 권장으로만 보고), 4xx만 죽음
            let st = ctx.linkCache.get(norm);
            if (st === undefined) {
              st = await fetch(`${BASE}${norm}`, { redirect: 'manual' }).then((r) => r.status).catch(() => 0);
              ctx.linkCache.set(norm, st);
            }
            if (st >= 300 && st < 400) result.redirectLinks.push({ text: l.text, href: h });
            else if (st < 200 || st >= 400) result.deadButtons.push({ kind: 'link-404', text: l.text, href: h, status: st });
          }
        }
      }
      // 핸들러 없는 비링크 = 죽음 후보 → 실클릭으로 최종 판정 (상한 내)
      // 보강6: 제출성·위험 버튼(신고/삭제/전송/발행 등)·submit 타입은 클릭 금지 → riskSkips 로그
      const candidates = nonLinks.filter((c) => !c.hasHandler);
      const suspects = [];
      for (const c of candidates) {
        if (RISK_CLICK_RE.test(c.text) || c.type === 'submit') { result.riskSkips.push({ text: c.text.slice(0, 30), tag: c.tag }); continue; }
        suspects.push(c);
      }
      let tested = 0;
      for (const s of suspects) {
        if (tested >= MAX_CLICK_TESTS_PER_PAGE) break;
        tested++;
        try {
          const verdict = await page.evaluate(async (probe) => {
            const els = [...document.querySelectorAll(probe.tag.replace('.pointer', ''))];
            const el = els.find((e) => e.textContent.trim().slice(0, 40) === probe.text);
            if (!el) return 'gone';
            // 스크롤 유발 mutation(헤더·lazy-load)이 클릭 효과로 오인되지 않게: 먼저 스크롤 → 정착 대기
            el.scrollIntoView({ block: 'center' });
            await new Promise((r) => setTimeout(r, 450));
            const count = async () => {
              let n = 0;
              const mo = new MutationObserver((recs) => { n += recs.length; });
              mo.observe(document.body, { subtree: true, childList: true, attributes: true });
              await new Promise((r) => setTimeout(r, 700));
              mo.disconnect();
              return n;
            };
            // 대조창(클릭 없음) vs 클릭창 — 진행바 등 상시 애니메이션 노이즈는 양쪽에 동일하게 실려 상쇄
            const ctrl = await count();
            const beforeUrl = location.href;
            el.click();
            const post = await count();
            return (post > ctrl + 2 || location.href !== beforeUrl) ? 'alive' : 'dead';
          }, s);
          if (verdict === 'dead') result.deadButtons.push({ kind: 'no-handler', text: s.text, tag: s.tag });
          if (page.url() !== url) { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT }).catch(() => {}); }
        } catch { /* 클릭 실패는 판정 보류 */ }
      }
      result.clickStats = { total: clickList.length, links: links.length, suspects: suspects.length, riskSkipped: result.riskSkips.length, tested, dropped: Math.max(0, suspects.length - tested), pointerDropped };

      // ③ 손님 여정
      const j = result.journey;
      await page.evaluate(async () => { // 끝까지 스크롤
        for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise((r) => setTimeout(r, 400));
      // 하단 고정바가 본문 마지막 줄을 가리는지 (문서화된 실함정 — 끝까지 스크롤한 상태에서 실측)
      j.bottomCovered = await page.evaluate(async () => {
        // lazy 로딩으로 페이지가 늘어났을 수 있음 — 진짜 바닥에 닿을 때까지 스크롤 안정화
        let prev = -1;
        for (let i = 0; i < 8 && window.scrollY !== prev; i++) {
          prev = window.scrollY;
          window.scrollTo(0, document.documentElement.scrollHeight);
          await new Promise((r) => setTimeout(r, 250));
        }
        const bars = [...document.querySelectorAll('div,nav,footer,section')].filter((el) => {
          const cs = getComputedStyle(el);
          if (cs.position !== 'fixed' && cs.position !== 'sticky') return false;
          const r = el.getBoundingClientRect();
          return r.height > 20 && r.height < 220 && r.bottom > window.innerHeight - 8 && r.width > window.innerWidth * 0.5;
        });
        if (!bars.length) return 'no-bar';
        const barTop = Math.min(...bars.map((b) => b.getBoundingClientRect().top));
        const texts = [...document.querySelectorAll('p,h2,h3,li,a,button')].filter((e) => e.textContent.trim().length > 5 && !bars.some((b) => b.contains(e)) && (e.checkVisibility ? e.checkVisibility() : true));
        const lastBottom = Math.max(0, ...texts.map((e) => e.getBoundingClientRect().bottom).filter((v) => isFinite(v)));
        return lastBottom > barTop + 6 ? 'COVERED' : 'ok';
      }).catch(() => 'n/a');
      const slugMatch = route.match(/\/([a-z0-9-]+)\/$/);
      if (slugMatch && ctx.phoneSlugs.has(slugMatch[1])) { // 전화바 고정 유지(광고 업소만) — 렌더 검증만, 발신 0
        j.phoneBar = await page.evaluate(() => {
          const tels = [...document.querySelectorAll('a[href^="tel:"]')];
          return tels.some((a) => { const r = a.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight + 2 && r.height > 8; }) ? 'ok' : 'MISSING';
        });
      }
      j.nextContent = await page.evaluate(() => { // "다음 볼거리" 존재+href
        const cand = [...document.querySelectorAll('a')].find((a) => /다음|더 보|추천|볼거리|이어서/.test(a.textContent) && a.getAttribute('href')?.startsWith('/'));
        return cand ? 'ok' : 'none';
      });
      if (route === '/') { // 검색 자동완성 (홈만)
        j.search = await page.evaluate(async () => {
          const input = document.querySelector('input[type="search"],input[placeholder*="검색"],input[placeholder*="가게"]');
          if (!input) return 'no-input';
          input.focus();
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, '일산');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          await new Promise((r) => setTimeout(r, 900));
          return document.body.textContent.includes('일산룸') || document.querySelector('[class*="suggest"],[class*="autocomplete"],[role="listbox"]') ? 'ok' : 'NO-SUGGEST';
        });
      }
      // 비회원 기여 시도 → 인라인 가입/로그인 카드 렌더 확인 (제출 0 — 쓰기요청은 어차피 차단)
      j.contribGate = await page.evaluate(async (riskSrc) => {
        const riskRe = new RegExp(riskSrc);
        const voteBtn = [...document.querySelectorAll('button')].find((b) => /투표|한 줄|후기/.test(b.textContent) && !riskRe.test(b.textContent) && !b.disabled);
        if (!voteBtn) return 'n/a';
        voteBtn.click();
        await new Promise((r) => setTimeout(r, 700));
        return /로그인|회원|가입/.test(document.body.textContent) ? 'ok' : 'NO-CARD';
      }, RISK_CLICK_RE.source).catch(() => 'n/a');
      // 뒤로가기 정상(여정 마지막)
      j.back = 'ok'; // SPA 내 실이동은 클릭 판정에서 즉시 복귀 처리 — 이동 발생 시 goto 복귀 성공이 곧 back ok
    }

    // 느림 판정(보강9): 자기 기준선 대비 — 결과에 모드 기록
    const bl = ctx.baseline;
    const { slow, mode } = judgeSlow(bl, `${route}|${persona.name}`, result.loadMs);
    result.slow = slow; result.slowMode = mode;

    // 채증 (문제 있을 때만, 상한 내, 저장소 밖 /tmp)
    const hasIssue = result.status >= 400 || result.brokenImgs > 0 || result.overflowPx > 4 || result.journey.bottomCovered === 'COVERED' || result.deadButtons.length > 0 || result.jsErrors.length > 0 || result.journey.phoneBar === 'MISSING';
    if (hasIssue && ctx.shots < MAX_SCREENSHOTS) {
      const f = `${SHOT_DIR}/${route.replace(/[^a-z0-9]+/gi, '_')}-${persona.name}.png`;
      mkdirSync(SHOT_DIR, { recursive: true });
      await page.screenshot({ path: f, fullPage: false }).catch(() => {});
      result.screenshots.push(f); ctx.shots++;
    }
  } catch (e) {
    result.jsErrors.push(`PATROL-FAIL: ${String(e).slice(0, 120)}`);
  } finally {
    await page.close().catch(() => {});
  }
  return result;
}

/* ── ③ 재방문 손님: 홈→(로그인)→즐겨찾기→커뮤니티 글쓰기 화면 (런당 1회, 제출 0) ── */
async function revisitJourney(browser, ctx) {
  const page = await browser.newPage();
  const log = [];
  const EMAIL = process.env.ROBOT_TEST_EMAIL, PW = process.env.ROBOT_TEST_PASSWORD;
  try {
    await page.setViewport({ width: 390, height: 844 });
    await page.setRequestInterception(true);
    armNetworkGuard(page, ctx);
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT });
    log.push('홈 진입 ok');
    const venueHref = await page.evaluate(() => [...document.querySelectorAll('a[href*="/nights/"],a[href*="/rooms/"],a[href*="/clubs/"]')].map((a) => a.getAttribute('href')).find((h) => h && h.split('/').filter(Boolean).length >= 2));
    if (venueHref) {
      await page.goto(`${BASE}${venueHref}`, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT });
      log.push(`venue 상세 ok (${venueHref})`);
      await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
      log.push('뒤로가기 ok');
    } else log.push('⚠️ 홈에서 venue 링크 미발견');

    if (EMAIL && PW) {
      // 보강7: 신규 가입 절대 금지 — 보존된 기존 테스트 계정으로만 로그인(행 생성 없는 token grant만 허용됨)
      await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT });
      // 로그인 클릭이 SPA 네비게이션을 일으키면 evaluate 컨텍스트가 파괴됨 — 정상 흐름이므로 잡고 진행
      const loggedIn = await page.evaluate(async (email, pw) => {
        const emailIn = document.querySelector('input[type="email"],input[name="email"]');
        const pwIn = document.querySelector('input[type="password"]');
        if (!emailIn || !pwIn) return 'no-form';
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(emailIn, email); emailIn.dispatchEvent(new Event('input', { bubbles: true }));
        set.call(pwIn, pw); pwIn.dispatchEvent(new Event('input', { bubbles: true }));
        const btn = [...document.querySelectorAll('button')].find((b) => /로그인/.test(b.textContent));
        if (!btn) return 'no-btn';
        btn.click();
        await new Promise((r) => setTimeout(r, 3500));
        return 'clicked';
      }, EMAIL, PW).catch((e) => (/context was destroyed|Execution context/i.test(String(e)) ? 'navigated' : `err:${String(e).slice(0, 60)}`));
      await new Promise((r) => setTimeout(r, 2500));
      const authed = await page.evaluate(() => Object.keys(localStorage).some((k) => k.includes('auth-token') || k.startsWith('sb-') || k === 'nolcool-auth')).catch(() => false);
      log.push(authed ? '로그인 ok(기존 테스트 계정)' : `⚠️ 로그인 실패(${loggedIn})`);
      if (authed) {
        await page.goto(`${BASE}/my/favorites`, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT });
        const favOk = await page.evaluate(() => document.body.textContent.length > 200 && !/404/.test(document.title));
        log.push(favOk ? '즐겨찾기 화면 도달 ok' : '⚠️ 즐겨찾기 화면 이상');
        await page.goto(`${BASE}/community/free`, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT });
        const writeOk = await page.evaluate(async (riskSrc) => {
          const riskRe = new RegExp(riskSrc);
          const btn = [...document.querySelectorAll('a,button')].find((b) => /글쓰기|글 쓰기|작성/.test(b.textContent) && !riskRe.test(b.textContent));
          if (!btn) return 'no-write-btn';
          btn.click();
          await new Promise((r) => setTimeout(r, 1200));
          return document.querySelector('textarea,[contenteditable="true"],input[placeholder*="제목"]') ? 'ok' : 'no-editor';
        }, RISK_CLICK_RE.source);
        log.push(writeOk === 'ok' ? '글쓰기 화면 도달 ok(제출 0)' : `⚠️ 글쓰기 화면: ${writeOk}`);
      }
    } else {
      log.push('⚠️ 로그인 동선 미검증(테스트 계정 부재) — 비로그인 가입 카드 확인으로 대체');
    }

    await page.goto(`${BASE}/community/`, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT });
    const commOk = await page.evaluate(() => document.body.textContent.length > 500);
    log.push(commOk ? '커뮤니티 진입 ok' : '⚠️ 커뮤니티 본문 빈약');
  } catch (e) {
    log.push(`FAIL: ${String(e).slice(0, 100)}`);
  } finally { await page.close().catch(() => {}); }
  return log;
}

/* ── 치명 즉시메일 (데둡: _ops_mail_flags robot_critical) ── */
async function criticalAlert(criticals) {
  const RESEND = process.env.RESEND_API_KEY, SKEY = process.env.SUPABASE_SERVICE_KEY, TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
  const SUPA = process.env.SUPABASE_URL || 'https://rkqnblbajhnehmxfnvri.supabase.co';
  const sig = criticals.map((c) => c.key).sort().join('|') || 'ok';
  if (!SKEY) { console.log(`⚠️ SUPABASE_SERVICE_KEY 없음 — 데둡 불가, 메일 스킵 (치명 ${criticals.length}건 로그만)`); return; }
  const headers = { apikey: SKEY, Authorization: `Bearer ${SKEY}`, 'Content-Type': 'application/json' };
  let last = null;
  try {
    const r = await fetch(`${SUPA}/rest/v1/_ops_mail_flags?k=eq.robot_critical&select=v`, { headers });
    if (r.ok) last = (await r.json())[0]?.v ?? null;
  } catch { /* 안전측 발송 */ }
  try {
    await fetch(`${SUPA}/rest/v1/rpc/exec_sql`, { method: 'POST', headers, body: JSON.stringify({ query: `INSERT INTO public._ops_mail_flags (k,v,updated_at) VALUES ('robot_critical','${sig.replace(/'/g, "''")}',now()) ON CONFLICT (k) DO UPDATE SET v=EXCLUDED.v, updated_at=now();` }) });
  } catch { /* flag 저장 실패해도 진행 */ }
  if (!criticals.length) return;
  if (last === sig) { console.log(`🔇 동일 치명 상태 반복 (${sig}) — 데둡: 메일 스킵`); return; }
  if (!RESEND) { console.log('⚠️ RESEND_API_KEY 없음 — 메일 스킵'); return; }
  const html = `<div style="font-family:sans-serif"><h2 style="color:#DC2626">🤖 손님 로봇 치명 감지 ${criticals.length}건 (${kstDate()})</h2><ul>${criticals.map((c) => `<li><b>${c.key}</b>: ${c.detail}</li>`).join('')}</ul><p style="font-size:12px;color:#666">동일 상태 반복 시 재발송하지 않습니다(데둡). 상세: data/monthly-inbox/customer-robot/</p></div>`;
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO], subject: `[놀쿨][🤖🛑] 손님 로봇 치명 ${criticals.length}건`, html }) });
  console.log(`📧 치명 메일: ${r.status}`);
}

(async () => {
  if (has('--refresh-manifest')) { refreshManifest(); if (!has('--and-patrol')) return; }
  if (!existsSync(MANIFEST)) { console.error('❌ 명부 없음 — --refresh-manifest 먼저'); process.exit(1); }
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const dow = has('--shard') ? parseInt(arg('--shard', '0'), 10) : kstNow().getUTCDay();
  let shard = manifest.routes.filter((_, i) => i % 7 === dow);

  // 보강8: 이전 실행 미완주분(체크포인트) 이어받기 — 누락 0
  let carryover = [];
  if (existsSync(CHECKPOINT) && !NO_SAVE) {
    try {
      const cp = JSON.parse(readFileSync(CHECKPOINT, 'utf8'));
      carryover = (cp.pending || []).filter((r) => !shard.includes(r));
      if (carryover.length) console.log(`🔁 체크포인트 이어받기: 조각 ${cp.shard} 잔여 ${carryover.length}장 선행 처리`);
    } catch { /* 손상 체크포인트는 무시 */ }
  }
  let queue = [...carryover, ...shard];
  if (LIMIT > 0) queue = queue.slice(0, LIMIT);
  console.log(`🤖 손님 로봇 순찰 — ${kstDate()} · 조각 ${dow}/7 · ${queue.length}장(이월 ${carryover.length}) / 명부 ${manifest.total}장 (${manifest.generatedAt} 갱신) · base=${BASE} · 예산 ${Math.round(BUDGET_MS / 60e3)}분`);

  const routeSet = new Set(manifest.routes);
  const baseline = loadBaseline();
  const ctx = {
    routeSet, shots: 0, blockedAnalytics: [], blockedWrites: [], baseline, linkCache: new Map(),
    phoneSlugs: phoneVenueSlugs(),
    // 명부에 없어도 정상인 동적 경로(검색·필터 등)
    dynamicOk: (p) => /^\/(search|login|signup|my|lead)/.test(p),
  };
  const pcSample = pickPcSample(queue); // 보강8: PC=유형별 대표 3장

  const browser = await puppeteer.launch({ executablePath: findChromium(), headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const MOBILE = { name: 'mobile', viewport: { width: 390, height: 844 }, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', deep: true };
  const PC = { name: 'pc', viewport: { width: 1440, height: 900 }, deep: false };

  const started = Date.now();
  const pages = [];
  let done = 0, partial = false;
  for (const route of queue) {
    if (Date.now() - started > BUDGET_MS) { partial = true; break; } // 보강8: 예산 초과 → 체크포인트
    const perPage = { route, personas: {} };
    perPage.personas.mobile = await patrolPage(browser, route, MOBILE, ctx);
    if (pcSample.has(route)) perPage.personas.pc = await patrolPage(browser, route, PC, ctx);
    pages.push(perPage);
    done++;
    if (done % 10 === 0) console.log(`  … ${done}/${queue.length} (${Math.round((Date.now() - started) / 60e3)}분 경과)`);
  }
  const revisit = await revisitJourney(browser, ctx);
  await browser.close();

  // 체크포인트 저장/해소
  if (!NO_SAVE) {
    mkdirSync(DATA_DIR, { recursive: true });
    if (partial) {
      const pending = queue.slice(done);
      writeFileSync(CHECKPOINT, JSON.stringify({ savedAt: kstDate(), shard: dow, pending }, null, 2) + '\n');
      console.log(`⏸️ 예산 초과 — 잔여 ${pending.length}장 체크포인트 저장(다음 실행이 이어받음)`);
    } else if (existsSync(CHECKPOINT)) { unlinkSync(CHECKPOINT); console.log('✅ 체크포인트 해소(잔여 0)'); }
    writeFileSync(BASELINE, JSON.stringify(baseline, null, 2) + '\n');
  }

  // ── 채점(5유형) ──
  const score = (p) => {
    const m = p.personas.mobile, pc = p.personas.pc;
    return {
      broken: (m.brokenImgs + m.consoleErrors.length + m.failedReqs.length + (m.status >= 400 ? 1 : 0)),
      dead: m.deadButtons.length,
      slow: (m.slow || 0) + (pc?.slow || 0), // 보강9: 자기 기준선 대비만(수집 모드=0)
      blocked: ['phoneBar', 'search', 'contribGate'].filter((k) => m.journey[k] && !['ok', 'n/a', 'none', 'no-input'].includes(m.journey[k])).length,
      mobileGap: (m.overflowPx > 4 ? 1 : 0) + (m.journey.bottomCovered === 'COVERED' ? 1 : 0),
    };
  };
  const graded = pages.map((p) => ({ route: p.route, grades: score(p), detail: p }));
  const problems = graded.filter((g) => Object.entries(g.grades).some(([, v]) => v > 0));
  const totals = graded.reduce((a, g) => { for (const k of Object.keys(g.grades)) a[k] = (a[k] || 0) + g.grades[k]; return a; }, {});
  const blMode = baselineActive(baseline) ? 'active' : `collecting(~${BASELINE_WARMUP_DAYS}일)`;
  const riskSkipsAll = graded.flatMap((g) => g.detail.personas.mobile.riskSkips.map((r) => ({ route: g.route, ...r })));

  console.log(`\n📊 성적표: ${done}/${queue.length}장 중 문제 ${problems.length}장 — 깨짐 ${totals.broken || 0} · 죽음 ${totals.dead || 0} · 느림 ${totals.slow || 0}(기준선 ${blMode}) · 막힘 ${totals.blocked || 0} · 모바일격차 ${totals.mobileGap || 0}`);
  console.log(`🛡️ 분석 차단 ${ctx.blockedAnalytics.length}건 · 쓰기 차단 ${ctx.blockedWrites.length}건 · 위험클릭 스킵 ${riskSkipsAll.length}건 (GA4·Clarity 유입 0 / 제출 0 / 위험 무클릭 — 전부 로그 증명)`);
  for (const p of problems.slice(0, 20)) console.log(`  ⚠️ ${p.route} — ${JSON.stringify(p.grades)}`);
  console.log(`🧭 재방문 여정: ${revisit.join(' → ')}`);

  // ── 치명 판정 ──
  const criticals = [];
  const hubs = ['/', '/clubs/', '/nights/', '/rooms/', '/yojeong/', '/lounges/', '/hoppa/'];
  for (const g of graded) {
    if (hubs.includes(g.route) && g.detail.personas.mobile.status >= 500) criticals.push({ key: `hub-5xx:${g.route}`, detail: `HTTP ${g.detail.personas.mobile.status}` });
    if (g.detail.personas.mobile.journey.phoneBar === 'MISSING') criticals.push({ key: `phonebar:${g.route}`, detail: '전화바 소실' });
  }
  const notFound = graded.filter((g) => g.detail.personas.mobile.status === 404).length;
  if (notFound >= Math.max(5, Math.round(done * 0.1))) criticals.push({ key: '404-spike', detail: `${notFound}/${done}` });
  const jsErrPages = graded.filter((g) => g.detail.personas.mobile.jsErrors.length > 0).length;
  if (jsErrPages >= Math.round(done * 0.3) && done >= 10) criticals.push({ key: 'js-error-spike', detail: `${jsErrPages}/${done}` });
  if (BASE.includes('nolcool.com')) await criticalAlert(criticals);
  else if (criticals.length) console.log(`(로컬 드릴 — 치명 ${criticals.length}건 메일 억제)`);

  // ── 저장 (30일 1통: monthly-inbox 축적, 메일 0) ──
  if (!NO_SAVE) {
    const dir = `${ROOT}data/monthly-inbox/customer-robot/${monthKey()}`;
    mkdirSync(dir, { recursive: true });
    const out = {
      date: kstDate(), shard: dow, pagesPatrolled: done, queued: queue.length, carryover: carryover.length, partial,
      manifestTotal: manifest.total, baselineMode: blMode, pcSampled: pcSample.size,
      totals, problemPages: problems.length,
      blockedAnalytics: ctx.blockedAnalytics.length, blockedWrites: ctx.blockedWrites.length,
      riskSkips: riskSkipsAll.slice(0, 40), riskSkipTotal: riskSkipsAll.length,
      criticals, revisit,
      problems: problems.map((p) => ({ route: p.route, grades: p.grades,
        issues: {
          dead: p.detail.personas.mobile.deadButtons.slice(0, 8),
          console: p.detail.personas.mobile.consoleErrors.slice(0, 4),
          external: p.detail.personas.mobile.externalLinks.slice(0, 6),
          journey: p.detail.personas.mobile.journey,
          shots: [...p.detail.personas.mobile.screenshots, ...(p.detail.personas.pc?.screenshots || [])],
        } })),
      externalLinksAll: [...new Set(graded.flatMap((g) => g.detail.personas.mobile.externalLinks))].slice(0, 40),
      // 301 자동연결 내부링크 — 죽음 아님, 정식 URL 직결 권장(월간 처방용)
      redirectLinksAll: [...new Map(graded.flatMap((g) => g.detail.personas.mobile.redirectLinks.map((r) => [r.href, { page: g.route, ...r }]))).values()].slice(0, 60),
    };
    writeFileSync(`${dir}/shard-${dow}-${kstDate()}.json`, JSON.stringify(out, null, 2) + '\n');
    console.log(`💾 저장: data/monthly-inbox/customer-robot/${monthKey()}/shard-${dow}-${kstDate()}.json`);
  }
  process.exit(0);
})().catch((e) => { console.error('❌', e); process.exit(1); });
