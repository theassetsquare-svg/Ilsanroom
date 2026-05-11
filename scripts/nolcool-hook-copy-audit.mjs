#!/usr/bin/env node
// 시즌34 — 후킹 카피 5원칙 적용률 검증
// description에 (질문 ? / 1인칭 나·내가 / 손실회피 놓치면·아깝다 / 수치 N / CTA 가보자·확인·바로)
// 다수가 있는지 체크 — venue + category page 대상
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const HOOK_PATTERNS = [
  { name: 'question', re: /\?|왜|어떤|어디|어느/ },
  { name: 'first-person', re: /나|내가|우리|솔직히|진짜로/ },
  { name: 'loss-aversion', re: /놓치|아깝|모르면|후회|망설/ },
  { name: 'number', re: /\d/ },
  { name: 'cta', re: /가보|확인|바로|먼저|당장|클릭|보러/ },
];

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (f === 'index.html') out.push(p);
  }
  return out;
}

const htmls = walk(DIST);
let total = 0, weak = 0;
const samples = [];

for (const html of htmls) {
  const text = readFileSync(html, 'utf8');
  const dm = text.match(/<meta\s+name=["']description["']\s+content="([^"]*)"/)
          || text.match(/<meta\s+name=["']description["']\s+content='([^']*)'/);
  if (!dm) continue;
  const desc = dm[1].trim();
  if (desc.length < 20) continue;
  total++;

  const hits = HOOK_PATTERNS.filter(p => p.re.test(desc)).length;
  // 5원칙 중 2개 이하면 weak (단조)
  if (hits <= 1) {
    weak++;
    if (samples.length < 15) {
      const rel = html.replace(/^dist[\/\\]/, '/').replace(/[\/\\]index\.html$/, '/');
      samples.push(`${rel} — hits=${hits} — "${desc.slice(0, 90)}"`);
    }
  }
}

const ratio = total ? ((total - weak) / total * 100).toFixed(1) : 0;
console.log(`\n📊 후킹 카피 5원칙: ${total - weak}/${total} 페이지 (${ratio}%)`);
console.log(`  weak (≤1 원칙): ${weak}건`);

if (samples.length) {
  console.log(`\nweak 샘플:`);
  for (const s of samples) console.log(`  - ${s}`);
}

// 강제 차단은 안 함 (보고만)
process.exit(0);
