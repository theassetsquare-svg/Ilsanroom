#!/usr/bin/env node
// One-shot sweep: 내부 <Link to="/...">에서 target="_blank" rel="noopener noreferrer" 제거.
// 외부 <a href="http..."> 는 건드리지 않음.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('find src -type f \\( -name "*.tsx" -o -name "*.ts" \\)', { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);

let touched = 0;
let totalRemoved = 0;

for (const f of files) {
  const orig = readFileSync(f, 'utf8');
  let next = orig;

  // 1) <Link to="/path" target="_blank" rel="noopener noreferrer" ...> — Link 내부
  //    JSX prop 순서가 다양해서 두 단계로 처리.
  //    A) target="_blank" rel="noopener noreferrer" 인접
  next = next.replace(/(<Link\b[^>]*?)\s+target="_blank"\s+rel="noopener noreferrer"/g, '$1');
  next = next.replace(/(<Link\b[^>]*?)\s+rel="noopener noreferrer"\s+target="_blank"/g, '$1');
  //    B) Link 안에서 target과 rel이 떨어져 있는 경우
  next = next.replace(/(<Link\b[^>]*?)\s+target="_blank"([^>]*?)\s+rel="noopener noreferrer"([^>]*?>)/g, '$1$2$3');
  next = next.replace(/(<Link\b[^>]*?)\s+rel="noopener noreferrer"([^>]*?)\s+target="_blank"([^>]*?>)/g, '$1$2$3');

  // 2) <NavLink ...> 도 동일
  next = next.replace(/(<NavLink\b[^>]*?)\s+target="_blank"\s+rel="noopener noreferrer"/g, '$1');
  next = next.replace(/(<NavLink\b[^>]*?)\s+rel="noopener noreferrer"\s+target="_blank"/g, '$1');

  // 3) <a href="/..."> 또는 href="#" 내부 anchor (절대경로 http 제외) — target=_blank 제거
  //    Note: 외부 <a href="http..."> 는 건드리지 않음.
  next = next.replace(/(<a\b[^>]*\bhref="(?:\/[^"]*|#[^"]*)"[^>]*?)\s+target="_blank"\s+rel="noopener noreferrer"/g, '$1');
  next = next.replace(/(<a\b[^>]*\bhref="(?:\/[^"]*|#[^"]*)"[^>]*?)\s+rel="noopener noreferrer"\s+target="_blank"/g, '$1');

  if (next !== orig) {
    const before = (orig.match(/target="_blank"/g) || []).length;
    const after = (next.match(/target="_blank"/g) || []).length;
    const removed = before - after;
    if (removed > 0) {
      writeFileSync(f, next);
      console.log(`  ${f}: -${removed}`);
      touched++;
      totalRemoved += removed;
    }
  }
}

console.log(`\n✅ ${touched} files updated, ${totalRemoved} internal target="_blank" removed`);
