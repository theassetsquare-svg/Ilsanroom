#!/usr/bin/env node
/**
 * 주간 가게이름 검색 순위 추이 리포트 (Google Search Console searchAnalytics)
 *
 * 사용자 요청(2026-06-03): "매주 가게이름 검색 순위 추이 메일로 보내줘"
 *
 * 기존 search-console-report.mjs 는 사이트 전체 상위 키워드 "스냅샷"만 보여준다.
 * 이 스크립트는 121개 업소 "가게이름" 각각의 평균순위를 이번주 vs 전주로 비교해
 * 📈개선 / 📉하락 / 🆕신규노출 / ⬇️순위권밖 추이를 한 통의 메일로 보낸다.
 *
 * 인증 (scripts/lib/gsc-auth.mjs):
 *   서비스계정 GSC_SA_JSON (만료 없음)
 *   RESEND_API_KEY / NOTIFICATION_EMAIL (메일 발송)
 *
 * 동작:
 *   1) venues.ts 파싱 → 121개 가게이름
 *   2) searchAnalytics.query(dimensions=['query']) 2윈도우 1회씩 (이번주 7일 / 전주 7일) — API 2콜
 *   3) 각 가게이름에 매칭되는 검색어들의 노출가중 대표순위 산출 → 주간 델타 계산
 *   4) 추이를 Resend 메일 1통으로 발송 (사용자 요청 = 매주 발송, 실패시만 아님)
 *
 * 읽기 전용. GSC 데이터는 정책상 약 2일 지연.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getAccessToken, gscQuery, hasGscCredentials } from './lib/gsc-auth.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const WINDOW = 7; // 비교 단위(일)

if (!hasGscCredentials()) {
  console.log('⏭️  GSC 인증정보 미설정 (GSC_SA_JSON) — 스킵');
  process.exit(0);
}

/* ─── venues.ts 파싱 (venue-name-seo-monitor.mjs 와 동일 패턴) ─── */
function parseVenues() {
  const src = fs.readFileSync(path.join('src', 'data', 'venues.ts'), 'utf8');
  const out = [];
  const re = /id:\s*'(v-\d+)',[\s\S]{0,500}?slug:\s*'([^']+)',[\s\S]{0,500}?name:\s*'([^']+)',[\s\S]{0,500}?category:\s*'([^']+)'[\s\S]{0,500}?region:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, id, slug, name, cat, region] = m;
    out.push({ id, slug, name, cat, region });
  }
  return out;
}

const norm = (s) => (s || '').replace(/\s+/g, '');

/** 검색어 행들을 가게이름별로 묶어 노출가중 대표순위 산출. */
function aggregateByVenue(venues, rows) {
  // 가게이름(공백제거) 사전. 긴 이름 우선 매칭(부분문자열 충돌 방지).
  const names = venues
    .map((v) => ({ v, key: norm(v.name) }))
    .filter((x) => x.key.length >= 3)
    .sort((a, b) => b.key.length - a.key.length);

  const acc = new Map(); // id -> {clicks, imp, posWeighted, queries:Set}
  for (const row of rows) {
    const q = norm(row.keys[0]);
    if (!q) continue;
    const hit = names.find(({ key }) => q.includes(key) || key.includes(q));
    if (!hit) continue;
    const id = hit.v.id;
    const a = acc.get(id) || { v: hit.v, clicks: 0, imp: 0, posW: 0, queries: new Set() };
    const imp = row.impressions || 0;
    a.clicks += row.clicks || 0;
    a.imp += imp;
    a.posW += (row.position || 0) * imp; // 노출가중 평균순위
    a.queries.add(row.keys[0]);
    acc.set(id, a);
  }
  const map = new Map();
  for (const [id, a] of acc) {
    map.set(id, {
      v: a.v,
      clicks: a.clicks,
      imp: a.imp,
      pos: a.imp > 0 ? a.posW / a.imp : 0,
      queries: a.queries.size,
    });
  }
  return map;
}

const fmtPos = (p) => (p > 0 ? p.toFixed(1) : '—');

