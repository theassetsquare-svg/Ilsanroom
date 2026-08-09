#!/usr/bin/env node
/**
 * 놀쿨 북극성 계기판 — 주 1회 7지표 실측 + 사다리 + "한국 1위" 판정 + 마일스톤(교차 발화).
 * 읽기 전용(사이트 크롤 0 = 피해 0). 어떤 수치도 조작하지 않는다(합성 = Google 페널티 = 금지).
 *
 * 7지표: ①실회원 수 ②방문당 페이지 ③완독률 ④평균 체류 ⑤재방문 비중 ⑥phone_click ⑦비브랜드 1페이지 점유율
 * 이력: data/northstar/YYYY-WW.json (주차별 보존). 판정 로직 = scripts/lib/northstar-eval.mjs (순수·단위테스트됨).
 *
 * ★메일 신설 안 함: 이 파일은 계산 + 블록 생성만. 발송은 northstar-audit.mjs 가 주간(월요일)에
 *   기존 [놀쿨][🌟북극성] 메일에 buildBlock() 결과를 1블록으로 끼워 보낸다(단일 메일·단일 채널).
 *
 * 인증(전부 기존 재사용): GSC_SA_JSON(GA4+GSC 공용) · SUPABASE_SECRET_KEY/SUPABASE_URL.
 * 스케줄: 새 워크플로 없음 — northstar-audit.yml(매일 08:20)이 월요일에만 계기판 산출.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { getGaToken, gaErrorReason, runReport, GA_PROPERTY } from './lib/ga-auth.mjs';
import { getAccessToken as getGscToken, gscQuery, hasGscCredentials } from './lib/gsc-auth.mjs';
import { evaluateKorea1, ladderTable, crossedMilestones, milestoneStatus, KOREA1_CRITERIA } from './lib/northstar-eval.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rkqnblbajhnehmxfnvri.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const DIR = 'data/northstar';
const CAT_KO = { night: '나이트', club: '클럽', room: '룸', yojeong: '요정', hoppa: '호빠', lounge: '라운지' };

function isoWeekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (t.getUTCDay() + 6) % 7;           // 0=월
  t.setUTCDate(t.getUTCDate() - day + 3);          // 그 주 목요일
  const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/* ── GSC: 비브랜드 1페이지 점유율 · TOP3 · 업종별 1페이지 진입 ── */
async function gscShare() {
  if (!hasGscCredentials()) return { ok: false, reason: 'GSC 자격증명 없음' };
  try {
    const token = await getGscToken();
    const { rows } = await gscQuery(token, { dimensions: ['query'], rowLimit: 1000, days: 28 });
    const nb = (rows || []).filter(r => !/놀쿨|nolcool/i.test(r.keys?.[0] || '')); // 비브랜드만(브랜드 0)
    const total = nb.length;
    if (!total) return { ok: false, reason: '쿼리 0행' };
    const page1 = nb.filter(r => Number(r.position) <= 10);
    const top3 = nb.filter(r => Number(r.position) <= 3).length;
    const categoryPage1 = {};
    for (const [c, ko] of Object.entries(CAT_KO)) categoryPage1[c] = page1.filter(r => (r.keys?.[0] || '').includes(ko)).length;
    return { ok: true, totalQueries: total, sharePct: +(page1.length / total * 100).toFixed(1), top3Queries: top3, categoryPage1 };
  } catch (e) { return { ok: false, reason: e.message }; }
}

/* ── GA4: 방문당 페이지·재방문·체류·phone_click·완독률 (28d) ── */
async function ga4Metrics() {
  try {
    const token = await getGaToken();
    const win = { dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }] };
    const out = {};

    const base = await runReport(token, { ...win, metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }, { name: 'averageSessionDuration' }] });
    if (base.ok) {
      const v = base.body.rows?.[0]?.metricValues || [];
      const pv = Number(v[0]?.value || 0), ses = Number(v[1]?.value || 0);
      out.pagesPerVisit = ses ? +(pv / ses).toFixed(2) : null;
      out.dwellSec = +Number(v[2]?.value || 0).toFixed(0);
      out._pv = pv;
    } else out._err = gaErrorReason(base.status, base.body);

    const nvr = await runReport(token, { ...win, dimensions: [{ name: 'newVsReturning' }], metrics: [{ name: 'sessions' }] });
    if (nvr.ok) {
      let ret = 0, tot = 0;
      for (const row of nvr.body.rows || []) {
        const s = Number(row.metricValues?.[0]?.value || 0); tot += s;
        if ((row.dimensionValues?.[0]?.value || '') === 'returning') ret += s;
      }
      out.revisitPct = tot ? +(ret / tot * 100).toFixed(1) : null;
    }

    const ev = await runReport(token, {
      ...win, dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ['phone_click', 'scroll_100'] } } },
    });
    if (ev.ok) {
      let phone = 0, scroll100 = 0;
      for (const row of ev.body.rows || []) {
        const n = Number(row.metricValues?.[0]?.value || 0);
        if ((row.dimensionValues?.[0]?.value) === 'phone_click') phone = n;
        if ((row.dimensionValues?.[0]?.value) === 'scroll_100') scroll100 = n;
      }
      out.phoneClick = phone;
      if (out._pv) out.readEndRate = +(scroll100 / out._pv * 100).toFixed(1);
    }
    delete out._pv;
    return { ok: true, ...out };
  } catch (e) { return { ok: false, reason: e.message }; }
}

