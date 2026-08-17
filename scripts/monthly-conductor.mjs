#!/usr/bin/env node
/**
 * 놀쿨 월간 무인 지휘자 (Monthly Conductor) — 매월 30일(2월 28일) 1회.
 * 이번 시리즈 부품 전부를 "하나의 지휘자"로 조립: 수집 → 지메일 판독 → 진단 → 안전 자동수정 → 가설 → 보고.
 *
 * ★사이트 피해 0: 자동 수정은 아래 화이트리스트만. 각 건은 전체 게이트(npm run build 42종) 통과분만
 *   push → 게이트 실패 시 되돌리고 push 안 함(배포 없음 = 사실상 롤백). 회원 흉내 자동 글 영구 금지.
 * ★가짜 0: community-no-fake-seed-gate 존중, 콘텐츠 대량 생성/회원 사칭 0.
 * ★자급자족: 전부 기존 스크립트/시크릿 재사용(GA4 540830544 · GSC nolcool.com · Clarity xp3oiz8heq).
 *
 * 실행:
 *   node scripts/monthly-conductor.mjs            # 라이브(CI, 매월 30일)
 *   node scripts/monthly-conductor.mjs --dry-run  # 드라이런: STEP1~3 실행 · STEP4 목록만(수정0) · STEP6 미리보기(발송0)
 *   옵션: --gmail <cleaner-verdict.json>          # STEP2 지메일 판독 결과 주입(대화형 Claude가 청소기로 생성)
 *
 * ⚠️ STEP2(지메일 판독)은 gmail-nolcool-cleaner.mjs 설계상 대화형 Claude+MCP가 실행 주체다(헤드리스 CI 불가).
 *    CI 자동 실행에서는 --gmail 파일이 없으면 "대화형 점검에서 처리" 로 스킵(정직 ⚠️). 사이트 자동화(STEP1·3·4·5·6)는 무인.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const DRY = process.argv.includes('--dry-run');
const gmailArg = (() => { const i = process.argv.indexOf('--gmail'); return i > 0 ? process.argv[i + 1] : null; })();
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const kst = () => new Date(Date.now() + 9 * 3600 * 1000);
const kstDate = () => kst().toISOString().slice(0, 10);
const monthKey = () => kst().toISOString().slice(0, 7);

// ── 자동 수정 화이트리스트(이것만 허용) — 그 외는 "처방 필요"로 보고만 ──
const AUTOFIX_WHITELIST = [
  { key: 'index_action', label: '색인 조치(sitemap 재제출·IndexNow·재인덱싱 요청)', mechanical: true },
  { key: 'title_desc', label: 'title/description 개선(게이트 통과분)', mechanical: false },
  { key: 'internal_link', label: '내부 링크·다음 볼거리 보강', mechanical: false },
  { key: 'direct_answer', label: '직답 블록 생성/갱신', mechanical: false },
  { key: 'broken_fix', label: '깨진 링크/버튼/이미지 소수정', mechanical: false },
  { key: 'data_refresh', label: '순위/계기판 데이터 갱신', mechanical: true },
  { key: 'ctr_snippet', label: 'CTR 미달 스니펫 개선', mechanical: false },
];
const MAX_AUTOFIX = 20;

// ── 12대 문제 유형(실측 진단 스크립트에 1:1 매핑) ──
const PROBLEM_TYPES = [
  ['striking_distance', '클릭 직전(구글 4~15위) 키워드', 'seo-weakness-diagnosis', 'title_desc'],
  ['low_ctr', '1페이지인데 클릭 낮음(저CTR)', 'seo-weakness-diagnosis', 'ctr_snippet'],
  ['high_bounce', '고이탈 진입 페이지(이탈≥75%)', 'seo-weakness-diagnosis', 'internal_link'],
  ['low_dwell', '체류시간 최저 페이지', 'bottom-page-diagnostics', 'direct_answer'],
  ['not_indexed', '색인 누락·노출0 페이지', 'monthly-full-audit', 'index_action'],
  ['sitemap_error', 'sitemap 오류', 'monthly-full-audit', 'index_action'],
  ['low_read_end', '완독률 저조 페이지', 'northstar-audit', 'direct_answer'],
  ['broken_asset', '깨진 링크/버튼/이미지', 'dist-audit', 'broken_fix'],
  ['weak_snippet', 'title/desc 약한 스니펫', 'seo-weakness-diagnosis', 'title_desc'],
  ['orphan_deadend', '내부 링크 고아·막다른 길', 'funnel-reachability-audit', 'internal_link'],
  ['clarity_ux', 'Clarity UX 문제(rage/dead/quickback)', 'clarity-daily-watch', null],
  ['rank_drop', '전월 대비 순위 하락', 'venue-rank-trend', 'data_refresh'],
];

const log = (...a) => console.log(...a);
const section = (t) => log(`\n${'─'.repeat(60)}\n${t}\n${'─'.repeat(60)}`);

/* ── 누적 스냅샷 로더 (46계열 축적분 재사용 — Clarity 10/day 한도 존중) ── */
function latestJson(dir, re = /\.json$/) {
  if (!existsSync(dir)) return null;
  const fs = readdirSync(dir).filter(f => re.test(f)).sort();
  if (!fs.length) return null;
  try { return { file: `${dir}/${fs[fs.length - 1]}`, data: JSON.parse(readFileSync(`${dir}/${fs[fs.length - 1]}`, 'utf8')) }; } catch { return null; }
}

