#!/usr/bin/env node
/**
 * 놀쿨 GSC "성장 기회" 발굴 — 트래픽을 *안전하게* 늘리는 단 하나의 레버.
 *
 * 색인·재제출·순위추적은 다른 워크플로가 이미 함. 본 스크립트는 그 다음 단계:
 * "이미 구글에 노출은 되는데 클릭/순위가 한 끗 모자란 페이지"를 찾아
 * 사람이 *무엇을* 고치면 바로 클릭이 느는지 알려준다. (콘텐츠 수정은 100% 사람)
 *
 *   🎯 클릭 직전(striking distance): 평균순위 4~15위 + 노출 충분
 *        → 본문 보강·내부링크 한 끗이면 1페이지 상단. 가장 ROI 높음.
 *   ✍️ 노출 대비 클릭 적음(low CTR): 이미 1페이지인데 CTR 낮음
 *        → title/description을 더 끌리게(후킹) 고치면 클릭 ↑. 순위 그대로 클릭만 ↑.
 *
 * 100% 읽기 전용 — GSC searchAnalytics API만 호출(사이트 크롤 0, 부하 0, 자동수정 0).
 * 사이트에 어떤 피해도 없음. 기회가 있을 때만 메일(없으면 조용 = 인박스 0).
 *
 * 매주 월 KST 11:30. 인증: GH Secret GSC_SA_JSON (서비스계정, 만료 없음).
 */
import { getAccessToken, gscQuery, hasGscCredentials } from './lib/gsc-auth.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

const DAYS = 28;
const ROW_LIMIT = 250;

// 데이터 축적 게이트 — 노출 총합이 이만큼은 쌓여야 "기회" 판정에 표본이 됨.
const MIN_TOTAL_IMPRESSIONS = 30;

// 🎯 클릭 직전: 평균순위 밴드 + 최소 노출
const STRIKE_POS_MIN = 3.5;   // 3~4위 위는 이미 상단
const STRIKE_POS_MAX = 15.0;  // 15위(약 2페이지 중반)까지가 현실적 밀기 범위
const STRIKE_MIN_IMP = 10;

// ✍️ 노출 대비 클릭 적음: 1페이지(≤10위)인데 CTR 낮고 노출 충분
const LOWCTR_POS_MAX = 10.0;
const LOWCTR_MIN_IMP = 20;
// 순위별 기대 CTR(러프) — 실측보다 낮으면 "클릭 새는 중"
const EXPECTED_CTR = (pos) => (pos <= 3 ? 0.12 : pos <= 6 ? 0.06 : 0.03);

const kst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const pct = (v) => (v * 100).toFixed(1);

function norm(rows) {
  return rows.map((r) => ({
    key: r.keys[0],
    clicks: r.clicks || 0,
    imp: r.impressions || 0,
    ctr: r.ctr || 0,
    pos: r.position || 0,
  }));
}

async function main() {
  if (!hasGscCredentials()) { console.log('⏭️  GSC 인증정보 미설정 (GSC_SA_JSON) — 스킵'); return; }
  const token = await getAccessToken();
  if (!token) { console.log('⏭️  GSC 토큰 발급 실패 — 스킵'); return; }

  const [q, p] = await Promise.all([
    gscQuery(token, { dimensions: ['query'], rowLimit: ROW_LIMIT, days: DAYS }),
    gscQuery(token, { dimensions: ['page'], rowLimit: ROW_LIMIT, days: DAYS }),
  ]);
  const queries = norm(q.rows);
  const pages = norm(p.rows);
  const range = { start: q.start, end: q.end };

  const totalImp = queries.reduce((n, r) => n + r.imp, 0);
  const totalClk = queries.reduce((n, r) => n + r.clicks, 0);
  console.log(`📊 GSC ${range.start}~${range.end} — 검색어 ${queries.length} · 페이지 ${pages.length} · 노출 ${totalImp} · 클릭 ${totalClk}`);

  if (totalImp < MIN_TOTAL_IMPRESSIONS) {
    console.log(`⏳ 데이터 축적중 (노출 ${totalImp} < ${MIN_TOTAL_IMPRESSIONS}) — 기회 판정 보류, 메일 미발송`);
    console.log('   색인·재제출은 별도 워크플로가 매일 가동중. 노출이 쌓이면 자동으로 기회 리포트 시작.');
    return;
  }

  // 🎯 클릭 직전 (키워드) — 노출 큰 순
  const strike = queries
    .filter((r) => r.pos >= STRIKE_POS_MIN && r.pos <= STRIKE_POS_MAX && r.imp >= STRIKE_MIN_IMP)
    .sort((a, b) => b.imp - a.imp).slice(0, 20);

  // ✍️ 노출 대비 클릭 적음 (키워드) — 새는 클릭(노출×(기대CTR-실CTR)) 큰 순
  const lowctr = queries
    .filter((r) => r.pos <= LOWCTR_POS_MAX && r.imp >= LOWCTR_MIN_IMP && r.ctr < EXPECTED_CTR(r.pos))
    .map((r) => ({ ...r, leak: Math.round(r.imp * (EXPECTED_CTR(r.pos) - r.ctr)) }))
    .filter((r) => r.leak >= 1)
    .sort((a, b) => b.leak - a.leak).slice(0, 20);

  // 📄 보강하면 좋은 페이지 — 1페이지 근처(순위 4~15)인데 노출 큰 페이지
  const pageStrike = pages
    .filter((r) => r.pos >= STRIKE_POS_MIN && r.pos <= STRIKE_POS_MAX && r.imp >= STRIKE_MIN_IMP)
    .sort((a, b) => b.imp - a.imp).slice(0, 15);

  console.log(`🎯 클릭직전 ${strike.length} · ✍️ 클릭새는중 ${lowctr.length} · 📄 보강페이지 ${pageStrike.length}`);

  if (!strike.length && !lowctr.length && !pageStrike.length) {
    console.log('✅ 즉시 손쓸 기회 없음(이미 상단이거나 노출 부족) — 메일 미발송');
    return;
  }
  await sendMail({ range, totalImp, totalClk, strike, lowctr, pageStrike });
}

