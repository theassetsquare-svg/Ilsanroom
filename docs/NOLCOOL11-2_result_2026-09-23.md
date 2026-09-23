# [놀쿨11-2] 466쪽 후킹 제목(고유·사실) · 완독 뼈대 · 5차원(틀까지) 엔진 — 로컬 결과 2026-09-23

- 세션: 놀쿨11-2(4411ac5c) · 사용 모델: Fable 5.1 · 지시서 `docs/prompts/queue/놀쿨11-2-후킹제목-완독-5차원-엔진.md`
- 작업 자리: **worktree `D:\naver-watch\wt-nolcool`(브랜치 `nol11-2` · origin/main 38be1ef 기준)** — 작업본 `repos/Ilsanroom`(다른 세션 미커밋 16파일)은 손대지 않았다. **로컬 빌드·게이트까지만 · 배포 0 · 푸시 0 · 주소 변경 0(사이트맵 466 = 466 · 빠짐 0 · 추가 0) · 네이버 0 · claude -p 0회 · API 키 0.**
- 빌드 17회(실패 원인은 모두 게이트가 잡아 준 것: 중복 단어 64 → 퍼널 54 → 밀도 4 → 창고 소진 → 스터핑 13/5/1/1 → FAQ 127 → 가격어 1 → 0). 최종 `npm run build` = 기존 게이트 40개 + 새 `page-gate` 통과(EXIT 0).
- 원본: 빌드 로그 `scratchpad/nol11/build1~17.log` · 게이트 보고 `page-gate.json` · 5차원 `measure/latest.json` · 검증표 `nc11-2-verify-*.json` · 전/후 숫자 `after-numbers.json`.

## 1. 고친 것 (파일:줄) — 새 엔진 0, 있는 자리에 규칙

| 파일 | 무엇 |
|---|---|
| `data/title-bank.json`(새) | 제목 창고 — 유형 4(near·region·tag·new) × **머리 6 × 꼬리 32~34**(조합 192+) · H1 틀 13유형 · 슬롯은 장부 사실만({place}{region}{tag}{cat}{n}{cats}{top}) |
| `scripts/lib/title-bank.mjs`(새) | **소원 엔진의 제목 자리 하나** — `makeTitle`(씨앗 순서 · 동일 0 · 3-gram 유사 0.8↑ 0 · 후킹 부분 같은 꼬리 3쪽까지 · 중복 단어 = dist 감사 잣대 · analyzeHook 통과) · `registerFixed`(명시 제목 등록만 · noindex 는 충돌 셈 제외) · `makeH1`(제목과 다른 문구) · `auditTitles`(게이트·검증이 같은 함수) |
| `scripts/prerender-seo.mjs` | 63줄 import · 476줄 `POP_RANK`(popularity-scores ranked 만)·`hubSkel`·`venueSkel` · `writePage` 344~377줄(제목 등록 → H1 → 뼈대 → **FAQPage LD = 화면 문답 동기화** 126쪽) · `renderPage` 267~300줄(숨김 SSR 제거 · `#root`=hero+nav · `#nc-ssr`=main+footer 보이게 · 첫 그림 `fetchpriority=high`+치수 · `window.__NC_META`) · 허브 4곳 `makeTitle` 호출(near 2495 · region 2308 · tag 2423 · new 2265) · `skel:` 12곳 · 빌드 끝 `dist/nc-pages.json` |
| `scripts/skeleton/index.mjs`(새) | 완독 뼈대 엔진 6유형 — ① 직답 → ② 사실/표(가게 8칸 · 목록/허브 가게별 한 줄 요약+인기 순위(진짜 값만)) → ③ 본문 소제목 → ④ FAQ → ⑤ 한 줄 정리 → ⑥ 다음에 볼 곳(`data-nc-next="slot"` 자리 + 허브 링크) · 글 불변 · 껍데기 제외 · 키워드 밀도 3% 안(허브 키·가게 이름 되풀이 0) |
| `scripts/uniq-variant.mjs` | `parseHtml/serializeHtml` export · `reorder` 가 `data-skel` answer·facts 머리 / faq·summary·next 꼬리 고정, body 만 섞음(뼈대 순서 보존) |
| `scripts/page-gate.mjs`(새) | 쪽 게이트 하나 — 막음 16항목(T1~T5·H1·H2·D1·S1~S3·L1·L2·A1·W1·N1) · 품질 3항목(Q1 40자·Q2 글자 하한·Q3 H2) · 순수 `gatePage()` · `npm run audit:page-gate` · 빌드 체인 끝 · 우회 레지스트리 등록 |
| `src/components/seo/SsrArticle.tsx`(새) · `src/layouts/MainLayout.tsx` · `src/index.css` | React 가 마운트 뒤 `#nc-ssr` 본문을 끌어안고 `#nc-ssr` 을 지운다(main id 1개) · SPA 이동은 프리렌더 HTML 을 받아 같은 본문 · **제목·설명도 프리렌더 값으로** |
| `src/hooks/useDocumentMeta.ts` | React 의 옛 틀 제목이 프리렌더(창고) 제목을 덮어쓰지 않게 `__NC_META`/캐시 우선 — 제목 자리 하나 |
| `src/components/ui/Card.tsx` | 내부 링크 `target=_blank` 기본값 → 외부 주소만(CLAUDE.md MUST · 새 창 0) — 화면 실측에서 /clubs/gangnam 11개 잡힘 |
| `package.json` · `scripts/gate-bypass-audit.mjs` | 빌드 체인에 `page-gate` · 우회 케이스 등록 |
| `scripts/verify/nc11-2-check.mjs`(새) | 3단계 검증(스테이징 237 · 디버깅 253 · 최종 229) |

