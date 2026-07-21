#!/usr/bin/env node
/**
 * clarity-daily-watch — 매일 21:00 KST Clarity 조기경보 (측정+판정만, 사이트 접촉 0)
 *
 * 사장님 정책 (2026-07-21):
 *   - 놀쿨 Clarity(xp3oiz8heq)만. theassetsquare(xm8xhrdjti) 0 접촉 — 토큰이 놀쿨 프로젝트 내장 + 응답 URL 전수 분리검증.
 *   - 이 스크립트는 읽기전용 측정+판정만. 코드 수정은 21:20 KST claude.ai 일일 루틴이
 *     이 런로그의 [FINDINGS_JSON]을 회수해 게이트 내에서만 처리 (월간 사이클과 동일 역할분리).
 *   - 메일도 루틴이 발송 (문제 0 = 침묵, 스팸 0). 이 스크립트는 메일 0.
 *
 * 실API (실측 스펙 — 이 형태 외 전부 404):
 *   GET https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=1~3&dimension1..3
 *   Bearer 토큰(프로젝트 내장) · 10 성공요청/일/프로젝트 · 봇세션 제외 필드 내장
 *
 * 콜 예산 (월간 30일 사이클과 충돌 0):
 *   평일 4콜: ①totals(1d) ②URL별(1d) ③URL별(3d, 추세 기준선) ④Device+Source(1d)
 *   UTC 29일(=KST 30일 07:00 월간 스윕이 5콜 사용) 2콜: ①totals(1d) ②URL별(1d) → 합 7/10
 *   dispatch 시 CLARITY_BUDGET=2 로 절약 테스트 가능. 429/한도소진은 graceful skip(내일 자동회복).
 *
 * 문제 판정 (착시 컷):
 *   - 소표본 제외: 페이지 세션 < 10 이면 판정 제외 (JS에러만 세션≥5)
 *   - RageClick/DeadClick/ErrorClick: 문제세션 ≥3 & 페이지세션 ≥10
 *   - QuickbackClick: 문제세션 ≥5 & 페이지세션의 30% 이상
 *   - ExcessiveScroll: 문제세션 ≥5
 *   - ScriptError: 문제세션 ≥2 & 페이지세션 ≥5 (JS에러는 심각도 상향)
 *   - 급증(추세): 오늘(1d) > 3일평균 × 2 & ≥3 (3d 기준선 콜이 있는 날만)
 *
 * 항상 exit 0 (측정 실패는 로그만 — 이중경보 차단). 환경: CLARITY_API_TOKEN
 */
const TOKEN = process.env.CLARITY_API_TOKEN;
const PROJECT = process.env.CLARITY_PROJECT_ID || 'xp3oiz8heq';
if (!TOKEN) { console.log('⏭️ CLARITY_API_TOKEN 없음 — 스킵'); process.exit(0); }

const kstNow = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
const num = (v) => Number(v || 0);
const urlOf = (row) => row.URL || row.Url || row.url || '';

// UTC 29일 = 월간 스윕(5콜)과 같은 쿼터일 → 일일은 2콜로 축소
const utcDay = new Date().getUTCDate();
const monthlyDay = utcDay === 29;
const budget = Math.max(1, Math.min(4, Number(process.env.CLARITY_BUDGET) || (monthlyDay ? 2 : 4)));
let calls = 0;

