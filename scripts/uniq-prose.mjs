/**
 * [플랫폼 트랙 P · 설계도 14장] 페이지 고유 문장 적용기 — prerender-seo.mjs writePage 가 본문 생성 직후 부른다.
 *   src/data/uniq-prose.json = { "<routePath>": { "<생성기 원문 문장>": "<이 페이지만의 새 문장>", ... } }
 *   - 생성기가 만든 틀 문장(여러 쪽에 같은 뼈대로 나오는 문장)을 그 페이지만의 문장으로 바꾼다. 사실·숫자·업소명·링크는 그대로.
 *   - 원문이 본문에 없으면(생성기가 바뀜) 아무것도 하지 않고 건너뛴다 → 게이트(uniq-prose-gate)가 「미적용」으로 알린다.
 *   - 새 문장은 naver-watch/scripts/platform/nol-prose-rewrite.mjs 가 구독 클로드(claude -p)로 쓰고 검사해 넣는다.
 */
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join(process.cwd(), 'src', 'data', 'uniq-prose.json');
let MAP = null;
function load() {
  if (MAP) return MAP;
  try { MAP = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { MAP = {}; }
  return MAP;
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const PROSE_STATS = { routes: 0, applied: 0, missed: 0, missedList: [] };

export function applyProse(ssrBody, routePath) {
  if (!ssrBody) return ssrBody;
  const m = load()[routePath];
  if (!m) return ssrBody;
  PROSE_STATS.routes++;
  let out = ssrBody;
  for (const [from, to] of Object.entries(m)) {
    if (!from || !to || from === to) continue;
    // from = HTML 본문에 실제로 있는 문자열(이미 escHtml 된 형태) · to = 새 문장(평문) → HTML 로 이스케이프해 넣는다
    if (out.includes(from)) { out = out.split(from).join(esc(to)); PROSE_STATS.applied++; }
    else { PROSE_STATS.missed++; if (PROSE_STATS.missedList.length < 50) PROSE_STATS.missedList.push(routePath + ' :: ' + from.slice(0, 40)); }
  }
  return out;
}
