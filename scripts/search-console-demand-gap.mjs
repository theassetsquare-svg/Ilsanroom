#!/usr/bin/env node
/**
 * 놀쿨 STEP 4 — 수요 갭 탐지 (비공개 내부 리포트)
 *
 * "사람들이 실제로 검색하는데 놀쿨 페이지가 없거나 약한" 지역/업소를 찾아낸다.
 * ★발견만 한다. 진짜 데이터로 된 진짜 페이지는 사람이 만든다. 자동 대량생성 0.
 *
 * 다른 워크플로와 역할 분리(중복 0):
 *   - search-console-opportunity.mjs : 평균순위 4~15위 = "조금만 밀면 1페이지" (밀기)
 *   - ga-demand-insight.mjs          : 사이트 내부검색 무결과 = "사이트에 아예 없는 페이지"
 *   - 본 스크립트                    : GSC 노출은 있는데 평균순위 15~50위로 묻힘
 *                                      = "페이지가 약하거나 전용 페이지가 없는 수요 갭"
 *
 * 분류:
 *   🏷️ 업소 수요(약함)   : 검색어에 실재 업소명 포함 → 그 업소 페이지가 묻힘(보강 대상)
 *   📍 지역×업종 갭      : 검색어 = [지역]+[업종]인데 묻힘 → 지역 허브/업소 페이지 약함·신규 후보
 *   ❓ 기타 수요         : 위 둘에 안 잡히는 노출 수요(사람 검토)
 *
 * ★안전: 100% 읽기 전용 — GSC searchAnalytics API + venues.ts 파싱만.
 *   - 사이트 크롤 0, 페이지 생성 0, 파일/라우트 쓰기 0, git 0, DB 0 → 사이트 피해 0
 *   - 검색어는 GSC가 집계·익명화한 값(개별 사용자 식별 불가) → 개인정보 안전
 *   - 가짜 업소·가짜 지역·가짜 수요 0 (실 GSC 데이터 + 실 venues.ts 인벤토리만)
 *
 * 매주 월 KST 03:00. 인증: GH Secret GSC_SA_JSON(서비스계정, 만료 없음). 갭 있을 때만 메일.
 */
import fs from 'node:fs';
import { getAccessToken, gscQuery, hasGscCredentials } from './lib/gsc-auth.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

const DAYS = 28;
const ROW_LIMIT = 250;
const MIN_TOTAL_IMPRESSIONS = 30; // 표본 게이트
const MIN_IMP = 8;                // 갭 후보 최소 노출
// 갭 밴드: opportunity(3.5~15)와 겹치지 않게 15 초과부터. 50 넘으면 현실적으로 노이즈.
const GAP_POS_MIN = 15.0;
const GAP_POS_MAX = 50.0;

const CAT_LABELS = ['클럽', '나이트', '라운지', '룸', '요정', '호빠', '호스트바', '나이트클럽'];

const kst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '').replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]/g, '');

// venues.ts 에서 실재 업소명/지역 인벤토리 추출 (읽기 전용 파싱)
function loadInventory() {
  const src = fs.readFileSync('src/data/venues.ts', 'utf8');
  const names = new Set();
  const regions = new Set();
  for (const m of src.matchAll(/nameKo:\s*'([^']+)'/g)) names.add(norm(m[1]));
  for (const m of src.matchAll(/regionKo:\s*'([^']+)'/g)) regions.add(norm(m[1]));
  return { names: [...names].filter(Boolean), regions: [...regions].filter(Boolean) };
}

function classify(termNorm, inv) {
  if (inv.names.some((n) => n.length >= 2 && (termNorm.includes(n) || n.includes(termNorm)))) {
    return 'venue';
  }
  const hasRegion = inv.regions.some((r) => r.length >= 2 && termNorm.includes(r));
  const hasCat = CAT_LABELS.some((c) => termNorm.includes(norm(c)));
  if (hasRegion && hasCat) return 'regioncat';
  if (hasRegion) return 'region';
  return 'other';
}

