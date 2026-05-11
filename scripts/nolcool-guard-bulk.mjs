#!/usr/bin/env node
// src/ 전체를 nolcool-guard.mjs로 일괄 검수
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.argv[2] || 'src';
const GUARD = new URL('./nolcool-guard.mjs', import.meta.url).pathname;

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx|js|jsx)$/.test(e)) acc.push(p);
  }
  return acc;
}

const files = walk(ROOT);
console.log(`\ud83d\udee1\ufe0f  ${files.length}\ud30c\uc77c \uac10\uc0ac\u2026`);

let failed = 0;
for (const f of files) {
  const abs = new URL(f, `file://${process.cwd()}/`).pathname;
  const content = readFileSync(f, 'utf8');
  const payload = JSON.stringify({ tool_name: 'Write', tool_input: { file_path: abs, content } });
  const r = spawnSync('node', [GUARD, 'pre'], { input: payload, encoding: 'utf8' });
  if (r.status !== 0 && r.stderr) {
    failed++;
    console.log(`\n=== ${f} ===`);
    process.stderr.write(r.stderr.split('\n').slice(0, 8).join('\n') + '\n');
  }
}

console.log(`\n\ud83d\udcca ${files.length}\ud30c\uc77c / \uc704\ubc18 ${failed}\ud30c\uc77c`);
process.exit(failed > 0 ? 1 : 0);