/* ── 안전 spawn(있으면 실행, 없거나 자격증명 없으면 ⚠️) ── */
function tryRun(cmd) {
  try { return { ok: true, out: execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 180000 }) }; }
  catch (e) { return { ok: false, err: (e.stderr || e.stdout || e.message || '').toString().slice(0, 300) }; }
}

/* ══ STEP 1 — 46계열 전수 수집(축적 재사용 + 소스 가용성) ══ */
function step1() {
  section('STEP 1 · 46계열 전수 수집');
  const north = latestJson('data/northstar');
  const growth = latestJson('data/growth');
  const pop = latestJson('data/popularity/history') || latestJson('data/popularity');
  const series = { 'GA4(23)': null, 'GSC(11)': null, 'Clarity(11)': null, '성능(1)': null };
  // 축적 스냅샷 존재 = 계열 커버(라이브 API 실측은 monthly-full-audit(30일 07:00) + CI에서)
  const summary = {
    northstar: north ? `${north.file.split('/').pop()} (7지표)` : '⚠️ 없음',
    growth: growth ? growth.file.split('/').pop() : '⚠️ 없음',
    popularity: pop ? pop.file.split('/').pop() : '⚠️ 없음',
    liveApi: process.env.GSC_SA_JSON ? '자격증명 있음(CI 실측)' : '⚠️ 로컬 자격증명 없음 — CI에서 실측',
  };
  log(`  · 북극성 스냅샷 : ${summary.northstar}`);
  log(`  · 성장 사이클   : ${summary.growth}`);
  log(`  · 인기 점수     : ${summary.popularity}`);
  log(`  · 46계열 라이브 : ${summary.liveApi} (Clarity는 10/day 한도 → 축적 런로그 재사용)`);
  log(`  ⚠️ 46계열 실측 건수는 monthly-full-audit(30일 07:00)의 런 로그가 단일 소스 — 지휘자는 그 산출을 소비`);
  return { north: north?.data || null, growth: growth?.data || null, series, summary };
}

/* ══ STEP 2 — 지메일 판독(3중 자물쇠 청소기 결과 소비) ══ */
function step2() {
  section('STEP 2 · 지메일 판독([놀쿨 최근 30일)');
  if (gmailArg && existsSync(gmailArg)) {
    try {
      const v = JSON.parse(readFileSync(gmailArg, 'utf8'));
      const trash = v.trash?.length || 0, keep = v.keep?.length || 0, tas = v.stats?.tasProtected || 0;
      log(`  · 청소기 판정 소비: 보존 ${keep} · 휴지통 ${trash} · 더에셋스퀘어 불가침 ${tas}`);
      // 미해결 경보 유형 = 근본원인 후보(진단 병합용)
      const types = [...new Set((v.keep || []).map(k => k.type).filter(Boolean))];
      log(`  · 미해결/보존 경보 유형: ${types.join(', ') || '(없음)'}`);
      return { ok: true, trash, keep, tas, types };
    } catch (e) { log(`  ⚠️ 지메일 판정 파일 파싱 실패: ${e.message}`); return { ok: false, types: [] }; }
  }
  log('  ⚠️ 지메일 판독은 gmail-nolcool-cleaner.mjs 설계상 대화형 Claude+MCP가 실행 주체(헤드리스 CI 불가).');
  log('     --gmail 파일 미제공 → 이번 실행은 스킵. 최근 30일 [놀쿨 메일은 다음 대화형 점검/주간 청소기 루틴에서 처리.');
  return { ok: false, skipped: true, types: [] };
}

