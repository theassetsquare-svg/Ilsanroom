# 놀쿨 보안 — 대표님 대시보드 체크리스트

코드로 자동화 불가능한 항목만 모았습니다. 각 항목은 콘솔에서 1회 클릭으로 끝납니다.
(코드로 끝난 항목: RLS·보안헤더·XSS정화·크롤러허용 — 전부 빌드게이트로 자동 잠금 완료)

## 1. Cloudflare (dash.cloudflare.com → nolcool.com)
- [ ] **SSL/TLS → Overview → Full (strict)** 로 설정. (Flexible/Full이면 중간자 위험)
- [ ] **Security → Bots → Verified Bots = Allow.** ★검색·AI 크롤러(Googlebot/GPTBot/ClaudeBot 등) 절대 차단 금지. "Block AI bots" 토글 켜지 말 것 — 놀쿨은 AI 검색 유입이 핵심.
- [ ] **Security → WAF → Managed Rules = ON** (Cloudflare Managed Ruleset). 단 챌린지(CAPTCHA/JS) 규칙이 공개 페이지·크롤러에 걸리지 않게 "Log" 우선 관찰.
- [ ] **Security → Settings → Security Level = Medium** 이하. High면 정상 방문자/크롤러에 챌린지 뜸.
- [ ] (선택) **Rate Limiting**: `/api/*` Pages Function 경로만 분당 제한. 공개 HTML 경로엔 걸지 말 것.

## 2. Supabase (supabase.com/dashboard → 프로젝트)
- [ ] **Authentication → Providers → Email → Confirm email = ON** (이메일 인증 강제).
- [ ] **Authentication → Policies → Leaked Password Protection = ON** (HaveIBeenPwned 대조).
- [ ] **Authentication → Rate Limits**: 기본값 유지(가입/로그인/OTP 시도 제한). 0으로 풀지 말 것.
- [ ] **MCP/분석용 서비스계정(SA)은 읽기전용 뷰어 유지.** GA4·보안 감사 SA에 편집 권한 상시 부여 금지(작업 시에만 잠깐 올렸다 복귀 — `docs/ga4-admin-checklist.md` 절차).
- [ ] **Project Settings → API → service_role 키 절대 외부 공유/프론트 노출 금지.** (현재 클라는 publishable 키만 사용 — 코드 검증 완료)

## 3. CSP script-src 강제 전환 (운영자 판단)
- 현재 CSP는 `frame-ancestors/base-uri/object-src`만 **강제**, `script-src`는 **Report-Only(관찰)** 상태.
- 위반은 이제 **자동 누적**됩니다: Report-Only가 `report-to`/`report-uri`로 `/api/csp-report`(Pages Function)에 위반을 POST → `csp_reports` 테이블에 유니크 위반(디렉티브+호스트+경로)만 1행씩 저장(쿼리스트링·PII 미저장, service_role 기록 / 관리자만 조회).
- 절차: ① 며칠 방문 누적 → ② Supabase에서 `select * from csp_reports order by last_seen desc` 확인 → ③ **0행(또는 의도된 도메인만)** 이면 → ④ `public/_headers`의 `Content-Security-Policy-Report-Only`를 `Content-Security-Policy`로 승격(`report-to`/`report-uri`는 유지).
- ★위반이 남아있는데 강제하면 인라인 스크립트(GA4·픽셀)가 막혀 사이트가 깨집니다. 반드시 `csp_reports` 비어있음 확인 후에만.

## 자동화로 이미 잠긴 항목 (참고)
- Supabase RLS 회귀 — `security-audit-nightly.yml` 매일 KST 03:00 (RLS off·정책없음·always-true 베이스라인 비교, 회귀 시 메일).
- 보안 헤더 누락/약화 — `scripts/security-headers-gate.mjs` 빌드 게이트(누락·script-src 강제 시 빌드 중단).
- XSS — 사용자/매거진 리치 HTML은 `src/lib/sanitize-html.ts`(DOMPurify)로 렌더 전 정화.
