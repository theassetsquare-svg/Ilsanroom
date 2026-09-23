# [놀쿨11-3] 구글·AI 노출 엔진 — 결과 (2026-09-24 · 로컬 · 배포 0)

모델: Fable 5.1 (claude-fable-5-1) · 세션 4411ac5c · 코드는 worktree `D:\naver-watch\wt-nolcool`(브랜치 nol11-2 · origin/main 38be1ef 기준) — 작업본 `repos/Ilsanroom` 손대지 않음 · 푸시 0 · 주소 변경 0 · 네이버 0.

## 판정 한 줄
**2-1·2-2·2-4·2-5 는 끝냈고 검증기·게이트 전부 통과했다. 2-3 CWV 는 「FCP·LCP 개선 + CLS 실패」다** — 정적 첫 화면을 React 가 갈아끼울 때 0.10~0.13 이 생긴다(10쪽 전부). 이것은 못 잡았다. 그래서 「자신있습니다」는 쓰지 않는다. 검증 스테이징 148/실패 0 · 디버깅 245/실패 15(전부 T4 CWV) · 최종 317/실패 0.

「AI 에서 나오게」는 **조건 완비(색인 허용 · 구조 · 인용 가능한 사실 · 봇 허용)** 를 갖춘 것이고, **결과(노출·순위)는 보장하지 않는다.**

## 1. 겹침 — 있는 것 그대로 쓴 것
| 있던 것 | 그대로 | 손댄 것 |
|---|---|---|
| robots.txt(모든 로봇 + AI 봇 40여 종 Allow · Sitemap 줄) | 그대로 | 0 |
| sitemap 466 · lastmod 해시 정직화(`scripts/.seo-lastmod.json`) | 그대로 | 0 |
| llms.txt · llms-full.txt | 절 구조 그대로 | 「전체 페이지」 절을 466 전부 「제목 + 직답 첫 문장」으로 |
| IndexNow 키 파일 `public/195f….txt` · `scripts/indexnow.mjs`(변경분만) | 그대로 | 키를 파일에서 읽기 · 창구 Bing 하나 · `--plan` |
| 가게 JSON-LD NightClub/BarOrPub 126 · FAQPage 357 · Breadcrumb 432 | 그대로 | 아래 2-1 |
| `_headers`(assets 1년 immutable · html SWR · og 30일) | 그대로 | 0 |

## 2. 고친 것 (2-1 ~ 2-5) · 규칙 출처
### 2-1 구조화 데이터 (출처: G-sd-localbusiness · Schema-NightClub · Schema-BarOrPub · G-sd-breadcrumb · G-sd-faq · G-sd-article · G-sd-policies · G-sd-review)
- 가게 126: `NightClub`(102) / `BarOrPub`(21) / `Restaurant`(2) / `EntertainmentBusiness`(2) — name·address(있는 만큼)·telephone(광고 라벨 규칙)·**openingHoursSpecification 은 장부 영업시간 글에서만 파싱(`parseOpeningHours`) · 없으면 속성 삭제** · url · image(og) + `FAQPage`(화면 dl 과 동일) + `BreadcrumbList` + **`WebPage`(speakable h1·.ssr-answer)**.
- **뺀 것(없는 사실)**: 가게 노드의 `datePublished`(슬러그 해시로 30~90일 전 = 가짜 등록일) · `dateModified`(항상 오늘) · article:published_time 메타. 검증기 실측: NightClub 에 `datePublished·dateModified·speakable` 은 「인정되지 않는 속성」 경고 3 → 날짜 삭제 · speakable 을 WebPage 노드로 옮겨 **경고 0**.
- 목록·지역 허브: `ItemList`(24) · `CollectionPage`(220) · `BreadcrumbList` — Breadcrumb 이 없던 33쪽에 자동 보강(마지막 항목 = 자기 주소).
- 홈: `WebSite`(+SearchAction · 11-4 검색창과 짝) · `Organization`. 매거진: `Article`(author·datePublished·dateModified 실제 값). 커뮤니티: `CollectionPage`(글 0 이라 DiscussionForumPosting 0).
- 가짜 평점 0: `aggregateRating·review·ratingValue·reviewCount` 466쪽 0 (게이트 J4).
- **JSON-LD 유형별 쪽 수**: BreadcrumbList 465 · FAQPage 357 · CollectionPage 220 · WebPage 177 · NightClub 102 · ItemList 24 · BarOrPub 21 · Restaurant 2 · EntertainmentBusiness 2 · Article 60 · WebSite 1 · Organization 1.

