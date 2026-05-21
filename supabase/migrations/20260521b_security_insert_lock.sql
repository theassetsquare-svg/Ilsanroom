-- ============================================================
-- 2026-05-21 보안 v2 — INSERT 정책 잠금 (Phase 2)
-- ============================================================
-- 1차 (20260521_security_fix.sql) 후속:
--   - 위험한 DELETE/UPDATE 잠금 완료, 민감 SELECT 잠금 완료
--   - 이번 작업: INSERT with_check=true 를 owner-only 로 잠금
--
-- 의도적 익명 INSERT 유지 (사이트 깨짐 방지):
--   - page_events: 익명 분석 추적 (visitor-tracker.ts)
--   - leads:       익명 리드폼 (growth-engine.ts)
--   - waitlist:    익명 대기열
--   - referrals:   referrer_id = auth.uid() 으로 잠금 (본인 추천만)
-- ============================================================

-- ───── community content INSERT 잠금 (12건) ─────

DROP POLICY IF EXISTS "insert_comments" ON public.comments;
CREATE POLICY "insert_comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_posts" ON public.posts;
CREATE POLICY "insert_posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_reviews" ON public.reviews;
CREATE POLICY "insert_reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_reactions" ON public.reactions;
CREATE POLICY "insert_reactions" ON public.reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_votes" ON public.votes;
CREATE POLICY "insert_votes" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "review_comments_insert" ON public.review_comments;
CREATE POLICY "review_comments_insert" ON public.review_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "upvotes_insert" ON public.review_upvotes;
CREATE POLICY "upvotes_insert" ON public.review_upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lounge_posts_insert" ON public.lounge_posts;
CREATE POLICY "lounge_posts_insert" ON public.lounge_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lounge_comments_insert" ON public.lounge_comments;
CREATE POLICY "lounge_comments_insert" ON public.lounge_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ───── user-owned data INSERT 잠금 (4건) ─────

DROP POLICY IF EXISTS "insert_favorites" ON public.favorites;
CREATE POLICY "insert_favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_quiz" ON public.quiz_results;
CREATE POLICY "insert_quiz" ON public.quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "venue_votes_insert" ON public.venue_votes;
CREATE POLICY "venue_votes_insert" ON public.venue_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- notifications INSERT: 본인 알림(self) OR service_role(시스템 알림 발송)
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- ───── referrals: referrer_id 본인 잠금 ─────
-- (스키마 확인: id, referrer_id 만 존재. referee_id 없음)
DROP POLICY IF EXISTS "insert_referrals" ON public.referrals;
CREATE POLICY "insert_referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- ───── 의도적 유지 (변경 없음) ─────
-- page_events INSERT anyone — visitor-tracker.ts (익명 분석)
-- leads INSERT anyone       — growth-engine.ts (익명 리드폼)
-- waitlist INSERT anyone    — 익명 대기열
