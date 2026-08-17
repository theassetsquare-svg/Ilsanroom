#!/usr/bin/env node
/**
 * 주간 검색어 상위노출 자동 루프 (SERP Loop)
 *
 * 사장님 요청(2026-07-25): 두 종류 검색어 전부, 상위 도달까지 매주 자동 반복.
 *   A. 특정 가게이름 검색 ("해운대고구려", "일산샴푸나이트" 등 전 venue)
 *      → 해당 venue 상세 페이지 순위.
 *   B. 지역+업종 조합 검색 ("해운대호빠", "강남호빠", "대전나이트" 등 전 조합)
 *      → 놀쿨의 어느 페이지(지역 허브/venue)가 랭크되나 + 순위.
 *
 * ⚠️ 정직 전제: 순위는 Google 결정 — 강제 불가. 이 루프가 하는 것:
 *   1) A·B 전수 3단계 분류(상위 ≤10 / 진입 11~20 / 미달 21+·노출0) + 전주 대비 추세
 *   2) 미달 대상 온페이지 정합 진단(읽기전용) → 결손을 기계판독 FINDINGS로 발행
 *      (실제 보강은 게이트 전체를 통과하는 별도 루틴/사람이 수행 — 자동 콘텐츠 생성 0)
 *   3) 결손 발견 URL만 IndexNow 재크롤 핑 (rank-drop-responder와 동일한 정당 레버)
 *   4) AI 유입(chatgpt 등)·네이버 유입 GA4 측정 — 보고만 (네이버는 타깃 아님)
 *   5) 주간 Gmail 1통 (변화 0이면 1줄)
 *
 * 도달/재진입: 상태 파일 없이 매주 재분류로 자연 처리 — 상위 도달하면 미달 목록에서
 * 자동 제외(헛수정 0), 하락하면 다시 미달로 잡혀 재진입.
 *
 * 기존 자산과의 역할 분리:
 *   - venue-rank-trend(월 09:30 KST): 가게이름 "추이 리포트"만. 본 루프는 3단계 분류+B 조합+FINDINGS.
 *   - rank-drop-responder(월 09:45 KST): "하락"만 대응. 본 루프는 "미달 전수"가 대상.
 *
 * 인증: GSC_SA_JSON (GSC+GA4 공용 SA) / INDEXNOW_KEY / RESEND_API_KEY / NOTIFICATION_EMAIL
 * 읽기 전용 + 색인 핑만. 소스/콘텐츠 수정 없음. 가짜·허위순위·스터핑 0.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getAccessToken, gscQuery, hasGscCredentials } from './lib/gsc-auth.mjs';
import { getGaToken, runReport } from './lib/ga-auth.mjs';
import { localityOf } from './lib/region-admin.mjs';

const SITE = 'nolcool.com';
const BASE = `https://${SITE}`;
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const WINDOW = 7;
const TOP = 10, ENTER = 20;           // 상위/진입 경계
const DIAG_CAP_B = 25, DIAG_CAP_A = 15; // 라이브 진단 fetch 상한 (사이트 부하 최소화)
const PING_CAP = 50;                   // IndexNow 핑 상한

const CAT_PATH = { club: 'clubs', night: 'nights', lounge: 'lounges', room: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa' };
const CAT_KO = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
// 검색어 매칭용 업종 토큰 (동의어 포함). "룸"은 1글자라 지역+룸 정확결합만 인정.
const CAT_TERMS = { club: ['클럽'], night: ['나이트'], lounge: ['라운지'], room: ['룸'], yojeong: ['요정'], hoppa: ['호빠', '호스트바'] };
const REGIONED = new Set(['club', 'room', 'yojeong']);

if (!hasGscCredentials()) { console.log('⏭️  GSC_SA_JSON 미설정 — 스킵'); process.exit(0); }

const norm = (s) => (s || '').replace(/\s+/g, '').toLowerCase();

/* ─── venues.ts 파싱 (prerender-seo.mjs 블록 패턴) ─── */
function parseVenues() {
  const src = fs.readFileSync(path.join('src', 'data', 'venues.ts'), 'utf8');
  const out = [];
  for (const block of src.split(/\n  \{/)) {
    const slug = block.match(/slug:\s*'([^']+)'/)?.[1];
    const cat = block.match(/category:\s*'([^']+)'/)?.[1];
    const region = block.match(/region:\s*'([^']+)'/)?.[1];
    const regionKo = block.match(/regionKo:\s*'([^']+)'/)?.[1];
    const nameKo = block.match(/nameKo:\s*'([^']+)'/)?.[1];
    const aliases = (block.match(/aliases:\s*\[([^\]]*)\]/)?.[1]?.match(/'([^']+)'/g) || []).map((a) => a.replace(/'/g, ''));
    if (!slug || !cat || !region || !nameKo) continue;
    const cp = CAT_PATH[cat] || cat;
    const url = REGIONED.has(cat) ? `${BASE}/${cp}/${region}/${slug}/` : `${BASE}/${cp}/${slug}/`;
    out.push({ slug, cat, region, regionKo: regionKo || '', nameKo, aliases, url });
  }
  return out;
}