const pathLink = (x) => {
  const u = x.key.startsWith('http') ? x.key : `https://nolcool.com${x.key}`;
  const label = x.key.replace(/^https?:\/\/nolcool\.com/, '') || '/';
  return `<a href="${u}" style="color:#2563EB">${label}</a>`;
};

function tbl(title, sub, list, cols) {
  if (!list.length) return '';
  const head = cols.map((c) => `<th style="border:1px solid #E5E7EB;padding:6px;font-size:11px;text-align:left;background:#F9FAFB">${c.h}</th>`).join('');
  const body = list.map((x) => `<tr>${cols.map((c) => `<td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">${c.f(x)}</td>`).join('')}</tr>`).join('');
  return `<h3 style="margin:22px 0 4px">${title}</h3>
    <p style="margin:0 0 8px;color:#6B7280;font-size:12px">${sub}</p>
    <table style="border-collapse:collapse;width:100%"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

async function sendMail({ range, totalImp, totalClk, strike, lowctr, pageStrike }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const html = `<div style="font-family:sans-serif;max-width:780px;margin:0 auto;padding:20px;color:#111">
    <h2 style="color:#7C3AED">[놀쿨] 트래픽 성장 기회 — 한 끗만 고치면 클릭 느는 곳</h2>
    <p style="color:#666;font-size:13px">${range.start} ~ ${range.end} (최근 ${DAYS}일) · 노출 ${totalImp} · 클릭 ${totalClk} · 읽기 전용 분석(사이트 변경 0)</p>
    <p style="color:#374151;font-size:13px;background:#F5F3FF;padding:10px;border-radius:8px">
      색인·재제출은 매일 자동으로 돌고 있습니다. 아래는 그 다음 단계 — <b>이미 구글에 보이는데 한 끗 모자란 곳</b>입니다.
      <b>사람이 직접</b> 본문·내부링크·제목을 손보면 순위는 안 떨어뜨리고 클릭만 늘어납니다. (자동수정 없음 = 사이트 안전)</p>
    ${tbl('🎯 클릭 직전 키워드 (조금만 밀면 1페이지 상단)',
      '평균순위 4~15위 + 노출 충분. 이 검색어가 들어간 페이지에 관련 본문·내부링크를 더하면 순위가 올라갑니다.',
      strike, [
      { h: '검색어', f: (x) => x.key }, { h: '노출', f: (x) => x.imp },
      { h: '클릭', f: (x) => x.clicks }, { h: '평균순위', f: (x) => x.pos.toFixed(1) }])}
    ${tbl('✍️ 노출은 많은데 클릭이 적음 (제목을 더 끌리게)',
      '이미 1페이지인데 CTR이 낮아 클릭이 새는 검색어. 해당 페이지 title/description을 더 끌리는 후킹으로 고치면 순위 그대로 클릭만 늘어납니다.',
      lowctr, [
      { h: '검색어', f: (x) => x.key }, { h: '노출', f: (x) => x.imp },
      { h: 'CTR', f: (x) => pct(x.ctr) + '%' }, { h: '평균순위', f: (x) => x.pos.toFixed(1) },
      { h: '놓친클릭(추정)', f: (x) => `~${x.leak}` }])}
    ${tbl('📄 보강하면 좋은 페이지 (1페이지 문턱)',
      '아래 페이지들은 순위가 1페이지 문턱(4~15위)에 있습니다. 이 페이지 본문을 더 채우고 관련 페이지에서 내부링크를 걸면 효과가 큽니다.',
      pageStrike, [
      { h: '페이지', f: pathLink }, { h: '노출', f: (x) => x.imp },
      { h: '클릭', f: (x) => x.clicks }, { h: '평균순위', f: (x) => x.pos.toFixed(1) }])}
    <p style="color:#9CA3AF;font-size:11px;margin-top:24px">매주 월 KST 11:30 자동 — search-console-opportunity.mjs · GSC 데이터 약 2일 지연 · 읽기 전용(사이트 부하·변경 0). 기회 있을 때만 발송.</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO],
      subject: `[놀쿨][🎯] 트래픽 성장 기회 ${strike.length + lowctr.length}건 (${kst()})`,
      html,
    }),
  }).catch(() => null);
  console.log('성장기회 이메일 HTTP', r ? r.status : '실패');
}

main().catch((e) => { console.error(e); process.exit(1); });
