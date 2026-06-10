#!/usr/bin/env node
/**
 * 놀쿨 GA4 태그 게이트 (★전 페이지 단일 설치 보장).
 *
 * 막는 것:
 *   1) 누락 — dist 페이지 <head>에 GA4 측정 태그(G-W6VE6KHLLD)가 없음.
 *   2) 중복 — gtag/js 로더 또는 config 호출이 2개 이상.
 *   3) 다른 ID — G-W6VE6KHLLD 가 아닌 다른 GA4 측정 ID 혼입.
 *
 * 단일 소스: 루트 index.html <head> → vite build → dist/index.html →
 * prerender-seo.mjs 가 이 dist/index.html 을 베이스로 전 페이지를 찍어내므로
 * (신규 venue 등 자동 생성 포함) 한 곳만 보면 전수가 보장된다.
 * 본 게이트는 그 상속이 실제로 모든 페이지에 박혔는지 prerender 후 전수 검증한다.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const ID = 'G-W6VE6KHLLD';

if (!existsSync(join(DIST, 'index.html'))) { console.log('⏭️  dist 없음 — 빌드 후 실행'); process.exit(0); }

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e === 'index.html') out.push(p);
  }
  return out;
}

// gtag.js 로더 src 의 측정 ID 들
function loaderIds(html) {
  const ids = [];
  const re = /googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+)/g;
  let m; while ((m = re.exec(html))) ids.push(m[1]);
  return ids;
}
// gtag('config', 'G-XXXX') 의 측정 ID 들
function configIds(html) {
  const ids = [];
  const re = /gtag\(\s*['"]config['"]\s*,\s*['"](G-[A-Z0-9]+)['"]/g;
  let m; while ((m = re.exec(html))) ids.push(m[1]);
  return ids;
}

const errors = [];
let pages = 0;

for (const f of walk(DIST)) {
  const html = readFileSync(f, 'utf8');
  pages++;
  const rel = f.replace(/^dist/, '') || '/';
  const loaders = loaderIds(html);
  const configs = configIds(html);

  // 다른 ID 혼입 차단
  const otherLoad = loaders.filter((x) => x !== ID);
  const otherCfg = configs.filter((x) => x !== ID);
  if (otherLoad.length) errors.push(`${rel} 다른 로더 ID: ${[...new Set(otherLoad)].join(', ')}`);
  if (otherCfg.length) errors.push(`${rel} 다른 config ID: ${[...new Set(otherCfg)].join(', ')}`);

  // 정확히 1개의 로더 + 1개의 config (대상 ID)
  const nLoad = loaders.filter((x) => x === ID).length;
  const nCfg = configs.filter((x) => x === ID).length;
  if (nLoad === 0) errors.push(`${rel} GA4 로더 누락 (${ID} gtag/js 없음)`);
  else if (nLoad > 1) errors.push(`${rel} GA4 로더 중복 ×${nLoad}`);
  if (nCfg === 0) errors.push(`${rel} GA4 config 누락 (${ID} 없음)`);
  else if (nCfg > 1) errors.push(`${rel} GA4 config 중복 ×${nCfg}`);

  // send_page_view:false 필수 — 자동 페이지뷰를 끄고 진짜 방문자(봇·내부·관리자·감사봇 제외)
  // 일 때만 visitor-tracker가 page_view를 쏜다. 빠지면 봇/링크미리보기가 이탈율을 오염시킨다.
  // ★HTML 주석을 먼저 제거하고 gtag('config', ID, { … send_page_view:false … }) 호출 본문에서만 확인.
  //   (주석에도 'send_page_view:false' 문구가 있어 단순 정규식은 false-pass 됨)
  if (nCfg >= 1) {
    const code = html.replace(/<!--[\s\S]*?-->/g, '');
    const cfgRe = new RegExp(`gtag\\(\\s*['"]config['"]\\s*,\\s*['"]${ID}['"]\\s*,\\s*\\{([^}]*)\\}`, 'g');
    let ok = false, m2;
    while ((m2 = cfgRe.exec(code))) {
      if (/send_page_view\s*:\s*false/i.test(m2[1])) ok = true;
    }
    if (!ok) errors.push(`${rel} send_page_view:false 누락 (config 옵션에 없음 → 자동 페이지뷰 미차단 → 봇 이탈율 오염)`);
  }
}

console.log('📊 GA4 태그 게이트');
console.log(`   검사 페이지 ${pages} · 측정 ID ${ID}`);

if (errors.length) {
  console.error(`\n🛑 GA4 태그 게이트 FAIL ${errors.length}건:`);
  for (const e of errors.slice(0, 30)) console.error(`   ❌ ${e}`);
  if (errors.length > 30) console.error(`   … 외 ${errors.length - 30}건`);
  console.error(`\n   → 루트 index.html <head> 의 gtag.js 스니펫(${ID}) 1개만 유지. 다른 ID 혼입 금지.`);
  process.exit(1);
}
console.log(`✅ GA4 태그 게이트 PASS — ${pages}페이지 전수 ${ID} 정확히 1개 (누락·중복·타 ID 0)`);
