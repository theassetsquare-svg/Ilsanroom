// 가독성 공통 유틸 — React 컴포넌트(.tsx)와 빌드 게이트(.mjs)가 같이 import.
// 한 곳에서만 정의해 두 쪽이 절대 어긋나지 않게 한다 (재발 방지).

const SENT_BOUNDARY = /(?<=[.다!?。])\s+/;
const CLAUSE_BOUNDARY = /(?<=[,·、])\s*/;

// 한 문장이 max를 넘으면 절(節) 경계 → 그래도 넘으면 하드 슬라이스로 쪼갠다.
function splitLongSentence(sentence, max) {
  if (sentence.length <= max) return [sentence];
  const clauses = sentence.split(CLAUSE_BOUNDARY).filter((c) => c.trim());
  const out = [];
  let buf = '';
  for (const clause of clauses) {
    if (clause.length > max) {
      if (buf) { out.push(buf.trim()); buf = ''; }
      for (let i = 0; i < clause.length; i += max) out.push(clause.slice(i, i + max).trim());
      continue;
    }
    if (buf && (buf + clause).length > max) { out.push(buf.trim()); buf = clause; }
    else buf += clause;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/**
 * 긴 단일 문단을 의미(문장) 단위로 끊어 2~4문장 단락 배열로 반환.
 * 길이 독립적: 문장 경계 우선, 단락이 max를 넘기 전까지만 묶는다.
 * 모든 반환 단락은 max 이하임을 보장한다.
 */
export function splitParagraphs(text, max = 280) {
  const clean = (text || '').trim();
  if (!clean) return [];
  const rawSentences = clean.split(SENT_BOUNDARY).map((s) => s.trim()).filter(Boolean);
  const sentences = [];
  for (const s of rawSentences) {
    if (s.length > max) sentences.push(...splitLongSentence(s, max));
    else sentences.push(s);
  }
  const paras = [];
  let buf = '';
  let count = 0;
  for (const s of sentences) {
    const joined = buf ? `${buf} ${s}` : s;
    // 단락이 max를 넘거나 이미 4문장이면 끊는다 (2~4문장 리듬).
    if (buf && (joined.length > max || count >= 4)) {
      paras.push(buf);
      buf = s;
      count = 1;
    } else {
      buf = joined;
      count += 1;
    }
  }
  if (buf) paras.push(buf);
  return paras;
}

/**
 * 한국어 조사 받침 처리. word 마지막 글자의 받침 유무로 올바른 조사를 붙여 반환.
 * type: '이/가' | '을/를' | '은/는' | '과/와' | '으로/로' | '이/가' 형태 문자열.
 */
export function josa(word, type) {
  const w = (word || '').trim();
  if (!w) return w;
  const last = w[w.length - 1];
  const code = last.charCodeAt(0);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  // 한글이 아니면(숫자/영문 등) 받침 있는 것으로 간주(보수적).
  const jong = isHangul ? (code - 0xac00) % 28 : 1;
  const hasBatchim = jong !== 0;
  const [withB, withoutB] = type.split('/');
  if (type === '으로/로') {
    // ㄹ 받침(jong===8)은 '로'를 쓴다.
    return w + (hasBatchim && jong !== 8 ? withB : withoutB);
  }
  return w + (hasBatchim ? withB : withoutB);
}
