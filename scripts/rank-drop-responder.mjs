#!/usr/bin/env node
/**
 * 순위 하락 가게 자동 대응 (Rank-Drop Responder)
 *
 * 사용자 요청(2026-06-02): "하락한 가게들 순위 올려줘 이거를 자동화로 해줘"
 *
 * ⚠️ 전문가 솔직 전제: 순위는 "강제로 밀어올릴" 수 없다. 자동화로 정당하게 할 수 있는 것은
 *    (1) 하락 가게 자동 탐지  (2) 하락의 실제 원인인 "온페이지 회귀" 진단
 *    (3) 하락 URL만 골라 IndexNow 재크롤 신호 발사(신선도 가속)
 *    (4) 사람이 손봐야 할 콘텐츠 회귀는 정확한 지표와 함께 사람에게 알림.
 *    콘텐츠 재작성은 100% 사람 규칙(feedback_no_ai_human_only)상 자동으로 하지 않는다.
 *
 * 기존 자산과의 관계:
 *   - venue-rank-trend.mjs : 매주 추이 "리포트"(읽기). 본 스크립트는 그 하락분에 "대응".
 *   - indexnow.mjs / google-reindex.mjs : 매일 전체 벌크 재크롤. 본 스크립트는 하락 URL만 타깃.
 *
 * 인증: scripts/lib/gsc-auth.mjs (서비스계정 GSC_SA_JSON)
 *       INDEXNOW_KEY (재크롤 핑) / RESEND_API_KEY · NOTIFICATION_EMAIL (메일)
 *
 * 동작:
 *   1) venues.ts 파싱 → 가게이름·URL
 *   2) GSC searchAnalytics 2윈도우(이번주/전주) → 하락(down)·권밖(dropped) 가게 추림
 *   3) 하락 가게 라이브 HTML 1개씩 fetch → 온페이지 회귀 진단(title/desc/H1/JSON-LD/밀도)
 *   4) 하락 URL만 IndexNow 재크롤 핑
 *   5) 메일 1통: ✅자동조치(재크롤) vs 🛠️사람필요(콘텐츠 회귀 지표) 분리
 *
 * 읽기 전용 + 색인 핑만. 소스/콘텐츠 수정 없음. GSC 데이터 약 2일 지연.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getAccessToken, gscQuery, hasGscCredentials } from './lib/gsc-auth.mjs';

const SITE = 'nolcool.com';
const BASE = `https://${SITE}`;
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const WINDOW = 7;

const CAT_PATH = { club: 'clubs', night: 'nights', lounge: 'lounges', room: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa' };
const REGIONED = new Set(['club', 'room', 'yojeong']);

if (!hasGscCredentials()) {
  console.log('⏭️  GSC 인증정보 미설정 (GSC_SA_JSON) — 스킵');
  process.exit(0);
}

/* ─── venues.ts 파싱 (venue-rank-trend.mjs 와 동일 패턴) ─── */
function parseVenues() {
  const src = fs.readFileSync(path.join('src', 'data', 'venues.ts'), 'utf8');
  const out = [];
  const re = /id:\s*'(v-\d+)',[\s\S]{0,500}?slug:\s*'([^']+)',[\s\S]{0,500}?name:\s*'([^']+)',[\s\S]{0,500}?category:\s*'([^']+)'[\s\S]{0,500}?region:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, id, slug, name, cat, region] = m;
    const cp = CAT_PATH[cat] || cat;
    const url = REGIONED.has(cat) ? `${BASE}/${cp}/${region}/${slug}/` : `${BASE}/${cp}/${slug}/`;
    out.push({ id, slug, name, cat, region, url });
  }
  return out;
}

const norm = (s) => (s || '').replace(/\s+/g, '');

/** 검색어 행들을 가게이름별로 묶어 노출가중 대표순위 산출. */
function aggregateByVenue(venues, rows) {
  const names = venues
    .map((v) => ({ v, key: norm(v.name) }))
    .filter((x) => x.key.length >= 3)
    .sort((a, b) => b.key.length - a.key.length);
  const acc = new Map();
  for (const row of rows) {
    const q = norm(row.keys[0]);
    if (!q) continue;
    const hit = names.find(({ key }) => q.includes(key) || key.includes(q));
    if (!hit) continue;
    const id = hit.v.id;
    const a = acc.get(id) || { v: hit.v, imp: 0, posW: 0 };
    const imp = row.impressions || 0;
    a.imp += imp;
    a.posW += (row.position || 0) * imp;
    acc.set(id, a);
  }
  const map = new Map();
  for (const [id, a] of acc) map.set(id, { v: a.v, imp: a.imp, pos: a.imp > 0 ? a.posW / a.imp : 0 });
  return map;
}