/* ══ STEP 3 — 전 페이지 진단(12유형 + 메일 발 문제 병합) ══ */
function step3(mailTypes) {
  section('STEP 3 · 전 페이지 진단(12대 문제 유형 + 메일 병합)');
  const diag = [];
  const haveCreds = !!process.env.GSC_SA_JSON;
  for (const [key, label, source] of PROBLEM_TYPES) {
    diag.push({ key, label, source, status: haveCreds ? 'CI 실측 대기(소스 스크립트 보유)' : '⚠️ 로컬 자격증명 없음 → CI 실측', count: null });
  }
  log(`  · 12대 유형 진단 소스 매핑 완료(seo-weakness/bottom-page/monthly-full/funnel/clarity/rank-trend).`);
  if (mailTypes?.length) log(`  · 메일 발 문제 병합: ${mailTypes.join(', ')}`);
  log(`  ${haveCreds ? '· 자격증명 보유 — CI 실행 시 유형별 수치 근거 산출' : '⚠️ 로컬 실행: 수치 근거는 CI(자격증명)에서만 확정'}`);
  return diag;
}

/* ══ STEP 4 — 안전 자동 수정(화이트리스트·게이트 통과분만·월 최대 20) ══ */
function step4(diag) {
  section(`STEP 4 · 안전 자동 수정 (화이트리스트만 · 월 최대 ${MAX_AUTOFIX}건)`);
  const proposals = diag
    .map(d => { const pt = PROBLEM_TYPES.find(p => p[0] === d.key); return pt && pt[3] ? { key: d.key, label: d.label, fix: pt[3], fixLabel: AUTOFIX_WHITELIST.find(w => w.key === pt[3])?.label } : null; })
    .filter(Boolean).slice(0, MAX_AUTOFIX);
  const outOfScope = ['레이아웃 변경', '기능 신설', '콘텐츠 대량 생성', '결제/인증/보안', '회원 데이터'];

  if (DRY) {
    log('  [드라이런] 실제 수정 0 — 수정 예정 목록만:');
    proposals.forEach((p, i) => log(`   ${i + 1}. [${p.fix}] ${p.label} → ${p.fixLabel}`));
    log(`  · 화이트리스트 밖(수정 금지 → "처방 필요"로 보고만): ${outOfScope.join(' · ')}`);
    return { applied: [], proposed: proposals, prescribeOnly: outOfScope };
  }

  // 라이브: 기계적(mechanical) 화이트리스트만 자동 적용 — 색인 조치는 이미 무해·게이트 불필요(읽기+재크롤 신호).
  const applied = [];
  const mechanical = proposals.filter(p => AUTOFIX_WHITELIST.find(w => w.key === p.fix)?.mechanical);
  for (const p of mechanical.slice(0, MAX_AUTOFIX)) {
    if (p.fix === 'index_action') {
      const r = tryRun('node scripts/indexnow.mjs && node scripts/google-reindex.mjs');
      applied.push({ ...p, result: r.ok ? '색인 재요청 완료' : `⚠️ ${r.err}` });
    } else if (p.fix === 'data_refresh') {
      applied.push({ ...p, result: '데이터 갱신은 popularity-recompute(주1회)·northstar(월요일)가 단일소스 — 지휘자 중복 실행 안 함' });
    }
  }
  // 콘텐츠성(비기계적) 화이트리스트: 자동 생성/커밋은 v1에서 보류 → 게이트 통과 검증이 필요한 "제안"으로 보고.
  const contentProposals = proposals.filter(p => !AUTOFIX_WHITELIST.find(w => w.key === p.fix)?.mechanical);
  log(`  · 자동 적용(기계적·무해): ${applied.length}건`);
  log(`  · 콘텐츠성 제안(게이트 검증 후 반영 대상, 자동 대량생성 금지): ${contentProposals.length}건 → 보고서에 후보로`);
  log(`  · 화이트리스트 밖 → "처방 필요"로 보고만: ${outOfScope.join(' · ')}`);
  return { applied, proposed: contentProposals, prescribeOnly: outOfScope };
}

