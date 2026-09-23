/**
 * [놀쿨11-2] 제목 창고 — 소원 엔진의 제목 생성 자리(prerender-seo.mjs getHookingTitle·허브 생성기)가 이 모듈 하나를 부른다.
 *
 *  - data/title-bank.json 의 유형별 틀(슬롯은 장부 사실만)에서 씨앗(주소 해시) 순서로 하나를 고른다.
 *  - 규칙(11-1 명세): 동일 0 · 3-gram 자카드 유사 0.8↑ 0 · 같은 틀은 사이트 안 3쪽까지 · 후킹은 저장소 잣대(hook-detector analyzeHook).
 *  - 명시 제목(seo-hooks.ts · 오버라이드 표 · 정적 쪽)은 registerFixed 로 등록만 한다 — CTR 실험 기록이 있는 제목은 손대지 않는다.
 *  - H1 은 makeH1 이 제목과 다른 문구로 만든다(가게이름·지역·업종 같은 사실 슬롯만).
 *  - 순수 함수 + 빌드 한 번의 레지스트리. 파일을 쓰지 않는다(report() 만 돌려준다).
 */
import fs from 'node:fs';
import path from 'node:path';
import { analyzeHook } from './hook-detector.mjs';

const BANK = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'title-bank.json'), 'utf8'));
export const MAX_USES = BANK.틀당_최대_쪽 || 3;
export const SIM_LIMIT = BANK.유사_상한 || 0.8;

