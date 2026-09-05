# NOLCOOL — Nightlife (NOT kids/leisure)

## 🌟🌟🌟 북극성 3대 지표 (#0 — 사장님이 다시 말 안 해도 영구 자동추적) 🌟🌟🌟
**사장님이 가장 중요하다고 못박은 3가지. 이 문서에 박았으므로 다시 설명할 필요 없음. 모든 작업은 이 3개를 끌어올리는 방향으로.**
1. **클릭률(CTR)** — 검색결과에서 놀쿨을 눌러 들어오게. 출처 = Google Search Console.
2. **끝까지 읽기 + 체류 10분 이상** — 글을 끝까지(scroll 100%) 읽고 세션 누적 체류 ≥600초. 출처 = `page_events`(scroll_100 / exit dwell_ms).
3. **이탈률 → 0%를 향해** — 한 페이지만 보고 나가지 않게. 출처 = GA4 bounceRate(진짜 방문자만).

**⚠️ 정직 불변식 (어기면 사이트 사망):** 이탈률 **literal 0% / 참여율 100% / 모든페이지 10분**은 물리적으로 불가능하고, **합성(가짜 이벤트 주입)하면 Google이 활동조작으로 탐지 → 영구 페널티**. 그래서 "가짜로 0% 만들기" 절대 금지. 유일한 화이트햇 = 봇·감사·미리보기 오염을 GA에서 빼고(이미 적용), **진짜 방문자가 자연스럽게 안 떠나도록 콘텐츠·동선·재미로** 0%를 향해 끌어내림. 자동화는 측정·알림만, 수치 조작 X.

**자동화:** `scripts/northstar-audit.mjs`(읽기전용, 사이트 크롤 0 = 피해 0) 매일 KST 08:20, 3대 지표를 한 통에 모아 **목표 미달시만** 메일(개선되면 자동 침묵=자기수렴). 보조: ga-health-audit(이탈/참여 08:00) · dwell-time-monitor(체류 06:30) · search-console-* (CTR).

## 📧 놀쿨 지메일 관리 (#0 — 이 터미널 담당·★불가침 3중 자물쇠) 📧
**theassetsquare@gmail.com 의 놀쿨 자동경보 메일 관리는 이 터미널 담당. 아래 3중 자물쇠는 위반 시 작업 전체 무효.**
1. **처리 대상 = 제목이 "[놀쿨"로 시작하는 메일만.** 다른 메일은 읽기·분류 대상에서 제외.
2. **noreply@theassetsquare.com 발신(더에셋스퀘어)은 읽기·수정·삭제 절대 금지.** 검색 결과에 잡혀도 무조건 건너뛴다.
3. **삭제 = 휴지통(TRASH) 이동만.** 영구삭제 금지 — 30일 복구 가능 상태 유지.

**운영 원칙:** ①이번 수정으로 해결된 경보·과거 중복분 = 휴지통 ②미해결 경보의 최신 1통 = 보존 ③북극성 등 자기수렴형 = 최신 1통만 보존 ④실행 전 삭제 예정 목록 먼저 출력 ⑤주 1회 자동 루틴 = `scripts/gmail-nolcool-cleaner.mjs`(읽기+휴지통 이동만 — 발송·라벨변경·영구삭제 불가).

## 🎼 월간 무인 지휘자 (#0 — 매월 30일 자동, 사람 없이 점검·수정·보고) 🎼
**`scripts/monthly-conductor.mjs` + `.github/workflows/monthly-conductor.yml`(매월 30일·2월 28일 KST 10:50 = UTC `50 1 30 * *`/`50 1 28 2 *`).** monthly-full-audit(30일 07:00) 이후 슬롯에서 그 산출을 소비. 6단계: ①46계열 수집(축적 재사용, Clarity 10/day 한도) ②지메일 판독(3중 자물쇠 청소기 — ⚠️대화형 Claude+MCP 전용, CI는 `--gmail` 파일 있을 때만·없으면 이월) ③12대 문제 진단 ④안전 자동수정(화이트리스트만·월 최대 20·게이트 통과분만 push, **게이트 실패=배포 없음**) ⑤가설 사이클 → `data/growth/YYYY-MM.json` ⑥[놀쿨] 월간 보고 1통(resend·중복방지 플래그·초보자 문체).
- **자동수정 화이트리스트(이것만):** title/desc · 내부링크 · 직답 블록 · 깨진 링크/이미지 소수정 · 색인 조치 · 순위/계기판 데이터 · CTR 스니펫. 그 외(레이아웃·기능신설·콘텐츠 대량생성·결제/인증/보안·회원데이터)=수정 금지, "처방 필요"로 보고만. **회원 흉내 자동 글 영구 금지(가짜 0).**
- **★매달 1일 수동 v3(`send-monthly-growth-report.mjs`/`monthly-growth-report.yml`) 폐지** — 지휘자 STEP5·STEP6이 대체. 수동 워크플로는 비상 폴백으로만 남김(정기 실행 안 함).

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
7. **신규 venue/title 변경 시** — 푸시 전 `node scripts/title-uniqueness-audit.mjs` 통과 필수. 구조 지문은 `npm run build`가 끝에 `struct-fingerprint-audit.mjs` 자동 실행(카테고리별 전수 쌍 5-gram Jaccard, FAIL>15%면 빌드 중단) — 신규 venue 닮음 자동 차단
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
- 빌드+프리렌더: `npm run build` (vite + prerender-seo.mjs + dist/dup/route/구조지문 감사)
- 구조 지문 단독: `npm run audit:fingerprint` (카테고리별 전수 쌍 5-gram Jaccard, FAIL>15%/WARN>10%)
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