/* ─── A: 가게이름 매칭 (이름+별칭, 긴 키 우선) ─── */
function venueNameKeys(venues) {
  const keys = [];
  for (const v of venues) {
    for (const n of [v.nameKo, ...v.aliases]) {
      const k = norm(n);
      if (k.length >= 3) keys.push({ v, key: k });
    }
  }
  return keys.sort((a, b) => b.key.length - a.key.length);
}
function matchVenue(nameKeys, normQ) {
  return nameKeys.find(({ key }) => normQ.includes(key) || key.includes(normQ))?.v || null;
}

/* ─── B: 지역×업종 조합 (venue 실데이터에서 도출 — 창작 0) ─── */
function buildCombos(venues) {
  const map = new Map(); // localityNorm|cat → combo
  for (const v of venues) {
    if (!v.regionKo) continue;
    const loc = localityOf(v.regionKo);
    const id = `${norm(loc)}|${v.cat}`;
    if (!map.has(id)) {
      map.set(id, {
        id, loc, cat: v.cat, regionKo: v.regionKo,
        label: `${loc}${CAT_KO[v.cat]}`,
        hubUrl: `${BASE}/region/${encodeURIComponent(v.regionKo)}/${CAT_PATH[v.cat]}/`,
        members: 0,
      });
    }
    map.get(id).members++;
  }
  return [...map.values()];
}
/** 검색어가 조합에 해당하나. A(가게이름) 매칭 검색어는 사전 제외하고 호출할 것. */
function matchCombo(combos, normQ) {
  for (const c of combos) {
    const locN = norm(c.loc);
    if (!normQ.includes(locN)) continue;
    for (const t of CAT_TERMS[c.cat]) {
      // "룸" 1글자: "{지역}룸" 정확 결합만 (일산룸살롱X — 금칙어, 일산룸/일산룸추천 OK)
      if (t === '룸' ? normQ.includes(`${locN}룸`) : normQ.includes(t)) return c;
    }
  }
  return null;
}

/* ─── 검색어 행 → 노출가중 순위 집계 ─── */
function classify(pos, imp) {
  if (!imp || pos <= 0) return 'none';
  return pos <= TOP ? 'top' : pos <= ENTER ? 'enter' : 'below';
}
function aggregate(venues, combos, rows) {
  const nameKeys = venueNameKeys(venues);
  const A = new Map(); // slug → {imp,clicks,posW,queries}
  const B = new Map(); // combo.id → 동일
  for (const row of rows) {
    const q = norm(row.keys[0]);
    if (!q) continue;
    const imp = row.impressions || 0;
    const v = matchVenue(nameKeys, q);
    let acc, key;
    if (v) { key = v.slug; acc = A; }
    else {
      const c = matchCombo(combos, q);
      if (!c) continue;
      key = c.id; acc = B;
    }
    const a = acc.get(key) || { imp: 0, clicks: 0, posW: 0, queries: new Set() };
    a.imp += imp; a.clicks += row.clicks || 0; a.posW += (row.position || 0) * imp;
    a.queries.add(row.keys[0]);
    acc.set(key, a);
  }
  const finish = (m) => {
    const out = new Map();
    for (const [k, a] of m) out.set(k, { imp: a.imp, clicks: a.clicks, pos: a.imp > 0 ? a.posW / a.imp : 0, queries: [...a.queries] });
    return out;
  };
  return { A: finish(A), B: finish(B) };
}

