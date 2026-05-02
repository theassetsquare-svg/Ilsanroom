-- 업소 투표 테이블 (랭킹 페이지 실시간 투표)
create table if not exists venue_votes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  nickname text not null,
  category text not null check (category in ('club','night','lounge','room','yojeong','hoppa')),
  venue_name text not null,
  reason text not null check (char_length(reason) <= 200),
  created_at timestamptz default now() not null
);

-- 인덱스
create index idx_venue_votes_created on venue_votes(created_at desc);
create index idx_venue_votes_venue on venue_votes(venue_name);
create index idx_venue_votes_category on venue_votes(category);

-- RLS
alter table venue_votes enable row level security;

-- 누구나 읽기
create policy "venue_votes_select" on venue_votes for select using (true);

-- 누구나 쓰기 (비회원도 가능)
create policy "venue_votes_insert" on venue_votes for insert with check (true);

-- 본인 삭제만
create policy "venue_votes_delete" on venue_votes for delete using (auth.uid() = user_id);