## 플랫폼 트랙 P — 설계도 14장 반영 (naver-watch/docs/AUTOPILOT_SPEC.md, 2026-09-06 대표님 지시 · nolcool.com 에 적용, 기존 규칙 유지)
> 원문은 naver-watch 설계도 14장. 이 저장소에서 작업하는 모든 세션은 아래를 최상위 규칙과 같은 무게로 지킨다. 특히 14-10(주소 불변)·14-4(노출 대상: 구글 + AI, 네이버 수집요청·순위 추적 없음).

14-1. **적용 범위**: 두 플랫폼의 모든 페이지(가게·가이드·커뮤니티·분양·카테고리·허브 등 공개 페이지 전부). 위성 20개와 같은 "서로 다름 5차원"(본문·겹침·문장표현·구조 지문·틀 글자) 각 ≤10%(틀 글자 30%, 시각 지문 50%)를 **플랫폼 안 페이지끼리 + 위성 20개 페이지와도** 적용한다(같은 가게이름 페이지가 nolcool.com 과 위성에 함께 있으므로 한 우주로 계산).
14-2. **레이아웃 규칙(브랜드 사이트용)**: 페이지마다 본문 레이아웃은 고유(변형 엔진: 섹션 순서·구성 요소 형태·글꼴 조합·색 변형·여백·장식·버튼·FAQ 형태), 클래스 토큰·CSS 페이지별. **브랜드 식별 요소(로고·상단 메뉴·푸터 법정표기·색 팔레트)는 공통 허용**이며 구조 지문 계산에서 제외 — 사이트 전체의 신뢰·사용성을 지키기 위한 판단(대표님이 "헤더·푸터까지 전부 다르게"라고 하면 그렇게 바꾼다).
14-3. **플랫폼 고유 규칙 유지**: theassetsquare — 모든 숫자에 출처(data.go.kr·한국부동산원·청약홈 등)·추측 숫자 금지·"무료/체험" 단어 금지·전화 1666-6838 은 푸터 1곳만·tel: 링크 금지·100점 규칙·Gmail 은 매월 30일 1통(즉시 메일은 사이트 다운·해킹·결제·서면 상담만)·API/토큰 재설치 요청 금지·Actions 월 600분 이하. nolcool — 가짜 0·자동 게시는 검사 통과 후·월간 지휘자(매월 30일)·소원 엔진·Actions 월 1,200분 이하. 무거운 전수 작업은 GitHub Actions 가 아니라 **이 PC 의 클로드코드 예약 실행**으로 돈다.
14-4. **노출 대상은 사이트별로 다르다(대표님 확정)**: **nolcool.com = 구글 + AI**(네이버 수집요청·순위 추적은 하지 않음, robots 는 모든 로봇 허용 유지), **theassetsquare.com = 네이버 + 구글 + AI**. 공통 조건: 페이지 유형별 구조화 데이터(nolcool: NightClub/LocalBusiness·Article·FAQPage·BreadcrumbList; theassetsquare: RealEstateListing·Offer·Article·FAQPage·Organization·BreadcrumbList — 전부 verified·출처 값만, 평점 조작 0) / 고유 title·description·H1 / 대표 이미지(nolcool 가게 페이지 = 위성과 같은 글자 카드 표준, theassetsquare = 권리 확인된 실사진 또는 출처 데이터로 만든 정보 카드) / OG·Twitter / 내부 링크·허브·브레드크럼 / 모바일·Core Web Vitals(LCP·CLS·INP) / sitemap·RSS·IndexNow(네이버·Bing)·robots(공식 확인 AI 봇)·llms.txt / 등록·제출 — nolcool: 구글 서치콘솔(사이트맵·커버리지·성과 API) + Bing 웹마스터(IndexNow, AI 답변엔진의 색인 기반) / theassetsquare: 서치어드바이저(사이트맵·RSS·수집요청 50건·최적화 검증) + 서치콘솔 + Bing — 전부 세션·공식 API 로 Claude 가 수행. **로봇 설정은 두 사이트 모두 전부 허용**: robots.txt 에 Googlebot·Google-Extended·bingbot·Yeti·공식 확인된 AI 봇(GPTBot·OAI-SearchBot·ChatGPT-User·ClaudeBot·Claude-SearchBot·Claude-User·PerplexityBot·Perplexity-User) Allow, 차단 규칙 0(관리 경로 제외), Cloudflare/호스팅의 봇 차단·AI 차단 해제(공식 방법으로 확인·기록) / E-E-A-T(작성 주체·출처·확인일·정정 창구) / 신선도(lastmod·갱신 주기). 보장 불가(순위·AI 답변 포함)는 조건 완비+측정+자가 개선으로.
14-5. **법·정책 준수(신고 방어를 두 플랫폼에도)**: 매일 방어 스캔 대상에 포함(10사유×40항목, 검토관 2회). theassetsquare 는 표시광고법·부동산 광고 표시 규정(공정위 지침·관련 법령 원문 확인)·숫자 출처를 검사 항목에 추가, nolcool 은 19세·광고 표시·개인정보 규칙 그대로.
14-6. **측정·보고**: nolcool — 구글 색인(서치콘솔 커버리지 API)·구글 평균 순위(서치콘솔 성과 API, 가게이름 질의)·Bing 색인·AI 노출 표본(llms.txt 수신·AI 봇 수집 로그); theassetsquare — 네이버 색인(site: 1차/2차 3형식·서치어드바이저 리포트)·네이버 순위(단지명 12곳 순환)·구글 커버리지·평균 순위·Bing. 공통: 5차원 최대값·CWV·신고 위험. 구글 순위는 자동 검색 스크래핑 대신 서치콘솔 공식 API 값만 쓴다. nolcool 은 월간 지휘자 보고에, theassetsquare 는 매월 30일 메일에 합쳐 넣는다(즉시 메일은 규칙대로 사고만).
14-7. **스케줄**: 주 1회 일요일 00:05+랜덤 150분(로컬 클로드코드, 작업명 PLATFORM-Uniqueness-Exposure) — 5차원 전수·재작업(구조 묶음, 글 사실 불변)·구조화 데이터·CWV 점검·색인 확인·요청(각 플랫폼 하루 50건)·측정. 매일 방어 스캔은 두 플랫폼 포함.
14-8. **입력 창구 확장**: `가게 추가:`(nolcool 포함) / `분양 추가: <단지명·유형>`(theassetsquare) / `사이트 추가:`.
14-9. 조사 규칙(10장) 확장: 체크리스트 8종에 ⑨ 구글 상위노출(Search Central·CWV·E-E-A-T) ⑩ 부동산 정보 페이지 노출·법규 표시 항목을 추가(각 100+, 출처 표기).
14-10. **절대 규칙 — 두 플랫폼 주소 불변**: nolcool.com·theassetsquare.com 의 어떤 페이지도 주소 변경·삭제·리디렉션·slug 재작성을 하지 않는다(위성의 '미색인 즉시 주소변경' 규칙은 플랫폼에 적용 금지). 미색인·중복·품질 문제는 같은 주소에서 내용·구조·내부 링크·사이트맵·재요청으로만 해결하고, 404 는 같은 주소로 복구한다. 기존 기능이 주소를 옮기는 방식(예: 분양 종료 → /closed/ 이동)이면 앞으로는 같은 주소에서 상태 표시로 전환하고 새 이동은 중단한다(이미 옮겨진 것은 그대로). 이 규칙을 어기는 코드·게이트·자동 게시는 배포 불가.
> 우선순위 메모(기존 규칙 유지): 1-0(세션·권한으로 할 수 있는 건 Claude 가)·1-2(결정 요청 금지)·11장 금지 목록·13장 배포 규칙은 트랙 P 에도 그대로. 놀쿨 루트 「브리핑만」 규칙은 이 14장의 범위(5차원·노출 조건·광고주 등록·주소 불변)만큼 확장되고, 그 밖의 콘텐츠 복사·위성↔놀쿨 링크는 여전히 금지. 저장소: nolcool.com = `D:/naver-watch/repos/Ilsanroom`(Vite+React, prerender) · theassetsquare.com = `D:/naver-watch/repos/man`(Next 16 static export, Cloudflare 프로젝트 theassetsquare).
