#!/usr/bin/env node
// 놀쿨 자동 가드: Edit/Write 직전·직후 CLAUDE.md + skills 룰 강제
// stdin: Claude Code hook JSON ({tool_name, tool_input:{file_path, content, old_string, new_string}})
// exit 2 = 차단(stderr 메시지 노출) / exit 0 = 통과
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { basename, extname } from 'node:path';

const MODE = process.argv[2] || 'pre'; // pre | post
const LOG = '/tmp/nolcool-guard.log';
const log = (m) => { try { appendFileSync(LOG, `[${new Date().toISOString()}][${MODE}] ${m}\n`); } catch {} };

let raw = '';
try { raw = readFileSync(0, 'utf8'); } catch {}
let pkt = {};
try { pkt = JSON.parse(raw || '{}'); } catch { process.exit(0); }
const ti = pkt.tool_input || {};
const file = ti.file_path || ti.path || '';
if (!file) process.exit(0);

// 검사 제외 경로 (자기 자신/메모리/번들/스크립트 자체)
const SKIP = [
  '/node_modules/', '/dist/', '/.git/', '/public/venues/',
  '/.claude/projects/', '/memory/',
  // 가드/감사 스크립트 자신 (룰 정의가 룰을 위반한 것으로 잡히는 self-eat 방지)
  '/scripts/nolcool-guard.mjs', '/scripts/nolcool-dist-audit.mjs',
  '/scripts/nolcool-live-audit.mjs', '/scripts/seo-check-hook.sh',
  '/scripts/auto-content', '/scripts/seed-', '/scripts/prerender-seo.mjs',
  // DB 정리 마이그레이션은 금지단어를 패턴으로 참조해야 삭제 가능 (self-eat 방지)
  '/supabase/migrations/',
  '/scripts/nolcool-link-audit.mjs', '/scripts/nolcool-freshness-audit.mjs',
  '/scripts/nolcool-guard-bulk.mjs', '/scripts/nolcool-route-sitemap-audit.mjs',
  '/scripts/nolcool-claudemd-drift.mjs', '/scripts/nolcool-cross-dup-audit.mjs',
  '/scripts/nolcool-cron-health.mjs',
  // 가드 룰 자체를 화면에 띄우는 운영 대시보드(룰을 문자열로 나열) - 룰 자체와 충돌
  '/src/pages/admin/AuditReportPage.tsx',
  '.lock', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.svg', '.woff',
];
if (SKIP.some(s => file.includes(s))) process.exit(0);

// 검사 대상 텍스트 수집
let text = '';
if (MODE === 'post') {
  // 실제 파일을 다시 읽음
  if (existsSync(file)) { try { text = readFileSync(file, 'utf8'); } catch {} }
} else {
  // pre: tool_input에서 추출 (Write=content, Edit=new_string)
  if (typeof ti.content === 'string') text = ti.content;
  else if (typeof ti.new_string === 'string') text = ti.new_string;
}
if (!text) process.exit(0);

const violations = [];
const isSrc = file.includes('/src/') || file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js');
const isData = /\/src\/(data|lib|pages|components)\//.test(file);
const isMd = file.endsWith('.md');
const isHomePage = /HomePage\.(t|j)sx?$/.test(file);

// 1) 가격 금지어 (사이트 전체)
// "만원" 은 가격 노출 컨텍스트에서만 차단. 혜택(차비/이벤트/쿠폰/사은품) 컨텍스트는 허용
const PRICE = ['입장료', '가성비', '시세', '가격대'];
for (const w of PRICE) {
  if (text.includes(w)) violations.push(`💸 가격단어 "${w}" 금지 (feedback_no_price_anywhere)`);
}
// "만원" 가격 노출 패턴만 차단 (룸비 30만원, 기본료 5만원, 입장 만원, 만원대/만원선/만원짜리 등)
const MANWON_PRICE_RE = /(룸비|기본료|보증금|세팅비|입장(?!\s*가능)|메뉴|요금|가격|코스)\s*[\d일이삼사오육칠팔구십백천]*만원|[\d일이삼사오육칠팔구십백천]+\s*만원\s*(부터|이상|이하|선|대|짜리|상당)|만원대(?![가-힣])/;
if (MANWON_PRICE_RE.test(text)) {
  violations.push(`💸 가격 컨텍스트 "만원" 금지 (혜택/차비 컨텍스트는 허용)`);
}