### 2-2 노출 기반 (출처: OpenAI-bots · Anthropic-bots · Perplexity-bots · Apple-bot · G-crawlers · llmstxt · G-sitemaps · IndexNow-doc · Bing-indexnow · G-canonical · G-safesearch)
- robots.txt: `User-agent: *` Allow + Googlebot·Google-Extended·Bingbot·GPTBot·OAI-SearchBot·ChatGPT-User·ClaudeBot·Claude-SearchBot·Claude-User·PerplexityBot·Perplexity-User·Applebot·CCBot·Amazonbot·Meta-ExternalAgent… 명시 Allow · Disallow 0 · Sitemap 줄 — 이미 있었다(손댐 0).
- llms.txt: 소개 + 허브 절 + **「전체 페이지」 466 = 제목 + 직답 첫 문장**(괄호 주소 %28/%29). llms-full.txt 그대로.
- sitemap 466 · lastmod 466 전부 날짜 · 오늘 이하 · 해시 정직화(바뀐 쪽만 오늘).
- IndexNow: `scripts/indexnow.mjs` — 키는 `public/<32hex>.txt` 에서(위성 방식) · 창구 **Bing 하나**(놀쿨은 구글+AI · 네이버 수집요청 0 · 규약상 참여 엔진 공유는 규약의 일) · 변경분만 · `--plan` 은 보내지 않음. prerender 의 자동 전송은 CI·`--indexnow` 일 때만(로컬 빌드 0 · 빌드 로그 대조).
- canonical 466 = 자기 절대주소 · og 3종 466 · hreflang 추가 0(기존 자기참조 ko·x-default 는 해가 없어 둠).
- **세이프서치 안전 게이트 S4**: 성적 묘사·성매매·노출 표현 25낱말(+저장소 위험어 미러) — 제목·설명·본문 466 걸림 0 · `rating=adult` 0 · 첫 그림은 og 문구 그림(alt 466).

### 2-3 CWV (출처: G-cwv · webdev-lcp · webdev-cls · webdev-inp · webdev-lazy-lcp · webdev-fetchpriority · MDN-preload · CF-cache-rules)
| 항목 | 결과 |
|---|---|
| 그림 크기 지정 | 첫 그림 width/height 466 · fetchpriority=high 466 · lazy 0 |
| 지연 로딩(첫 화면 제외) | 첫 그림 eager · 나머지는 React 카드(lazy) |
| 현대 형식 | **og jpg 를 쓰던 첫 그림 → webp 축소판 srcset(600w·1200w · sharp 로 빌드마다 `dist/og/*-w600/-w1200.webp` 774장)** · og:image 는 jpg 그대로 · 466 전부 webp |
| 글꼴 미리 연결 | 해당 없음 — 시스템 글꼴(웹폰트 0) |
| CSS 분리 | 1파일 23KB(gz) · Lighthouse unused-css 통과 → 추가 분리 이득 0 |
| 번들 분할 | vendor 4묶음 modulepreload + 경로별 chunk 164 — 이미 있었다 |
| Cloudflare 캐시 헤더 | `_headers` assets 1년 immutable · html max-age 60/s-maxage 300/SWR 600 · og 30일 — 이미 있었다 |
| PSI 공식 API | **실행 불가(429 할당량)** → Lighthouse 12 CLI(같은 엔진 · 모바일 · 시뮬레이션 4G)로 대체 |

