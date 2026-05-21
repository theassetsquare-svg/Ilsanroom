-- ============================================================
-- 2026-05-21 Supabase Security Hardening
-- ============================================================
-- Targets advisor warnings:
--   1) Function Search Path Mutable (9 functions)
--   2) RLS Policy Always True — sensitive SELECT + dangerous UPDATE/DELETE
--   3) SECURITY DEFINER + PUBLIC EXECUTE (9 functions — keep is_admin)
--   4) RLS Enabled No Policy — seed_* tables (service_role only)
--
-- All operations idempotent (IF EXISTS / DROP POLICY IF EXISTS).
-- No data modified — only policy/function definitions.
-- ============================================================

-- ───────────────────────────────────────────────────────────
-- 1) FUNCTION SEARCH_PATH — lock to public, pg_catalog
-- ───────────────────────────────────────────────────────────
ALTER FUNCTION public.auto_generate_content()                       SET search_path = public, pg_catalog;
ALTER FUNCTION public.auto_hide_on_report()                         SET search_path = public, pg_catalog;
ALTER FUNCTION public.auto_reply_to_recent()                        SET search_path = public, pg_catalog;
ALTER FUNCTION public.handle_new_user()                             SET search_path = public, pg_catalog;
ALTER FUNCTION public.page_events_block_admin()                     SET search_path = public, pg_catalog;
ALTER FUNCTION public.touch_page_blocks_updated_at()                SET search_path = public, pg_catalog;
ALTER FUNCTION public.touch_seo_overrides_updated_at()              SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_magazine_updated_at()                  SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_venues_updated_at()                    SET search_path = public, pg_catalog;

-- ───────────────────────────────────────────────────────────
-- 2) RLS — DANGEROUS DELETE/UPDATE WITH qual=true (12 policies)
--    Replace with: owner-only (user_id = auth.uid()) + admin override
-- ───────────────────────────────────────────────────────────

-- comments
DROP POLICY IF EXISTS "delete_comments" ON public.comments;
CREATE POLICY "delete_comments" ON public.comments
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "update_comments" ON public.comments;
CREATE POLICY "update_comments" ON public.comments
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- posts
DROP POLICY IF EXISTS "delete_posts" ON public.posts;
CREATE POLICY "delete_posts" ON public.posts
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "update_posts" ON public.posts;
CREATE POLICY "update_posts" ON public.posts
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- reviews
DROP POLICY IF EXISTS "delete_reviews" ON public.reviews;
CREATE POLICY "delete_reviews" ON public.reviews
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "update_reviews" ON public.reviews;
CREATE POLICY "update_reviews" ON public.reviews
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- lounge_posts
DROP POLICY IF EXISTS "lounge_posts_delete" ON public.lounge_posts;
CREATE POLICY "lounge_posts_delete" ON public.lounge_posts
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "lounge_posts_update" ON public.lounge_posts;
CREATE POLICY "lounge_posts_update" ON public.lounge_posts
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- lounge_comments
DROP POLICY IF EXISTS "lounge_comments_delete" ON public.lounge_comments;
CREATE POLICY "lounge_comments_delete" ON public.lounge_comments
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- review_comments
DROP POLICY IF EXISTS "review_comments_delete" ON public.review_comments;
CREATE POLICY "review_comments_delete" ON public.review_comments
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- review_upvotes (user_id-only delete)
DROP POLICY IF EXISTS "upvotes_delete" ON public.review_upvotes;
CREATE POLICY "upvotes_delete" ON public.review_upvotes
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- notifications UPDATE (mark-read should be owner-only)
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ───────────────────────────────────────────────────────────
-- 3) RLS — SENSITIVE SELECT WITH qual=true (8 policies)
--    Lock to owner+admin (or admin-only when no user_id column)
-- ───────────────────────────────────────────────────────────

-- favorites: owner+admin
DROP POLICY IF EXISTS "read_favorites" ON public.favorites;
CREATE POLICY "read_favorites" ON public.favorites
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- notifications: owner+admin
DROP POLICY IF EXISTS "notifications_read" ON public.notifications;
CREATE POLICY "notifications_read" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- quiz_results: owner+admin
DROP POLICY IF EXISTS "read_quiz" ON public.quiz_results;
CREATE POLICY "read_quiz" ON public.quiz_results
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- invoices: admin-only (no user_id column)
DROP POLICY IF EXISTS "read_invoices" ON public.invoices;
CREATE POLICY "read_invoices" ON public.invoices
  FOR SELECT USING (public.is_admin());

-- leads: admin-only (no user_id column)
DROP POLICY IF EXISTS "read_leads" ON public.leads;
CREATE POLICY "read_leads" ON public.leads
  FOR SELECT USING (public.is_admin());

-- subscriptions: admin-only (no user_id column)
DROP POLICY IF EXISTS "read_subs" ON public.subscriptions;
CREATE POLICY "read_subs" ON public.subscriptions
  FOR SELECT USING (public.is_admin());

-- waitlist: admin-only (no user_id column)
DROP POLICY IF EXISTS "read_waitlist" ON public.waitlist;
CREATE POLICY "read_waitlist" ON public.waitlist
  FOR SELECT USING (public.is_admin());

-- user_titles: public-read (badge display intentional) — keep qual=true, no change
-- (badge listing is meant to be visible; documented exception)

-- ───────────────────────────────────────────────────────────
-- 4) SECURITY DEFINER + PUBLIC EXECUTE — REVOKE + targeted GRANT
--    Keep is_admin() PUBLIC (RLS evaluation needs anon path)
-- ───────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.add_temperature(uuid, numeric, text)        FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.add_temperature(uuid, numeric, text)        TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.check_and_unlock_titles(uuid)               FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.check_and_unlock_titles(uuid)               TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.decay_inactive_users()                      FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.decay_inactive_users()                      TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user()                           FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.handle_new_user()                           TO service_role;

REVOKE EXECUTE ON FUNCTION public.mark_attendance(uuid)                       FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.mark_attendance(uuid)                       TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.page_events_block_admin()                   FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.page_events_block_admin()                   TO service_role;

REVOKE EXECUTE ON FUNCTION public.reward_activity(uuid, text)                 FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reward_activity(uuid, text)                 TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.update_season_progress(uuid, text)          FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.update_season_progress(uuid, text)          TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.user_is_banned(uuid)                        FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.user_is_banned(uuid)                        TO authenticated, service_role;

-- is_admin() — INTENTIONALLY keep PUBLIC EXECUTE (RLS policies invoke as anon/auth)

-- ───────────────────────────────────────────────────────────
-- 5) RLS NO POLICY — seed_* tables → service_role only
-- ───────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.seed_authors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.seed_comment_pool  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.seed_post_pool     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seed_authors_service_only" ON public.seed_authors;
CREATE POLICY "seed_authors_service_only" ON public.seed_authors
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "seed_comment_pool_service_only" ON public.seed_comment_pool;
CREATE POLICY "seed_comment_pool_service_only" ON public.seed_comment_pool
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "seed_post_pool_service_only" ON public.seed_post_pool;
CREATE POLICY "seed_post_pool_service_only" ON public.seed_post_pool
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ───────────────────────────────────────────────────────────
-- 6) Cleanup diagnostic tables (if present from audit run)
-- ───────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public._diag_policies;
DROP TABLE IF EXISTS public._diag_funcs;
DROP TABLE IF EXISTS public._diag_cols;
