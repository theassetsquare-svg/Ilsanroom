#!/usr/bin/env node
/**
 * 놀쿨 GA4 옵티마이저 — 점수를 끌어올릴 "1페이지 + 구체 처방" 자동 발견 (읽기 전용).
 *
 * ga-health-audit 와 역할 분리(중복 0):
 *   - ga-health-audit.mjs : 약한 페이지를 "목록"으로 적발(이탈/참여/체류) + 메일.
 *   - 본 스크립트         : 트래픽×갭으로 ★우선순위 1위 페이지를 지목하고,
 *                           GA4 스크롤 도달(끝까지읽기)까지 교차해 ★근본원인→구체 처방을 만든다.
 *
 * ★★★ 정직 불변식 (CLAUDE.md #0) — 이 스크립트가 절대 넘지 않는 선:
 *   - 점수는 ★진짜 방문자가 안 떠나게 콘텐츠·동선으로만 올린다. 수치 조작 0.
 *   - GA에 가짜 이벤트(page_view/scroll 등) 주입·Measurement Protocol 전송 절대 0
 *     → 구글 활동조작 탐지 = 영구 페널티 = 사이트 사망. (ga-optimizer-safety-gate가 빌드차단)
 *   - 페이지 자동 대량생성 0 (scaled-content 페널티). 처방은 "사람이 적용할 액션"만 제시.
 *   - 100% 읽기 전용: GA Data API 읽기만. 파일/라우트/DB/사이트 변경 0 → 사이트 피해 0.
 *
 * 출력: 처방 리포트(메일). 점수 목표 도달 + 처방대상 0 이면 자동 침묵(자가수렴).
 * 매일 KST 09:10. 인증: GH Secret GSC_SA_JSON (로컬 키 불필요).
 */
import { getGaToken, gaErrorReason, runReport, GA_PROPERTY } from './lib/ga-auth.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

const MIN_TOTAL_SESSIONS = 50; // 사이트 전체 이 미만이면 데이터 축적중(보류)
const MIN_PAGE_SESSIONS = 3;   // 페이지별 처방 최소 표본
const TARGET_SCORE = 50;       // 참여율×100 목표선(=이탈 50%). 업계 "양호".
// 처방 트리거 임계(이 선을 못 넘으면 해당 약점으로 진단)
const BOUNCE_HIGH = 0.70;      // 이탈 70%↑ = 첫인상에서 떠남
const DWELL_SHORT = 30;        // 평균 30초 미만 = 너무 빨리 떠남
const SCROLL_LOW = 0.35;       // 스크롤 도달률 35% 미만 = 본문 안 읽힘(끝까지읽기 약함)
const ENGAGE_LOW = 0.40;       // 참여율 40% 미만

const kst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

async function siteScore(token) {
  const r = await runReport(token, {
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    metrics: [{ name: 'sessions' }, { name: 'engagementRate' }, { name: 'bounceRate' }],
  });
  if (!r.ok) return { ok: false, r };
  const m = r.body.rows?.[0]?.metricValues || [];
  return { ok: true, sessions: Number(m[0]?.value || 0), engage: Number(m[1]?.value || 0), bounce: Number(m[2]?.value || 0) };
}

// pagePath 별 행동 지표
async function pageRows(token) {
  const r = await runReport(token, {
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'bounceRate' },
      { name: 'engagementRate' }, { name: 'averageSessionDuration' },
    ],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 1000,
  });
  return (r.body?.rows || []).map((x) => ({
    path: x.dimensionValues?.[0]?.value || '(unknown)',
    sessions: Number(x.metricValues?.[0]?.value || 0),
    views: Number(x.metricValues?.[1]?.value || 0),
    bounce: Number(x.metricValues?.[2]?.value || 0),
    engage: Number(x.metricValues?.[3]?.value || 0),
    dwell: Number(x.metricValues?.[4]?.value || 0),
  }));
}

// pagePath 별 scroll 이벤트 수(GA4 향상된측정 'scroll' = 90% 도달) → 끝까지읽기 신호
async function scrollByPage(token) {
  const r = await runReport(token, {
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'scroll' } } },
    limit: 1000,
  });
  const map = new Map();
  for (const x of r.body?.rows || []) {
    map.set(x.dimensionValues?.[0]?.value || '', Number(x.metricValues?.[0]?.value || 0));
  }
  return map;
}

// 근본원인 → 구체 처방(결정론적 규칙, 가짜 데이터 0). 점수 기여 큰 약점부터.
function prescribe(p) {
  const rx = [];
  if (p.scrollRate < SCROLL_LOW) {
    rx.push('본문이 끝까지 안 읽힘 → 첫 H2를 업소명+차별점 자기완결 답변(90~110어절)으로, 중간에 소제목·짧은 단락·리스트로 가독성↑, 모바일 줄간격 1.7');
  }
  if (p.bounce >= BOUNCE_HIGH) {
    rx.push('첫인상에서 떠남(이탈↑) → SSR hero 이미지+H1+도입 한줄을 즉시 보이게, 상단에 관련 내부링크 2개로 다음 행동 제시');
  }
  if (p.dwell < DWELL_SHORT) {
    rx.push('너무 빨리 떠남(체류↓) → 본문 고유 정보(양주/부스/룸 구성·분위기) 보강, 스크롤 진행바/관련 카드로 다음 읽을거리 연결');
  }
  if (p.engage < ENGAGE_LOW && p.dwell >= DWELL_SHORT) {
    rx.push('읽긴 읽는데 다음 행동 없음(참여↓) → 본문 내 관련 venue·매거진 cross-link, 커뮤니티 글감/후기 유도 동선 추가');
  }
  return rx;
}

