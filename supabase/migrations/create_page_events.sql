-- 방문자 행동 추적 — 페이지 이벤트 로그
-- 이 SQL을 Supabase Dashboard → SQL Editor에 붙여넣기 → Run
create table if not exists public.page_events (
  id bigserial primary key,
  session_id text not null,
  path text not null,
  event_type text not null,            -- view, scroll_25/50/75/100, time_10s/30s/60s/180s, exit
  dwell_ms integer,
  referrer text,
  viewport_w integer,
  viewport_h integer,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_page_events_path on public.page_events (path);
create index if not exists idx_page_events_session on public.page_events (session_id);
create index if not exists idx_page_events_type on public.page_events (event_type);
create index if not exists idx_page_events_created on public.page_events (created_at desc);

-- 누구나 INSERT 가능 (방문자 기록), SELECT는 인증된 관리자만
alter table public.page_events enable row level security;

drop policy if exists "anyone can insert events" on public.page_events;
create policy "anyone can insert events"
  on public.page_events for insert
  with check (true);

drop policy if exists "authenticated can read events" on public.page_events;
create policy "authenticated can read events"
  on public.page_events for select
  using (auth.role() = 'authenticated');