/* ─── B 조합별 랭크 페이지 (query+page 차원) ─── */
function rankingPages(venues, combos, rowsQP) {
  const nameKeys = venueNameKeys(venues);
  const best = new Map(); // combo.id → {page, imp}
  for (const row of rowsQP) {
    const q = norm(row.keys[0]);
    if (!q || matchVenue(nameKeys, q)) continue;
    const c = matchCombo(combos, q);
    if (!c) continue;
    const imp = row.impressions || 0;
    const cur = best.get(c.id);
    if (!cur || imp > cur.imp) best.set(c.id, { page: row.keys[1], imp });
  }
  return best;
}

/* ─── 미달 대상 온페이지 정합 진단 (읽기전용 GET, 자기 사이트) ─── */
async function diagnose(url, mustTokens) {
  const issues = [];
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'NOLCOOL-serp-loop/1.0' } });
    if (!r.ok) return { status: r.status, issues: [`라이브 응답 ${r.status}`] };
    const html = await r.text();
    const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '';
    const desc = (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || [])[1] || '';
    const h1 = ((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '').replace(/<[^>]+>/g, '');
    for (const t of mustTokens) {
      const tn = norm(t);
      if (!norm(title).includes(tn)) issues.push(`title에 "${t}" 없음 ("${title.slice(0, 45)}")`);
      else if (norm(title).indexOf(tn) > 20) issues.push(`title에서 "${t}"가 뒤쪽 (front-load 미달)`);
      if (!norm(h1).includes(tn)) issues.push(`H1에 "${t}" 없음`);
      if (!norm(desc).includes(tn)) issues.push(`meta desc에 "${t}" 없음`);
    }
    if (!/application\/ld\+json/.test(html)) issues.push('JSON-LD 없음');
    return { status: r.status, issues };
  } catch (e) {
    return { status: 0, issues: [`fetch 실패: ${e.message}`] };
  }
}

/* ─── GA4: AI 유입 + 네이버 유입 (보고만) ─── */
async function referrerSessions() {
  const token = await getGaToken();
  if (!token) return { ok: false };
  const end = new Date(Date.now() - 86400 * 1000).toISOString().slice(0, 10);
  const start = new Date(Date.now() - (WINDOW + 1) * 86400 * 1000).toISOString().slice(0, 10);
  const res = await runReport(token, {
    dateRanges: [{ startDate: start, endDate: end }],
    dimensions: [{ name: 'sessionSource' }],
    metrics: [{ name: 'sessions' }],
    limit: 250,
  });
  if (!res.ok) return { ok: false };
  const AI_RE = /chatgpt|openai|perplexity|gemini|bard\.google|copilot|claude|you\.com|phind|deepseek/i;
  let ai = 0, naver = 0; const aiSrc = [];
  for (const row of res.body.rows || []) {
    const src = row.dimensionValues?.[0]?.value || '';
    const n = Number(row.metricValues?.[0]?.value || 0);
    if (AI_RE.test(src)) { ai += n; aiSrc.push(`${src}:${n}`); }
    else if (/naver/i.test(src)) naver += n;
  }
  return { ok: true, ai, naver, aiSrc, start, end };
}