async function main() {
  const token = await getGaToken();
  if (!token) { console.error('❌ GA 토큰 발급 실패 (GSC_SA_JSON 확인)'); process.exit(1); }
  console.log(`🔑 GA 인증 OK · 속성 ${GA_PROPERTY}`);

  const site = await siteScore(token);
  if (!site.ok) {
    console.error(`❌ runReport 실패 — ${gaErrorReason(site.r.status, site.r.body)}`);
    process.exit(2);
  }
  const score = Math.round(site.engage * 100);
  console.log(`📊 사이트 점수 ${score}/100 · 이탈 ${(site.bounce * 100).toFixed(0)}% · 세션 ${site.sessions}`);

  if (site.sessions < MIN_TOTAL_SESSIONS) {
    console.log(`⏳ 데이터 축적중 (세션 ${site.sessions} < ${MIN_TOTAL_SESSIONS}) — 처방 보류, 메일 미발송`);
    return;
  }

  const [rows, scroll] = await Promise.all([pageRows(token), scrollByPage(token)]);
  const cand = rows
    .filter((p) => p.sessions >= MIN_PAGE_SESSIONS)
    .map((p) => {
      // scrollRate = scroll(향상측정, 게이트 없음=봇·감사봇 포함) ÷ page_view(게이트=진짜 방문자만).
      // 분자가 분모보다 클 수 있어(>100%) 물리 불가능값이 나옴 → [0,1] 클램프로 "끝까지읽기"를 상한 근사로만 사용.
      // (수치 조작 아님: 가짜 이벤트 주입·전송 0. 표시 가능한 범위로 정직하게 자르기만.)
      const rawScroll = p.views > 0 ? (scroll.get(p.path) || 0) / p.views : 0;
      const scrollRate = Math.min(1, Math.max(0, rawScroll));
      const pp = { ...p, scrollRate };
      const rx = prescribe(pp);
      // 우선순위 = 트래픽 × (1 - 참여율) = 고치면 점수 가장 많이 오를 페이지
      const lift = p.sessions * (1 - p.engage);
      return { ...pp, rx, lift };
    })
    .filter((p) => p.rx.length > 0)
    .sort((a, b) => b.lift - a.lift);

  console.log(`🔧 처방 대상 페이지 ${cand.length} · 1순위 ${cand[0]?.path || '-'}`);

  const siteFail = score < TARGET_SCORE;
  if (!siteFail && cand.length === 0) {
    console.log(`✅ 점수 ${score}/100 (목표 ${TARGET_SCORE}+) · 처방 대상 0 — 메일 미발송(자가수렴)`);
    return;
  }
  await sendMail({ score, site, cand: cand.slice(0, 10) });
}

function card(p, i) {
  const lis = p.rx.map((r) => `<li style="margin:4px 0;font-size:13px;color:#374151">${r}</li>`).join('');
  return `<div style="border:1px solid #E5E7EB;border-radius:8px;padding:12px;margin:10px 0">
    <p style="margin:0 0 4px"><b>${i + 1}순위</b> · <a href="https://nolcool.com${p.path}" style="color:#2563EB">${p.path}</a></p>
    <p style="margin:0 0 6px;color:#6B7280;font-size:12px">세션 ${p.sessions} · 이탈 ${(p.bounce * 100).toFixed(0)}% · 참여 ${(p.engage * 100).toFixed(0)}% · 체류 ${p.dwell.toFixed(0)}초 · 스크롤도달 ${(p.scrollRate * 100).toFixed(0)}%</p>
    <ul style="margin:0;padding-left:18px">${lis}</ul></div>`;
}

async function sendMail({ score, site, cand }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px;color:#111">
    <h2 style="color:#7C3AED">[놀쿨 GA4 옵티마이저] 점수 ${score}/100 — 올릴 페이지 ${cand.length}곳 처방</h2>
    <p style="background:#F5F3FF;border-radius:8px;padding:12px;color:#374151;font-size:13px">
      아래는 <b>고치면 점수가 가장 많이 오를 순서(트래픽×갭)</b>로 정렬한 페이지와 ★구체 처방입니다.
      <b>사람이 진짜 콘텐츠로 적용</b>하세요. 자동 대량생성·가짜 이벤트 주입은 하지 않습니다(구글 페널티 방지).
      다음날 점수가 오르면 그 페이지는 목록에서 자동으로 빠집니다.</p>
    <p style="color:#444;font-size:13px">사이트 7일 — 세션 ${site.sessions} · 이탈 ${(site.bounce * 100).toFixed(0)}% · 참여율 ${(site.engage * 100).toFixed(0)}%</p>
    ${cand.map(card).join('')}
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 09:10 자동 — ga-optimizer.mjs (속성 540830544) · 100% 읽기전용(사이트 변경 0) · 점수 ${TARGET_SCORE}+ & 처방0 도달 시 자동 침묵.</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO],
      subject: `[놀쿨][GA4 처방] 점수 ${score}/100 · ${cand.length}곳 (${kst()})`,
      html,
    }),
  }).catch(() => null);
  console.log('옵티마이저 이메일 HTTP', r ? r.status : '실패');
}

main().catch((e) => { console.error(e); process.exit(1); });
