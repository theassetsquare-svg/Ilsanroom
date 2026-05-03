-- page_events 컬럼 확장 — 유입채널/UTM/디바이스/유저ID/메타 추적
-- 자동 마이그레이션: git push 시 실행

alter table public.page_events
  add column if not exists user_id uuid,
  add column if not exists source_type text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists device_type text,
  add column if not exists meta jsonb;

create index if not exists idx_page_events_source on public.page_events (source_type);
create index if not exists idx_page_events_device on public.page_events (device_type);
create index if not exists idx_page_events_user on public.page_events (user_id);
create index if not exists idx_page_events_utm_campaign on public.page_events (utm_campaign);