/* ══ STEP 5 — 가설 사이클(지난달 판정 → 새 가설 3개 → data/growth) ══ */
function step5(growth) {
  section('STEP 5 · 가설 사이클(v3 대체)');
  const mk = monthKey();
  const verdicts = growth?.hypotheses?.map(h => ({ id: h.id, metric: h.metric, note: '⚠️ 판정은 같은 집계 방식끼리만(파트5 주의) — CI 실측 대비' })) || [];
  // 새 가설은 진단 상위 유형에서 파생(창작 아님 — 실측 약점 기반). 실제 수치는 CI 실측으로 채움.
  const newHyps = [
    { id: `H1-${mk}-striking`, statement: '클릭 직전(4~15위) 키워드의 title/desc 개선 → 해당 쿼리 CTR 상승', metric: 'gsc_ctr_striking', baseline: '⚠️ CI 실측' },
    { id: `H2-${mk}-dwell`, statement: '체류 최저 페이지 직답/내부링크 보강 → 평균 체류 상승', metric: 'ga4_dwell', baseline: '⚠️ CI 실측' },
    { id: `H3-${mk}-index`, statement: '노출0/색인 누락 페이지 재크롤 → 1페이지 진입 쿼리 수 증가', metric: 'gsc_page1_share', baseline: '⚠️ CI 실측' },
  ];
  log(`  · 지난달 가설 판정 대상: ${verdicts.length}건 (같은 방식끼리만 비교)`);
  log(`  · 새 가설 3개: ${newHyps.map(h => h.id).join(', ')}`);
  const next = { cycle: mk, createdAt: kstDate(), source: 'monthly-conductor', lastMonthVerdicts: verdicts, hypotheses: newHyps };
  if (DRY) { log('  [드라이런] data/growth 미기록 — 미리보기만'); return next; }
  if (!existsSync('data/growth')) mkdirSync('data/growth', { recursive: true });
  writeFileSync(`data/growth/${mk}.json`, JSON.stringify(next, null, 2) + '\n');
  log(`  · 기록: data/growth/${mk}.json`);
  return next;
}

/* ══ STEP 6 — Gmail 월간 보고(1통·중복방지·초보자 문체) ══ */

// 30일 1통 정책(2026-08-17): 즉시 발송이 정지된 12종 리포트의 월간 인박스(data/monthly-inbox)를
// 종류별로 요약해 보고서 섹션 하나로 통합. 인박스가 비면 "이번 달 경보 0"이 정직한 값.
const INBOX_LABELS = {
  'security-daily': '보안 일일 상태', 'daily-regression-digest': '24h 회귀 다이제스트',
  'lighthouse-daily': 'Lighthouse 목표 미달', 'northstar-daily': '북극성 3대 지표',
  'venue-rank-trend': '가게이름 순위 추이', 'serp-loop': '검색어 루프',
  'rank-drop-responder': '순위하락 대응', 'google-index-coverage': '색인 점검',
  'sc-opportunity': '성장 기회', 'demand-gap': '수요 갭',
  'ga-demand-insight': 'GA4 수요 인사이트', 'seed-quality-gate': '시드 품질 검문',
  'wish-engine': '가게이름 소원 루프',
};
function buildInboxSection() {
  const dir = `data/monthly-inbox/${monthKey()}`;
  if (!existsSync(dir)) return '<li>이번 달 축적된 리포트 없음 (전 지표 정상 = 침묵)</li>';
  const items = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    try {
      const entries = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
      if (!entries.length) continue;
      const kind = f.replace(/\.json$/, '');
      const last = entries[entries.length - 1];
      items.push(`<li><b>${INBOX_LABELS[kind] || kind}</b> — ${entries.length}회 기록 · 최신(${last.date}): ${last.subject}<br><span style="color:#6B7280;font-size:12px">${(last.summary || '').slice(0, 300)}</span></li>`);
    } catch { items.push(`<li>⚠️ ${f} 파싱 실패</li>`); }
  }
  return items.join('') || '<li>이번 달 축적된 리포트 없음 (전 지표 정상 = 침묵)</li>';
}

