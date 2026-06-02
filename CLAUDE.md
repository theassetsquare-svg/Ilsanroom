# NOLCOOL — Nightlife (NOT kids/leisure)

## ⭐⭐⭐ TITLE/DESC/본문 차별화 절대규칙 (#0 — 모든 작업 최우선) ⭐⭐⭐
**모든 venue/페이지 카피 작성 시 자기 검열 필수**. 위반 시 Google이 사이트 자체 템플릿으로 인식 → 색인 약화.

**시즌78 패러다임**: 후킹 ≠ 단어. 후킹 = 언어 구조 효과. 단어 화이트리스트 영구 폐기.

1. **후미 5어절 unique** — title 뒤 5어절 다른 페이지와 동일하면 즉시 교체 (예: "단골이 직접 가본 진짜 이유" 2번 X)
2. **n-gram 5회 초과 금지** — 3~5어절 문구 단위가 사이트 전체 5회 초과 사용 X (단어 빈도가 아니라 **표현 패턴**)
3. **후킹 5축 1축 이상** — 모든 title/desc는 `analyzeHook(text).passed === true` 필수
   - 5축: 숫자/구체화 · 질문/대화 · FOMO/부정 · 1인칭/구어체 · 구체적 디테일
   - 어떤 단어든 5축 중 1축이라도 자극하면 통과 (무제한 표현 커버)
4. **5축 차별화 필수** — (시그니처·시점·감정·페르소나·후킹형태) 중 최소 2축 venue 고유성
5. **본문 고유성 > 패딩 분량** — venue 상세 ≥1700자(detail)/≥2000자(listing), H2 ≥5개. ★3000자 패딩 폐기: 3000자 채우려 가게별 templated 보일러플레이트를 넣으면 그게 구조 지문(scaled-content-abuse)이 된다. 가게별 100% 고유 데이터로만 본문 구성 → 5-gram Jaccard <10% 필수. SSR 본문은 크롤러 프록시(숨김 div), 실제 체류는 React 본문이 만든다 (dwell-content-audit)
6. **자동 검증** — 매일 KST 07:35 title-uniqueness, 07:40 dwell-content (실패시만 메일)
7. **신규 venue/title 변경 시** — 푸시 전 `node scripts/title-uniqueness-audit.mjs` 통과 필수
8. **공통 모듈** — 모든 watch는 `scripts/lib/hook-detector.mjs` import (단어 사전 사용 금지)

## MUST
- DELETE all shared content pools! Write UNIQUE content for EACH venue! Time does not matter! SEO is #1!
- base: "/" ONLY. BrowserRouter ONLY. No # in URL
- Store name = Region+Type+Business. FIRST in title
- No "놀쿨" in any title except homepage
- Keyword density 1.5-2.5% (1000c=5-7x, 2000c=8-12x)
- Logo "놀쿨" text: font-weight: 300 (thin/light). NOT bold! Thin = elegant = stands out!
CSS: .logo-text { font-weight: 300; letter-spacing: 0.05em; }
Only "놀쿨" word is thin. Other text stays normal weight.
Mobile: 16px font, 1.7 line-height, 44px touch, no bar overlap
- useEffect cleanup ALL timers. persistSession:true. ErrorBoundary
- Bestseller writing. No AI text.
- Internal links = SAME TAB (SPA nav, pageview/세션 증가, SEO/CWV 유리). External links = new tab `target="_blank" rel="noopener noreferrer"`. SafeLink Link 기본=같은 탭, prerender SSR도 외부만 _blank.

