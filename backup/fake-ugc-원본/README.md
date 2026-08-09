# 가짜 UGC 원본 백업 (2026-08-09 · 파트2.5 정직화)

이 폴더는 커뮤니티 **가짜 회원 글·댓글·좋아요를 DB에서 전면 제거하기 전** 원본 소스를 보존한 것이다.
근거: 사이트 #1 규칙 "가짜 0" + 표시광고법(기만적 후기·활동 조작) 리스크. 원칙 = 비어 있는 정직 > 가득 찬 가짜.

## 무엇이 가짜였나
- **SQL 시드 글**: `seed_community_posts.sql`·`_v2`·`v3_alive`·`v5_older_demographics` — 전부 `user_id = NULL` 로 삽입된 창작 글/후기(예: "일산룸 신실장님 진짜 센스있음" 등 가짜 "후기").
- **자동 생성기**: `005_auto_content_system.sql` (seed_authors 50명 가상 닉네임 + seed_post_pool 200개 + seed_comment_pool) + `006a~f` 풀 확장. `scripts/auto-content-v2.mjs` 가 15분마다 이 풀에서 뽑아 가상 유저 명의로 글·댓글·좋아요를 계속 주입했다.

## 제거 방법 (되돌리기용 참고)
- 라이브 DB 삭제 = `supabase/migrations/zzz_remove_fake_ugc_2026_08_09.sql` (push 시 자동 실행).
- 삭제 전 실제 행(생성기가 만든 8월 글 포함, 이 폴더의 SQL에는 없는 것)은 **DB 내 백업 테이블** `_fake_ugc_backup_20260809_*` 로 복사 보존된다(복구 가능). 이 폴더 파일 = 원본 시드 소스(기록용).
- 생성기는 워크플로(schedule 제거) + 스크립트 하드가드 + `community-no-fake-seed-gate` 로 영구 차단.

## 가짜 vs 진짜 식별 (삭제 안전 근거)
- 진짜 회원 글 = `createPost()` 가 `user_id = 로그인 사용자.id` 로 저장. 절대 NULL 아님.
- 가짜 = `user_id IS NULL`(시드) 또는 작성자 닉네임이 `seed_authors`(가상 50인)에 속함. `user_profiles.nickname` UNIQUE 제약상 실회원은 seed 닉네임을 가질 수 없음 → 실회원 글은 절대 삭제되지 않는다.