/* ─── IndexNow 핑 (결손 발견 URL만) ─── */
async function pingIndexNow(urls) {
  if (!INDEXNOW_KEY || urls.length === 0) return { sent: 0, status: urls.length === 0 ? 'none' : 'no-key' };
  const payload = { host: SITE, key: INDEXNOW_KEY, keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`, urlList: urls.slice(0, PING_CAP) };
  const codes = [];
  for (const ep of ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow']) {
    try {
      const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(payload) });
      codes.push(`${ep.includes('bing') ? 'bing' : 'indexnow'}:${r.status}`);
    } catch { codes.push('ERR'); }
  }
  return { sent: Math.min(urls.length, PING_CAP), status: codes.join(' ') };
}

async function sendMail(html, subject) {
  // 30일 1통 정책(2026-08-17): 즉시 발송 정지 — 월간 지휘자 보고서로 통합 (data/monthly-inbox)
  const MONTHLY_DIGEST_ONLY = true;
  if (MONTHLY_DIGEST_ONLY) {
    const { archiveInsteadOfSend } = await import('./lib/monthly-inbox.mjs');
    archiveInsteadOfSend('serp-loop', subject, html);
    return false;
  }
  if (!RESEND_API_KEY) { console.log('⏭️  RESEND_API_KEY 없음 — 콘솔만'); return false; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO], subject, html }),
  }).catch(() => null);
  console.log(`📧 메일: ${r ? r.status : '실패'} → ${TO}`);
  return !!(r && r.ok);
}

const fmtPos = (p) => (p > 0 ? p.toFixed(1) : '노출0');
const TIER_KO = { top: '상위', enter: '진입', below: '미달', none: '노출0' };

(async () => {
  const token = await getAccessToken();
  if (!token) { console.log('⏭️  GSC 토큰 실패 — 스킵'); return; }

  const venues = parseVenues();
  const combos = buildCombos(venues);
  console.log(`📋 A 가게이름 ${venues.length}개 · B 지역×업종 조합 ${combos.length}개 (이번주 ${WINDOW}일 vs 전주 ${WINDOW}일)`);

  const day = 86400 * 1000;
  const end = new Date(Date.now() - 2 * day);
  const curStart = new Date(end.getTime() - (WINDOW - 1) * day);
  const prevEnd = new Date(curStart.getTime() - day);
  const prevStart = new Date(prevEnd.getTime() - (WINDOW - 1) * day);
  const ymd = (d) => d.toISOString().slice(0, 10);

  const [curQ, prevQ, curQP] = await Promise.all([
    gscQuery(token, { dimensions: ['query'], rowLimit: 25000, startDate: ymd(curStart), endDate: ymd(end) }),
    gscQuery(token, { dimensions: ['query'], rowLimit: 25000, startDate: ymd(prevStart), endDate: ymd(prevEnd) }),
    gscQuery(token, { dimensions: ['query', 'page'], rowLimit: 25000, startDate: ymd(curStart), endDate: ymd(end) }),
  ]);
  const cur = aggregate(venues, combos, curQ.rows);
  const prev = aggregate(venues, combos, prevQ.rows);
  const bPages = rankingPages(venues, combos, curQP.rows);

  /* ── 3단계 분류 + 추세 ── */
  const rowA = venues.map((v) => {
    const c = cur.A.get(v.slug), p = prev.A.get(v.slug);
    const tier = classify(c?.pos || 0, c?.imp || 0);
    const prevTier = classify(p?.pos || 0, p?.imp || 0);
    return { kind: 'A', name: v.nameKo, url: v.url, v, tier, prevTier, pos: c?.pos || 0, prevPos: p?.pos || 0, imp: c?.imp || 0, clicks: c?.clicks || 0, queries: c?.queries || [] };
  });
  const rowB = combos.map((cb) => {
    const c = cur.B.get(cb.id), p = prev.B.get(cb.id);
    const tier = classify(c?.pos || 0, c?.imp || 0);
    const prevTier = classify(p?.pos || 0, p?.imp || 0);
    const page = bPages.get(cb.id)?.page || '';
    return { kind: 'B', name: cb.label, url: cb.hubUrl, cb, page, tier, prevTier, pos: c?.pos || 0, prevPos: p?.pos || 0, imp: c?.imp || 0, clicks: c?.clicks || 0, queries: c?.queries || [] };
  });

  const cnt = (rows, t) => rows.filter((r) => r.tier === t).length;
  const aTop = cnt(rowA, 'top'), aEnter = cnt(rowA, 'enter');
  const bTop = cnt(rowB, 'top'), bEnter = cnt(rowB, 'enter');
  const RANKS = { top: 3, enter: 2, below: 1, none: 0 };
  const arrived = [...rowA, ...rowB].filter((r) => RANKS[r.tier] > RANKS[r.prevTier] && r.tier !== 'below');
  const declined = [...rowA, ...rowB].filter((r) => RANKS[r.tier] < RANKS[r.prevTier]);

  console.log(`📊 A: 상위 ${aTop}/${venues.length} · 진입 ${aEnter} · 미달 ${cnt(rowA, 'below')} · 노출0 ${cnt(rowA, 'none')}`);
  console.log(`📊 B: 상위 ${bTop}/${combos.length} · 진입 ${bEnter} · 미달 ${cnt(rowB, 'below')} · 노출0 ${cnt(rowB, 'none')}`);
  console.log(`🆕 새 도달(승급) ${arrived.length} · 📉 하락(재진입) ${declined.length}`);

  /* ── 미달 진단 (노출 있는 미달 우선 = 개선 여지 최대, 노출0은 후순위) ── */
  const belowB = rowB.filter((r) => r.tier === 'below' || r.tier === 'none').sort((x, y) => y.imp - x.imp).slice(0, DIAG_CAP_B);
  const belowA = rowA.filter((r) => r.tier === 'below' || (r.tier === 'none' && r.prevTier !== 'none')).sort((x, y) => y.imp - x.imp).slice(0, DIAG_CAP_A);
  const findings = { generatedAt: new Date().toISOString(), window: `${ymd(curStart)}~${ymd(end)}`, a_below: [], b_below: [] };
  for (const r of belowB) {
    const d = await diagnose(r.url, [r.cb.loc, CAT_KO[r.cb.cat]]);
    if (r.cb.members <= 1) d.issues.push(`허브 멤버 ${r.cb.members}곳 (thin — 단일멤버는 정직 유지, 패딩 금지)`);
    findings.b_below.push({ combo: r.name, url: r.url, pos: +r.pos.toFixed(1), imp: r.imp, page: r.page, queries: r.queries.slice(0, 5), issues: d.issues });
    await new Promise((s) => setTimeout(s, 150));
  }
  for (const r of belowA) {
    const d = await diagnose(r.url, [r.v.nameKo]);
    findings.a_below.push({ name: r.name, slug: r.v.slug, url: r.url, pos: +r.pos.toFixed(1), imp: r.imp, queries: r.queries.slice(0, 5), issues: d.issues });
    await new Promise((s) => setTimeout(s, 150));
  }
  const deficient = [...findings.b_below, ...findings.a_below].filter((f) => f.issues.length > 0);
  console.log(`🔍 진단 ${belowB.length + belowA.length}건 중 결손 발견 ${deficient.length}건`);
  for (const f of deficient.slice(0, 20)) console.log(`  🛠️ ${f.combo || f.name}: ${f.issues.join(' · ')}`);

  // 기계판독 1줄 (GHA 시크릿 마스킹이 raw JSON 중괄호를 깨뜨리므로 base64 — 1effadbc 교훈)
  console.log('SERP_LOOP_FINDINGS_B64=' + Buffer.from(JSON.stringify(findings)).toString('base64'));

  /* ── 결손 URL만 IndexNow 재크롤 ── */
  const ping = await pingIndexNow(deficient.map((f) => f.url));
  console.log(`🔁 IndexNow ${ping.sent}개 (${ping.status})`);

  /* ── GA4 AI·네이버 유입 (보고만) ── */
  const ref = await referrerSessions();
  if (ref.ok) console.log(`🤖 AI 유입 ${ref.ai}세션 (${ref.aiSrc.join(', ') || '없음'}) · 네이버 ${ref.naver}세션 (측정만·타깃 아님)`);

  /* ── 주간 메일 1통 ── */
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' KST';
  const noChange = arrived.length === 0 && declined.length === 0 && deficient.length === 0;
  const tierRow = (r) => `<tr>
    <td style="padding:5px 8px;border-bottom:1px solid #F1F1F1">${r.kind === 'B' ? '🗺️' : '🏪'} ${r.name}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #F1F1F1;text-align:right">${TIER_KO[r.prevTier]} ${fmtPos(r.prevPos)} → <b>${TIER_KO[r.tier]} ${fmtPos(r.pos)}</b></td>
    <td style="padding:5px 8px;border-bottom:1px solid #F1F1F1;text-align:right">${r.imp}</td></tr>`;
  const defRow = (f) => `<tr>
    <td style="padding:5px 8px;border-bottom:1px solid #F1F1F1"><a href="${f.url}" style="color:#7C3AED">${f.combo || f.name}</a></td>
    <td style="padding:5px 8px;border-bottom:1px solid #F1F1F1;text-align:right">${f.pos > 0 ? f.pos : '노출0'}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #F1F1F1;color:#DC2626;font-size:12px">${f.issues.map((i) => `• ${i}`).join('<br>')}</td></tr>`;
  const tbl = (head, rows) => rows.length ? `<table style="width:100%;border-collapse:collapse;font-size:13px;margin:6px 0 18px">
    <thead><tr style="color:#6B7280;font-size:11px;border-bottom:2px solid #E5E7EB">${head}</tr></thead><tbody>${rows.join('')}</tbody></table>` : '';

  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px;color:#111">
    <h2 style="color:#7C3AED;margin-bottom:2px">🔁 놀쿨 검색어 상위노출 주간 루프</h2>
    <p style="color:#666;font-size:12px;margin-top:2px">이번주 ${ymd(curStart)}~${ymd(end)} vs 전주 ${ymd(prevStart)}~${ymd(prevEnd)} · 발송 ${kst}</p>
    <p style="font-size:14px;margin:12px 0">
      🏪 <b>A 가게이름</b>: 상위 <b style="color:#16A34A">${aTop}</b>/${venues.length} · 진입 ${aEnter} · 미달 ${cnt(rowA, 'below')} · 노출0 ${cnt(rowA, 'none')}<br>
      🗺️ <b>B 지역+업종</b>: 상위 <b style="color:#16A34A">${bTop}</b>/${combos.length} · 진입 ${bEnter} · 미달 ${cnt(rowB, 'below')} · 노출0 ${cnt(rowB, 'none')}<br>
      ${ref.ok ? `🤖 AI 유입 <b>${ref.ai}</b>세션 · 네이버 <b>${ref.naver}</b>세션 (측정만·타깃 아님)` : ''}</p>
    ${noChange ? `<p style="font-size:14px;color:#6B7280">이번 주 변화 없음 — 승급 0 · 하락 0 · 결손 0. 구글 재평가 대기.</p>` : `
    ${arrived.length ? `<h3 style="margin:18px 0 4px;font-size:15px">🆕 새 도달 (${arrived.length})</h3>${tbl('<th style="text-align:left;padding:4px 8px">검색어/가게</th><th style="text-align:right;padding:4px 8px">전주 → 이번주</th><th style="text-align:right;padding:4px 8px">노출</th>', arrived.map(tierRow))}` : ''}
    ${declined.length ? `<h3 style="margin:18px 0 4px;font-size:15px">📉 하락 — 루프 재진입 (${declined.length})</h3>${tbl('<th style="text-align:left;padding:4px 8px">검색어/가게</th><th style="text-align:right;padding:4px 8px">전주 → 이번주</th><th style="text-align:right;padding:4px 8px">노출</th>', declined.map(tierRow))}` : ''}
    ${deficient.length ? `<h3 style="margin:18px 0 4px;font-size:15px">🛠️ 미달+결손 → 이번 주 보강 대상 (${deficient.length}) · 🔁 재크롤 핑 ${ping.sent}</h3>
      <p style="font-size:12px;color:#6B7280;margin:0 0 4px">온페이지 정합 결손만 보강(게이트 통과 필수). 이미 상위/결손 없는 페이지는 손대지 않음(헛수정 0).</p>
      ${tbl('<th style="text-align:left;padding:4px 8px">대상</th><th style="text-align:right;padding:4px 8px">순위</th><th style="text-align:left;padding:4px 8px">발견 결손</th>', deficient.map(defRow))}` : ''}
    `}
    <p style="color:#9CA3AF;font-size:11px;margin-top:24px">순위는 Google 결정 — 이 루프는 측정→결손 보강→재크롤→재측정만 반복(가짜·스터핑 0). 상위 도달 시 자동 제외, 하락 시 재진입. 평균순위=노출가중, GSC 약 2일 지연. 네이버는 측정만.</p>
  </div>`;

  const mailOk = await sendMail(html, `[놀쿨][🔁] 검색어 루프 — A상위 ${aTop}/${venues.length} · B상위 ${bTop}/${combos.length} · 🆕${arrived.length} 🛠️${deficient.length}`);
  console.log(`RESULT A_TOP=${aTop}/${venues.length} B_TOP=${bTop}/${combos.length} ARRIVED=${arrived.length} DEFICIENT=${deficient.length} PING=${ping.sent} MAIL=${mailOk ? 'PASS' : 'FAIL'}`);
})().catch((e) => { console.error('❌ 실패:', e); process.exit(1); });
