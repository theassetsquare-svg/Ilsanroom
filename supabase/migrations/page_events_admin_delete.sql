-- 관리자가 오염된 테스트 데이터 정리 가능하도록 DELETE 정책 추가
drop policy if exists "admin can delete events" on public.page_events;
create policy "admin can delete events"
  on public.page_events for delete
  using (
    auth.jwt() ->> 'email' in (
      'qotjsdnr123@naver.com',
      'baesunwook513@gmail.com',
      'theassetsquare@gmail.com'
    )
  );