function buildRows(venues, cur, prev) {
  const rows = [];
  for (const v of venues) {
    const c = cur.get(v.id);
    const p = prev.get(v.id);
    if (!c && !p) continue; // 양쪽 다 노출 0 → 스킵
    const curPos = c ? c.pos : 0;
    const prevPos = p ? p.pos : 0;
    let trend, delta;
    if (c && !p) { trend = 'new'; delta = null; }
    else if (!c && p) { trend = 'dropped'; delta = null; }
    else {
      delta = prevPos - curPos; // +면 순위 상승(숫자 작아짐)
      trend = delta > 0.5 ? 'up' : delta < -0.5 ? 'down' : 'flat';
    }
    rows.push({
      name: v.name, curPos, prevPos, delta, trend,
      imp: c ? c.imp : 0, clicks: c ? c.clicks : 0, queries: c ? c.queries : 0,
    });
  }
  return rows;
}

function tableHtml(title, rows, opts = {}) {
  if (rows.length === 0) return '';
  const body = rows.map((r) => {
    const d = r.delta == null ? (r.trend === 'new' ? '🆕' : '⬇️권밖')
      : (r.delta > 0 ? `📈 +${r.delta.toFixed(1)}` : r.delta < 0 ? `📉 ${r.delta.toFixed(1)}` : '—');
    const color = r.trend === 'up' ? '#16A34A' : r.trend === 'down' ? '#DC2626' : r.trend === 'new' ? '#2563EB' : '#6B7280';
    return `<tr>
      <td style="padding:5px 8px;border-bottom:1px solid #F1F1F1">${r.name}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #F1F1F1;text-align:right">${fmtPos(r.curPos)}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #F1F1F1;text-align:right;color:#9CA3AF">${fmtPos(r.prevPos)}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #F1F1F1;text-align:right;font-weight:700;color:${color}">${d}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #F1F1F1;text-align:right">${r.imp}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #F1F1F1;text-align:right">${r.clicks}</td>
    </tr>`;
  }).join('');
  return `<h3 style="margin:22px 0 6px;font-size:15px">${opts.icon || ''} ${title} <span style="color:#9CA3AF;font-weight:400">(${rows.length})</span></h3>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="color:#6B7280;font-size:11px;border-bottom:2px solid #E5E7EB">
      <th style="text-align:left;padding:4px 8px">가게이름</th><th style="text-align:right;padding:4px 8px">이번주</th>
      <th style="text-align:right;padding:4px 8px">전주</th><th style="text-align:right;padding:4px 8px">추이</th>
      <th style="text-align:right;padding:4px 8px">노출</th><th style="text-align:right;padding:4px 8px">클릭</th>
    </tr></thead><tbody>${body}</tbody></table>`;
}

async function sendMail(html, subject) {
  if (!RESEND_API_KEY) { console.log('⏭️  RESEND_API_KEY 없음 — 콘솔 출력만'); return; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO], subject, html }),
  }).catch(() => null);
  console.log(`📧 메일 발송: ${r ? r.status : '실패'} → ${TO}`);
}

