#!/usr/bin/env node
/**
 * 놀쿨 인기 점수 엔진 (한국1위 파트4 S1 — 순위 = 실측만).
 *
 * 업소별 점수 = 최근 28일 ①GA4 페이지 조회·사용자 ②GA4 phone_click ③GSC 검색 클릭의 가중 합산.
 * ★읽기전용 — GA4/GSC API GET/runReport만 호출. 사이트 크롤 0, 가짜 이벤트 주입 0, 메일 0.
 *
 * 출력(3곳, 전부 이 스크립트만 씀 — 단일 소스):
 *   src/data/popularity-scores.json   — 프론트 번들 임포트용 (src/lib/popularity.ts)
 *   public/data/popularity.json       — 라이브 공개 검증용 (nolcool.com/data/popularity.json)
 *   data/popularity/history/<날짜>.json — 산출 근거 보존 (검증 가능)
 *
 * 침묵 원칙: 28일 조회수 MIN_VIEWS_28D 미만 업소는 ranked=false → 순위 부여 금지(최신 등록순 구간).
 * 광고비(isPremium) 가중치 0 — 광고비로 순위를 살 수 없다.
 *
 * 인증: GH Secret GSC_SA_JSON (로컬엔 키 없음 → popularity-recompute.yml 주 1회 실행).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { getGaToken, runReport } from './lib/ga-auth.mjs';
import { getAccessToken as getGscToken, gscQuery, hasGscCredentials } from './lib/gsc-auth.mjs';

/* ── 가중치 상수 (변경 시 이 주석과 history JSON에 근거가 남는다) ──
 * W_VIEW  = 1  : 페이지 조회 1회 = 기본 단위 (관심의 총량)
 * W_USER  = 2  : 순 사용자 1명 = 조회 2회 가치 (한 명이 여러 번 새로고침한 것보다 여러 명이 본 게 진짜 인기)
 * W_PHONE = 30 : 전화 클릭 1회 = 방문 직전의 최고 의도 신호 (조회 30회 가치)
 * W_GSC   = 3  : 검색 클릭 1회 = 사이트 밖에서 이름을 찾아 들어온 외부 수요 (조회 3회 가치)
 */
const W_VIEW = 1;
const W_USER = 2;
const W_PHONE = 30;
const W_GSC = 3;
/** 침묵 임계 — 28일 조회수가 이 값 미만이면 순위 부여 금지 (표본 부족 = 최신 등록순 정직 정렬). */
const MIN_VIEWS_28D = 10;
const WINDOW_DAYS = 28;

/* ── venues.ts에서 slug 목록 추출 (gen-venues-counts.mjs와 동일한 파서) ── */
function loadVenueSlugs() {
  const src = readFileSync('src/data/venues.ts', 'utf8');
  const blocks = src.split(/(?=^\s+id:\s*'v-\d+')/m).slice(1);
  const slugs = new Set();
  for (const b of blocks) {
    if (/status:\s*'closed_or_unclear'/.test(b)) continue;
    const m = b.match(/slug:\s*'([^']+)'/);
    if (m) slugs.add(m[1]);
  }
  return slugs;
}

/** 경로 → venue slug (마지막 경로 세그먼트가 slug 집합에 있으면 매칭). */
function pathToSlug(path, slugs) {
  const clean = String(path).split('?')[0].split('#')[0].replace(/\/+$/, '');
  const seg = clean.split('/').pop();
  return seg && slugs.has(seg) ? seg : null;
}

