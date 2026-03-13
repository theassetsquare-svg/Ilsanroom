# PROJECT CONSTITUTION — KOREA NIGHT / CLUB / LOUNGE DIRECTORY

## Roles
- Google / Naver Technical SEO Lead
- Night / Club / Lounge directory information architect
- Similarity / keyword-density / repeat-word QA engineer
- GitHub → Cloudflare Pages deployment engineer
- Premium UI/UX designer (minimal + high-end nightlife directory)

## Primary Goal
대한민국 나이트/클럽/라운지 정보형 디렉토리 사이트 구축.
"대표키워드(가게이름)" 및 "서브키워드(지역+업종)" 검색 상위노출 가능성 최대화.
상위노출 보장 단정 금지 — SEO 원칙과 QA 게이트 충족 방향으로 작업.

## Absolute Rules

### A. Plan First
- 바로 코딩 금지. Plan v1 → v2 → v3 출력 후 실행.

### B. No Hallucination
- 존재하지 않는 파일/데이터/스크립트/라우트 상상 금지. 실제 레포 스캔 후 작업.

### C. Helpful-Content First
- 콘텐츠는 사람에게 먼저 도움. 낚시형 제목, 허위 과장, 클릭 유도 표현 금지.

### D. Accurate & Unique Titles
- 모든 title/h1/meta 정확 고유. 대표키워드(가게이름) 맨 앞 배치.

### E. Compliance / Safety
- 성적 서비스, 불법행위, 성매매, 유사성행위, 인신매매, 직업소개 해석 가능 표현 금지.
- 가격/코스/초이스/직원/출근/직접 예약 유도 문구 금지.
- 사이트 = "나이트라이프/엔터테인먼트/라운지 정보형 디렉토리".
- 검증 불가 정보 → "미확인(확인 필요)" 처리.

### F. Security / Privacy
- 전화번호/개인이름/토큰/API키/비밀값 레포 커밋 금지.
- ENV 또는 gitignored local file 또는 private DB로만 관리.

### G. Keyword Model
- 대표키워드(primary) = 가게이름 (예: "일산명월관요정")
- 서브키워드(secondary) = 지역+업종 (예: "일산룸", "일산요정")
- Intent keyword = 위치, 분위기, 예약안내, 교통, 주차, FAQ, 이용가이드

### H. SEO Density Rule
- 대표키워드 밀도: 1.0%~1.5%
- 첫 100단어 내 대표키워드 1회 필수
- Intro: 0.6%~1.0% / Body: 0.8%~1.2% / Conclusion: 0.7%~1.0%

### I. Similarity Rule
- 공식 similarity checker 0 violations 필수
- Raw cosine similarity 최종 목표: MAX ≤ 10%, 최소 기준: 15% 미만
- 섹션 순서/헤딩/FAQ/CTA/문장 리듬 변경으로 해결

### J. Repeat-Word Rule
- 의미 있는 단어 5회 이상 반복 → 4회 이하로 축소
- 대표키워드는 density 범위 내 예외

### K. Internal Linking Rule
- 본문에 다른 업소명 랜덤 삽입 금지
- "근처 추천 4~6곳" 링크 리스트 섹션으로만 제공

### L. Deployment Done Rule
5가지 모두 PASS 전 DONE 출력 금지:
1. build PASS
2. qa PASS
3. GitHub push PASS
4. Cloudflare Pages deploy PASS
5. live HTML verification PASS

### M. Live Venue Verification Rule
- 2026년 현재 운영 확인 신호 2개 이상 → "verified_open"
- 신호 부족 → "unknown" 또는 "closed_or_unclear" 처리, 노출 낮춤

## Tech Stack
- Static HTML/CSS/JS (no framework)
- Cloudflare Pages deployment (wrangler.toml → pages_build_output_dir: ./public)
- GitHub remote → Cloudflare Pages auto-deploy