**Lighthouse 전(라이브 nolcool.com · 11-2 이전 판) / 후(로컬 dist · gzip 서버 · Cloudflare 챌린지 스크립트 없음 — 같은 조건이 아니다)**
| 쪽 | 점수 | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|
| / | 55→70 | 2673→1866 | 9941→**2016** | 560→977 | 0.002→**0.13** |
| /nights/ilsanshampoonight/ | 56→52 | 2702→1863 | 9370→8742 | 524→735 | 0→0.103 |
| /clubs/gangnam/gangnamclub-race/ | 54→55 | 2358→1853 | 7271→8253 | 747→578 | 0→0.13 |
| /rooms/ilsan/ilsanroom/ | 56→60 | 2660→1856 | 9460→8365 | 575→440 | 0→0.116 |
| /clubs/ | 57→55 | 2944→2017 | 10882→7397 | 486→551 | 0→0.116 |
| /nights/ | 52→56 | 2489→2014 | 6310→8337 | 886→512 | 0→0.116 |
| /region/강남/ | 59→69 | 2643→1865 | 8141→4161 | 503→483 | 0→0.116 |
| /near/마두/ | 57→65 | 2599→1863 | 8642→4757 | 565→539 | 0→0.103 |
| /magazine/daejeon-night-guide/ | 49→57 | 2790→1861 | 8816→5033 | 878→795 | 0→0.116 |
| /community/ | 56→70 | 2430→1867 | 6881→4146 | 643→446 | 0→0.117 |

