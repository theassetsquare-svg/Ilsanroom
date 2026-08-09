# 놀쿨 무인 운영 헬스보드 (자동 생성 2026-08-09)

> 전체 자동화 명부. 읽기 전용 생성물. 95% 미만 성공률 = 기존 경보(workflow-failure-monitor·daily-regression-digest)로 커버, 신규 채널 없음.

## 요약
- 워크플로 총 **165개** (스케줄 144 · 수동 20 · 기타 1)
- DB 트리거 **17개**
- 성공률 산출: ⚠️ GITHUB_TOKEN 없음 — CI 실행 시 산출

## 스케줄 워크플로 (144)

| 워크플로 | 파일 | 주기 | 최근 성공률 |
|---|---|---|---|
| Activity Alert (15min) | `activity-alert.yml` | 매시 */15분 간격/반복 | ⚠️ CI에서 GH API로 산출 |
| All Pages Quality Watch (5축 — anchor 200/img alt/H1/lang+viewport/canonical) | `all-pages-quality-watch.yml` | 매일 KST 6:25 | ⚠️ CI에서 GH API로 산출 |
| All Pages SEO Monitor (sitemap 전수 9지표 풀체크) | `all-pages-seo-monitor.yml` | 매일 KST 6:15 | ⚠️ CI에서 GH API로 산출 |
| All Venues SEO Watch (121업소 9지표 24h) | `all-venues-seo-watch.yml` | 매일 KST 7:15 | ⚠️ CI에서 GH API로 산출 |
| Ansanhitnight Keyword Watch (안산히트나이트 2 키워드 24h) | `ansanhitnight-keyword-watch.yml` | 매일 KST 9:00 | ⚠️ CI에서 GH API로 산출 |
| Daily Supabase Backup | `backup.yml` | 매일 KST 3:00 | ⚠️ CI에서 GH API로 산출 |
| Monthly Billing Report | `billing-monthly.yml` | 매월 1일 KST 8:00 | ⚠️ CI에서 GH API로 산출 |
| Bottom Page Diagnostics (체류 짧은 페이지 진단) | `bottom-page-diagnostics.yml` | 매일 KST 6:45 | ⚠️ CI에서 GH API로 산출 |
| Browser Audit (PC + Mobile) | `browser-audit.yml` | 매일 KST 10:00 · 매일 KST 4:00 | ⚠️ CI에서 GH API로 산출 |
| Bucheonmeritnight Keyword Watch (부천메리트나이트 2 키워드 24h) | `bucheonmeritnight-keyword-watch.yml` | 매일 KST 8:20 | ⚠️ CI에서 GH API로 산출 |
| Bundangpongpongnight Keyword Watch (분당퐁퐁나이트 2 키워드 24h) | `bundangpongpongnight-keyword-watch.yml` | 매일 KST 8:25 | ⚠️ CI에서 GH API로 산출 |
| Busanasiadnight Keyword Watch (부산아시아드나이트 2 키워드 24h) | `busanasiadnight-keyword-watch.yml` | 매일 KST 8:10 | ⚠️ CI에서 GH API로 산출 |
| Busanhoppa Aura Keyword Watch (부산호빠+해운대호빠 2 키워드 24h) | `busanhoppa-aura-keyword-watch.yml` | 매일 KST 11:05 | ⚠️ CI에서 GH API로 산출 |
| Busanhoppa Menz Keyword Watch (부산호빠+해운대호빠 2 키워드 24h) | `busanhoppa-menz-keyword-watch.yml` | 매일 KST 10:40 | ⚠️ CI에서 GH API로 산출 |
| Busanhoppa Star Keyword Watch (부산호빠+해운대호빠 2 키워드 24h) | `busanhoppa-star-keyword-watch.yml` | 매일 KST 11:00 | ⚠️ CI에서 GH API로 산출 |
| Busanmulnight Keyword Watch (부산물나이트 2 키워드 24h) | `busanmulnight-keyword-watch.yml` | 매일 KST 8:05 | ⚠️ CI에서 GH API로 산출 |
| Busanyeonsandongmulnight Keyword Watch (부산연산동물나이트 2 키워드 24h) | `busanyeonsandongmulnight-keyword-watch.yml` | 매일 KST 8:15 | ⚠️ CI에서 GH API로 산출 |
| Categories SEO Watch (6 카테고리 24h 통합) | `categories-seo-watch.yml` | 매일 KST 7:10 | ⚠️ CI에서 GH API로 산출 |
| Changwon Lululalala Keyword Watch (창원룰루랄라나이트 + 창원나이트 2 키워드 24h) | `changwon-lululalala-keyword-watch.yml` | 매일 KST 9:40 | ⚠️ CI에서 GH API로 산출 |
| Cheonan Korea Keyword Watch (천안코리아나이트 + 천안나이트 2 키워드 24h) | `cheonankorea-keyword-watch.yml` | 매일 KST 9:50 | ⚠️ CI에서 GH API로 산출 |
| Cheonan Stardom Keyword Watch (천안스타돔나이트 + 천안나이트 2 키워드 24h) | `cheonanstardom-keyword-watch.yml` | 매일 KST 9:45 | ⚠️ CI에서 GH API로 산출 |
| Cheongdamclub Arju Keyword Watch (강남클럽·청담클럽 2 키워드 24h) | `cheongdamclub-arju-keyword-watch.yml` | 매일 KST 12:45 | ⚠️ CI에서 GH API로 산출 |
| Cheongdamh2o Keyword Watch (청담H2O나이트 2 키워드 24h) | `cheongdamh2o-keyword-watch.yml` | 매일 KST 7:20 | ⚠️ CI에서 GH API로 산출 |
| Cheongju Supermoon Keyword Watch (청주클럽 단일 키워드 24h) | `cheongju-supermoon-keyword-watch.yml` | 매일 KST 13:35 | ⚠️ CI에서 GH API로 산출 |
| Clarity Daily Watch (매일 21:00 KST — 측정·판정만, 코드수정·메일은 21:20 루틴) | `clarity-daily-watch.yml` | 매일 KST 21:00 | ⚠️ CI에서 GH API로 산출 |
| Clubs Keyword Watch (/clubs 클럽 단일 키워드 24h) | `clubs-keyword-watch.yml` | 매일 KST 12:10 | ⚠️ CI에서 GH API로 산출 |
| Scheduled Cron Jobs | `cron-jobs.yml` | 매일 KST 6:00 · 매일 KST 12:00 · 매일 KST 18:00 · 매일 KST 1:00 · 매주 토요일 KST 0:00 | ⚠️ CI에서 GH API로 산출 |
| CrUX Daily (실사용자 Core Web Vitals) | `crux-daily.yml` | 매일 KST 5:00 | ⚠️ CI에서 GH API로 산출 |
| Daeguhoppa Perfect Keyword Watch (대구호빠+동성로호빠 2 키워드 24h) | `daeguhoppa-perfect-keyword-watch.yml` | 매일 KST 10:30 | ⚠️ CI에서 GH API로 산출 |
| Daegutotoganight Keyword Watch (대구토토가나이트 2 키워드 24h) | `daegutotoganight-keyword-watch.yml` | 매일 KST 7:35 | ⚠️ CI에서 GH API로 산출 |
| Daejeonhoppa Eclipse Keyword Watch (대전호빠+충청호빠 2 키워드 24h) | `daejeonhoppa-eclipse-keyword-watch.yml` | 매일 KST 10:35 | ⚠️ CI에서 GH API로 산출 |
| Daejeononenight Keyword Watch (대전원나이트 SEO + 정책 24h) | `daejeononenight-keyword-watch.yml` | 매일 KST 7:50 | ⚠️ CI에서 GH API로 산출 |
| Daejeonsevennight Keyword Watch (대전세븐나이트 2 키워드 24h) | `daejeonsevennight-keyword-watch.yml` | 매일 KST 7:40 | ⚠️ CI에서 GH API로 산출 |
| 24h Auto Build + SEO Notify | `daily-build.yml` | 매일 KST 6:00 · 매일 KST 18:00 | ⚠️ CI에서 GH API로 산출 |
| Daily Regression Digest (KST 09:00) | `daily-regression-digest.yml` | 매일 KST 9:00 | ⚠️ CI에서 GH API로 산출 |
| Dapsimnidontellmamanight Keyword Watch (답십리돈텔마마나이트 2 키워드 24h) | `dapsimnidontellmamanight-keyword-watch.yml` | 매일 KST 9:25 | ⚠️ CI에서 GH API로 산출 |
| Deep Audit (Daily Link + Freshness) | `deep-audit.yml` | 매일 KST 9:30 | ⚠️ CI에서 GH API로 산출 |
| GSC Demand Gap (weekly) | `demand-gap.yml` | 매주 일요일 KST 3:00 | ⚠️ CI에서 GH API로 산출 |
| Doksangukbingwannight Keyword Watch (독산동국빈관나이트 2 키워드 24h) | `doksangukbingwannight-keyword-watch.yml` | 매일 KST 8:00 | ⚠️ CI에서 GH API로 산출 |
| Dwell Content Audit (체류 10분 보장 본문 분량) | `dwell-content-audit.yml` | 매일 KST 7:40 | ⚠️ CI에서 GH API로 산출 |
| Dwell Time Monitor (체류시간 24h 자동 리포트) | `dwell-time-monitor.yml` | 매일 KST 6:30 | ⚠️ CI에서 GH API로 산출 |
| GA4 Demand Insight (weekly) | `ga-demand.yml` | 매주 월요일 KST 11:00 | ⚠️ CI에서 GH API로 산출 |
| GA4 Health Audit (daily) | `ga-health.yml` | 매일 KST 8:00 | ⚠️ CI에서 GH API로 산출 |
| GA4 Optimizer (daily) | `ga-optimizer.yml` | 매일 KST 9:10 | ⚠️ CI에서 GH API로 산출 |
| GA4 Key-Event Autowatch (read-only) | `ga4-keyevent-autowatch.yml` | 매일 KST 8:25 | ⚠️ CI에서 GH API로 산출 |
| Gangnam Hoppa Again Keyword Watch (강남호빠+서울호빠 2 키워드 24h) | `gangnam-hoppa-again-keyword-watch.yml` | 매일 KST 10:15 | ⚠️ CI에서 GH API로 산출 |
| Gangnam Hoppa Flirting Keyword Watch (강남호빠+서울호빠 2 키워드 24h) | `gangnam-hoppa-flirting-keyword-watch.yml` | 매일 KST 10:20 | ⚠️ CI에서 GH API로 산출 |
| Gangnamclub Arte Keyword Watch (강남클럽·청담클럽 2 키워드 24h) | `gangnamclub-arte-keyword-watch.yml` | 매일 KST 12:40 | ⚠️ CI에서 GH API로 산출 |
| Gangnamclub Bamnbam Keyword Watch (강남클럽·청담클럽 2 키워드 24h) | `gangnamclub-bamnbam-keyword-watch.yml` | 매일 KST 12:30 | ⚠️ CI에서 GH API로 산출 |
| Gangnamclub Face Keyword Watch (강남클럽·청담클럽 2 키워드 24h) | `gangnamclub-face-keyword-watch.yml` | 매일 KST 12:55 | ⚠️ CI에서 GH API로 산출 |
| Gangnamclub Jack Keyword Watch (강남클럽·청담클럽 2 키워드 24h) | `gangnamclub-jack-keyword-watch.yml` | 매일 KST 13:05 | ⚠️ CI에서 GH API로 산출 |
| Gangnamclub Laputa Keyword Watch (강남클럽·청담클럽 2 키워드 24h) | `gangnamclub-laputa-keyword-watch.yml` | 매일 KST 12:15 | ⚠️ CI에서 GH API로 산출 |
| Gangnamclub Miro Keyword Watch (강남클럽·청담클럽 2 키워드 24h) | `gangnamclub-miro-keyword-watch.yml` | 매일 KST 12:25 | ⚠️ CI에서 GH API로 산출 |
| Gangnamclub Peak Keyword Watch (강남클럽·청담클럽 2 키워드 24h) | `gangnamclub-peak-keyword-watch.yml` | 매일 KST 13:00 | ⚠️ CI에서 GH API로 산출 |
| Gangnamclub Race Keyword Watch (강남클럽·청담클럽 2 키워드 24h) | `gangnamclub-race-keyword-watch.yml` | 매일 KST 12:20 | ⚠️ CI에서 GH API로 산출 |
| Gangnamclub Sound Keyword Watch (강남클럽·청담클럽 2 키워드 24h) | `gangnamclub-sound-keyword-watch.yml` | 매일 KST 12:35 | ⚠️ CI에서 GH API로 산출 |
| Gangnamclub Utopia Keyword Watch (강남클럽·청담클럽 2 키워드 24h) | `gangnamclub-utopia-keyword-watch.yml` | 매일 KST 12:50 | ⚠️ CI에서 GH API로 산출 |
| Gangnam Hoppa Royal Keyword Watch (강남호빠+서울호빠 2 키워드 24h) | `gangnamhoppa-royal-keyword-watch.yml` | 매일 KST 10:10 | ⚠️ CI에서 GH API로 산출 |
| Gangnamjuliananight Keyword Watch (강남줄리아나나이트 2 키워드 24h) | `gangnamjuliananight-keyword-watch.yml` | 매일 KST 7:45 | ⚠️ CI에서 GH API로 산출 |
| Geondaehoppa W Keyword Watch (건대호빠+서울호빠 2 키워드 24h) | `geondaehoppa-w-keyword-watch.yml` | 매일 KST 10:25 | ⚠️ CI에서 GH API로 산출 |
| Gildongchancenight Keyword Watch (길동찬스나이트 2 키워드 24h) | `gildongchancenight-keyword-watch.yml` | 매일 KST 7:25 | ⚠️ CI에서 GH API로 산출 |
| Google Index Coverage (전수 색인 점검) | `google-index-coverage.yml` | 매주 월요일 KST 9:00 | ⚠️ CI에서 GH API로 산출 |
| Google Issue Monitor (서치콘솔 문제 자동 감지·해결) | `google-issue-monitor.yml` | 매일 KST 8:30 | ⚠️ CI에서 GH API로 산출 |
| Google Re-Index (Sitemap + Inspect) | `google-reindex.yml` | 매일 KST 7:30 | ⚠️ CI에서 GH API로 산출 |
| Gwangjusangmunight Keyword Watch (광주상무나이트 2 키워드 24h) | `gwangjusangmunight-keyword-watch.yml` | 매일 KST 9:15 | ⚠️ CI에서 GH API로 산출 |
| Gwangjutotonight Keyword Watch (광주토토밤나이트 2 키워드 24h) | `gwangjutotonight-keyword-watch.yml` | 매일 KST 9:20 | ⚠️ CI에서 GH API로 산출 |
| Haeundaegoguryeo SEO Watch (해운대고구려 단일 페이지 24h) | `haeundaegoguryeo-seo-watch.yml` | 매일 KST 7:00 | ⚠️ CI에서 GH API로 산출 |
| Haeundae Hoppa Kkantappiya Keyword Watch (해운대호빠+부산호빠 2 키워드 24h) | `haeundaehoppa-kkantappiya-keyword-watch.yml` | 매일 KST 10:05 | ⚠️ CI에서 GH API로 산출 |
| Haeundaehoppa Michelin Keyword Watch (해운대호빠 2 키워드 24h) | `haeundaehoppa-michelin-keyword-watch.yml` | 매일 KST 11:35 | ⚠️ CI에서 GH API로 산출 |
| Haeundaehoppa Velvet Keyword Watch (해운대호빠 벨벳 2 키워드 24h) | `haeundaehoppa-velvet-keyword-watch.yml` | 매일 KST 11:40 | ⚠️ CI에서 GH API로 산출 |
| Home Nolcool Keyword Watch (홈 놀쿨 단일 키워드 24h) | `home-nolcool-keyword-watch.yml` | 매일 KST 14:00 | ⚠️ CI에서 GH API로 산출 |
| Hongdae Hoppa Keyword Watch (홍대호빠 단일 키워드 24h) | `hongdae-hoppa-keyword-watch.yml` | 매일 KST 11:45 | ⚠️ CI에서 GH API로 산출 |
| Hongdae Bermuda Keyword Watch (홍대클럽 단일 키워드 24h) | `hongdaeclub-bermuda-keyword-watch.yml` | 매일 KST 13:50 | ⚠️ CI에서 GH API로 산출 |
| Hongdae Dokkaebi Keyword Watch (홍대클럽 단일 키워드 24h) | `hongdaeclub-dokkaebi-keyword-watch.yml` | 매일 KST 13:40 | ⚠️ CI에서 GH API로 산출 |
| Hongdae Maid Keyword Watch (홍대클럽 단일 키워드 24h) | `hongdaeclub-maid-keyword-watch.yml` | 매일 KST 13:45 | ⚠️ CI에서 GH API로 산출 |
| Hongdae Pacific Keyword Watch (홍대클럽 단일 키워드 24h) | `hongdaeclub-pacific-keyword-watch.yml` | 매일 KST 13:55 | ⚠️ CI에서 GH API로 산출 |
| Hoppa Keyword Watch (/hoppa 호빠 단일 키워드 상위노출 24h) | `hoppa-keyword-watch.yml` | 매일 KST 10:00 | ⚠️ CI에서 GH API로 산출 |
| Ilsanmyeongwolgwanyojeong Keyword Watch (일산명월관·일산요정 2 키워드 24h) | `ilsanmyeongwolgwanyojeong-keyword-watch.yml` | 매일 KST 11:55 | ⚠️ CI에서 GH API로 산출 |
| Ilsanshampoonight Keyword Watch (일산샴푸나이트 2 키워드 24h) | `ilsanshampoonight-keyword-watch.yml` | 매일 KST 9:30 | ⚠️ CI에서 GH API로 산출 |
| Incheonarabiannight Keyword Watch (인천아라비안나이트 2 키워드 24h) | `incheonarabiannight-keyword-watch.yml` | 매일 KST 7:55 | ⚠️ CI에서 GH API로 산출 |
| Indeokvon-gukbingwan-night Keyword Watch (인덕원국빈관나이트 2 키워드 24h) | `indeokvon-gukbingwan-night-keyword-watch.yml` | 매일 KST 9:25 | ⚠️ CI에서 GH API로 산출 |
| IndexNow Auto Submit | `indexnow.yml` | 매일 KST 7:00 | ⚠️ CI에서 GH API로 산출 |
| Itaewon Savage Keyword Watch (이태원클럽 단일 키워드 24h) | `itaewon-savage-keyword-watch.yml` | 매일 KST 13:20 | ⚠️ CI에서 GH API로 산출 |
| Itaewonclub Maid Keyword Watch (이태원클럽 단일 키워드 24h) | `itaewonclub-maid-keyword-watch.yml` | 매일 KST 13:15 | ⚠️ CI에서 GH API로 산출 |
| Itaewonclub Prism Keyword Watch (이태원클럽 단일 키워드 24h) | `itaewonclub-prism-keyword-watch.yml` | 매일 KST 13:30 | ⚠️ CI에서 GH API로 산출 |
| Itaewonclub Utopia Keyword Watch (이태원클럽 단일 키워드 24h) | `itaewonclub-utopia-keyword-watch.yml` | 매일 KST 13:25 | ⚠️ CI에서 GH API로 산출 |
| Jangandong Hoppa Flex Keyword Watch (장안동호빠 단일 키워드 24h) | `jangandong-hoppa-flex-keyword-watch.yml` | 매일 KST 11:25 | ⚠️ CI에서 GH API로 산출 |
| Jangandonghoppa Bbangbbang Keyword Watch (장안동호빠 단일 키워드 24h) | `jangandonghoppa-bbangbbang-keyword-watch.yml` | 매일 KST 11:20 | ⚠️ CI에서 GH API로 산출 |
| Jejunight Keyword Watch (제주나이트 + 제주도나이트 2 키워드 24h) | `jejunight-keyword-watch.yml` | 매일 KST 9:35 | ⚠️ CI에서 GH API로 산출 |
| Jeonju Hoppa Gallery Keyword Watch (전주호빠 단일 키워드 24h) | `jeonju-hoppa-gallery-keyword-watch.yml` | 매일 KST 11:30 | ⚠️ CI에서 GH API로 산출 |
| JSON-LD Semantic Watch (Schema.org 의미 유효성) | `jsonld-semantic-watch.yml` | 매일 KST 6:30 | ⚠️ CI에서 GH API로 산출 |
| Keyword SEO Monitor Watchdog | `keyword-monitor-watchdog.yml` | 매일 KST 6:30 | ⚠️ CI에서 GH API로 산출 |
| Keyword SEO Monitor (일산명월관 / 일산요정) | `keyword-seo-monitor.yml` | 매일 KST 6:00 | ⚠️ CI에서 GH API로 산출 |
| Keyword Stuffing PC+Mobile Watch (전 페이지 양 디바이스 24h) | `keyword-stuffing-pc-mobile-watch.yml` | 매일 KST 6:20 | ⚠️ CI에서 GH API로 산출 |
| Lighthouse Daily (PC + Mobile) | `lighthouse-daily.yml` | 매일 KST 4:00 | ⚠️ CI에서 GH API로 산출 |
| Live Site Audit (Daily) | `live-audit.yml` | 매일 KST 9:00 | ⚠️ CI에서 GH API로 산출 |
| Daily Magazine + Widgets | `magazine-daily.yml` | 매일 KST 12:00 · 매일 KST 22:00 · 매일 KST 2:00 | ⚠️ CI에서 GH API로 산출 |
| 24h Site Monitoring | `monitoring.yml` | 매시 */15분 간격/반복 | ⚠️ CI에서 GH API로 산출 |
| Monthly Full Audit (매달 30일 GA4+GSC+Clarity 200축 전수점검·자동해결·해결보고) | `monthly-full-audit.yml` | 매월 29일 KST 7:00 | ⚠️ CI에서 GH API로 산출 |
| Nightly Full Audit | `nightly-full-audit.yml` | 매일 KST 3:30 | ⚠️ CI에서 GH API로 산출 |
| Nights SEO Watch (/nights 카테고리 24h) | `nights-seo-watch.yml` | 매일 KST 7:05 | ⚠️ CI에서 GH API로 산출 |
| Northstar 3-Metric Audit (daily) | `northstar-audit.yml` | 매일 KST 8:20 | ⚠️ CI에서 GH API로 산출 |
| Nowoncheongchunpocha Keyword Watch (노원청춘포차 단일 키워드 24h) | `nowoncheongchunpocha-keyword-watch.yml` | 매일 KST 13:10 | ⚠️ CI에서 GH API로 산출 |
| Nowonhobaknight Keyword Watch (노원호박나이트 2 키워드 24h) | `nowonhobaknight-keyword-watch.yml` | 매일 KST 7:30 | ⚠️ CI에서 GH API로 산출 |
| Ops Weekly Question | `ops-weekly-question.yml` | 매주 목요일 KST 11:00 | ⚠️ CI에서 GH API로 산출 |
| Paju Yadang Skydome Keyword Watch (파주야당스카이돔나이트 + 파주나이트 2 키워드 24h) | `pajuyadangskydome-keyword-watch.yml` | 매일 KST 9:55 | ⚠️ CI에서 GH API로 산출 |
| Popularity Recompute (인기 점수 주간 재계산) | `popularity-recompute.yml` | 매주 일요일 KST 5:20 | ⚠️ CI에서 GH API로 산출 |
| prefetch-404-watch | `prefetch-404-watch.yml` | 매일 KST 6:55 | ⚠️ CI에서 GH API로 산출 |
| Rank Drop Responder (순위 하락 자동 대응) | `rank-drop-responder.yml` | 매주 월요일 KST 9:45 | ⚠️ CI에서 GH API로 산출 |
| Region Cross Title Watch (지역×업종 교차 후킹 title 24h) | `region-cross-title-watch.yml` | 매일 KST 9:05 | ⚠️ CI에서 GH API로 산출 |
| Sangbonghangukgwannight Keyword Watch (상봉동한국관나이트 2 키워드 24h) | `sangbonghangukgwannight-keyword-watch.yml` | 매일 KST 8:30 | ⚠️ CI에서 GH API로 산출 |
| GSC Growth Opportunity (weekly) | `sc-opportunity.yml` | 매주 월요일 KST 11:30 | ⚠️ CI에서 GH API로 산출 |
| Search Console Cannibalization (카니발리제이션 진단) | `search-console-cannibalization.yml` | 매일 KST 9:10 | ⚠️ CI에서 GH API로 산출 |
| Search Console Report (키워드/클릭) | `search-console-report.yml` | 매주 월요일 KST 9:00 | ⚠️ CI에서 GH API로 산출 |
| Security Audit Hourly | `security-audit-hourly.yml` | 매시 0분 간격/반복 | ⚠️ CI에서 GH API로 산출 |
| Security Audit Nightly | `security-audit-nightly.yml` | 매일 KST 3:00 | ⚠️ CI에서 GH API로 산출 |
| Security Daily Report | `security-daily-report.yml` | 매일 KST 9:00 | ⚠️ CI에서 GH API로 산출 |
| Seed Content Quality Gate (weekly) | `seed-content-quality-gate.yml` | 매주 월요일 KST 11:45 | ⚠️ CI에서 GH API로 산출 |
| SEO Deep Audit Watch (전수 7축 24h) | `seo-deep-audit-watch.yml` | 매일 KST 12:00 | ⚠️ CI에서 GH API로 산출 |
| SEO Regression Watch (title dup + 하단 overlap + 중복 박스 24h) | `seo-regression-watch.yml` | 매일 KST 7:15 | ⚠️ CI에서 GH API로 산출 |
| SEO Weakness Diagnosis (daily) | `seo-weakness-diagnosis.yml` | 매일 KST 9:40 | ⚠️ CI에서 GH API로 산출 |
| Seongnamshampoonight Keyword Watch (성남샴푸나이트 2 키워드 24h) | `seongnamshampoonight-keyword-watch.yml` | 매일 KST 8:35 | ⚠️ CI에서 GH API로 산출 |
| SERP Loop (검색어 상위노출 주간 루프) | `serp-loop.yml` | 매주 월요일 KST 10:45 | ⚠️ CI에서 GH API로 산출 |
| SERP T1 Recheck (노출0 색인의심 주간 재확인) | `serp-t1-recheck.yml` | 매주 월요일 KST 10:15 | ⚠️ CI에서 GH API로 산출 |
| Sinlimgrandprixnight Keyword Watch (신림그랑프리나이트 2 키워드 24h) | `sinlimgrandprixnight-keyword-watch.yml` | 매일 KST 8:55 | ⚠️ CI에서 GH API로 산출 |
| Struct Fingerprint Watch (구조 지문 라이브 감시) | `struct-fingerprint-watch.yml` | 매일 KST 7:45 | ⚠️ CI에서 GH API로 산출 |
| Sunday Deep Audit (Sitemap Fullcheck) | `sunday-deep-audit.yml` | 매주 토요일 KST 3:00 | ⚠️ CI에서 GH API로 산출 |
| supabase-401-watch | `supabase-401-watch.yml` | 매일 KST 6:50 | ⚠️ CI에서 GH API로 산출 |
| Suwonchancenight Keyword Watch (수원찬스돔나이트 2 키워드 24h) | `suwonchancenight-keyword-watch.yml` | 매일 KST 8:40 | ⚠️ CI에서 GH API로 산출 |
| Suwonhoppa Aura Keyword Watch (수원호빠 단일 키워드 24h) | `suwonhoppa-aura-keyword-watch.yml` | 매일 KST 11:15 | ⚠️ CI에서 GH API로 산출 |
| Suwonhoppa Beast Keyword Watch (수원호빠 단일 키워드 24h) | `suwonhoppa-beast-keyword-watch.yml` | 매일 KST 11:10 | ⚠️ CI에서 GH API로 산출 |
| Suwonkoreanight Keyword Watch (수원코리아나이트 2 키워드 24h) | `suwonkoreanight-keyword-watch.yml` | 매일 KST 8:45 | ⚠️ CI에서 GH API로 산출 |
| Suyushampoonight Keyword Watch (수유샴푸나이트 2 키워드 24h) | `suyushampoonight-keyword-watch.yml` | 매일 KST 8:50 | ⚠️ CI에서 GH API로 산출 |
| Title Uniqueness Audit (사이트 전체 후미 + HOOK 분포) | `title-uniqueness-audit.yml` | 매일 KST 7:35 | ⚠️ CI에서 GH API로 산출 |
| Uijeongbuhangukgwannight Keyword Watch (의정부한국관나이트 2 키워드 24h) | `uijeongbuhangukgwannight-keyword-watch.yml` | 매일 KST 9:20 | ⚠️ CI에서 GH API로 산출 |
| Ulsanchampionnight Keyword Watch (울산챔피언나이트 2 키워드 24h) | `ulsanchampionnight-keyword-watch.yml` | 매일 KST 9:15 | ⚠️ CI에서 GH API로 산출 |
| Ulsannewworldnight Keyword Watch (울산뉴월드나이트 2 키워드 24h) | `ulsannewworldnight-keyword-watch.yml` | 매일 KST 9:10 | ⚠️ CI에서 GH API로 산출 |
| Venue List UI Watch (카테고리 부동산급 UI 24h) | `venue-list-ui-watch.yml` | 매일 KST 14:05 | ⚠️ CI에서 GH API로 산출 |
| Venue Name SEO Monitor (121업소 가게이름 풀체크) | `venue-name-seo-monitor.yml` | 매일 KST 6:00 | ⚠️ CI에서 GH API로 산출 |
| Venue Rank Trend (가게이름 순위 추이 주간) | `venue-rank-trend.yml` | 매주 월요일 KST 9:30 | ⚠️ CI에서 GH API로 산출 |
| Venue Reports Daily | `venue-reports-daily.yml` | 매일 KST 9:30 · 매시 15분 간격/반복 | ⚠️ CI에서 GH API로 산출 |
| Workflow Failure Monitor (24h 집계 메일) | `workflow-failure-monitor.yml` | 매일 KST 9:00 | ⚠️ CI에서 GH API로 산출 |
| Yeongdeungpoterminalnight Keyword Watch (영등포터미널나이트 2 키워드 24h) | `yeongdeungpoterminalnight-keyword-watch.yml` | 매일 KST 9:05 | ⚠️ CI에서 GH API로 산출 |
| Yojeong Keyword Watch (요정 단일 키워드 24h) | `yojeong-keyword-watch.yml` | 매일 KST 11:50 | ⚠️ CI에서 GH API로 산출 |