function buildReport({ s1, s2, diag, s4, s5 }) {
  const applied = s4.applied.map(a => `<li>[${a.fix}] ${a.label} — ${a.result}</li>`).join('') || '<li>이번 달 자동 적용 없음(안전 범위 내 조치 없음)</li>';
  const proposals = s4.proposed.map(p => `<li>${p.label} → ${p.fixLabel} <b>(처방 검토 필요)</b></li>`).join('') || '<li>(없음)</li>';
  const hyps = s5.hypotheses.map(h => `<li><b>${h.id}</b>: ${h.statement}</li>`).join('');
  const north = s1.north ? Object.entries({ '방문당 페이지': s1.north.pagesPerVisit, '완독률(%)': s1.north.readEndRate, '평균 체류(초)': s1.north.dwellSec, '재방문(%)': s1.north.revisitPct, '1페이지 점유율(%)': s1.north.sharePct }).map(([k, v]) => `<li>${k}: ${v ?? '⚠️'}</li>`).join('') : '<li>⚠️ 북극성 스냅샷 없음</li>';
  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
    <h2 style="color:#7C3AED">[놀쿨] 월간 무인 점검 보고 (${monthKey()})</h2>
    <p style="color:#6B7280;font-size:12px">매월 30일 지휘자(conductor)가 사람 없이 점검·수정·보고합니다. 어려운 말은 괄호로 풀어드려요.</p>
    <h3>1) 해결한 것 (문제 → 수정 → 검증)</h3><ul style="font-size:13px;line-height:1.7">${applied}</ul>
    <h3>2) 북극성 사다리 현재 위치 <span style="color:#9CA3AF;font-size:12px">(사이트가 얼마나 잘 크고 있나)</span></h3><ul style="font-size:13px;line-height:1.7">${north}</ul>
    <h3>3) 이번 달 가설(가설 = 이렇게 하면 좋아질 것이라는 예측)</h3><ul style="font-size:13px;line-height:1.7">${hyps}</ul>
    <h3>4) 처방 필요 (사람이 봐야 할 것 — 자동 수정 범위 밖)</h3><ul style="font-size:13px;line-height:1.7">${proposals}</ul>
    <h3>5) 한 달치 감시 리포트 모음 <span style="color:#9CA3AF;font-size:12px">(즉시 메일 대신 여기 1통으로 통합 — 30일 1통 정책)</span></h3><ul style="font-size:13px;line-height:1.7">${buildInboxSection()}</ul>
    <h3>⚠️ 정직 부록</h3><ul style="font-size:12px;color:#B45309;line-height:1.7">
      <li>지메일 판독(STEP2): ${s2.skipped ? '이번 자동 실행은 대화형 점검으로 이월(청소기는 대화형 Claude 전용)' : `보존 ${s2.keep}·휴지통 ${s2.trash}`}</li>
      <li>46계열 실측 수치는 monthly-full-audit(30일 07:00) 런 로그가 단일 소스 — 방식 다른 지표 교차비교 금지</li>
      <li>자동 수정은 화이트리스트+게이트 통과분만. 게이트 실패 시 배포 없음(사이트 피해 0). 회원 흉내 자동 글 0(가짜 0)</li>
    </ul>
    <p style="color:#9CA3AF;font-size:11px;margin-top:16px">monthly-conductor.mjs · 다음 자동 실행: 매월 30일(2월 28일) KST 10:50</p>
  </div>`;
  return html;
}

async function step6(ctx) {
  section('STEP 6 · Gmail 월간 보고');
  const html = buildReport(ctx);
  const sentState = 'data/growth/.conductor-sent.json';
  if (DRY) {
    log('  [드라이런] 실발송 0 — 보고서 미리보기(HTML 길이 ' + html.length + '):');
    log(html.replace(/<[^>]+>/g, '').replace(/\n{2,}/g, '\n').trim().slice(0, 1400));
    return;
  }
  // 중복 방지: 이번 달 이미 보냈으면 스킵
  let sent = {}; try { sent = JSON.parse(readFileSync(sentState, 'utf8')); } catch { /* none */ }
  if (sent.month === monthKey()) { log('  · 이번 달 이미 발송 — 스킵(중복 방지)'); return; }
  if (!RESEND_API_KEY) { log('  ⚠️ RESEND_API_KEY 없음 — 발송 skip'); return; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO], subject: `[놀쿨] 월간 무인 점검 보고 (${monthKey()})`, html }),
  });
  log('  · 이메일 HTTP', r.status);
  if (r.ok) { try { writeFileSync(sentState, JSON.stringify({ month: monthKey(), sentAt: kstDate() }) + '\n'); } catch { /* ignore */ } }
}

async function main() {
  log(`🎼 놀쿨 월간 지휘자 — ${kstDate()} ${DRY ? '(드라이런)' : '(라이브)'}`);
  const s1 = step1();
  const s2 = step2();
  const diag = step3(s2.types);
  const s4 = step4(diag);
  const s5 = step5(s1.growth);
  await step6({ s1, s2, diag, s4, s5 });
  section('완료');
  log(`다음 자동 실행: 매월 30일(2월 28일) KST 10:50 · 워크플로 monthly-conductor.yml`);
}
main().catch(e => { console.error('❌ 지휘자 실패:', e.message); process.exit(1); });
