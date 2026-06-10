-- 2026-06-10: notify_on_comment() PUBLIC EXECUTE 회수 — 보안 회귀 +1 해소.
--
-- 배경: 20260609_notify_on_comment.sql 이 CREATE OR REPLACE FUNCTION 으로 만든
--   notify_on_comment() 는 plpgsql 기본 규칙상 PUBLIC 에 EXECUTE 가 자동 부여된다.
--   이 함수는 SECURITY DEFINER 라서, 야간 보안 감사(security-audit-nightly.mjs)의
--   secdef_public 지표가 baseline 1(is_admin 만) → 2 로 올라 매일 🛑 회귀 메일이 왔다.
--
-- 핵심: notify_on_comment() 는 *트리거 함수*다. 트리거는 테이블 소유자 권한으로 발화하므로
--   PUBLIC 에게 직접 EXECUTE 권한이 전혀 필요 없다(직접 호출은 트리거 컨텍스트 NEW 부재로
--   무의미). 따라서 PUBLIC EXECUTE 회수는 트리거 동작에 영향 0 이고, 불필요한 공격면만 제거한다.
--   → secdef_public 가 baseline 1 로 복귀 = 야간 감사 영구 통과(재발 차단).
--
-- 멱등: REVOKE 는 권한이 이미 없어도 에러 없이 통과. CREATE FUNCTION 이 아니므로
--   auto_secure_function_trigger(ddl_command_end on CREATE FUNCTION) 재귀와 무관 → 우회 불필요.
-- 순서: 파일명 알파벳 정렬상 20260609 (생성) 다음 20260610 (회수) 가 실행되어,
--   신규 DB 재구축 시에도 생성 직후 회수가 보장된다.

REVOKE EXECUTE ON FUNCTION public.notify_on_comment() FROM PUBLIC;