(async () => {
  const token = await getAccessToken();
  if (!token) { console.log('⏭️  access_token 발급 실패 — 스킵'); return; }

  const venues = parseVenues();
  console.log(`📋 venue ${venues.length}개 / 가게이름 순위 추이 (이번주 ${WINDOW}일 vs 전주 ${WINDOW}일)`);

  // GSC 2일 지연 반영: end = 오늘-2. 이번주 = [end-6, end], 전주 = [end-13, end-7].
  const day = 86400 * 1000;
  const end = new Date(Date.now() - 2 * day);
  const curStart = new Date(end.getTime() - (WINDOW - 1) * day);
  const prevEnd = new Date(curStart.getTime() - day);
  const prevStart = new Date(prevEnd.getTime() - (WINDOW - 1) * day);
  const ymd = (d) => d.toISOString().slice(0, 10);

  const [curQ, prevQ] = await Promise.all([
    gscQuery(token, { dimensions: ['query'], rowLimit: 25000, startDate: ymd(curStart), endDate: ymd(end) }),
    gscQuery(token, { dimensions: ['query'], rowLimit: 25000, startDate: ymd(prevStart), endDate: ymd(prevEnd) }),
  ]);

  const cur = aggregateByVenue(venues, curQ.rows);
  const prev = aggregateByVenue(venues, prevQ.rows);
  const rows = buildRows(venues, cur, prev);

  const up = rows.filter((r) => r.trend === 'up').sort((a, b) => b.delta - a.delta);
  const down = rows.filter((r) => r.trend === 'down').sort((a, b) => a.delta - b.delta);
  const news = rows.filter((r) => r.trend === 'new').sort((a, b) => a.curPos - b.curPos);
  const dropped = rows.filter((r) => r.trend === 'dropped').sort((a, b) => a.prevPos - b.prevPos);
  const flat = rows.filter((r) => r.trend === 'flat').sort((a, b) => a.curPos - b.curPos);

  // 콘솔 요약
  console.log(`📊 노출된 가게 ${rows.length}/${venues.length} · 📈상승 ${up.length} · 📉하락 ${down.length} · 🆕신규 ${news.length} · ⬇️권밖 ${dropped.length} · 유지 ${flat.length}`);
  for (const r of up.slice(0, 10)) console.log(`  📈 ${r.name}: ${fmtPos(r.prevPos)} → ${fmtPos(r.curPos)} (+${r.delta.toFixed(1)})`);
  for (const r of down.slice(0, 10)) console.log(`  📉 ${r.name}: ${fmtPos(r.prevPos)} → ${fmtPos(r.curPos)} (${r.delta.toFixed(1)})`);

  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' KST';
  const totImp = rows.reduce((a, r) => a + r.imp, 0);
  const totClicks = rows.reduce((a, r) => a + r.clicks, 0);
  const noData = rows.length === 0;

  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px;color:#111">
    <h2 style="color:#7C3AED;margin-bottom:2px">📊 놀쿨 가게이름 검색 순위 추이</h2>
    <p style="color:#666;font-size:12px;margin-top:2px">이번주 ${ymd(curStart)}~${ymd(end)} vs 전주 ${ymd(prevStart)}~${ymd(prevEnd)} · 발송 ${kst}</p>
    ${noData ? `<p style="font-size:14px;color:#6B7280;margin-top:16px">아직 가게이름 검색 노출 데이터가 없습니다. 색인이 더 쌓이면 다음 주부터 추이가 잡힙니다.</p>` : `
    <p style="font-size:14px;margin:12px 0">노출된 가게 <b>${rows.length}/${venues.length}</b> · 총 노출 <b>${totImp}</b> · 총 클릭 <b>${totClicks}</b><br>
      📈 상승 <b style="color:#16A34A">${up.length}</b> · 📉 하락 <b style="color:#DC2626">${down.length}</b> · 🆕 신규 <b style="color:#2563EB">${news.length}</b> · ⬇️ 순위권밖 <b>${dropped.length}</b> · 유지 ${flat.length}</p>
    ${tableHtml('순위 상승', up, { icon: '📈' })}
    ${tableHtml('순위 하락 — 점검 권장', down, { icon: '📉' })}
    ${tableHtml('신규 노출 진입', news, { icon: '🆕' })}
    ${tableHtml('순위권 밖으로 이탈', dropped, { icon: '⬇️' })}
    ${tableHtml('순위 유지', flat.slice(0, 40), { icon: '➖' })}
    `}
    <p style="color:#9CA3AF;font-size:11px;margin-top:24px">평균순위는 검색결과 위치(작을수록 상위). 노출가중 평균. Google 정책상 약 2일 지연. 읽기 전용 리포트.</p>
  </div>`;

  await sendMail(html, `[놀쿨][📊] 가게이름 순위 추이 — 📈${up.length} 📉${down.length} 🆕${news.length}`);
})().catch((e) => { console.error('❌ 실패:', e); process.exit(1); });