소원 엔진과 합친 자리: `getHookingTitle()`(가게 126 · seo-hooks.ts 명시 제목 · CTR 실험 5건)은 **손대지 않았다** — `registerFixed` 로 등록만. 창고는 허브 4유형에만 쓴다(146쪽). 창고 수: 꼬리 34+34+34+32 = **134** · 머리 24 · H1 틀 13유형 96.

## 2. 466쪽 전 → 후 (전 = 11-1 라이브 실측 09-23 · 후 = 빌드 17 dist)

| 항목 | 전 | 후 |
|---|---|---|
| 동일 제목 | 0 | **0** |
| 유사 제목(3-gram 0.8↑) 쌍 | 25(11-1 잣대 32) | **0** |
| 후킹 부분 동일 묶음 | 26묶음 139쪽(4쪽 이상 21묶음) | 49묶음 115쪽 · **4쪽 이상 0**(같은 꼬리 3쪽까지 · 창고 규칙) |
| 후킹(저장소 잣대 analyzeHook) 실패 | 0 | **0**(466/466) |
| 후킹(11-1 우리 정규식) 축 0 | 298 | 277(허브 146쪽은 전부 통과 · 나머지는 명시 제목 그대로) |
| H1 = 제목 | 466 | **0** |
| 숨김 SSR(1px clip) | 466 | **0** — 본문이 보인다(크롤러 = 사람) |
| 첫 그림 lazy / 치수 없음 | 356 / 466 | **0 / 0**(eager+high · 1200×675) |
| 완독 뼈대 6조각(직답·표·본문·FAQ·정리·다음) | 0 | **357**(가게 126·목록 34·허브 196·매거진 59는 FAQ 없음 = 유형 규칙대로 5조각 · 커뮤니티·가이드 3~5조각) — `checkSkeleton` 466/466 통과 |
| FAQPage JSON-LD = 화면 문답 | 가게 126쪽 불일치 | **466 일치**(LD 를 화면 쪽으로 동기화 126) |
| 내부 링크 새 창 | 정적 0 · React 화면 11(카드) | **0 / 0** |
| 5차원(measure5 --extra · 위성 1,719쪽과 한 우주) | 466/466 초과(구조 지문) | **④ 구조 0**(최대 9%) · 글 갈래 ① 277 ② 262 ③ 404 ⑤ 198 → **초과 407** — 글은 이 단계 밖(claude -p ≤5 규칙) → 11-6 |
| 제목 40자 초과(품질) | 100 | 100(명시 제목 그대로 — 손대지 않음 규칙) |
| 본문 글자(nc-article 기준) 중앙 | — | 1,355 · 품질 경고 Q2(가게 1,700·목록 2,000 미만) 277쪽 |
| 사이트맵 | 466 | 466(diff 0) |