async function clarityFetch(label, days, params = {}) {
  calls++;
  const qs = new URLSearchParams({ numOfDays: String(days), ...params }).toString();
  const r = await fetch(`https://www.clarity.ms/export-data/api/v1/project-live-insights?${qs}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
  }).catch(() => null);
  if (!r || !r.ok) {
    const body = r ? (await r.text().catch(() => '')).slice(0, 150) : '';
    console.warn(`⚠️ Clarity ${label}: ${r ? r.status : 'ERR'} ${body}${r && r.status === 429 ? ' — 일 한도 소진, 내일 자동회복 (경보 아님)' : ''}`);
    return null;
  }
  const data = await r.json().catch(() => null);
  return Array.isArray(data) ? data : null;
}

const PROBLEM_METRICS = /RageClick|DeadClick|ErrorClick|Quickback|ScriptError|ExcessiveScroll/i;

/** ★필드 실측 스펙 (2026-07-22 거짓양성 근본수정 — sessionsCount는 문제수가 아님!):
 *  문제 메트릭 row = { URL, sessionsCount(그 URL 총세션), sessionsWithMetricPercentage(문제세션 비율%), subTotal(문제 이벤트수) }
 *  → 문제세션 = round(sessionsCount × pct/100), 문제 이벤트 = subTotal. sessionsCount를 그대로 쓰면
 *    "트래픽 많은 페이지 = 문제 페이지" 거짓양성 (totals의 ScriptError subTotal=0인데 URL별 7건 검출됐던 사고). */
function problemOf(row) {
  const total = num(row.sessionsCount ?? row.totalSessionCount);
  const pct = num(row.sessionsWithMetricPercentage);
  const events = num(row.subTotal);
  const sessions = pct > 0 ? Math.max(1, Math.round((total * pct) / 100)) : 0;
  return { sessions, events, total };
}

/** URL별 응답 → { pageSessions: Map<url,n>, problems: Map<metric, Map<url,{sessions,events}>> } + 분리검증 URL 집합 */
function parseByUrl(data, allUrls) {
  const pageSessions = new Map();
  const problems = new Map();
  const rawSample = new Map();
  for (const m of data) {
    for (const row of m.information || []) {
      const u = urlOf(row);
      if (!u) continue;
      allUrls.add(u);
      if (m.metricName === 'Traffic') pageSessions.set(u, num(row.totalSessionCount) - num(row.totalBotSessionCount));
      else if (PROBLEM_METRICS.test(m.metricName)) {
        if (!problems.has(m.metricName)) problems.set(m.metricName, new Map());
        const p = problemOf(row);
        if (p.sessions > 0 || p.events > 0) {
          problems.get(m.metricName).set(u, p);
          // 필드 검증용 원시 row 1개 로그 (거짓양성 재발 시 즉시 판별)
          if (!rawSample.has(m.metricName)) { rawSample.set(m.metricName, 1); console.log(`🧾 raw ${m.metricName}: ${JSON.stringify(row).slice(0, 200)}`); }
        }
      }
    }
  }
  return { pageSessions, problems };
}

async function main() {
  console.log(`📅 clarity-daily-watch ${kstNow()} · 프로젝트 ${PROJECT} · 예산 ${budget}콜${monthlyDay ? ' (UTC29 월간충돌 축소)' : ''}`);
  const allUrls = new Set();
  const findings = [];

  // ① totals 1d — 오늘 총괄 (실세션 = 봇 제외)
  const totals = await clarityFetch('totals(1d)', 1);
  let realSessions = null;
  if (totals) {
    for (const m of totals) {
      const info = m.information?.[0] || {};
      if (m.metricName === 'Traffic') {
        realSessions = num(info.totalSessionCount) - num(info.totalBotSessionCount);
        console.log(`🔍 Traffic(1d): 실세션 ${realSessions} (봇 ${num(info.totalBotSessionCount)} 제외) · PV ${info.pagesViews ?? info.PagesViews ?? '?'}`);
      } else console.log(`🔍 ${m.metricName}(1d): ${JSON.stringify(info).slice(0, 140)}`);
    }
  }

  // ② URL별 1d — 오늘 페이지별 문제
  let today = null;
  if (calls < budget) {
    const d = await clarityFetch('URL별(1d)', 1, { dimension1: 'URL' });
    if (d) today = parseByUrl(d, allUrls);
  }

  // ③ URL별 3d — 추세 기준선 (평일만)
  let base = null;
  if (calls < budget) {
    const d = await clarityFetch('URL별(3d 기준선)', 3, { dimension1: 'URL' });
    if (d) base = parseByUrl(d, new Set());
  }

  // ④ Device+Source 1d (한 콜에 2축)
  if (calls < budget) {
    const d = await clarityFetch('Device+Source(1d)', 1, { dimension1: 'Device', dimension2: 'Source' });
    if (d) {
      const traffic = d.find((m) => m.metricName === 'Traffic');
      const rows = (traffic?.information || []).slice(0, 8);
      console.log(`🔍 기기×소스(1d): ${rows.map((r) => `${r.Device || '?'}/${r.Source || '?'}=${r.totalSessionCount ?? '?'}`).join(' · ')}`);
    }
  }

  // ★ 놀쿨 프로젝트 분리검증 — 응답 URL 전부 nolcool.com이어야 함 (theassetsquare 교차 0)
  const foreign = [...allUrls].filter((u) => !String(u).includes('nolcool.com') && String(u).startsWith('http'));
  console.log(`🔒 분리검증: URL ${allUrls.size}개 중 놀쿨 외 ${foreign.length}개 ${allUrls.size && !foreign.length ? '✅ 놀쿨 전용' : foreign.length ? '❌ 교차 의심: ' + foreign.slice(0, 3).join(', ') : '(URL 데이터 없음)'}`);

  // 문제 판정 (착시 컷)
  if (today) {
    for (const [metric, byUrl] of today.problems) {
      for (const [u, p] of byUrl) {
        const ps = today.pageSessions.get(u) ?? p.total ?? 0;
        const n = p.sessions; // ★문제세션 (pct 기반) — 총세션 아님
        const isScript = /ScriptError/i.test(metric);
        const pass =
          (isScript && n >= 2 && ps >= 5) ||
          (/Quickback/i.test(metric) && n >= 5 && ps >= 10 && n / ps >= 0.3) ||
          (/ExcessiveScroll/i.test(metric) && n >= 5 && ps >= 10) ||
          (/RageClick|DeadClick|ErrorClick/i.test(metric) && n >= 3 && ps >= 10);
        if (!pass) continue;
        const baseP = base?.problems.get(metric)?.get(u) ?? null;
        const surge = baseP != null && n > (baseP.sessions / 3) * 2 && n >= 3;
        findings.push({ metric, url: u, sessions: n, events: p.events, pageSessions: ps, surge });
      }
    }
    findings.sort((a, b) => b.sessions - a.sessions);
    for (const f of findings) console.log(`🚨 ${f.metric}: ${f.url} — 문제세션 ${f.sessions}/${f.pageSessions} (이벤트 ${f.events})${f.surge ? ' ⚡급증(3d평균 2배↑)' : ''}`);
    if (!findings.length) console.log('✅ 착시 컷 통과 문제 0건 — 루틴 침묵 예정 (메일 0)');
  } else {
    console.log('⏭️ URL별 데이터 없음 — 판정 스킵');
  }

  // 루틴 회수용 구조화 출력 (한 줄 JSON — 21:20 KST 루틴이 파싱)
  console.log(`[FINDINGS_JSON] ${JSON.stringify({ ts: kstNow(), calls, budget, realSessions, separationOk: allUrls.size > 0 && foreign.length === 0, findings })}`);
  console.log(`🧮 콜 ${calls}/${budget} (일 한도 10 내 배분${monthlyDay ? ' · 월간 5콜 공존' : ''})`);
}

main().catch((e) => { console.error('❌ (로그만, 이중경보 차단)', e); process.exit(0); });
