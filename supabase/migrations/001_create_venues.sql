-- =============================================
-- venues 테이블 (놀쿨 가게 정보 시스템)
-- 실행: Supabase Dashboard → SQL Editor
-- 기존 venues 테이블이 있으면 DROP 후 재생성
-- =============================================

DROP TABLE IF EXISTS venues CASCADE;

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('club','night','lounge','room','yojeong','hoppa')),
  region TEXT NOT NULL,
  region_ko TEXT NOT NULL,
  address TEXT DEFAULT '',
  description TEXT,
  short_description TEXT,
  features TEXT[] DEFAULT '{}',
  atmosphere TEXT[] DEFAULT '{}',
  age_group TEXT,
  dress_code TEXT,
  best_time TEXT,
  parking TEXT,
  nearby_station TEXT,
  image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'verified_open' CHECK (status IN ('verified_open','unknown','closed_or_unclear')),
  open_hours TEXT,
  tags TEXT[] DEFAULT '{}',
  -- 업소 핵심 정보 (양주/부스/룸)
  liquor_info TEXT,
  booth_info TEXT,
  room_info TEXT,
  -- 담당자
  staff_nickname TEXT,
  staff_phone TEXT,
  district TEXT,
  -- 소유자 (B2B 연동)
  owner_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_venues_category ON venues(category);
CREATE INDEX IF NOT EXISTS idx_venues_region ON venues(region);
CREATE INDEX IF NOT EXISTS idx_venues_slug ON venues(slug);
CREATE INDEX IF NOT EXISTS idx_venues_status ON venues(status);
CREATE INDEX IF NOT EXISTS idx_venues_is_active ON venues(is_active);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_venues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_venues_updated_at ON venues;
CREATE TRIGGER trg_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_venues_updated_at();

-- RLS (Row Level Security)
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능
DROP POLICY IF EXISTS "venues_select_all" ON venues;
CREATE POLICY "venues_select_all" ON venues
  FOR SELECT USING (true);

-- 소유자만 수정 가능
DROP POLICY IF EXISTS "venues_update_owner" ON venues;
CREATE POLICY "venues_update_owner" ON venues
  FOR UPDATE USING (auth.uid() = owner_id);

-- admin만 삽입/삭제 (Supabase Dashboard에서 직접)
-- 필요 시 추가 정책 설정