/* ── Supabase: 실회원 수 (user_profiles count exact) ── */
async function memberCount() {
  if (!SUPABASE_KEY) return { ok: false, reason: 'SUPABASE key 없음' };
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=user_id`, {
      method: 'HEAD',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'count=exact', Range: '0-0' },
    });
    const cr = r.headers.get('content-range') || '';
    const total = cr.includes('/') ? Number(cr.split('/')[1]) : null;
    return Number.isFinite(total) ? { ok: true, members: total } : { ok: false, reason: `content-range=${cr}` };
  } catch (e) { return { ok: false, reason: e.message }; }
}

export async function computeSnapshot() {
  const [g, a, mem] = await Promise.all([gscShare(), ga4Metrics(), memberCount()]);
  const snap = {
    week: isoWeekKey(), generatedAt: new Date().toISOString().slice(0, 10), source: 'live(GA4 540830544 + GSC nolcool.com + Supabase)',
    members: mem.ok ? mem.members : null,
    pagesPerVisit: a.pagesPerVisit ?? null,
    readEndRate: a.readEndRate ?? null,
    dwellSec: a.dwellSec ?? null,
    revisitPct: a.revisitPct ?? null,
    phoneClick: a.phoneClick ?? null,
    sharePct: g.ok ? g.sharePct : null,
    top3Queries: g.ok ? g.top3Queries : null,
    totalQueries: g.ok ? g.totalQueries : null,
    categoryPage1: g.ok ? g.categoryPage1 : null,
    _errors: [g.ok ? null : `GSC:${g.reason}`, a.ok ? null : `GA4:${a.reason || a._err}`, mem.ok ? null : `members:${mem.reason}`].filter(Boolean),
  };
  return snap;
}

function loadPrev(weekKey) {
  if (!existsSync(DIR)) return null;
  const files = readdirSync(DIR).filter(f => /^\d{4}-W\d{2}\.json$/.test(f) && f !== `${weekKey}.json`).sort();
  if (!files.length) return null;
  try { return JSON.parse(readFileSync(`${DIR}/${files[files.length - 1]}`, 'utf8')); } catch { return null; }
}

/** 계기판 HTML 1블록 + 마일스톤 교차 + 판정 (northstar-audit 가 주간 메일에 삽입). */
export function buildBlock(cur, prev) {
  const evalR = (cur.sharePct != null && cur.top3Queries != null && cur.categoryPage1) ? evaluateKorea1(cur) : null;
  const crossings = crossedMilestones(prev, cur);
  const trend = (k, dir = 'up') => {
    if (!prev || prev[k] == null || cur[k] == null) return '';
    const d = +(cur[k] - prev[k]).toFixed(2);
    if (d === 0) return ' <span style="color:#9CA3AF">→</span>';
    const good = dir === 'up' ? d > 0 : d < 0;
    return ` <span style="color:${good ? '#059669' : '#DC2626'}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}</span>`;
  };
  const ladders = ladderTable(cur);
  const ladderRows = ladders.map(p =>
    `<tr><td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">${p.label}</td>
     <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:center"><b>${p.current}${p.unit}</b></td>
     <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:center;color:#6B7280">${p.atTop ? '최상단 달성' : `${p.next}${p.unit} (남은 ${p.gap}${p.unit})`}</td>
     <td style="border:1px solid #E5E7EB;padding:6px;font-size:11px;color:#9CA3AF">${p.steps.join(' → ')}</td></tr>`).join('');
  const memRow = `<tr><td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">실회원 수</td>
     <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:center"><b>${cur.members ?? '⚠️'}</b>${trend('members')}</td>
     <td colspan="2" style="border:1px solid #E5E7EB;padding:6px;font-size:11px;color:#9CA3AF">진짜 회원만(user_profiles) · 마일스톤 100/1,000/10,000</td></tr>`;
  const phoneRow = `<tr><td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">phone_click</td>
     <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:center"><b>${cur.phoneClick ?? '⚠️'}</b>${trend('phoneClick')}</td>
     <td colspan="2" style="border:1px solid #E5E7EB;padding:6px;font-size:11px;color:#9CA3AF">전화 문의(전환 최종단)</td></tr>`;

  const judge = evalR ? `
    <h4 style="margin:14px 0 6px">🏆 "한국 유흥정보 1위" 판정 (4주 연속 필요)</h4>
    <ul style="font-size:12px;color:#374151;line-height:1.7;margin:0;padding-left:18px">
      <li>1페이지 점유율 ${evalR.share.value}% / 목표 ${evalR.share.target}% → ${evalR.share.pass ? '✅' : '❌ 미달'}</li>
      <li>TOP3 진입 쿼리 ${evalR.top3.value}개 / 목표 ${evalR.top3.target}개 → ${evalR.top3.pass ? '✅' : '❌ 미달'}</li>
      <li>6업종 1페이지 진입 ${evalR.six.pass ? '✅ 전부' : '❌ 결측 ' + evalR.six.missing.join(',')}</li>
    </ul>
    <p style="font-size:12px;color:${evalR.conditionsMet ? '#059669' : '#6B7280'};margin:6px 0 0">→ 3조건 동시충족: <b>${evalR.conditionsMet ? 'YES (연속주 카운트 시작)' : 'NO'}</b></p>` : '<p style="font-size:12px;color:#9CA3AF">GSC 점유율 데이터 축적 중 — 판정 보류</p>';

  const milestoneHtml = crossings.length
    ? `<p style="background:#ECFDF5;border-left:3px solid #059669;padding:10px 12px;font-size:13px;color:#065F46"><b>🎉 이번 주 새 마일스톤 돌파:</b> ${crossings.map(c => c.label).join(' · ')}</p>`
    : '';

  const html = `<div style="margin-top:24px;padding-top:16px;border-top:2px solid #7C3AED">
    <h3 style="color:#7C3AED">🌟 북극성 계기판 — 주간 (${cur.week})</h3>
    <p style="color:#6B7280;font-size:12px">7지표 실측 + 사다리(현재→다음 계단). 전 대비 = 직전 스냅샷. 전부 읽기전용·진짜 방문자.</p>
    ${milestoneHtml}
    <table style="border-collapse:collapse;width:100%">
      <thead><tr style="background:#F5F3FF">
        <th align="left" style="border:1px solid #E5E7EB;padding:6px;font-size:11px">지표</th>
        <th style="border:1px solid #E5E7EB;padding:6px;font-size:11px">현재</th>
        <th style="border:1px solid #E5E7EB;padding:6px;font-size:11px">다음 계단</th>
        <th style="border:1px solid #E5E7EB;padding:6px;font-size:11px">사다리</th></tr></thead>
      <tbody>${memRow}${ladderRows}${phoneRow}</tbody>
    </table>
    ${judge}
    ${cur._errors?.length ? `<p style="font-size:11px;color:#B45309">⚠️ 일부 소스 축적/조회 보류: ${cur._errors.join(' · ')}</p>` : ''}
    <p style="color:#9CA3AF;font-size:11px;margin-top:10px">주 1회 자동 — northstar-dashboard.mjs · 이력 data/northstar/${cur.week}.json · 판정상수 northstar-eval.mjs</p>
  </div>`;
  return { html, crossings, evalR };
}

