-- 자동 마이그레이션 시스템 테스트
-- 이 파일이 GitHub Actions로 자동 적용되면 시스템 정상 작동.
-- 효과: _migration_check 테이블 1행 생성 (별 의미 없는 표식).

CREATE TABLE IF NOT EXISTS public._migration_check (
  id serial primary key,
  marker text,
  created_at timestamptz default now()
);

INSERT INTO public._migration_check (marker)
VALUES ('auto-migration-2026-05-03')
ON CONFLICT DO NOTHING;
