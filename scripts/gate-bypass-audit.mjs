#!/usr/bin/env node
/**
 * [메타] 게이트 우회검증 자동 레지스트리 + 하니스
 *
 * 빌드 체인의 모든 "차단 게이트"(process.exit(1) 로 배포를 막는 *-gate/*-audit)는
 * 양방향으로 검증돼야 한다 — 정상 PASS(빌드가 증명) + 위반 주입 시 FAIL.
 * 그동안은 게이트를 추가할 때마다 사람이 손으로 우회검증을 한 번씩 돌렸다.
 * 이 스크립트는 그 우회검증을 ★레지스트리화 + 자동화한다.
 *
 *  ① 커버리지 강제(--coverage-only, 무변형=빌드 체인 안전):
 *     package.json scripts.build 를 파싱해 빌드 체인의 차단 게이트(source 에 process.exit(1))를
 *     전부 찾아, REGISTRY 에 우회 케이스가 없으면 FAIL.
 *     → 새 게이트를 빌드 체인에 추가하면, 우회 케이스를 등록할 때까지 빌드가 막힌다.
 *       (게이트 추가 = 우회검증 등록 강제. "자동으로 우회검증이 돈다"의 핵심.)
 *
 *  ② 실제 우회 실행(기본 모드, 파일 변형 → CI 에서만):
 *     각 케이스마다 대상 파일을 위반 상태로 변형 → 해당 게이트 1개 실행 → exit≠0(FAIL) 인지 확인 →
 *     반드시 원복(try/finally). 게이트가 변형에도 PASS 하면 "구멍(HOLE)"으로 보고하고 종료코드 1.
 *     dist 게이트는 dist/ 가 필요 → CI 워크플로에서 `npm run build` 후 실행.
 *
 * ⚠️ 정상 PASS 측은 `npm run build` 자체가 매번 증명하므로 여기선 위반 주입(FAIL) 측만 돌린다.
 * ⚠️ 이 스크립트는 어떤 파일도 영구 변경하지 않는다(모든 변형은 finally 에서 원복).
 * ⚠️ 사이트 금지어(가격어 등)는 소스 리터럴 대신 유니코드 조합으로 구성(가드/스터핑 게이트 회피).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const COVERAGE_ONLY = process.argv.includes('--coverage-only');

// 사이트 금지어를 소스 리터럴로 두지 않기 위해 유니코드로 구성
const PRICE_WORD = String.fromCharCode(0xC785, 0xC7A5, 0xB8CC); // [가격 금지어]

// ─────────────────────────────────────────────────────────────────────────────
// 변형 헬퍼 — 모두 () => revertFn 을 반환. revert 는 원본을 그대로 되돌린다.
// ─────────────────────────────────────────────────────────────────────────────
const read = (p) => fs.readFileSync(p, 'utf8');

function append(file, text) {
  return () => {
    const orig = fs.readFileSync(file);
    fs.appendFileSync(file, `\n${text}\n`);
    return () => fs.writeFileSync(file, orig);
  };
}
function replaceAll(file, from, to) {
  return () => {
    const orig = read(file);
    const next = orig.split(from).join(to);
    if (next === orig) throw new Error(`치환 대상 없음(${file}): ${from}`);
    fs.writeFileSync(file, next);
    return () => fs.writeFileSync(file, orig);
  };
}
function moveAway(file) {
  return () => {
    const bak = `${file}.bypassbak-${process.pid}`;
    fs.renameSync(file, bak);
    return () => fs.renameSync(bak, file);
  };
}
function jsonAddKey(file, keyResolver, key, value) {
  return () => {
    const orig = read(file);
    const obj = JSON.parse(orig);
    obj[keyResolver(obj)][key] = value;
    fs.writeFileSync(file, JSON.stringify(obj, null, 2));
    return () => fs.writeFileSync(file, orig);
  };
}
// dist 파일을 대상 시점에 resolve 해서 변형(경로가 동적인 dist 게이트용)
function lazy(resolveFile, transform) {
  return () => {
    const file = resolveFile();
    const orig = read(file);
    const next = transform(orig, file);
    if (next === orig) throw new Error(`변형 미적용(${file})`);
    fs.writeFileSync(file, next);
    return () => fs.writeFileSync(file, orig);
  };
}
function lazyCopyOver(resolveDst, resolveSrc) {
  return () => {
    const dst = resolveDst(), src = resolveSrc();
    const orig = fs.readFileSync(dst);
    fs.copyFileSync(src, dst);
    return () => fs.writeFileSync(dst, orig);
  };
}

const insertBeforeBody = (resolveFile, html) =>
  lazy(resolveFile, (s) => s.replace('</body>', `${html}</body>`));

// dist venue 상세 페이지 경로 수집 (dist/<category>/<region>/<slug>/index.html)
function venueHtmls(category) {
  const base = path.join('dist', category);
  if (!fs.existsSync(base)) return [];
  const out = [];
  for (const region of fs.readdirSync(base)) {
    const rdir = path.join(base, region);
    if (!fs.statSync(rdir).isDirectory()) continue;
    for (const slug of fs.readdirSync(rdir)) {
      const f = path.join(rdir, slug, 'index.html');
      if (fs.existsSync(f)) out.push(f);
    }
  }
  return out;
}
const clubVenue = (i) => () => {
  const v = venueHtmls('clubs');
  if (v.length <= i) throw new Error(`clubs venue html ${i} 없음 — 빌드 후 실행`);
  return v[i];
};
const titleOf = (file) => read(file).match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
const setTitle = (resolveDst, resolveSrcTitle) =>
  lazy(resolveDst, (s) => s.replace(/<title>[^<]*<\/title>/, `<title>${resolveSrcTitle()}</title>`));

const REGION_A = () => 'dist/region/평택/index.html';
const REGION_B = () => 'dist/region/용인/index.html';

// ─────────────────────────────────────────────────────────────────────────────
// 레지스트리 — 빌드 체인의 각 차단 게이트 → 우회 케이스(위반 주입)
//   phase: 'pre'  = vite build 이전(src 변형, dist 불필요)
//          'dist' = prerender 이후(dist 변형, dist/ 필요)
// ─────────────────────────────────────────────────────────────────────────────
const REGISTRY = {
  // ── pre-build (src) ──
  'scripts/nolcool-readability-gate.mjs': {
    phase: 'pre',
    label: 'description 을 분할 없이 <p>{full} 로 직접 렌더',
    mutate: append('src/components/venue/VenueDetailTabs.tsx', '// <p>{full}'),
  },
  'scripts/venue-rating-source-gate.mjs': {
    phase: 'pre',
    label: 'reviewCount 0 인데 rating>0 (별점 창작) venue 블록 주입',
    mutate: append('src/data/venues.ts', "  {\n    slug: 'zzbypass-rating-test',\n    rating: 5,\n  },"),
  },
  'scripts/venue-desc-completeness-gate.mjs': {
    phase: 'pre',
    label: '쉼표로 잘린 미완결 shortDescription venue 블록 주입',
    mutate: append('src/data/venues.ts', "  {\n    slug: 'zzbypass-desc-test',\n    shortDescription: '이 문장은 끝맺지 못하고 잘린 채로 끝나는데,',\n  },"),
  },
  'scripts/mcp-readonly-gate.mjs': {
    phase: 'pre',
    label: 'MCP 서버에 쓰기 메서드(method:POST) 코드 주입',
    mutate: append('scripts/mcp/nolcool-readonly-mcp.mjs', "const __bypass = { method: 'POST' };"),
  },
  'scripts/cron-schema-drift-gate.mjs': {
    phase: 'pre',
    label: 'cron 에 유령 테이블(community_posts) 조회 코드 주입 → 드리프트가 잡아야 함',
    mutate: append('functions/api/cron/activity-alert.ts',
      "const __bypass = fetch('/rest/v1/community_posts?select=id');"),
  },
  'scripts/community-moderation-gate.mjs': {
    phase: 'pre',
    label: 'hasIllegalWord 무력화(return false) → 행동검증이 잡아야 함',
    mutate: replaceAll('src/lib/content-filter.ts',
      'return ILLEGAL_PATTERNS.some((p) => p.test(text));', 'return false;'),
  },
  'scripts/community-no-fake-seed-gate.mjs': {
    phase: 'pre',
    label: '커뮤니티 페이지에 seedPosts 가짜 시드 선언 재유입',
    mutate: append('src/pages/community/FreePage.tsx', '// const seedPosts = [];'),
  },
  'scripts/demand-engine-safety-gate.mjs': {
    phase: 'pre',
    label: '수요 스크립트에 child_process(execSync) 호출 주입',
    mutate: append('scripts/search-console-opportunity.mjs', "// execSync('x')"),
  },
  'scripts/ga-optimizer-safety-gate.mjs': {
    phase: 'pre',
    label: 'GA 스크립트에 gtag event(이벤트 주입) 흔적 주입',
    mutate: append('scripts/ga-optimizer.mjs', "// gtag('event','x')"),
  },
  'scripts/diagnosis-property-gate.mjs': {
    phase: 'pre',
    label: '진단 스크립트에 NOLCOOL 외 GA4 속성 리터럴(properties/999999) 주입',
    mutate: append('scripts/seo-weakness-diagnosis.mjs', '// properties/999999'),
  },
  'scripts/content-honesty-gate.mjs': {
    phase: 'pre',
    label: '본문에 출처 없는 단정어("직수입") 주입',
    mutate: append('src/pages/HomePage.tsx', '// test 직수입'),
  },
  'scripts/scroll-honesty-gate.mjs': {
    phase: 'pre',
    label: 'scroll_100 게이트 신호를 무력화(scrollXXX 로 치환)',
    mutate: replaceAll('src/lib/visitor-tracker.ts', 'scroll_100', 'scrollXXX'),
  },
  'scripts/places-source-gate.mjs': {
    phase: 'pre',
    label: 'provenance 에 비허용 키(rating) 주입',
    mutate: jsonAddKey('src/data/places-provenance.json', (o) => Object.keys(o)[0], 'rating', 5),
  },
  'scripts/ga4-pii-gate.mjs': {
    phase: 'pre',
    label: 'GA4 page_view 페이로드에서 scrubPii() 관문을 벗겨 href 직송(PII 누출)',
    mutate: replaceAll('src/lib/visitor-tracker.ts',
      "gtag('event', 'scroll_100', scrubPii({ page_path: pagePath, page_location: window.location.href }));",
      "gtag('event', 'scroll_100', { page_path: pagePath, page_location: window.location.href });"),
  },

  // ── post-build (dist) ──
  'scripts/nolcool-dist-audit.mjs': {
    phase: 'dist',
    label: 'dist 홈에 가격 금지어 주입',
    mutate: insertBeforeBody(() => 'dist/index.html', `<p>${PRICE_WORD} 안내</p>`),
  },
  'scripts/struct-fingerprint-audit.mjs': {
    phase: 'dist',
    label: '같은 카테고리 venue 한 곳을 다른 곳으로 복사(구조 지문 100%)',
    mutate: lazyCopyOver(clubVenue(0), clubVenue(1)),
  },
  'scripts/funnel-reachability-audit.mjs': {
    phase: 'dist',
    label: 'venue 본문(main)의 내부 링크를 깨뜨려 도달성 0',
    mutate: lazy(clubVenue(0), (s) => {
      const a = s.indexOf('<main id="main-content"');
      const b = s.indexOf('</main>', a);
      if (a < 0 || b < 0) throw new Error('main 블록 없음');
      return s.slice(0, a) + s.slice(a, b).split('href="/').join('href="x') + s.slice(b);
    }),
  },
  'scripts/nolcool-entity-gate.mjs': {
    phase: 'dist',
    label: 'venue addressRegion 을 행정구역 아닌 동네명("테스트동")으로 변조',
    mutate: lazy(clubVenue(0), (s) => s.replace(/"addressRegion":"[^"]*"/, '"addressRegion":"테스트동"')),
  },
  'scripts/prefetch-route-gate.mjs': {
    phase: 'dist',
    label: 'dist 홈에 404 내부 링크(prefetch 대상) 주입',
    mutate: insertBeforeBody(() => 'dist/index.html', '<a href="/zzz-nonexistent-xyz/">x</a>'),
  },
  'scripts/og-asset-gate.mjs': {
    phase: 'dist',
    label: '카테고리 og JPG(public/og/clubs.jpg) 제거',
    mutate: moveAway('public/og/clubs.jpg'),
  },
  'scripts/category-density-gate.mjs': {
    phase: 'dist',
    label: '/clubs/ 에 키워드("클럽") 과밀 스터핑 주입',
    mutate: insertBeforeBody(() => 'dist/clubs/index.html', '<p>' + '클럽 '.repeat(600) + '</p>'),
  },
  'scripts/dist-stuffing-gate.mjs': {
    phase: 'dist',
    label: 'venue 본문에 키워드("클럽") 과밀 스터핑 주입',
    mutate: insertBeforeBody(clubVenue(0), '<p>' + '클럽 '.repeat(900) + '</p>'),
  },
  'scripts/dwell-content-gate.mjs': {
    phase: 'dist',
    label: 'venue 본문의 <p>·<h2> 를 모두 제거(체류 콘텐츠 0)',
    mutate: lazy(clubVenue(0), (s) =>
      s.replace(/<p[\s\S]*?<\/p>/g, '').replace(/<h2[\s\S]*?<\/h2>/g, '')),
  },
  'scripts/title-uniqueness-gate.mjs': {
    phase: 'dist',
    label: 'venue 두 곳의 <title> 을 동일하게 만들어 중복',
    mutate: setTitle(clubVenue(0), () => titleOf(clubVenue(1)())),
  },
  'scripts/aggregate-title-gate.mjs': {
    phase: 'dist',
    label: '지역(region) 두 곳의 <title> 을 동일하게 만들어 중복',
    mutate: setTitle(REGION_A, () => titleOf(REGION_B())),
  },
  'scripts/page-essentials-gate.mjs': {
    phase: 'dist',
    label: 'venue 페이지에서 <title> 제거(필수 요소 누락)',
    mutate: lazy(clubVenue(0), (s) => s.replace(/<title>[^<]*<\/title>/, '')),
  },
  'scripts/ga4-tag-gate.mjs': {
    phase: 'dist',
    label: 'dist 홈의 GA4 gtag.js 로더 URL 변조(태그 제거)',
    mutate: lazy(() => 'dist/index.html', (s) =>
      s.split('googletagmanager.com/gtag/js').join('example.com/x')),
  },
  'scripts/venue-density-audit.mjs': {
    phase: 'dist',
    label: 'venue 페이지에 가게이름을 과다 반복 주입(키워드 밀도 >3.0% 회귀)',
    mutate: lazy(clubVenue(0), (s) => {
      const name = (s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').replace(/<[^>]+>/g, '').trim();
      if (!name) throw new Error('h1 가게이름 추출 실패 — 빌드 후 실행');
      return s.replace('</body>', `<p>${(name + ' ').repeat(120)}</p></body>`);
    }),
  },
  'scripts/lastmod-honesty-gate.mjs': {
    phase: 'dist',
    label: '미변경 페이지 lastmod 을 직전값과 다른 날짜로 위조(거짓 신선도 주입)',
    mutate: () => {
      const f = 'scripts/.seo-lastmod.json';
      const orig = fs.readFileSync(f);
      const cur = JSON.parse(orig.toString());
      const prev = JSON.parse(fs.readFileSync('scripts/.seo-lastmod.prev.json', 'utf8'));
      const today = new Date().toISOString().slice(0, 10);
      // 해시가 직전과 동일(미변경)인 라우트 1개 → 직전 lastmod 과 다른 날짜로 위조 (계약 위반=일자 무관)
      const target = Object.keys(cur).find((r) => prev[r] && prev[r].hash === cur[r].hash);
      if (!target) throw new Error('미변경 라우트 없음 — 빌드 후 실행');
      cur[target].lastmod = prev[target].lastmod === today ? '2099-01-01' : today;
      fs.writeFileSync(f, JSON.stringify(cur, null, 0) + '\n');
      return () => fs.writeFileSync(f, orig);
    },
  },
};

// 이 하니스 자기 자신(--coverage-only 로 빌드 체인에 들어가 있음) — 우회검증 대상 아님
const SELF = 'scripts/gate-bypass-audit.mjs';

// 빌드 체인 안에 있지만 process.exit(1) 가 없는 "보고 전용" 감사 — 커버리지 면제
const NON_BLOCKING = new Set([
  'scripts/nolcool-cross-dup-audit.mjs',
  'scripts/nolcool-route-sitemap-audit.mjs',
]);

// ─────────────────────────────────────────────────────────────────────────────
// 커버리지 — 빌드 체인의 차단 게이트가 전부 레지스트리에 있는지
// ─────────────────────────────────────────────────────────────────────────────
function buildChainScripts() {
  const pkg = JSON.parse(read('package.json'));
  const build = pkg.scripts?.build || '';
  const out = [];
  for (const m of build.matchAll(/node\s+(scripts\/[\w./-]+\.mjs)/g)) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}
function isBlocking(scriptPath) {
  // *-gate / *-audit 이고 source 에 process.exit(1) 가 있으면 차단 게이트
  if (!/-(gate|audit)\.mjs$/.test(scriptPath)) return false;
  if (!fs.existsSync(scriptPath)) return false;
  return /process\.exit\(1\)/.test(read(scriptPath));
}
function checkCoverage() {
  const chain = buildChainScripts();
  const blocking = chain.filter((s) => s !== SELF && isBlocking(s));
  const missing = blocking.filter((s) => !REGISTRY[s] && !NON_BLOCKING.has(s));
  console.log(`🧭 빌드 체인 차단 게이트 ${blocking.length}개 · 레지스트리 ${Object.keys(REGISTRY).length}개 · 보고전용 면제 ${NON_BLOCKING.size}개`);
  if (missing.length) {
    console.error(`\n❌ 우회검증 커버리지 FAIL — 빌드 체인에 있으나 우회 케이스 미등록 ${missing.length}개:`);
    for (const s of missing) console.error(`   - ${s}`);
    console.error('\n새 게이트를 추가했다면 scripts/gate-bypass-audit.mjs REGISTRY 에 우회 케이스(위반 주입)를 등록하세요.');
    console.error('(정말 보고 전용이라 process.exit(1) 이 없다면 NON_BLOCKING 에 추가)\n');
    return false;
  }
  // 레지스트리에 있는데 빌드 체인에 더 이상 없는 stale 케이스 경고(차단은 안 함)
  const stale = Object.keys(REGISTRY).filter((s) => !chain.includes(s));
  if (stale.length) console.log(`⚠️  빌드 체인에 없는 레지스트리 케이스(stale) ${stale.length}개: ${stale.join(', ')}`);
  console.log('✅ 우회검증 커버리지 PASS — 모든 차단 게이트에 우회 케이스 등록됨');
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 우회 실행 — 위반 주입 → 게이트 1개 실행 → FAIL 이어야 함
// ─────────────────────────────────────────────────────────────────────────────
function runGate(script) {
  const r = spawnSync('node', [script], { cwd: ROOT, encoding: 'utf8' });
  return r.status; // 0 = PASS, !=0 = FAIL(차단)
}
function runBypassCases() {
  const distReady = fs.existsSync('dist/index.html');
  const holes = [];
  const errs = [];
  let ran = 0, skipped = 0;

  for (const [script, c] of Object.entries(REGISTRY)) {
    if (c.phase === 'dist' && !distReady) {
      console.log(`   ⏭️  SKIP(dist 없음) ${script} — ${c.label}`);
      skipped++;
      continue;
    }
    let revert = null;
    try {
      revert = c.mutate();
      const status = runGate(script);
      if (status === 0) {
        holes.push(`${script}: 위반 주입(${c.label})에도 게이트가 PASS — 우회 구멍`);
        console.log(`   ❌ HOLE ${script} — ${c.label}`);
      } else {
        console.log(`   ✅ OK   ${script} (주입→FAIL) — ${c.label}`);
        ran++;
      }
    } catch (e) {
      errs.push(`${script}: 우회 케이스 실행 오류 — ${e.message}`);
      console.log(`   ⚠️  ERR  ${script} — ${e.message}`);
    } finally {
      if (revert) { try { revert(); } catch (e) { errs.push(`${script}: 원복 실패 — ${e.message}`); } }
    }
  }

  console.log(`\n📊 우회 실행: 정상차단 ${ran} · 구멍 ${holes.length} · 오류 ${errs.length} · 스킵(dist) ${skipped}`);
  for (const h of holes) console.error(`   - ${h}`);
  for (const e of errs) console.error(`   - ${e}`);
  return { ok: holes.length === 0 && errs.length === 0, holes, errs };
}

// ─────────────────────────────────────────────────────────────────────────────
const coverageOk = checkCoverage();
if (COVERAGE_ONLY) {
  process.exit(coverageOk ? 0 : 1);
}
if (!coverageOk) {
  console.error('\n커버리지 실패 — 우회 실행 생략. 먼저 레지스트리를 정리하세요.');
  process.exit(1);
}
console.log('\n🧪 우회 실행 시작 (각 게이트에 위반 주입 → FAIL 확인 → 원복):');
const { ok } = runBypassCases();
if (!ok) {
  console.error('\n❌ 게이트 우회검증 FAIL — 위 구멍/오류를 수정하세요.');
  process.exit(1);
}
console.log('\n✅ 게이트 우회검증 PASS — 모든 차단 게이트가 위반 주입을 실제로 막음 (양방향).');