- FCP 10/10 개선 · LCP 7/10 개선(홈 9.9s→2.0s) · 점수 7/10 개선. **LCP 2.5s 안은 1/10** · **CLS 0.1 안은 0/10**.
- **CLS 원인(실측)**: 정적 첫 화면(#root hero: 그림@128 h210 · h1@88)을 React 가 헤더 94 + 그림@192 h290 + h1@352 로 갈아끼운다(모바일 412px · 가게 쪽). 허브 쪽은 h1 314→124 · 첫 문단 752→184. 보이는 영역 안에서 60~230px 이 움직여 0.10~0.13. 가게·목록 쪽 LCP 8s 는 React 가 다시 그리는 그림이 LCP 후보가 되기 때문(하이드레이션이 아니라 교체).
- **못 잡은 것 → 11-4 로 넘긴다(그 단계가 첫 화면·홈을 다시 짠다)**: 정적 첫 화면과 React 첫 화면을 **같은 높이·같은 순서**로(가게: 헤더 자리 94 + 그림 192/290 + h1 겹침 352 · 허브: h1 124 · 첫 문단 184). 그러면 CLS 0 · LCP = 첫 그림.
- 서드파티(GTM 340ms · Clarity 220ms 주 스레드)는 로드 지연이 측정 뜻을 바꾸므로 손대지 않았다 — 대표님 결정 사항.

### 2-4 내부 링크 (출처: G-links · G-seo-starter)
- 「다음에 볼 곳」에 허브 묶음 `nc-next-hubs`: 지역 허브 · 업종 전체 · 지역×업종 · 인기 순위 · 신규 · 역 근처 · 인기 랭킹(장부 사실에서만 · 자기 제외). 라벨에 업종어를 되풀이하지 않는다(`/lounges/` 밀도 3.04% → 2.94%).
- 링크 그래프(671쪽 · 44,976 링크): **고아 0** · 홈에서 깊이 [1, 79, 299, 87] = 3단계 안 466 · **허브 직접 링크 466/466** · 새 창 0 · 본문 내부 링크 문턱(가게 10 · 나머지 6) 466 통과 · 안내 쪽 `/guide/ilsan-yojeong` 은 사실(일산·요정·마두)로 허브 링크를 받게 함(4→9).

### 2-5 page-gate 확장 (`scripts/page-gate.mjs`)
막음 추가 10: J1 LD 파싱 · J2 유형별 필수 마크업 · J3 사실 일치(name·telephone·영업시간·주소·Breadcrumb 마지막) · J4 가짜 평점 · J5 글 0 게시판 · O1 og 3종 · S4 세이프서치 · L3 내부 링크 ≥N · L4 허브 링크. 빌드 체인 끝(41개 게이트 + page-gate) 466쪽 막음 0 · 품질 경고 Q1 100 · Q2 271 · L4 1(회차마다 줄임).

## 3. T1~T7
| # | 무엇 | 결과 |
|---|---|---|
| T1 | 유형별 JSON-LD 표본 8쪽(클럽·라운지·나이트·목록·지역·매거진·홈·커뮤니티) 파싱·속성=본문·가짜 평점 0 | **8/8 통과** |
| T2 | validator.schema.org 코드 스니펫 7쪽(구글 리치 결과 테스트는 공개 주소 필요 → 로컬 실행 불가) | **오류 0 · 경고 0 (7/7)** — 첫 시도의 경고 3·오류 2 를 고친 뒤 |
| T3 | robots·llms.txt·sitemap(466 · lastmod) · 키 파일 · indexnow --plan | 통과 |
| T4 | CWV 표본 10쪽 모바일 | **실패** — CLS 0/10 · LCP 1/10 (FCP 10/10 · LCP 7/10 개선) |
| T5 | 고아 0 · 허브 2단계 · 새 창 0 | 통과 |
| T6 | 세이프서치 466 걸림 0 | 통과 |
| T7 | 빌드(25회차) · 사이트맵 466=466 빠짐 0 추가 0 · 게이트 exit 0 | 통과 |

## 4. 검증 3단계 (`scripts/verify/nc11-3-check.mjs`)
| 단계 | 검사 | 통과 | 실패 | 실행 불가 | 해당 없음 |
|---|---|---|---|---|---|
| 스테이징 | 148 | 147 | 0 | 0 | 1(글꼴) |
| 디버깅 | 245 | 221 | **15** | 1(PSI) | 8 |
| 최종 | 317 | 313 | 0 | 1(PSI) | 3 |

실패 15 = T4 CLS 10 · LCP 후>전 2(/clubs/gangnam/gangnamclub-race/ · /nights/) · 점수 후<전 2(/nights/ilsanshampoonight/ · /clubs/) · 「후 CLS 10/10」 1. 기록 파일 `docs/nc11-3-verify-*.json` · 검증기 `docs/nc11-3-schema-validator-2026-09-24.json` · Lighthouse `docs/nc11-3-lighthouse-before/after.json`.

## 5. 대표님만 하실 수 있는 것
1. **Bing 웹마스터 등록**(계정 일): https://www.bing.com/webmasters → 사이트 추가 `https://nolcool.com` → 「Google Search Console 가져오기」 클릭(GSC 가 연결돼 있어 한 번에 됨) → 사이트맵 `https://nolcool.com/sitemap.xml` 제출. IndexNow 키는 이미 사이트 뿌리에 있다(`/195ffcff10d3481d896c1151d28e3292.txt`).
2. **PSI 공식 API 재측정**은 11-6 배포 뒤 라이브 주소로(할당량 풀린 뒤) — 지금은 로컬이라 어차피 못 잰다.
3. GTM·Clarity 로드 지연 여부(주 스레드 560ms) — 측정 의미가 바뀌는 일이라 대표님 결정.

## 6. 못 찾은 것 · 못 한 것
- **CLS 0.1 안(10쪽 0/10)** — 위 2-3. 11-4 첫 화면 재구성에서 정적=React 높이 맞춤으로 잡는다.
- PSI 공식 API 429 → Lighthouse CLI 대체(같은 엔진). 라이브 vs 로컬 조건 차이(CDN·챌린지 스크립트)는 표에 적었다.
- 구글 리치 결과 테스트(공개 주소 필요) 실행 불가 → validator.schema.org 코드 스니펫으로.

## 7. 빌드·파일
빌드 18~25(8회 · 실패 원인: 라운지 밀도 3.04% → 라벨 · 안내 쪽 링크 4<6 → 사실 부여 · `/near/마두역` 프리페치 404 → `마두`). 고친 파일: `scripts/prerender-seo.mjs` · `scripts/skeleton/index.mjs` · `scripts/page-gate.mjs` · `scripts/indexnow.mjs` · `scripts/verify/nc11-3-check.mjs`(새) · `docs/nc11-3-*.json`(새). 빌드 산출물(og webp 774장 · `public/og/*.jpg` 재생성 · `.seo-lastmod.json` · `venues-top4.ts`)은 커밋에서 뺐다.

다음 단계: 놀쿨11-4 — 단, 이 단계는 **검증실패(T4 CWV)** 로 멈춘 상태다(큐 규칙: 멈춤 사유 「검증실패」).