## 수동/dispatch 워크플로 (20)

- `auto-content-v2.yml` — Auto Content v2 (DISABLED — 가짜 UGC 금지)
- `auto-content.yml` — Auto Content Generator (legacy - disabled)
- `clarity-smoke.yml` — Clarity Smoke (dispatch 전용 — 토큰·놀쿨 분리 1콜 확인, 메일 0)
- `fill-places.yml` — Fill venue Places (address/hours/station)
- `ga-discover.yml` — GA Discover (oneshot)
- `ga-enable.yml` — GA Data API enable (one-shot)
- `ga4-admin-apply.yml` — GA4 Admin Apply (manual, write)
- `ga4-admin-state.yml` — GA4 Admin Config Audit (read-only)
- `ga4-em-scroll-off.yml` — GA4 Enhanced Measurement Scroll OFF (write — needs SA editor)
- `ga4-gsc-full-dump.yml` — GA4+GSC Full Dump (read-only)
- `ga4-metadata-check.yml` — GA4 Metadata Check (read-only)
- `ga4-page-report.yml` — GA4 Page Report (read-only)
- `ga4-unassigned-probe.yml` — GA4 Unassigned Probe (read-only)
- `gate-bypass-audit.yml` — Gate Bypass Audit (양방향 우회검증)
- `migrate.yml` — Auto SQL Migrations
- `monthly-growth-report.yml` — Monthly Growth Cycle Report (manual)
- `send-admin-checklist.yml` — Send GA4 Admin Checklist (manual)
- `serp-zero-analysis.yml` — SERP Zero Analysis (노출0 가게이름 원인분석 — 온디맨드)
- `venue-rank-check.yml` — Venue Rank Check (지정 가게이름 GSC 실순위 즉석조회)
- `verify-places.yml` — Verify venue Places (read-only, no write)