★★★ TITLE RULES — NO DUPLICATE WORDS! ★★★
Homepage ONLY: "놀쿨 — hook title"
ALL other pages: Store name + hook. NO 놀쿨! NO same word twice!
WRONG: "장안동호빠 장안동호빠" → DELETE duplicate!
WRONG: "강남클럽 레이스 강남 최고" → "강남" twice → DELETE!
RIGHT: "강남클럽 레이스 — 한번 가면 단골 되는 이유"
RIGHT: "장안동호빠 — 직접 가본 사람만 아는 진짜 이야기"
meta description: 150 chars. Store name + hooking. NO duplicate words!
Check EVERY page title. Same word appears twice = DELETE immediately!
Do NOT ask. Just fix. Report all titles when done.
- react-helmet-async for unique title/meta per page! SPA bots fix!
- Every page UNIQUE hookTitle! No duplicate titles! Fix gold-content.ts!
## SEO 2026
- title: Store name + hook. Under 60 chars
- meta description: 150 chars. H1+H2 with store name 3+ times
- Schema: JSON-LD NightClub. og:image: real photo 1:1
- robots.txt Allow ALL bots! NO Disallow! sitemap.xml list ALL pages! llms.txt for AI search! (Googlebot/Yeti/GPTBot) + llms.txt
- Core Web Vitals: LCP<2.5s, INP<200ms, CLS<0.1
- E-E-A-T: real experience, expert tone. Canonical URL. NEVER duplicate title/content across domains!. og:image 1200x1200 (1:1) every page!

- NEVER use shared content pools! Write UNIQUE 1000+ chars per venue! Takes time = OK! SEO = #1 priority!
- Time does not matter! Write UNIQUE 1000+ chars per venue! SEO > speed!
## NEVER
- NEVER use fake phone numbers! NEVER use placeholder data! Only REAL advertiser phone numbers! No number = leave empty!
- Auto page transition. Next.js. Change existing URLs
- Brand name in title. Brand path. Stuffing over 3%
- Baby/mom/family/kids images. No family content (parents birthday/family gathering/reunion/anniversary = DELETE!). Banned adult words

## CODING DISCIPLINE (Karpathy Rules)
- THINK FIRST: State assumptions. Multiple interpretations? Present all. Uncertain? Say so.
- MINIMUM CODE: No speculative features. No abstractions for single-use. 200 lines possible in 50? Rewrite.
- SURGICAL CHANGES: Touch ONLY what's requested. Don't "improve" adjacent code/comments/formatting. Match existing style. YOUR orphaned imports/vars = delete. Pre-existing dead code = mention only.
- GOAL-DRIVEN: Define success criteria BEFORE coding. Loop until verified.
  "Fix bug" → reproduce test → make it pass
  "Add feature" → write check → implement → verify
  Multi-step: `Step → verify → Step → verify`

## STACK
- Frontend: Vite + React 18 + TypeScript + react-helmet-async + react-router-dom (BrowserRouter, base "/")
- Backend: Supabase (Auth/DB/Storage) + Cloudflare Pages Functions (`functions/`)
- Hosting: Cloudflare Pages (auto-deploy on `git push origin main`)
- SEO: Static prerender via `scripts/prerender-seo.mjs` (runs after `vite build`)
- Domain: nolcool.com (primary), ilsanroom.pages.dev → 301 → nolcool.com

## FILE MAP
- `CLAUDE.md` — 본 규칙 (이 파일)
- `index.html` — SPA 엔트리, 정적 SEO 폴백 H1+JSON-LD
- `vite.config.ts` / `tsconfig.json` / `wrangler.toml` — 빌드·배포 설정
- `package.json scripts.build` = `vite build && node scripts/prerender-seo.mjs`
- `src/pages/` — 라우트 페이지 (HomePage, ClubsPage, NightsPage, RoomsPage, YojeongPage, LoungesPage, HoppaPage + 6종 *DetailPage)
- `src/pages/community/` — 7개 게시판 (free/qna/reviews/tips/party/jogak/fashion)
- `src/pages/admin/` `auth/` `lead/` `my/` `seo/` — 관리/인증/리드/마이/SEO 정적
- `src/components/` — venue/community/seo/home/layout/ui 등 17개 도메인 폴더
- `src/data/venues.ts` — 6업종 업소 마스터 데이터 (UNIQUE 콘텐츠 1000+자/업소)
- `src/data/magazine-articles.ts` `venue-events.ts` — 매거진/이벤트
- `src/lib/community-data.ts` `fake-users.ts` `growth-engine.ts` — 커뮤니티 시드·유저
- `src/lib/content-filter.ts` `feature-flags.ts` `analytics.ts` — 모더레이션/플래그/분석
- `scripts/prerender-seo.mjs` — 정적 HTML SSR + sitemap/llms.txt/robots 자동 생성
- `scripts/seed-venues.mjs` `auto-content*.mjs` `seed-content.sql` — 콘텐츠 시드
- `scripts/optimize-images.mjs` `generate-og-images.ts` — 이미지 최적화/OG
- `scripts/seo-check-hook.sh` — SEO 검증 훅 스크립트
- `scripts/migrate.mjs` `supabase/migrations/*.sql` — DB 마이그레이션 (push 시 자동)
- `functions/api/*` — Cloudflare Pages Functions (clip-upload 등 service_role 경유)
- `public/` — 정적 자산 (robots.txt/sitemap.xml/llms.txt 빌드 시 덮어쓰기)
- `.claude/agents/` — 5개 subagent (venue-analyst/copy-reviewer/mobile-tester/data-validator/seo-auditor)
- `.claude/settings.json` — hooks 5종 (jq 기반 위험명령 차단)
- `~/.claude/skills/nolcool-venue-content/` — 6업종 콘텐츠 작성 SKILL

