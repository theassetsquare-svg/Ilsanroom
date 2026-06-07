# 놀쿨 (NOLCOOL) — nightlife-portal

대한민국 나이트라이프 정보 + 커뮤니티 플랫폼. 라이브: **https://nolcool.com**

> 가격/2차/무료체험/가족 단어 금지 · title 중복단어 금지 · '놀쿨'은 홈 title만 · 100% 사람 운영 컨셉(AI 냄새 0%). 자세한 규칙은 `CLAUDE.md`.

---

## 1. 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Vite 6 + React 18 + TypeScript + react-router-dom 7 (BrowserRouter, base `/`) + react-helmet-async + Tailwind 4 |
| 백엔드 | Supabase (Auth/DB/Storage) + Cloudflare Pages Functions (`functions/`) |
| 호스팅 | Cloudflare Pages — `git push origin main` 시 자동 배포 (`npm run build` 실행, 산출물 `dist/`) |
| SEO | 정적 프리렌더 `scripts/prerender-seo.mjs` (vite build 직후 실행, sitemap/llms.txt/robots 자동 생성) |
| 도메인 | nolcool.com (메인). 구 *.pages.dev 주소는 301 리다이렉트로 nolcool.com에 통합 |

★ Next.js / Vercel 아님 (도입 금지). HashRouter 금지 — BrowserRouter + base `/` 만.

---

## 2. 개발 / 빌드

```bash
npm run dev          # vite 개발 서버
npm run build        # vite build + prerender + 전체 빌드게이트 (아래 4번)
npm run build:no-audit   # 게이트 없이 빠른 빌드 (디버그용)
npx tsc --noEmit     # 타입체크
```

배포는 별도 명령 없음 — `git push origin main` 하면 Cloudflare Pages가 `npm run build`를 돌려 자동 배포. wrangler 로그인 불필요.

---

## 3. 오토파일럿 = GitHub Actions (사장님 수동 0)

놀쿨의 "자동 운영"은 **GitHub Actions 워크플로**(`.github/workflows/`)가 담당한다. 별도 서버·Cloudflare Worker·sites.json 없음. 핵심 두 갈래:

### (A) 안전 자동 수정 — 사람 개입·메일 0
코드/콘텐츠를 바꾸지 않는, 되돌릴 필요 없는 작업만 자동 실행한다.
- **sitemap 재제출** — Google/Bing ping + GSC Sitemaps.submit (`scripts/google-reindex.mjs`, KST 07:30)
- **IndexNow ping** — 변경 URL 색인 요청 (`indexnow.yml`)
- **Cloudflare 재배포** — Deploy Hook POST (`daily-build.yml`, KST 06:00 / 18:00)

콘텐츠·코드·보안은 절대 자동 수정하지 않는다(사람 판단 필요).

### (B) 감지 → 지메일 알림 → 사람 수정
라이브/서치콘솔/성능을 매일 점검하고 **문제일 때만** 메일을 보낸다.
- 발신: Resend `onboarding@resend.dev` (nolcool.com 도메인 미인증, resend.dev이 검증된 발신자)
- 수신: `theassetsquare@gmail.com` (시크릿 `NOTIFICATION_EMAIL`)
- 정책: 메일 발송 스크립트 약 117개, 대부분 "실패시만 메일" → 정상일 땐 받은편지함 노이즈 0
- 보안 일일 보고서만 예외적으로 정상/회귀 둘 다 매일 1통 (KST 09:00)

---

## 4. ★재발 방지 — 빌드게이트 (회귀가 라이브에 못 닿는다)

모든 게이트는 `npm run build`에 묶여 있고, build는 **두 곳에서 실행**된다:
1. **모든 push / PR** — `.github/workflows/audit-pr.yml`
2. **모든 배포** — Cloudflare Pages

→ 게이트를 깨는 변경은 푸시도 배포도 불가. 이게 재발 방지의 본체다.