/** 스냅샷 산출 → 이력 저장 → 블록 반환. northstar-audit(월요일)이 호출. */
export async function runWeekly({ write = true } = {}) {
  const cur = await computeSnapshot();
  const prev = loadPrev(cur.week);
  if (write) {
    if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
    writeFileSync(`${DIR}/${cur.week}.json`, JSON.stringify(cur, null, 2) + '\n');
  }
  return { ...buildBlock(cur, prev), snapshot: cur, prev };
}

// 직접 실행(수동/CI 점검): 산출 + 콘솔 요약 (메일은 northstar-audit 경유 — 여기선 발송 0)
if (import.meta.url === `file://${process.argv[1]}`) {
  runWeekly({ write: true }).then(({ snapshot, crossings, evalR }) => {
    console.log('🌟 계기판 스냅샷', snapshot.week, JSON.stringify(snapshot, null, 2));
    console.log('마일스톤 교차:', crossings.map(c => c.label).join(', ') || '(없음)');
    if (evalR) console.log(`1위 판정 3조건: 점유 ${evalR.share.pass}·TOP3 ${evalR.top3.pass}·6업종 ${evalR.six.pass} → ${evalR.conditionsMet ? 'YES' : 'NO'}`);
  }).catch(e => { console.error('❌', e.message); process.exit(1); });
}