function rowsToObj(rows) {
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

  const inv = loadInventory();
  console.log(`📚 인벤토리 — 업소명 ${inv.names.length} · 지역 ${inv.regions.length}`);

  const [q, p] = await Promise.all([
    gscQuery(token, { dimensions: ['query'], rowLimit: ROW_LIMIT, days: DAYS }),
    gscQuery(token, { dimensions: ['page'], rowLimit: ROW_LIMIT, days: DAYS }),
  ]);
  const queries = rowsToObj(q.rows);
  const pages = rowsToObj(p.rows);
  const range = { start: q.start, end: q.end };
  const totalImp = queries.reduce((n, r) => n + r.imp, 0);
  console.log(`📊 GSC ${range.start}~${range.end} — 검색어 ${queries.length} · 페이지 ${pages.length} · 노출 ${totalImp}`);

  if (totalImp < MIN_TOTAL_IMPRESSIONS) {
    console.log(`⏳ 데이터 축적중 (노출 ${totalImp} < ${MIN_TOTAL_IMPRESSIONS}) — 갭 판정 보류, 메일 미발송`);
    return;
  }

  // 갭 검색어: 노출 있는데 15~50위로 묻힘
  const gap = queries
    .filter((r) => r.pos > GAP_POS_MIN && r.pos <= GAP_POS_MAX && r.imp >= MIN_IMP)
    .map((r) => ({ ...r, kind: classify(norm(r.key), inv) }))
    .sort((a, b) => b.imp - a.imp);

  const venueGap = gap.filter((r) => r.kind === 'venue').slice(0, 20);
  const regionGap = gap.filter((r) => r.kind === 'regioncat' || r.kind === 'region').slice(0, 20);
  const otherGap = gap.filter((r) => r.kind === 'other').slice(0, 15);

  // 갭 페이지: 묻힌 페이지(보강 대상)
  const pageGap = pages
    .filter((r) => r.pos > GAP_POS_MIN && r.pos <= GAP_POS_MAX && r.imp >= MIN_IMP)
    .sort((a, b) => b.imp - a.imp).slice(0, 15);

  console.log(`🏷️ 업소갭 ${venueGap.length} · 📍 지역갭 ${regionGap.length} · ❓ 기타 ${otherGap.length} · 📄 페이지갭 ${pageGap.length}`);

  if (!venueGap.length && !regionGap.length && !otherGap.length && !pageGap.length) {
    console.log('✅ 수요 갭 없음(묻힌 검색어 없음) — 메일 미발송');
    return;
  }
  await sendMail({ range, totalImp, venueGap, regionGap, otherGap, pageGap });
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

async function sendMail({ range, totalImp, venueGap, regionGap, otherGap, pageGap }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const qcols = [
    { h: '검색어', f: (x) => x.key }, { h: '노출', f: (x) => x.imp },
    { h: '클릭', f: (x) => x.clicks }, { h: '평균순위', f: (x) => x.pos.toFixed(1) },
  ];
  const html = `<div style="font-family:sans-serif;max-width:780px;margin:0 auto;padding:20px;color:#111">
    <h2 style="color:#7C3AED">[놀쿨] 수요 갭 — 찾는데 페이지가 없거나 약한 곳</h2>
    <p style="color:#666;font-size:13px">${range.start} ~ ${range.end} (최근 ${DAYS}일) · 노출 ${totalImp} · 읽기 전용(사이트 변경 0)</p>
    <p style="color:#374151;font-size:13px;background:#F5F3FF;padding:10px;border-radius:8px">
      아래는 <b>사람들이 구글에서 찾는데 놀쿨이 15~50위로 묻힌</b> 검색어입니다(4~15위 "밀기"는 별도 기회 리포트가 담당).
      <b>전용 페이지가 약하거나 없다</b>는 신호 — 사람이 직접 진짜 데이터로 페이지를 보강/신설하면 유입이 큽니다.
      <b>자동 생성은 하지 않습니다</b>(구글 대량생성 페널티 방지). 이건 발견 리포트입니다.</p>
    ${tbl('🏷️ 업소 수요인데 묻힘 (그 업소 페이지 보강)',
      '검색어에 실재 업소명이 들어있는데 15위 밖. 해당 업소 상세를 더 채우고 내부링크를 더하세요.',
      venueGap, qcols)}
    ${tbl('📍 지역×업종 갭 (지역 허브/업소 약함·신규 후보)',
      '[지역]+[업종] 수요인데 묻힘. 그 지역 업소 커버리지가 약하거나 전용 페이지가 필요할 수 있습니다(사람 판단).',
      regionGap, qcols)}
    ${tbl('📄 묻힌 유입 페이지 (보강 1순위)',
      '이미 있는 페이지인데 15~50위. 본문 보강 + 관련 페이지에서 내부링크.',
      pageGap, [{ h: '페이지', f: pathLink }, { h: '노출', f: (x) => x.imp }, { h: '클릭', f: (x) => x.clicks }, { h: '평균순위', f: (x) => x.pos.toFixed(1) }])}
    ${tbl('❓ 기타 노출 수요 (검토)',
      '업소명/지역으로 자동 분류 안 된 묻힌 검색어. 사람이 의미를 보고 판단하세요.',
      otherGap, qcols)}
    <p style="color:#9CA3AF;font-size:11px;margin-top:24px">매주 월 KST 03:00 자동 — search-console-demand-gap.mjs · GSC 약 2일 지연 · 읽기 전용(사이트 부하·변경·자동발행 0). 갭 있을 때만 발송.</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO],
      subject: `[놀쿨][🕳️] 수요 갭 ${venueGap.length + regionGap.length + otherGap.length}건 (${kst()})`,
      html,
    }),
  }).catch(() => null);
  console.log('수요갭 이메일 HTTP', r ? r.status : '실패');
}

main().catch((e) => { console.error(e); process.exit(1); });
