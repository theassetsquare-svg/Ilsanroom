-- 서버측 방어막: 관리자 user_id가 박힌 이벤트는 INSERT 자체를 무효화
-- 클라이언트 우회/JS 비활성 봇 등 모든 케이스 차단
create or replace function public.page_events_block_admin()
returns trigger
language plpgsql
security definer
as $$
declare
  admin_email text;
begin
  if new.user_id is not null then
    select email into admin_email
    from auth.users
    where id = new.user_id
    limit 1;
    if admin_email in (
      'qotjsdnr123@naver.com',
      'baesunwook513@gmail.com',
      'theassetsquare@gmail.com'
    ) then
      return null; -- INSERT 무시
    end if;
  end if;
  -- 봇 UA 차단 (서버측 한 번 더)
  if new.user_agent ~* '(bot|crawl|spider|slurp|googlebot|yeti|gptbot|claude|chatgpt|perplexity|headlesschrome|phantomjs|puppeteer|playwright|lighthouse|pagespeed)' then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_page_events_block_admin on public.page_events;
create trigger trg_page_events_block_admin
  before insert on public.page_events
  for each row
  execute function public.page_events_block_admin();