## DB 트리거 (17)

- `trg_venues_updated_at` (full_venues_setup.sql)
- `venues_updated_at` (001_initial_schema.sql)
- `users_updated_at` (001_initial_schema.sql)
- `posts_updated_at` (001_initial_schema.sql)
- `trg_auto_hide` (004_week4_moderation.sql)
- `trg_page_events_block_admin` (page_events_block_admin.sql)
- `trg_update_reporter_trust` (20260523_venue_reports_antiabuse.sql)
- `trg_notify_on_comment` (20260609_notify_on_comment.sql)
- `trg_auto_moderate_posts` (20260726_member_warning_system.sql)
- `trg_auto_moderate_comments` (20260726_member_warning_system.sql)
- `trg_auto_moderate_reviews` (20260726_member_warning_system.sql)
- `zz_trg_detect_banned_rejoin` (20260726_member_warning_system.sql)
- `trg_magazine_updated_at` (admin_phase2_magazine.sql)
- `trg_seo_overrides_updated` (admin_phase4_seo_overrides.sql)
- `trg_page_blocks_updated` (admin_phase5_page_blocks.sql)
- `on_auth_user_created` (fix_users_and_fkeys.sql)
- `trg_notify_first_post` (zzz_part4_member_magnet_2026_08_09.sql)