## 검증 커맨드
- 빌드+프리렌더: `npm run build` (vite + prerender-seo.mjs)
- 타입체크: `npx tsc --noEmit`
- 라이브 SEO 풀체인: `bash scripts/seo-check-hook.sh` 또는 `seo-content-auditor` subagent
- title 중복단어 검출: `grep -oE '<title>[^<]+</title>' dist/**/index.html | awk '{for(i=1;i<=NF;i++)if(seen[$i]++)print}'`
- 가격 단어 검출: `grep -rE '(만원\|입장료\|가성비\|시세\|가격대)' src/data/ src/lib/community-data.ts`
- "놀쿨" 본문 등장 (홈 외 0~2회 OK): `grep -rc '놀쿨' src/data/venues.ts`
- 라이브 페이지 헤더 검사: `curl -sI https://nolcool.com/{path}/` (200/301 확인)
- sitemap 카운트: `curl -s https://nolcool.com/sitemap.xml \| grep -c '<loc>'`
- 모바일 뷰포트 QA: `gstack` skill (390×844)

## 함정 (Pitfalls)
- **HashRouter 금지**: BrowserRouter + base "/" 만. `/#/` URL 들어오면 SEO 박살.
- **Next.js 도입 금지**: Vite SPA 유지. 프리렌더는 `prerender-seo.mjs`가 처리.
- **'놀쿨' stuffing**: 본문 3회 이상 = 페널티. 홈 title만 "놀쿨 — hook" 허용, 그 외 페이지 title에 "놀쿨" 절대 X.
- **title 중복단어**: 같은 단어 2회 이상 등장 시 즉시 삭제 (예: "장안동호빠 장안동호빠").
- **공유 콘텐츠 풀 (gold-content 공통)**: 업소마다 UNIQUE 1000+자 필수. 공유 풀 사용 = SEO 죽음.
- **가짜 전화번호**: placeholder/임의 번호 절대 X. 없으면 빈 값.
- **카카오맵 등 지도 임베드**: 노출 X (메모리 `feedback_no_map_no_price`).
- **가격 노출**: 만원/입장료/가성비/시세/가격대 단어 사이트 전체 금지.
- **외부 링크 target 누락**: 모든 외부 링크 `target="_blank" rel="noopener noreferrer"`.
- **react-helmet-async 누락**: 모든 페이지에 `useDocumentMeta` 또는 `<Helmet>` 필수. 누락 시 동적 title 안 먹음.
- **prerender 결과 미푸시**: `npm run build`만 돌리고 `dist/`만 본 채 끝내면 라이브 반영 X. push해서 Cloudflare Pages 트리거 필수.
- **Supabase 직접 SQL 실행 시도**: 사용자가 직접 마이그레이션 함 (`feedback_supabase_user_manages`). SQL 파일+방법만 제공.
- **storage.objects RLS 변경 시도**: 막혀있음. 업로드는 `functions/api/clip-upload` Pages Function 경유 (`project_clip_upload_arch`).
- **Bottom bar 겹침**: 모바일 fixed bottom 요소가 본문 마지막 줄을 가린다. `padding-bottom: env(safe-area-inset-bottom) + bar height`.
- **`ilsanroom.pages.dev` canonical**: 301로 nolcool.com 통합. canonical에 nolcool.com 박혀있어야 함.
