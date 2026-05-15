#!/usr/bin/env node
// App.tsx 라우트 vs dist/sitemap.xml 일치성 검증
// - 정적 라우트(파라미터 없음)는 sitemap에 포함되어야 함
// - sitemap의 URL은 라우트에 매칭되어야 함 (고아 URL 없음)
import { readFileSync, existsSync } from 'node:fs';

const APP = 'src/App.tsx';
const SITEMAP = 'dist/sitemap.xml';
const BASE = 'https://nolcool.com';

if (!existsSync(SITEMAP)) {
  console.log(`⏭️  ${SITEMAP} 없음 — 빌드 후 실행하세요`);
  process.exit(0);
}

// 1) App.tsx에서 정적 라우트 추출
const app = readFileSync(APP, 'utf8');
const routes = [...app.matchAll(/<Route\s+path=["']([^"']+)["']/g)]
  .map(m => m[1])
  .filter(p => p !== '*' && !p.startsWith('admin') && !p.startsWith('lounge') === false || true);

const staticRoutes = routes.filter(p => !p.includes(':') && p !== '*' && p.startsWith('/'));
const dynamicPatterns = routes.filter(p => p.includes(':'));

// 2) sitemap URL 추출
const sm = readFileSync(SITEMAP, 'utf8');
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const paths = urls.map(u => u.replace(BASE, '').replace(/\/$/, '') || '/');

// 3) staticRoute → sitemap 포함 여부
const exempt = new Set([
  '/admin', '/login', '/profile', '/messages', '/setup-nickname',
  '/auth/callback', '/auth/naver-callback',
  '/dashboard', '/onboarding', '/launch', '/billing', '/analytics',
  '/welcome', '/waitlist', '/hidden', '/print', '/referral',
  '/my/referrals', '/my/customize',
  // Navigate 리디렉트 (실제 페이지 없음)
  '/price', '/for-business',
]);
const missing = staticRoutes
  .filter(r => !exempt.has(r))
  .filter(r => {
    const norm = r === '/' ? '/' : r;
    return !paths.includes(norm) && !paths.includes(norm + '/');
  });

// 4) sitemap orphan (라우트 매칭 안 되는 URL)
const dynRe = dynamicPatterns.map(p =>
  new RegExp('^' + p.replace(/:[^/]+/g, '[^/]+') + '$')
);
const staticSet = new Set(staticRoutes);
const orphan = paths.filter(p => {
  if (staticSet.has(p)) return false;
  if (dynRe.some(re => re.test(p))) return false;
  return true;
});

console.log(`📍 정적 라우트 ${staticRoutes.length}개 / 동적 ${dynamicPatterns.length}개`);
console.log(`🗺️  sitemap URL ${paths.length}개`);
console.log(`\n📊 결과: 누락 ${missing.length} / 고아 ${orphan.length}`);

if (missing.length) {
  console.log('\n🛑 sitemap에 누락된 라우트:');
  for (const r of missing) console.log(`  - ${r}`);
}
if (orphan.length && orphan.length < 20) {
  console.log('\n⚠️  라우트에 매칭 안 되는 sitemap URL:');
  for (const p of orphan) console.log(`  - ${p}`);
} else if (orphan.length) {
  console.log(`\n⚠️  라우트에 매칭 안 되는 sitemap URL ${orphan.length}건 (상위 10):`);
  for (const p of orphan.slice(0, 10)) console.log(`  - ${p}`);
}

process.exit(missing.length > 0 ? 1 : 0);