## 3. T1~T9

| # | 결과 |
|---|---|
| T1 같은 제목 쌍 3개(11-1 실측 near/모란↔수진 · region/길동↔수유 · 건대↔구리) → 재생성 → 유사<0.8·후킹·사실(「N곳」= 실제 업소 수 142/142 일치 · 명시 1쪽 해당 없음) | 3/3 통과 |
| T2 CTR 실험 제목 5건(title-experiments.json) 손대지 않음 | 5/5 통과 |
| T3 유형 6종 뼈대 순서·조각 · FAQ=LD | 6/6 통과(S3 0) |
| T4 목록 쪽 한 줄 요약 = 장부 shortDescription/features · 인기 값 = popularity-scores ranked 순위 그대로(표시 45건 전부 일치 · 침묵 구간 표시 0) | 통과 |
| T5 변형: 같은 쪽 = 같은 모양(주소 해시 씨앗 · style data-page 466) · 표본 190쌍 토큰 자카드 ≤10% 초과 0 · 5차원 ④ 0 | 통과 |
| T6 새 창 0(466 grep + 화면 16쪽) | 통과 |
| T7 page-gate 466쪽 막음 0 · exit 0(품질 경고 Q1 100 · Q2 277) | 통과 |
| T8 사이트맵 diff 0(빠짐 0 · 추가 0 · 466=466) | 통과 |
| T9 `npm run build` 성공 · HTML 중앙 17.3KB → 18.5KB(본문이 보이게 되며 +1.2KB) · JS 번들 변화 0(SsrArticle 1.6KB) | 통과 |

로컬 화면(`node serve-dist.mjs dist 4173` · 크롬): 16쪽(가게 4·목록 3·허브 5·매거진 3·홈) — 본문 끌어안기·조각 순서·main 1개·#nc-ssr 제거·다음에 볼 곳 자리·새 창 0·제목=프리렌더 전부 확인. 화면 캡처 `D:\Temp\claude-chrome-screenshots-nfEAqX\screenshot-1790173241703-0.jpg`. 모바일 390 은 크롬 최대화 창이라 resize 가 안 먹어(09-06 실측과 같음) 뷰포트 메타로 갈음.

## 4. 검증 3단계
스테이징 **237/실패 0** · 디버깅 **253/실패 0**(해당 없음 1 = 명시 제목 near/신사) · 최종 **229/실패 0**(해당 없음 34 = 유형 규칙상 없는 조각) — `Ilsanroom/scripts/verify/nc11-2-check.mjs` · 기록 `state/verify/4411ac5c….json`(23:20). 인터넷 대조는 11-1 연구 145건(FAQ 리치 결과 종료·보이지 않는 콘텐츠 마크업 금지·LCP 지연 로드 금지·제목 링크 규칙)을 그대로 따랐다.

## 5. 못 찾은 것 · 남긴 것
- **5차원 글 갈래 407쪽**(①②③⑤)은 그대로 — 이 단계는 claude -p 5쪽 이하라 글 재작성을 안 했다. ⑤ 틀 글자는 NC0(137)보다 **198** 로 늘었다: 뼈대의 정리 문장·표 머리글 같은 짧은 틀 줄이 세어진 것 — 11-6 에서 `uniq-prose` 루프로 잇는다.
- 명시 제목 100쪽이 40자 초과(품질) · 본문 하한 미달 277쪽(품질) — 막음 아님, 회차마다 줄인다.
- React 목록·허브 쪽의 화면 H1(예: 「강남 클럽」)은 React 컴포넌트 값이고 정적 H1 과 다르다(둘 다 제목과 다름 = 규칙 충족). 통일은 11-4(React 쪽) 몫.
- `npx tsc --noEmit` 오류 2건(RoomsPage·YojeongPage `regions` 누락)은 origin/main 그대로인 기존 것(제 변경 0 · vite 빌드는 통과).
- 크롬 창 resize(모바일 390) 실행 불가.

다음 단계: 놀쿨11-3