/** 라이브 HTML 1개 fetch → 온페이지 회귀 진단. */
async function diagnose(v) {
  const issues = [];
  let status = 0;
  try {
    const r = await fetch(v.url, { headers: { 'User-Agent': 'NOLCOOL-rank-responder/1.0' } });
    status = r.status;
    if (!r.ok) return { ok: false, status, issues: [`라이브 응답 ${status} (페이지 접근 불가)`] };
    const html = await r.text();

    // title: 가게이름이 맨 앞(공백 제거 비교)
    const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '';
    if (!norm(title).startsWith(norm(v.name))) issues.push(`title 맨 앞에 가게이름 없음 ("${title.slice(0, 40)}")`);

    // meta description: 가게이름 포함
    const desc = (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || [])[1] || '';
    if (!norm(desc).includes(norm(v.name))) issues.push('meta description 에 가게이름 없음');

    // H1: 가게이름 포함
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '';
    if (!norm(h1.replace(/<[^>]+>/g, '')).includes(norm(v.name))) issues.push('H1 에 가게이름 없음');

    // 업소 JSON-LD 스키마 존재 (venue-name-seo-monitor 와 동일 타입 집합 — room=EntertainmentBusiness, hoppa=BarOrPub 포함)
    if (!/"@type"\s*:\s*"(NightClub|Restaurant|BarOrPub|EntertainmentBusiness|LocalBusiness)"/.test(html)) {
      issues.push('업소 JSON-LD 스키마 누락');
    }

    // 키워드 밀도: 가게이름 등장수 / 어절수 (venue-name-seo-monitor densityPct 와 동일 산식·밴드 0.5~3.5%)
    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');
    const name = v.name;
    let count = 0;
    for (let i = 0; name && (i = bodyText.indexOf(name, i)) !== -1; i += name.length) count++;
    const words = bodyText.split(/\s+/).filter(Boolean).length;
    const density = (count / Math.max(words, 1)) * 100;
    if (density < 0.5) issues.push(`가게이름 키워드 밀도 ${density.toFixed(2)}% (<0.5% 미달, ${count}회)`);
    else if (density > 3.5) issues.push(`가게이름 키워드 밀도 ${density.toFixed(2)}% (>3.5% 과다, ${count}회)`);

    return { ok: issues.length === 0, status, issues, density: density.toFixed(2) };
  } catch (e) {
    return { ok: false, status, issues: [`fetch 실패: ${e.message}`] };
  }
}