// 2) 성인 금지어 / 가족 콘텐츠
// "2차"는 "2차: 두번째 단계" 같은 주석/통계 용어와 충돌 → 성적 컨텍스트 패턴만
const BANNED_RE = [
  { re: /2차\s*(서비스|모임|콜|가능|가격|비용|진행|연계|약속|장소)/, label: '2차+서비스/모임/콜' },
  { re: /\b무료\s*체험\b/, label: '무료체험' },
  { re: /부모님\s*생신/, label: '부모님생신' },
  { re: /\b상견례\b/, label: '상견례' },
  { re: /가족\s*모임/, label: '가족모임' },
  { re: /\b돌잔치\b/, label: '돌잔치' },
  { re: /결혼\s*기념일/, label: '결혼기념일' },
];
for (const { re, label } of BANNED_RE) {
  if (re.test(text)) violations.push(`🚫 금지단어 "${label}" (feedback_banned_words_strict)`);
}

// 3) "놀쿨" stuffing in title — 홈 외 페이지
if (!isHomePage) {
  // 함수형 useDocumentMeta('title', ...) 또는 객체형 useDocumentMeta({title:'...'}) 또는 <title>
  const titleRegex = /(?:useDocumentMeta\s*\(\s*[`'"][^`'"]*놀쿨[^`'"]*[`'"])|(?:useDocumentMeta\s*\(\s*\{[^}]*title\s*:\s*[`'"][^`'"]*놀쿨[^`'"]*[`'"])|(?:<title>[^<]*놀쿨[^<]*<\/title>)/;
  if (titleRegex.test(text)) {
    violations.push(`🏷️  title에 "놀쿨" 금지 (홈 외 페이지). CLAUDE.md TITLE RULES`);
  }
}

// 4) title 중복단어 — 함수형 첫 인자 + 객체형 + <title> 모두 지원
const titleMatches = [
  ...text.matchAll(/useDocumentMeta\s*\(\s*[`'"]([^`'"]+)[`'"]/g),
  ...text.matchAll(/useDocumentMeta\s*\(\s*\{[^}]*?title\s*:\s*[`'"]([^`'"]+)[`'"]/g),
  ...text.matchAll(/<title>([^<]+)<\/title>/g),
];
for (const m of titleMatches) {
  const t = (m[1] || '').trim();
  if (!t) continue;
  const tokens = t.replace(/[—\-·,!?:|]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  // 1) 완전일치 중복
  const seen = new Map();
  for (const tok of tokens) seen.set(tok, (seen.get(tok) || 0) + 1);
  const dup = [...seen.entries()].filter(([, n]) => n >= 2).map(([w]) => w);
  // 2) 부분문자열 중복: 짧은 단독 토큰(2-3자)이 더 긴(4자+) 합성 토큰에도 등장하는 경우만
  // 예: "강남클럽 강남" → "강남" 단독 + "강남클럽" 합성 = 매칭
  // 제외: "관리자 관리" — 관리자 3자라 합성 토큰 기준 미달 → 통과
  const standaloneShort = tokens.filter(t => /^[가-힣]{2,3}$/.test(t));
  const longCompound = tokens.filter(t => /^[가-힣]{4,}$/.test(t));
  for (const k of new Set(standaloneShort)) {
    const inLong = longCompound.filter(L => L.includes(k)).length;
    if (inLong >= 1 && !dup.includes(k)) {
      dup.push(`${k}(단독+합성${inLong}회)`);
    }
  }
  if (dup.length) violations.push(`🔁 title 중복단어 [${dup.join(', ')}] in "${t}"`);
  // 3) 시즌129 패턴: 합성+합성 토큰이 같은 2자 한국어 stem 공유 (예: 일산명월관요정 + 일산요정 = 일산×2, 요정×2)
  //    역명(*역) 제외 — 위치 SEO 정당
  const stemMap = new Map();
  for (const tok of tokens) {
    if (/역$/.test(tok)) continue;
    if (tok.length < 4) continue; // 합성 토큰만
    const s = tok.slice(0, 2);
    if (!/^[가-힣]{2}$/.test(s)) continue;
    stemMap.set(s, (stemMap.get(s) || 0) + 1);
  }
  const stemDup = [...stemMap.entries()].filter(([, c]) => c >= 2).map(([s, c]) => `${s}×${c}`);
  if (stemDup.length) violations.push(`🔁 title 의미중복 stem [${stemDup.join(', ')}] in "${t}" (시즌129 패턴)`);
}

// 5) 3rd-party 이미지 서비스
const BAD_IMG = ['thum.io', 'microlink.io', 'screenshotone', 'image.thum.io'];
for (const w of BAD_IMG) {
  if (text.includes(w)) violations.push(`🖼️  3rd-party 이미지서비스 "${w}" 금지 (feedback_no_3rdparty_image_services)`);
}

// 6) HashRouter / Next.js
if (/from\s+['"]react-router-dom['"][^;]*HashRouter/.test(text) || /\bHashRouter\b/.test(text) && isSrc) {
  if (/\bHashRouter\b/.test(text)) violations.push(`🛣️  HashRouter 금지. BrowserRouter만 (CLAUDE.md 함정)`);
}
if (/from\s+['"]next\/(router|link|navigation|head)['"]/i.test(text)) {
  violations.push(`⚛️  Next.js import 금지. Vite SPA 유지`);
}

// 6-2) react-router-dom Link 직접 import 금지 (SafeLink 강제 — 새탭 정책)
// 예외: SafeLink 자신, AdminLayout(사이드바 SPA 네비)
const isSafeLink = file.includes('/components/ui/SafeLink.');
const isAdminNav = /AdminLayout\.(t|j)sx?$/.test(file);
if (isSrc && !isSafeLink && !isAdminNav) {
  // import { ..., Link[ ,]..., } from 'react-router-dom'
  const rrdImport = text.match(/import\s*\{[^}]+\}\s*from\s*['"]react-router-dom['"]/g) || [];
  for (const stmt of rrdImport) {
    if (/\b(Link|NavLink)\b/.test(stmt)) {
      violations.push(`🔗 react-router-dom에서 Link/NavLink 직접 import 금지 — '@/components/ui/SafeLink' 사용 (새탭 정책)`);
      break;
    }
  }
}

// 7) 가짜 전화번호 패턴 — placeholder=/example=/주석 안은 허용
const FAKE_PHONES = [
  /010[-\s]?0000[-\s]?0000/, /010[-\s]?1234[-\s]?(1234|5678)/,
  /02[-\s]?0000[-\s]?0000/, /000[-\s]?000[-\s]?0000/,
];
for (const re of FAKE_PHONES) {
  const m = text.match(re);
  if (!m) continue;
  // 해당 매치 라인 추출
  const idx = m.index ?? 0;
  const lineStart = text.lastIndexOf('\n', idx) + 1;
  const lineEnd = text.indexOf('\n', idx); const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
  // placeholder= / example / 주석은 허용
  if (/placeholder\s*=|example|\/\/|\/\*|예시|샘플/.test(line)) continue;
  violations.push(`📞 가짜 전화번호 패턴 ${re.source} 금지 (CLAUDE.md NEVER)`);
}

// 8) target=_blank rel 누락 — 이메일 템플릿(email.ts/mail/Resend 호출) 제외 (메일 클라이언트가 target 무시)
const isEmail = /email|mail/i.test(file) || /api\.resend\.com|RESEND_API_KEY/.test(text);
if (!isEmail && isSrc && /<a\s+[^>]*href=["']https?:\/\/[^"']+["'][^>]*>/.test(text)) {
  // target/_blank 없는 외부 링크 1개라도 있으면 경고
  const externals = text.match(/<a\s+[^>]*href=["']https?:\/\/[^"']+["'][^>]*>/g) || [];
  for (const a of externals) {
    if (!a.includes('target="_blank"') && !a.includes("target='_blank'")) {
      violations.push(`🔗 외부 링크 target="_blank" 누락: ${a.slice(0, 80)}`);
      break;
    }
  }
}

// 9) useDocumentMeta 누락 — 콘텐츠 페이지만. callback/redirect/error는 제외
// Edit(부분수정)의 new_string엔 보통 useDocumentMeta가 없으니 파일 전체를 다시 읽어서 검사
const NO_SEO_NEEDED = /(Callback|Redirect|Error|404|Logout)Page\.tsx$/;
if (/\/src\/pages\/.+Page\.tsx$/.test(file) && !NO_SEO_NEEDED.test(file)) {
  const fullText = (pkt.tool_name === 'Edit' && existsSync(file))
    ? (() => { try { return readFileSync(file, 'utf8'); } catch { return text; } })()
    : text;
  if (!/useDocumentMeta|<Helmet|<title>/.test(fullText)) {
    violations.push(`📄 페이지 컴포넌트에 useDocumentMeta/Helmet 누락 (SEO)`);
  }
}

// 9-2) v16 AI 클리셰 패턴 — venue 콘텐츠 + 페이지 본문 (data/lib/pages/components)
// 양주 도메인 용어 "프리미엄 셀렉션/룸"은 유지 (업계 표준 카테고리)
const AI_CLICHE = [
  { re: /자리잡은|자리잡고\s*있/, label: '자리잡은 (사람말 "있는/들어선")' },
  { re: /잊지\s*못할/, label: '잊지 못할' },
  { re: /특별한\s*경험/, label: '특별한 경험' },
  { re: /추천\s*드립/, label: '추천드립니다' },
  { re: /본\s*(가게|클럽|업소|호빠|요정|룸|라운지|나이트)는/, label: '본 가게/클럽은' },
  { re: /방문하시는\s*분들/, label: '방문하시는 분들' },
  { re: /고객\s*여러분/, label: '고객 여러분' },
  { re: /당점\s*(에서|은|의)/, label: '당점에서는' },
  { re: /저희\s*(클럽|룸|업소|가게|라운지|호빠|요정)\s*에서는/, label: '저희 ~에서는' },
  { re: /고품격\s*서비스/, label: '고품격 서비스' },
  { re: /엄선된\s*[가-힣]/, label: '엄선된 ~' },
  { re: /강력\s*추천/, label: '강력 추천' },
  { re: /필수\s*방문/, label: '필수 방문' },
  { re: /후회\s*없으/, label: '후회 없으실' },
  { re: /만족스러우실/, label: '만족스러우실' },
  { re: /탁월한\s*[가-힣]/, label: '탁월한 ~' },
  { re: /최고의\s*선택/, label: '최고의 선택' },
  { re: /분석한\s*결과/, label: '분석한 결과' },
  { re: /종합\s*평가/, label: '종합 평가' },
  // "프리미엄 [업종]"은 차단, 단 "프리미엄 셀렉션/룸/라인/위스키" 등 도메인 용어는 제외
  { re: /프리미엄\s*(클럽|라운지|호빠|요정|나이트|업소|가게)/, label: '프리미엄 [업종]' },
];
// 페이지/data/components/lib 스코프 한정 (법률·도움말·FAQ 페이지 자연어 보호: 법률 페이지는 useDocumentMeta 있어서 isData에 포함되지만 위 표현이 거의 안 쓰임)
const isContentScope = /\/src\/(data|pages|components|lib)\//.test(file);
// 단, Privacy/Help/QnA/Terms 등 정책·FAQ 페이지는 일부 표현 자연어로 사용 가능 → 스코프 제외
const isPolicyPage = /(Privacy|Help|Terms|QnA|FAQ|About)Page\.tsx$/.test(file);
if (isContentScope && !isPolicyPage) {
  for (const { re, label } of AI_CLICHE) {
    if (re.test(text)) violations.push(`🤖 AI 클리셰 "${label}" — 사람 톤으로 (v16 친구톤)`);
  }
}

// 10) "놀쿨" 본문 stuffing (홈 외 src/data/venues.ts 등) — 3회 이상
if (!isHomePage && (file.endsWith('venues.ts') || /\/src\/data\//.test(file))) {
  const cnt = (text.match(/놀쿨/g) || []).length;
  if (cnt >= 4) violations.push(`🌀 "놀쿨" stuffing ${cnt}회 (3회 이하 권장)`);
}

// 11) title 길이 60자 초과 / meta description 150자 초과 — 템플릿 리터럴 변수 포함 시 정적 길이 측정 부정확하니 제외
for (const m of titleMatches) {
  const t = (m[1] || '').trim();
  if (!t) continue;
  if (/\$\{[^}]+\}/.test(t)) continue; // ${var} 포함 시 평가 길이 모름
  if (t.length > 60) violations.push(`📏 title ${t.length}자 (60자 한계) "${t.slice(0, 30)}…"`);
}
// useDocumentMeta(title, description, ...) 함수형 2번째 인자만 안정적으로 잡힘
const descMatches = [
  ...text.matchAll(/useDocumentMeta\s*\(\s*[`'"][^`'"]+[`'"]\s*,\s*[`'"]([^`'"]+)[`'"]/g),
  ...text.matchAll(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/g),
];
for (const m of descMatches) {
  const d = (m[1] || '').trim();
  if (d.length > 160) violations.push(`📏 meta description ${d.length}자 (150자 권장, 160자 강한계)`);
}

// 12) 지도 임베드 금지 — iframe src만 차단. <a href> 외부 링크(귀가 도구)는 허용.
const MAP_HOSTS = /(map\.kakao|map\.naver|kakao\.com\/map|naver\.com\/map|maps\.google|google\.com\/maps|daum\.net\/map)/;
const iframes = text.match(/<iframe[^>]*src=["'][^"']+["'][^>]*>/g) || [];
for (const i of iframes) {
  if (MAP_HOSTS.test(i)) { violations.push(`🗺️  지도 iframe 임베드 금지 (feedback_no_map_no_price)`); break; }
}

// 13) canonical/og:image 하드코드 ilsanroom.pages.dev — nolcool.com만 허용
if (/canonical/i.test(text) || /og:url|og:image/i.test(text)) {
  if (/ilsanroom\.pages\.dev/.test(text)) {
    violations.push(`🌐 canonical/og에 ilsanroom.pages.dev 하드코드 금지 (nolcool.com만)`);
  }
}

// 14) useEffect 안에 setTimeout/setInterval 있는데 return cleanup 없음 (자원 누수)
// Callback/Redirect/Error 페이지는 즉시 navigate라 cleanup 면제
const cleanupExempt = /(Callback|Redirect|Error|404|Logout)Page\.tsx$/.test(file);
if (!cleanupExempt && isSrc && /useEffect\s*\(/.test(text)) {
  // 간단 패턴: useEffect 블록 내 setTimeout/setInterval이 있고 같은 블록 내 return문 없음
  const ueBlocks = text.match(/useEffect\s*\(\s*(?:\(\s*\)\s*=>\s*\{|\(\)\s*=>\s*\{|function\s*\([^)]*\)\s*\{)([\s\S]*?)\}\s*,\s*\[[^\]]*\]\s*\)/g) || [];
  for (const blk of ueBlocks) {
    if (/\b(setTimeout|setInterval|addEventListener|subscribe)\s*\(/.test(blk) && !/return\s+(?:\(\)\s*=>|function|\(\s*\)\s*=>)/.test(blk)) {
      violations.push(`🧹 useEffect cleanup 누락 (timer/listener/subscribe 정리 필요)`);
      break;
    }
  }
}

// 15) JSON-LD NightClub schema — 6업종 venue Detail만. Magazine/PostDetail 제외.
// prerender-seo.mjs가 SSR HTML에 자동 주입하므로 src 컴포넌트엔 별도 요구 안 함 → 룰 비활성
// (실제 검증은 dist/*.html 감사에서 수행)

// 16) "놀쿨" stuffing은 src 단계에선 UI 라벨/기능명("놀쿨 쪽지" 등)과 구분 어려움
// → dist 감사에서 렌더링된 본문 텍스트만 카운트 (nolcool-dist-audit.mjs)

// 17) <img> alt 누락 (장식 이미지 alt="" 허용)
if (isSrc && /<img\s/.test(text)) {
  const imgs = text.match(/<img\s+[^>]*?\/?>/g) || [];
  for (const img of imgs) {
    if (!/\salt\s*=/.test(img)) {
      violations.push(`♿ <img> alt 속성 누락 (장식이면 alt="" 명시): ${img.slice(0, 80)}`);
      break;
    }
  }
}

// 18) icon-only <button>에 aria-label 또는 텍스트 누락
// 패턴: <button ... >[아이콘 JSX]</button> 텍스트/aria-label 없음
if (isSrc && /<button\s/.test(text)) {
  // 자식이 단일 SVG/아이콘이고 aria-label 없는 케이스 (정규식 한계로 보수적 탐지)
  const iconBtns = text.match(/<button\s+[^>]*?>\s*<(?:svg|[A-Z]\w+Icon|[A-Z]\w+)[^>]*\/?>(?:\s*<\/(?:svg|[A-Z]\w+Icon|[A-Z]\w+)>)?\s*<\/button>/g) || [];
  for (const b of iconBtns) {
    if (!/aria-label\s*=|aria-labelledby\s*=|title\s*=/.test(b)) {
      violations.push(`♿ icon-only <button> aria-label 누락: ${b.slice(0, 80)}`);
      break;
    }
  }
}

// 19) 모바일 fixed bottom 요소 — pb-safe 또는 padding-bottom env(safe-area-inset) 누락 페이지
// MainLayout이 글로벌 pb 처리하므로 페이지 단위 검사는 안 함. fixed bottom 요소 자체에 height 명시 필요만 체크.
if (isSrc && /(fixed\s+(?:bottom-0|inset-x-0\s+bottom-0))/.test(text)) {
  // bottom 고정 요소가 height/h-/min-h 없으면 위험 (overlap 무한)
  const fixedBottoms = text.match(/className=["'][^"']*(?:fixed)\s+[^"']*bottom-0[^"']*["']/g) || [];
  for (const cls of fixedBottoms) {
    if (!/\bh-\d|\bmin-h|\bpy-\d|\bp-\d|\bheight:/.test(cls)) {
      // 보수적: 경고만 (false-positive 가능)
      // 실제 차단 룰엔 미포함
    }
  }
}

// 20) JSX 이벤트 핸들러 inline 함수 — 단순 안티패턴이라 가드 차단 X. CLAUDE.md 미규정.

// 21) 위험단어(불법 연관·SEO 페널티) 재유입 차단 — src 콘텐츠 한정.
//     매핑: 밤문화/유흥→나이트라이프 · 노래방→가라오케 · 룸살롱/룸싸롱→프라이빗룸 · 초이스→셀렉션
// 2026-07-08: '밤 문화' 등 띄어쓰기 변형 우회 차단 — dist-audit DANGEROUS regex와 1:1 미러.
const DANGEROUS = [
  { w: '밤문화', re: /밤\s?문화/ },
  { w: '유흥', re: /유흥/ },
  { w: '룸살롱', re: /룸\s?살롱/ },
  { w: '룸싸롱', re: /룸\s?싸롱/ },
  { w: '노래방', re: /노래\s?방(?!송)/ },
  { w: '초이스', re: /초이스/ },
];
if (isSrc) {
  for (const { w, re } of DANGEROUS) {
    if (re.test(text)) violations.push(`⛔ 위험단어 "${w}" 금지 (불법 연관·SEO 페널티) → 나이트라이프/가라오케/프라이빗룸/셀렉션`);
  }
}

if (violations.length) {
  log(`BLOCK ${file}: ${violations.join(' | ')}`);
  console.error(`\n🛑 놀쿨 가드 차단 (${MODE}) — ${basename(file)}`);
  for (const v of violations) console.error(`   • ${v}`);
  console.error(`📖 룰: CLAUDE.md / ~/.claude/skills/nolcool-* / MEMORY.md`);
  console.error(`📝 로그: ${LOG}`);
  // post 모드는 차단해도 이미 쓰여진 상태 → 경고만 (exit 1로 stderr만 노출)
  process.exit(MODE === 'pre' ? 2 : 1);
}
process.exit(0);