async function ga4PagesReport(token) {
  const r = await runReport(token, {
    dateRanges: [{ startDate: `${WINDOW_DAYS}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
    limit: 5000,
  });
  if (!r.ok) throw new Error(`GA4 pages report 실패: ${JSON.stringify(r.body).slice(0, 300)}`);
  return (r.body.rows || []).map((x) => ({
    path: x.dimensionValues?.[0]?.value || '',
    views: Number(x.metricValues?.[0]?.value || 0),
    users: Number(x.metricValues?.[1]?.value || 0),
  }));
}

async function ga4PhoneClicks(token) {
  const r = await runReport(token, {
    dateRanges: [{ startDate: `${WINDOW_DAYS}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'phone_click' } } },
    limit: 5000,
  });
  if (!r.ok) throw new Error(`GA4 phone_click report 실패: ${JSON.stringify(r.body).slice(0, 300)}`);
  return (r.body.rows || []).map((x) => ({
    path: x.dimensionValues?.[0]?.value || '',
    clicks: Number(x.metricValues?.[0]?.value || 0),
  }));
}

async function gscPageClicks() {
  const token = await getGscToken();
  const rows = await gscQuery(token, { dimensions: ['page'], rowLimit: 5000, days: WINDOW_DAYS });
  return (rows || []).map((x) => ({
    path: String(x.keys?.[0] || '').replace(/^https?:\/\/[^/]+/, ''),
    clicks: Number(x.clicks || 0),
  }));
}

async function main() {
  if (!process.env.GSC_SA_JSON || !hasGscCredentials()) {
    console.error('❌ GSC_SA_JSON 없음 — 이 스크립트는 GH Actions(popularity-recompute.yml)에서만 동작');
    process.exit(1);
  }
  const slugs = loadVenueSlugs();
  const gaToken = await getGaToken();
  if (!gaToken) { console.error('❌ GA4 토큰 발급 실패'); process.exit(1); }

  const [pages, phones, gsc] = [await ga4PagesReport(gaToken), await ga4PhoneClicks(gaToken), await gscPageClicks()];

  const acc = new Map(); // slug -> {views, users, phoneClicks, gscClicks}
  const get = (slug) => {
    if (!acc.has(slug)) acc.set(slug, { views: 0, users: 0, phoneClicks: 0, gscClicks: 0 });
    return acc.get(slug);
  };
  for (const p of pages) { const s = pathToSlug(p.path, slugs); if (s) { const e = get(s); e.views += p.views; e.users += p.users; } }
  for (const p of phones) { const s = pathToSlug(p.path, slugs); if (s) get(s).phoneClicks += p.clicks; }
  for (const p of gsc) { const s = pathToSlug(p.path, slugs); if (s) get(s).gscClicks += p.clicks; }

  const venuesOut = {};
  let rankedCount = 0;
  for (const [slug, e] of acc) {
    const score = e.views * W_VIEW + e.users * W_USER + e.phoneClicks * W_PHONE + e.gscClicks * W_GSC;
    const ranked = e.views >= MIN_VIEWS_28D; // 침묵 원칙 — 표본 미달이면 순위 금지
    if (ranked) rankedCount++;
    venuesOut[slug] = { ...e, score, ranked };
  }

  const kstDate = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const out = {
    generatedAt: kstDate,
    windowDays: WINDOW_DAYS,
    minViews28d: MIN_VIEWS_28D,
    weights: { view: W_VIEW, user: W_USER, phoneClick: W_PHONE, gscClick: W_GSC },
    venues: venuesOut,
  };
  const json = JSON.stringify(out, null, 2) + '\n';
  writeFileSync('src/data/popularity-scores.json', json);
  mkdirSync('public/data', { recursive: true });
  writeFileSync('public/data/popularity.json', json);
  mkdirSync('data/popularity/history', { recursive: true });
  writeFileSync(`data/popularity/history/${kstDate}.json`, json);

  console.log(`✅ 인기 점수 산출 — 매칭 업소 ${acc.size}곳, 순위 부여 ${rankedCount}곳 (조회 ${MIN_VIEWS_28D}뷰 미만은 최신 등록순 구간)`);
  const top = Object.entries(venuesOut).filter(([, v]) => v.ranked).sort((a, b) => b[1].score - a[1].score).slice(0, 10);
  for (const [slug, v] of top) console.log(`  ${slug}: score=${v.score} (views=${v.views} users=${v.users} phone=${v.phoneClicks} gsc=${v.gscClicks})`);
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