## 이번 시리즈(파트1~4.5)로 사람 손이 빠진 항목

- ✅ 순위 판정 — popularity-engine 실측 자동(파트4)
- ✅ 방문자 기여(후기·투표·질문 판) 공급 — 기여 엔진 5종 + 운영팀 주간질문 자동(파트4.5)
- ✅ 북극성 7지표 추적·사다리·주간요약 — 계기판 자동(파트5)
- ✅ "한국 1위" 판정·중간 마일스톤 알림 — 상수+교차발화 자동(파트5)

## 여전히 사람이 필요한 지점 (잔여)

| 항목 | 사유 |
|---|---|
| 광고주 콘텐츠 본문 입력 | venue 상세 본문은 100% 고유·실데이터라야 함 — SSR desc는 자동, 본문 창작은 사람(광고주/운영) |
| 월간 대시보드 최종 판정(9/1 등) | 자동은 측정·처방 재료까지. GA4/GSC 수치의 사업적 판정은 사장님 몫 |
| 첫 글·첫 댓글 답글 | trg_notify_first_post → ops_alerts 큐. 사람 냄새 유지 위해 답글은 사람(운영팀)만 — 기계 사칭 금지 |
| GCP/GA4 콘솔 1회 권한 | serviceusage.enable 등 콘솔 권한은 코드 불가 — 사장님 1회 조치 |
| 광고주 예외 관리 | 가격 노출 예외(대전원나이트 등) 등 개별 광고주 정책은 사람 판단 |