/** 하락 URL만 IndexNow 재크롤 핑. */
async function pingIndexNow(urls) {
  if (!INDEXNOW_KEY) { console.log('⏭️  INDEXNOW_KEY 없음 — 재크롤 핑 스킵'); return { sent: 0, status: 'skip' }; }
  if (urls.length === 0) return { sent: 0, status: 'none' };
  const payload = {
    host: SITE, key: INDEXNOW_KEY, keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`,
    urlList: urls.slice(0, 10000),
  };
  const endpoints = ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow'];
  const codes = [];
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      codes.push(`${ep.includes('bing') ? 'bing' : 'indexnow'}:${res.status}`);
    } catch (e) { codes.push(`${ep}:ERR`); }
  }
  console.log(`🔁 IndexNow 재크롤 핑 ${urls.length}개 — ${codes.join(' ')}`);
  return { sent: urls.length, status: codes.join(' ') };
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
  console.log(`📋 venue ${venues.length}개 — 순위 하락 자동 대응 시작`);

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

  // 하락 추림: down(0.5위 이상 악화) + dropped(권밖 이탈)
  const drops = [];
  for (const v of venues) {
    const c = cur.get(v.id);
    const p = prev.get(v.id);
    if (!p) continue; // 전주 노출 없으면 비교 불가
    if (c) {
      const delta = p.pos - c.pos; // +면 상승
      if (delta < -0.5) drops.push({ v, kind: 'down', prevPos: p.pos, curPos: c.pos, delta });
    } else {
      drops.push({ v, kind: 'dropped', prevPos: p.pos, curPos: 0, delta: null });
    }
  }
  drops.sort((a, b) => (a.delta ?? -999) - (b.delta ?? -999));
  console.log(`📉 하락 ${drops.length}곳 (악화 ${drops.filter((d) => d.kind === 'down').length} · 권밖 ${drops.filter((d) => d.kind === 'dropped').length})`);

  if (drops.length === 0) {
    console.log('✅ 이번 주 순위 하락 가게 없음 — 대응 불필요');
    return; // 회귀 없음 = 메일 노이즈 안 만듦 (mail-only-on-failure 정책)
  }

  // 각 하락 가게 온페이지 진단
  const diagnosed = [];
  for (const d of drops) {
    const diag = await diagnose(d.v);
    diagnosed.push({ ...d, diag });
    const tag = diag.ok ? '✅온페이지정상' : `🛠️${diag.issues.length}건`;
    console.log(`  ${d.kind === 'dropped' ? '⬇️권밖' : `📉${d.delta.toFixed(1)}`} ${d.v.name} — ${tag}`);
  }

  // 하락 URL 전체를 타깃 재크롤 (신선도 가속 — 정당한 자동 레버)
  const ping = await pingIndexNow(diagnosed.map((d) => d.v.url));

  // 사람 필요 vs 자동조치만 분리
  const humanNeeded = diagnosed.filter((d) => !d.diag.ok);
  const autoOnly = diagnosed.filter((d) => d.diag.ok);

  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' KST';
  const fmtPos = (p) => (p > 0 ? p.toFixed(1) : '권밖');

  const humanRows = humanNeeded.map((d) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #F1F1F1"><a href="${d.v.url}" style="color:#7C3AED">${d.v.name}</a></td>
      <td style="padding:6px 8px;border-bottom:1px solid #F1F1F1;text-align:right">${fmtPos(d.prevPos)} → ${fmtPos(d.curPos)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #F1F1F1;color:#DC2626">${d.diag.issues.map((i) => `• ${i}`).join('<br>')}</td>
    </tr>`).join('');

  const autoRows = autoOnly.map((d) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #F1F1F1"><a href="${d.v.url}" style="color:#7C3AED">${d.v.name}</a></td>
      <td style="padding:6px 8px;border-bottom:1px solid #F1F1F1;text-align:right">${fmtPos(d.prevPos)} → ${fmtPos(d.curPos)}</td>
    </tr>`).join('');

  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px;color:#111">
    <h2 style="color:#DC2626;margin-bottom:2px">📉 놀쿨 순위 하락 자동 대응</h2>
    <p style="color:#666;font-size:12px;margin-top:2px">이번주 ${ymd(curStart)}~${ymd(end)} vs 전주 ${ymd(prevStart)}~${ymd(prevEnd)} · 발송 ${kst}</p>
    <p style="font-size:14px;margin:12px 0">하락 <b style="color:#DC2626">${drops.length}</b>곳 탐지 · 🔁 IndexNow 재크롤 핑 <b>${ping.sent}</b>개 발사 (${ping.status})<br>
      🛠️ 사람 점검 필요 <b style="color:#DC2626">${humanNeeded.length}</b> · ✅ 온페이지 정상(재크롤만으로 충분) <b style="color:#16A34A">${autoOnly.length}</b></p>

    ${humanNeeded.length ? `
    <h3 style="margin:22px 0 6px;font-size:15px">🛠️ 사람 점검 필요 — 온페이지 회귀 (${humanNeeded.length})</h3>
    <p style="font-size:12px;color:#6B7280;margin:0 0 6px">아래는 콘텐츠/메타가 무너진 가게. 콘텐츠는 100% 사람 작성 규칙상 자동 수정하지 않음. 지표를 보고 직접 보강.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="color:#6B7280;font-size:11px;border-bottom:2px solid #E5E7EB">
        <th style="text-align:left;padding:4px 8px">가게이름</th><th style="text-align:right;padding:4px 8px">전주→이번주</th><th style="text-align:left;padding:4px 8px">발견된 회귀</th>
      </tr></thead><tbody>${humanRows}</tbody></table>` : ''}

    ${autoOnly.length ? `
    <h3 style="margin:22px 0 6px;font-size:15px">✅ 자동 조치 완료 — 온페이지 정상 (${autoOnly.length})</h3>
    <p style="font-size:12px;color:#6B7280;margin:0 0 6px">페이지는 멀쩡한데 순위만 빠짐(경쟁/변동). 하락 URL 타깃 재크롤 핑 발사 완료. 추가 손볼 것 없음.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="color:#6B7280;font-size:11px;border-bottom:2px solid #E5E7EB">
        <th style="text-align:left;padding:4px 8px">가게이름</th><th style="text-align:right;padding:4px 8px">전주→이번주</th>
      </tr></thead><tbody>${autoRows}</tbody></table>` : ''}

    <p style="color:#9CA3AF;font-size:11px;margin-top:24px">순위는 강제로 못 올린다. 이 자동화는 ①하락 탐지 ②온페이지 회귀 진단 ③하락 URL 재크롤 가속 ④사람 보강 알림까지 한다. 평균순위=노출가중, Google 약 2일 지연. 읽기 전용 + 색인 핑.</p>
  </div>`;

  await sendMail(html, `[놀쿨][📉] 순위하락 대응 — 🛠️사람 ${humanNeeded.length} / ✅자동 ${autoOnly.length} / 🔁재크롤 ${ping.sent}`);
})().catch((e) => { console.error('❌ 실패:', e); process.exit(1); });