/* ── 정규화·유사도 (page-gate.mjs 도 같은 함수를 쓴다 = 잣대 하나) ── */
export const normalize = (s) => String(s || '').replace(/\s+/g, '').toLowerCase().replace(/[.,·—\-~!?()[\]{}"'“”‘’:;/#]/g, '');
export function grams3(s) { const n = normalize(s); const g = new Set(); for (let i = 0; i + 3 <= n.length; i++) g.add(n.slice(i, i + 3)); return g; }
export function jaccard(a, b) { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); }
export const hookPart = (t) => { const s = String(t || ''); const i = s.search(/\s[—|]\s/); return i >= 0 ? s.slice(i + 3).trim() : s; };

function seedOf(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
function fill(tpl, facts) {
  return tpl.replace(/\{(\w+)\}/g, (m, k) => (facts[k] === undefined || facts[k] === null || facts[k] === '' ? m : String(facts[k])));
}
const hasUnfilled = (s) => /\{\w+\}/.test(s);
/** dist 감사(nolcool-dist-audit.mjs)와 같은 잣대 — 2글자 이상 토큰이 두 번이면 중복 단어 */
export function dupTokens(title) {
  const tokens = String(title || '').replace(/[—\-·,!?:|]/g, ' ').split(/\s+/).filter((t) => t.length >= 2);
  const seen = new Set(); const dup = [];
  for (const t of tokens) { if (seen.has(t)) dup.push(t); seen.add(t); }
  // 부분 중복 — 2~3글자 한글 토큰이 4글자 이상 한글 토큰 안에 들어 있으면(예: 용산 · 용산드래곤시티) 감사가 중복으로 본다
  const shortT = tokens.filter((t) => /^[가-힣]{2,3}$/.test(t)), longT = tokens.filter((t) => /^[가-힣]{4,}$/.test(t));
  for (const k of new Set(shortT)) if (longT.some((L) => L.includes(k))) dup.push(k);
  return dup;
}

/* ── 레지스트리(빌드 1회) ── */
const REG = { titles: new Map(), grams: [], uses: new Map(), hooks: new Map(), conflicts: [], generated: 0, fixed: 0, fallback: 0, h1: new Map() };

function conflictWith(title) {
  const n = normalize(title);
  if (REG.titles.has(n)) return { kind: '동일', with: REG.titles.get(n) };
  const g = grams3(title);
  for (const [route, gg, t] of REG.grams) { const s = jaccard(g, gg); if (s >= SIM_LIMIT) return { kind: '유사', with: route, sim: +s.toFixed(2), other: t }; }
  // 후킹 부분(— 뒤)이 같은 쪽은 「같은 틀 3쪽까지」 규칙과 같게 3쪽까지만 허용, 4쪽째부터 충돌
  const hp = normalize(hookPart(title));
  if (hp.length >= 6 && (REG.hooks.get(hp) || 0) >= MAX_USES) return { kind: '후킹부분동일', with: [...REG.grams].filter(([, , t]) => normalize(hookPart(t)) === hp).map((x) => x[0]).slice(0, 3).join(','), other: hookPart(title) };
  return null;
}
function register(route, title) {
  REG.titles.set(normalize(title), route);
  REG.grams.push([route, grams3(title), title]);
  const hp = normalize(hookPart(title)); if (hp.length >= 6) REG.hooks.set(hp, (REG.hooks.get(hp) || 0) + 1);
}

/** 명시 제목 등록 — 바꾸지 않는다. 충돌은 기록만(게이트가 보고). */
export function registerFixed(route, title, opts = {}) {
  if (REG.titles.get(normalize(title)) === route) return title; // 창고가 이미 이 주소로 등록한 제목
  const c = conflictWith(title);
  if (c && !opts.noindex) REG.conflicts.push({ route, title, ...c }); // noindex 쪽(단일 태그 등)은 색인 대상이 아니라 충돌을 세지 않는다
  register(route, title);
  REG.fixed++;
  return title;
}

/** 창고에서 고유·후킹 제목을 만든다 — 머리(opener) × 꼬리(tail) 조합. 「같은 틀 3쪽까지」는 꼬리 기준. facts 의 슬롯이 비면 그 조합은 건너뛴다. */
export function makeTitle(type, route, facts) {
  const bank = (BANK.title || {})[type];
  if (!bank || !bank.tail || !bank.tail.length) throw new Error(`title-bank: 유형 「${type}」 틀 없음`);
  const seed = seedOf(route);
  const tails = bank.tail.map((t, i) => [t, (seed + i * 2654435761) >>> 0]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
  const openers = bank.opener.map((t, i) => [t, (seed + 7 + i * 40503) >>> 0]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
  for (const tail of tails) {
    const key = `${type}:${tail}`;
    if ((REG.uses.get(key) || 0) >= MAX_USES) continue;
    for (const op of openers) {
      const t = fill(`${op} — ${tail}`, facts);
      if (hasUnfilled(t)) continue;
      if (dupTokens(t).length) continue;
      if (!analyzeHook(t).passed) continue;
      if (conflictWith(t)) continue;
      REG.uses.set(key, (REG.uses.get(key) || 0) + 1);
      register(route, t);
      REG.generated++;
      return t;
    }
  }
  throw new Error(`title-bank: 「${route}」 고유 제목을 못 만들었다(유형 ${type} 머리 ${bank.opener.length}×꼬리 ${bank.tail.length} 소진)`);
}

/** H1 — 제목과 다른 문구. type 별 틀에서 씨앗 순서로 고르고, 제목과 정규화 동일이면 다음 틀. */
export function makeH1(type, route, facts, title) {
  const list = (BANK.h1 || {})[type] || (BANK.h1 || {}).static;
  const seed = seedOf('h1:' + route);
  const order = list.map((t, i) => [t, (seed + i * 40503) >>> 0]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
  const nt = normalize(title);
  for (const tpl of order) {
    const h = fill(tpl, facts);
    if (hasUnfilled(h)) continue;
    if (normalize(h) === nt) continue;
    REG.h1.set(route, h);
    return h;
  }
  const h = `${facts.head || facts.name || facts.region || facts.place || String(title).split(/\s[—|]\s/)[0]} — 안내`;
  REG.h1.set(route, h);
  return h;
}

/** 빌드 끝에 요약 — prerender 가 콘솔에 찍고, nc11-2-check 가 읽는다. */
export function report() {
  const usesOver = [...REG.uses.entries()].filter(([, n]) => n > MAX_USES);
  return { titles: REG.titles.size, generated: REG.generated, fixed: REG.fixed, fallback: REG.fallback, conflicts: REG.conflicts, usesOver, uses: Object.fromEntries(REG.uses), maxUses: MAX_USES, simLimit: SIM_LIMIT };
}

/** 검사용 — 제목 목록 전체를 다시 훑어 동일·유사·후킹부분동일 쌍을 센다(순수). */
export function auditTitles(pairs /* [route, title][] */) {
  const seen = new Map(); const out = { dup: [], sim: [], hookDup: [], hook0: [] };
  const gs = pairs.map(([r, t]) => [r, grams3(t), t]);
  for (const [r, t] of pairs) {
    const n = normalize(t); if (seen.has(n)) out.dup.push([seen.get(n), r, t]); else seen.set(n, r);
    if (!analyzeHook(t).passed) out.hook0.push([r, t]);
  }
  const hp = new Map();
  for (const [r, t] of pairs) { const k = normalize(hookPart(t)); if (k.length < 6) continue; if (!hp.has(k)) hp.set(k, []); hp.get(k).push(r); }
  for (const [k, rs] of hp) if (rs.length > MAX_USES) out.hookDup.push([rs.slice(0, 4).join(','), rs.length, k]); // 4쪽 이상 묶음만(틀당 3쪽 규칙)
  for (let i = 0; i < gs.length; i++) for (let j = i + 1; j < gs.length; j++) { const s = jaccard(gs[i][1], gs[j][1]); if (s >= SIM_LIMIT) out.sim.push([gs[i][0], gs[j][0], +s.toFixed(2)]); }
  return out;
}