| 게이트 | 차단 대상 | 단독 실행 |
|--------|-----------|-----------|
| `nolcool-readability-gate.mjs` | 가독성 미달 (vite 전) | `audit:readability` |
| `nolcool-dist-audit.mjs` | 금지어·가짜별점·가짜긴급/품절·JSON-LD 중복·렌더아티팩트 | `audit:dist` |
| `nolcool-cross-dup-audit.mjs` | 페이지 간 콘텐츠 중복 | `audit:dup` |
| `nolcool-route-sitemap-audit.mjs` | 라우트↔sitemap 불일치·고아 | `audit:routes` |
| `struct-fingerprint-audit.mjs` | venue 구조 지문(5-gram Jaccard >15%) | `audit:fingerprint` |
| `funnel-reachability-audit.mjs` | 고아·미도달·깊이>3·막다른길 | `audit:funnel` |
| `nolcool-entity-gate.mjs` | 단일 tag 색인·addressRegion 누락 | `audit:entity` |
| `prefetch-route-gate.mjs` | 내부링크 prefetch 404 | `audit:prefetch` |
| `og-asset-gate.mjs` | og:image .svg·카테고리 JPG 치수≠1200²·두부/빈카드 | `audit:og` |

추가로 `scripts/nolcool-guard.mjs`(Edit/Write 훅)가 작성 단계에서 가격어·금지어·title 중복·홈 외 '놀쿨'·3rd-party 이미지·HashRouter·Next.js import·가짜폰·외부링크 target 누락을 실시간 차단한다.

---

## 5. 사장님 지메일 워크플로 (문제 1건당 흐름)

1. **메일 도착** — 받은편지함에 `[NOLCOOL-...]` 제목으로 문제 알림 (실패시에만 옴)
2. **클로드에게 전달** — 메일 내용을 그대로 클로드에게 붙여넣기
3. **근본 수정** — 클로드가 원인 진단 → 코드 수정 → **재발 방지 게이트 추가**
4. **푸시·배포** — `git push` 하면 게이트 통과한 코드만 라이브 반영
5. **메일 삭제** — 해결됐으니 그 메일은 지워도 됨. 같은 문제는 게이트가 막아 다시 안 옴

핵심: 메일이 **안 오면 정상**. 오면 클로드에게 넘기면 끝.

---

## 6. 1회 설정 (이미 완료됨 — 참고용)

GitHub 레포 시크릿 15종이 등록되어 오토파일럿이 가동 중이다. 새로 만질 일은 없고, 키 회전이나 점검 시 참고.

| 시크릿 | 용도 |
|--------|------|
| `RESEND_API_KEY` | 지메일 알림 발송 |
| `NOTIFICATION_EMAIL` | 알림 수신 주소 (theassetsquare@gmail.com) |
| `CLOUDFLARE_BUILD_HOOK` | 재배포 트리거 |
| `GSC_*` / OAuth refresh token | 서치콘솔 sitemap 제출·색인 검사 |
| `INDEXNOW_KEY` | IndexNow ping (배포 키파일 값과 정렬 필수) |
| `CRUX_API_KEY` | Core Web Vitals 실사용자 데이터 |
| 그 외 점검용 키 | 라이브 감사·성능 모니터 |

배포용 1회 작업은 `git push` 권한뿐. wrangler login·KV·Worker 배포는 불필요(오토파일럿이 Worker가 아니라 GitHub Actions이기 때문).

---

## 7. 정직한 한계 (자동화가 못 하는 것)

- **실제 체류시간·전환율** — Google Analytics/GSC 실데이터 영역. 코드로 만들지 않음(가짜 카운터 금지).
- **콘텐츠 작성** — 100% 사람. 자동화는 인프라(감지·알림·게이트)만 담당.
- **Google 색인 여부** — sitemap 제출·IndexNow까지가 우리 몫. 색인 결정은 Google.
- **보안·코드 수정** — 절대 자동 적용 안 함. 메일로 알리고 사람이 판단.

---

## 8. 더 보기

- `CLAUDE.md` — 작업 절대 규칙 (title/금지어/SEO/함정 전체)
- `package.json` scripts — `audit:*` 개별 게이트 실행 명령
- `.github/workflows/` — 전체 자동화 워크플로
- `scripts/` — 프리렌더·게이트·감사·알림 스크립트