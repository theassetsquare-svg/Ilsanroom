#!/usr/bin/env node
/**
 * 놀쿨 무인 운영 헬스보드 (파트5/5) — 전체 자동화 명부 자동 생성.
 *  · 워크플로(.github/workflows/*.yml) 이름·주기(cron) + DB 트리거 + 사람 필요 지점.
 *  · GITHUB_TOKEN 있으면 워크플로별 최근 성공률·마지막 실행일 산출(GH Actions API).
 *  · 주간 성공률 95% 미만 = 기존 경보(workflow-failure-monitor / daily-regression-digest)로 이미 커버 →
 *    신규 경보 채널 신설 금지. 이 스크립트는 "명부 생성"만(읽기 전용, 사이트 피해 0).
 *
 * 출력: reports/ops-healthboard.md (사장님/완결보고서용).
 * 실행: node scripts/ops-healthboard.mjs   (env 선택: GITHUB_TOKEN|GH_TOKEN, GH_REPO)
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const WF_DIR = '.github/workflows';
const MIG_DIR = 'supabase/migrations';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const REPO = process.env.GH_REPO || 'theassetsquare-svg/Ilsanroom';

const cronTo = (c) => {
  // KST 대략 표기 (UTC+9). "m h dom mon dow". UTC→KST 시 날짜 경계는 근사(시각만 +9).
  const [m, h, dom, , dow] = c.split(/\s+/);
  const days = { '0': '일', '1': '월', '2': '화', '3': '수', '4': '목', '5': '금', '6': '토' };
  const kh = h === '*' ? '*' : (Number(h) + 9) % 24;
  let when;
  if (m.includes('/') || h === '*') when = `${h === '*' ? '매시' : kh + '시'} ${m}분 간격/반복`;
  else if (dom !== '*') when = `매월 ${dom}일 KST ${kh}:${String(m).padStart(2, '0')}`;
  else if (dow !== '*') when = `매주 ${dow.split(',').map(d => days[d] || d).join('/')}요일 KST ${kh}:${String(m).padStart(2, '0')}`;
  else when = `매일 KST ${kh}:${String(m).padStart(2, '0')}`;
  return when;
};

function inventory() {
  const files = readdirSync(WF_DIR).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  const rows = files.map(f => {
    const s = readFileSync(`${WF_DIR}/${f}`, 'utf8');
    const name = s.match(/^name:\s*(.+)$/m)?.[1]?.trim() || f;
    const crons = [...s.matchAll(/cron:\s*'([^']+)'/g)].map(m => m[1]);
    const dispatch = /workflow_dispatch:/.test(s);
    const onPush = /^\s*push:/m.test(s);
    return { file: f, name, crons, cadence: crons.length ? crons.map(cronTo).join(' · ') : (onPush ? 'on push' : (dispatch ? '수동(dispatch)' : '—')), dispatch };
  });
  return rows.sort((a, b) => a.file.localeCompare(b.file));
}

function triggers() {
  const set = new Map();
  for (const f of readdirSync(MIG_DIR).filter(f => f.endsWith('.sql'))) {
    const s = readFileSync(`${MIG_DIR}/${f}`, 'utf8');
    for (const m of s.matchAll(/CREATE\s+TRIGGER\s+([a-z0-9_]+)/gi)) set.set(m[1].toLowerCase(), f);
  }
  return [...set.entries()].map(([name, file]) => ({ name, file }));
}

// 파트1~4.5로 자동화되어 사람 손이 빠진 항목 vs 여전히 사람이 필요한 잔여 항목
const RESOLVED_BY_SERIES = [
  '순위 판정 — popularity-engine 실측 자동(파트4)',
  '방문자 기여(후기·투표·질문 판) 공급 — 기여 엔진 5종 + 운영팀 주간질문 자동(파트4.5)',
  '북극성 7지표 추적·사다리·주간요약 — 계기판 자동(파트5)',
  '"한국 1위" 판정·중간 마일스톤 알림 — 상수+교차발화 자동(파트5)',
];
const HUMAN_NEEDED = [
  ['광고주 콘텐츠 본문 입력', 'venue 상세 본문은 100% 고유·실데이터라야 함 — SSR desc는 자동, 본문 창작은 사람(광고주/운영)'],
  ['월간 대시보드 최종 판정(9/1 등)', '자동은 측정·처방 재료까지. GA4/GSC 수치의 사업적 판정은 사장님 몫'],
  ['첫 글·첫 댓글 답글', 'trg_notify_first_post → ops_alerts 큐. 사람 냄새 유지 위해 답글은 사람(운영팀)만 — 기계 사칭 금지'],
  ['GCP/GA4 콘솔 1회 권한', 'serviceusage.enable 등 콘솔 권한은 코드 불가 — 사장님 1회 조치'],
  ['광고주 예외 관리', '가격 노출 예외(대전원나이트 등) 등 개별 광고주 정책은 사람 판단'],
];

async function gh(path) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'nolcool-healthboard' },
  });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

async function successRates(files) {
  if (!TOKEN) return null;
  const out = {};
  for (const f of files) {
    try {
      const d = await gh(`/actions/workflows/${f}/runs?per_page=20`);
      const runs = (d.workflow_runs || []).filter(r => r.status === 'completed');
      if (!runs.length) { out[f] = { rate: null, last: null, n: 0 }; continue; }
      const ok = runs.filter(r => r.conclusion === 'success').length;
      out[f] = { rate: Math.round(ok / runs.length * 100), last: runs[0].updated_at?.slice(0, 10), n: runs.length };
    } catch (e) { out[f] = { rate: null, last: null, n: 0, err: String(e.message) }; }
  }
  return out;
}

function md(inv, trg, rates) {
  const now = new Date().toISOString().slice(0, 10);
  const scheduled = inv.filter(r => r.crons.length);
  const dispatchOnly = inv.filter(r => !r.crons.length && r.dispatch);
  const low = rates ? Object.entries(rates).filter(([, v]) => v.rate != null && v.rate < 95) : [];

  const rateCell = (f) => {
    if (!rates) return '⚠️ CI에서 GH API로 산출';
    const v = rates[f]; if (!v) return '—';
    return v.rate == null ? '(런 없음)' : `${v.rate}% (${v.n}런, 최근 ${v.last})`;
  };

  let s = `# 놀쿨 무인 운영 헬스보드 (자동 생성 ${now})\n\n`;
  s += `> 전체 자동화 명부. 읽기 전용 생성물. 95% 미만 성공률 = 기존 경보(workflow-failure-monitor·daily-regression-digest)로 커버, 신규 채널 없음.\n\n`;
  s += `## 요약\n- 워크플로 총 **${inv.length}개** (스케줄 ${scheduled.length} · 수동 ${dispatchOnly.length} · 기타 ${inv.length - scheduled.length - dispatchOnly.length})\n- DB 트리거 **${trg.length}개**\n- 성공률 산출: ${rates ? `GH API ${Object.keys(rates).length}개 워크플로` : '⚠️ GITHUB_TOKEN 없음 — CI 실행 시 산출'}\n`;
  if (rates) s += `- 주간 성공률 **95% 미만: ${low.length}개**${low.length ? ' → ' + low.map(([f]) => f).join(', ') : ' (전부 양호)'}\n`;
  s += `\n## 스케줄 워크플로 (${scheduled.length})\n\n| 워크플로 | 파일 | 주기 | 최근 성공률 |\n|---|---|---|---|\n`;
  for (const r of scheduled) s += `| ${r.name} | \`${r.file}\` | ${r.cadence} | ${rateCell(r.file)} |\n`;
  s += `\n## 수동/dispatch 워크플로 (${dispatchOnly.length})\n\n${dispatchOnly.map(r => `- \`${r.file}\` — ${r.name}`).join('\n')}\n`;
  s += `\n## DB 트리거 (${trg.length})\n\n${trg.map(t => `- \`${t.name}\` (${t.file})`).join('\n')}\n`;
  s += `\n## 이번 시리즈(파트1~4.5)로 사람 손이 빠진 항목\n\n${RESOLVED_BY_SERIES.map(x => `- ✅ ${x}`).join('\n')}\n`;
  s += `\n## 여전히 사람이 필요한 지점 (잔여)\n\n| 항목 | 사유 |\n|---|---|\n${HUMAN_NEEDED.map(([k, v]) => `| ${k} | ${v} |`).join('\n')}\n`;
  return s;
}

async function main() {
  const inv = inventory();
  const trg = triggers();
  const rates = await successRates(inv.map(r => r.file)).catch(() => null);
  if (!existsSync('reports')) mkdirSync('reports', { recursive: true });
  const out = md(inv, trg, rates);
  writeFileSync('reports/ops-healthboard.md', out);
  console.log(`✅ 헬스보드 생성 — 워크플로 ${inv.length} · 트리거 ${trg.length} · 성공률 ${rates ? 'GH API 산출' : '⚠️ 토큰 없음(CI 산출)'}`);
  console.log('→ reports/ops-healthboard.md');
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
