-- ============================================================
-- 보안 근본 수리 (2026-08-17) — SECURITY DEFINER + PUBLIC EXECUTE 2건 회수
--
-- 일회용 진단(zz-oneshot-secdef-diag, run 32054545309)으로 전수 특정:
--   1) notify_first_post()        — 2026-08-09 zzz_part4_member_magnet 생성.
--      용도: posts INSERT 트리거 → 실회원 통산 1번째 글일 때 ops_alerts 큐 적재.
--   2) fn_update_reporter_trust() — 2026-05-23 venue_reports_antiabuse 생성.
--      용도: venue_reports.status 변경 트리거 → reporter_trust 점수 갱신.
--
-- 둘 다 "트리거 전용" 함수 — 트리거 발화는 호출자 EXECUTE 권한을 검사하지
-- 않으므로(권한 검사는 CREATE TRIGGER 시점, 소유자 postgres) PUBLIC/anon/
-- authenticated EXECUTE는 불필요 권한. 회수해도 첫 글 알림·신고 신뢰점수
-- 트리거는 그대로 동작한다.
--
-- SECURITY DEFINER 유지 사유(문서화): 두 함수 모두 RLS로 잠긴 테이블
-- (ops_alerts / reporter_trust)에 시스템 기록을 남겨야 하므로 INVOKER 전환
-- 불가. search_path는 두 함수 모두 이미 고정돼 있음(감사 지표 0 유지).
--
-- 기대 결과: secdef_public 2 → 0 (기준선 1보다 낮음 = 회귀 아님).
-- 기준선도 0으로 강화(scripts/security-audit-nightly.mjs 동시 갱신).
-- ============================================================

-- 커스텀 이벤트 트리거 우회 (reference_exec_sql_event_trigger_gotcha):
-- exec_sql 단일 트랜잭션 — 중간 실패 시 DISABLE까지 통째 롤백 = 무해.
ALTER EVENT TRIGGER auto_rls_trigger DISABLE;
ALTER EVENT TRIGGER auto_secure_function_trigger DISABLE;

REVOKE ALL ON FUNCTION public.notify_first_post() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_update_reporter_trust() FROM PUBLIC, anon, authenticated;

ALTER EVENT TRIGGER auto_rls_trigger ENABLE;
ALTER EVENT TRIGGER auto_secure_function_trigger ENABLE;
