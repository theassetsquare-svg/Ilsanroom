#!/usr/bin/env node
/**
 * 놀쿨 지메일 주간 정리 — 판정 엔진 (읽기 + 휴지통 이동만).
 *
 * 실행 주체: 주 1회 스케줄된 클로드 에이전트(Gmail MCP 보유)가 이 스크립트를 판정기로 사용한다.
 *   ① 에이전트가 Gmail에서 subject:"[놀쿨" newer_than:30d 스레드를 조회해 JSON으로 저장
 *   ② node scripts/gmail-nolcool-cleaner.mjs <threads.json>  → 삭제/보존 판정 출력
 *   ③ 에이전트는 출력의 trash 목록만 휴지통(TRASH) 이동. 그 외 조작 금지.
 *
 * ★불가침 3중 자물쇠 (CLAUDE.md 📧 섹션과 1:1 — 코드로 강제):
 *   1) 놀쿨 메일 판별 = 2중 조건: (제목에 "[놀쿨" 포함 또는 Gmail "놀쿨" 라벨 보유) AND
 *      발신 onboarding@resend.dev. 2026-08-02 보강 — "제목이 [놀쿨로 시작"만으로는
 *      이모지 접두("✅ [놀쿨…", "🚨 놀쿨…") 놀쿨 경보 2통을 놓쳤다. 불일치 = skipped 분류.
 *   2) noreply@theassetsquare.com (더에셋스퀘어) 발신은 무조건 제외 — tasProtected 카운트만.
 *   3) 액션은 "TRASH"(휴지통 이동) 단 하나. 영구삭제/라벨변경/발송 액션은 존재하지 않는다.
 *
 * 판정 규칙:
 *   - 유형별(제목 시그니처)로 묶어 최신 1통 보존, 과거 중복분 = TRASH (자기수렴형 경보 공통).
 *   - 해결 완료 보고(✅) 메일은 보존 기간 14일 — 그 후 TRASH.
 *   - 알 수 없는 [놀쿨 유형은 보수적으로 전부 보존.
 *
 * 입력 JSON 형식: [{ "id": "...", "subject": "...", "sender": "...", "date": "ISO8601", "labelIds": ["..."] }]
 *   (labelIds는 선택 — 없으면 제목 조건만으로 판별)
 * 출력: JSON { trash: [...], keep: [...], stats } — 사람이 먼저 검토할 수 있게 목록 전문 출력.
 */
import { readFileSync } from 'node:fs';

const TAS_SENDER = 'noreply@theassetsquare.com'; // 자물쇠 ② — 절대 접촉 금지
const NOLCOOL_SENDER = 'onboarding@resend.dev';  // 놀쿨 경보 발신 단일 주소 (reference_resend_sender)
const NOLCOOL_LABEL = 'Label_5833945061753990192'; // Gmail 사용자 라벨 "놀쿨" (list_labels 실측 ID)
const RESOLVED_KEEP_DAYS = 14;

// 유형 시그니처 — 제목에서 첫 매칭으로 분류 (새 경보 유형은 UNKNOWN → 전부 보존)
const TYPES = [
  ['title-regression', /지역×업종 교차 title 회귀/],
  ['24h-digest', /24h 회귀/],
  ['northstar', /북극성/],
  ['lighthouse', /Lighthouse 목표 미달/],
  ['fullcrawl', /놀쿨 풀크롤/],
  ['nightly-audit-fail', /야간 풀감사 실패/],
  ['index-coverage', /색인 안 된 페이지/],
  ['rank-trend', /가게이름 순위 추이/],
  ['rank-drop', /순위하락 대응/],
  ['serp-loop', /검색어 루프/],
  ['ga4-demand', /사용자 수요 인사이트/],
  ['growth-opportunity', /트래픽 성장 기회/],
  ['demand-gap', /수요 갭/],
  ['monthly-report', /월간 성장 사이클/],
  ['resolved-report', /^✅|\[✅\]/],
];

function classify(subject) {
  for (const [type, re] of TYPES) if (re.test(subject)) return type;
  return 'UNKNOWN';
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('사용법: node scripts/gmail-nolcool-cleaner.mjs <threads.json>');
  process.exit(1);
}
const threads = JSON.parse(readFileSync(inputPath, 'utf8'));

const stats = { total: threads.length, tasProtected: 0, skippedNonNolcool: 0 };
const byType = new Map();

for (const t of threads) {
  const sender = (t.sender || '').toLowerCase();
  const subject = t.subject || '';
  if (sender.includes(TAS_SENDER)) { stats.tasProtected++; continue; }      // 자물쇠 ② — 무조건 최우선
  const isNolcool = (subject.includes('[놀쿨') || (t.labelIds || []).includes(NOLCOOL_LABEL))
    && sender.includes(NOLCOOL_SENDER);                                     // 자물쇠 ① — 2중 조건
  if (!isNolcool) { stats.skippedNonNolcool++; continue; }
  const type = classify(subject);
  if (!byType.has(type)) byType.set(type, []);
  byType.get(type).push(t);
}

const now = Date.now();
const trash = [];
const keep = [];

for (const [type, list] of byType) {
  list.sort((a, b) => new Date(b.date) - new Date(a.date)); // 최신 우선
  if (type === 'UNKNOWN') { keep.push(...list.map(t => ({ ...t, why: '알 수 없는 유형 — 보수적 보존' }))); continue; }
  list.forEach((t, i) => {
    const ageDays = (now - new Date(t.date).getTime()) / 86400000;
    if (type === 'resolved-report') {
      (ageDays > RESOLVED_KEEP_DAYS ? trash : keep).push({ ...t, why: `해결보고 ${Math.round(ageDays)}일 경과 (보존 ${RESOLVED_KEEP_DAYS}일)` });
    } else if (i === 0) {
      keep.push({ ...t, why: `${type} 최신 1통 보존` });
    } else {
      trash.push({ ...t, why: `${type} 과거 중복분 (최신 ${list[0].date} 보존)` });
    }
  });
}

const out = { generatedAt: new Date().toISOString(), stats: { ...stats, trash: trash.length, keep: keep.length }, trash, keep };
console.log(JSON.stringify(out, null, 2));
