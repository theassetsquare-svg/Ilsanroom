#!/usr/bin/env node
// GitHub Actions 워크플로 cron 헬스체크
// 모든 *.yml에 schedule이 있는지 + 최근 24시간 안에 성공한 실행이 있는지 (gh CLI 필요)
import { readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const DIR = '.github/workflows';
const files = readdirSync(DIR).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

const report = [];
for (const f of files) {
  const src = readFileSync(join(DIR, f), 'utf8');
  const name = (src.match(/^name:\s*(.+)$/m) || [, f])[1].trim();
  const hasCron = /^\s*-\s*cron:\s*['"]([^'"]+)['"]/m.test(src);
  const cron = hasCron ? src.match(/^\s*-\s*cron:\s*['"]([^'"]+)['"]/m)[1] : '';
  const hasDispatch = /workflow_dispatch:/.test(src);
  report.push({ file: f, name, cron, hasDispatch });
}

console.log(`📋 ${files.length} 워크플로 검사\n`);

const cronWorkflows = report.filter(r => r.cron);
console.log(`⏰ schedule cron: ${cronWorkflows.length}개`);
for (const r of cronWorkflows) {
  console.log(`  • ${r.name.padEnd(38)} ${r.cron.padEnd(15)} ${r.file}`);
}

const onDemand = report.filter(r => !r.cron && r.hasDispatch);
console.log(`\n🖱️  수동/이벤트: ${onDemand.length}개`);
for (const r of onDemand) console.log(`  • ${r.name} (${r.file})`);

// gh CLI 있으면 최근 24h 성공 확인
let gh = false;
try { execSync('gh --version', { stdio: 'pipe' }); gh = true; } catch {}

if (gh) {
  console.log('\n📊 최근 24h 실행 상태 (gh):');
  for (const r of cronWorkflows) {
    try {
      const out = execSync(`gh run list --workflow="${r.file}" --limit 1 --json conclusion,createdAt,status 2>/dev/null`, { encoding: 'utf8' });
      const arr = JSON.parse(out);
      if (!arr.length) { console.log(`  ⏭️  ${r.name} — 실행 기록 없음`); continue; }
      const last = arr[0];
      const age = (Date.now() - new Date(last.createdAt).getTime()) / 3600000;
      const ic = last.conclusion === 'success' ? '✅' : last.conclusion === 'failure' ? '❌' : '⏳';
      console.log(`  ${ic} ${r.name.padEnd(38)} ${last.conclusion || last.status}  ${age.toFixed(1)}h前`);
    } catch (e) {
      console.log(`  ⚠️  ${r.name} — gh 조회 실패`);
    }
  }
} else {
  console.log('\n💡 gh CLI 없음 — 라이브 상태는 GitHub Actions 페이지에서 확인하세요');
}

process.exit(0);
