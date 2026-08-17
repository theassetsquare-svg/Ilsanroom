// 메일 30일 1통 정책 (2026-08-17) — 일간·주간 리포트 12종 즉시 발송 정지.
// 발송 대신 여기로 축적 → 매월 30일 monthly-conductor STEP6 보고서 섹션으로 통합.
// 즉시 메일 유지 4종(사이트 다운/보안 변화/회원 첫 글/서면 상담)은 이 모듈을 쓰지 않는다.
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('../..', import.meta.url).pathname;
const MAX_ENTRIES_PER_KIND = 40; // 월간 상한 — 일간 리포트도 한 달 분량이면 충분

function kstDate() {
  return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
}

function monthKey() {
  return kstDate().slice(0, 7);
}

/** HTML 리포트를 텍스트 요약으로 축약 (보고서 섹션용) */
function htmlToText(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1500);
}

/**
 * 즉시 발송 대신 월간 인박스에 축적.
 * @param {string} kind  리포트 종류 슬러그 (예: 'security-daily')
 * @param {string} subject  발송했을 메일 제목
 * @param {string} html  발송했을 메일 본문 (텍스트 요약으로 저장)
 */
export function archiveInsteadOfSend(kind, subject, html) {
  try {
    const dir = join(ROOT, 'data', 'monthly-inbox', monthKey());
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${kind}.json`);
    let entries = [];
    try { entries = JSON.parse(readFileSync(file, 'utf8')); } catch { /* 첫 기록 */ }
    entries.push({ date: kstDate(), subject, summary: htmlToText(html) });
    if (entries.length > MAX_ENTRIES_PER_KIND) entries = entries.slice(-MAX_ENTRIES_PER_KIND);
    writeFileSync(file, JSON.stringify(entries, null, 2) + '\n');
    console.log(`📥 [30일1통] 즉시 발송 정지 — 월간 인박스 축적: ${kind} · "${subject}"`);
  } catch (e) {
    console.error(`⚠️ 월간 인박스 기록 실패(발송은 어차피 정지): ${e.message}`);
  }
}
