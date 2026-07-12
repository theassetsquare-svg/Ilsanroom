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
 * HTML 본문(매거진·커뮤니티)의 긴 <p> 문단 벽을 문장 단위 여러 <p>로 표시 분할.
 * - 플레인텍스트 길이 ≤ max인 <p>는 그대로 (상위노출 페이지 무손대 원칙 — 텍스트 100% 불변, 표시만 분할)
 * - <a>·<strong> 등 인라인 태그 내부(depth>0)에서는 절대 자르지 않는다
 * - 원래 <p>의 속성은 분할된 모든 <p>에 그대로 승계
 */
export function splitHtmlParagraphs(html, max = 280) {
  const src = html || '';
  if (!src) return src;
  const stripTags = (s) => s.replace(/<[^>]+>/g, '');
  const VOID_TAG = /^<(br|img|hr|input|wbr|source|embed)\b/i;
  return src.replace(/<p(\s[^>]*)?>([\s\S]*?)<\/p>/gi, (whole, attrs, inner) => {
    if (stripTags(inner).length <= max) return whole;
    // 태그/텍스트 토큰화
    const tokens = [];
    let last = 0;
    for (const m of inner.matchAll(/<[^>]+>/g)) {
      if (m.index > last) tokens.push({ tag: false, v: inner.slice(last, m.index) });
      tokens.push({ tag: true, v: m[0] });
      last = m.index + m[0].length;
    }
    if (last < inner.length) tokens.push({ tag: false, v: inner.slice(last) });
    // depth 0 텍스트에서만 문장 경계로 조각 생성
    const parts = [];
    let depth = 0;
    let buf = '';
    for (const tok of tokens) {
      if (tok.tag) {
        if (/^<\//.test(tok.v)) depth = Math.max(0, depth - 1);
        else if (!/\/>$/.test(tok.v) && !VOID_TAG.test(tok.v)) depth += 1;
        buf += tok.v;
        continue;
      }
      if (depth > 0) { buf += tok.v; continue; }
      const pieces = tok.v.split(SENT_BOUNDARY);
      for (let i = 0; i < pieces.length; i += 1) {
        buf += pieces[i];
        if (i < pieces.length - 1) { parts.push(buf); buf = ''; }
      }
    }
    if (buf.trim()) parts.push(buf);
    // 조각을 max 이하·최대 3문장 리듬으로 묶어 <p> 재조립
    const paras = [];
    let cur = '';
    let curLen = 0;
    let count = 0;
    for (const part of parts) {
      const len = stripTags(part).length;
      if (cur && (curLen + len > max || count >= 3)) {
        paras.push(cur);
        cur = part;
        curLen = len;
        count = 1;
      } else {
        cur = cur ? `${cur} ${part}` : part;
        curLen += len;
        count += 1;
      }
    }
    if (cur.trim()) paras.push(cur);
    const open = `<p${attrs || ''}>`;
    return paras.map((p) => `${open}${p.trim()}</p>`).join('\n');
  });
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
