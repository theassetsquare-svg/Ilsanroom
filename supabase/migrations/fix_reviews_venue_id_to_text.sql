-- 업소 리뷰 — 기존 reviews 테이블에 누락 컬럼 추가 + venue_id 타입 변경
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 RUN

-- 1) venue_id를 UUID → text(slug)로 변경
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_venue_id_fkey;
ALTER TABLE public.reviews ALTER COLUMN venue_id TYPE text USING venue_id::text;

-- 2) 누락된 컬럼 추가
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS visit_date date;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- 3) review_comments venue_id (있으면)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='review_comments' AND column_name='venue_id') THEN
    ALTER TABLE public.review_comments DROP CONSTRAINT IF EXISTS review_comments_venue_id_fkey;
    ALTER TABLE public.review_comments ALTER COLUMN venue_id TYPE text USING venue_id::text;
  END IF;
END $$;

-- 4) review_upvotes venue_id (있으면)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='review_upvotes' AND column_name='venue_id') THEN
    ALTER TABLE public.review_upvotes ALTER COLUMN venue_id TYPE text USING venue_id::text;
  END IF;
END $$;

-- 5) 인덱스
DROP INDEX IF EXISTS idx_reviews_venue_id;
CREATE INDEX IF NOT EXISTS idx_reviews_venue_id ON public.reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- 6) RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone can read active reviews" ON public.reviews;
CREATE POLICY "anyone can read active reviews" ON public.reviews
  FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "authenticated can insert reviews" ON public.reviews;
CREATE POLICY "authenticated can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner can update reviews" ON public.reviews;
CREATE POLICY "owner can update reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);
