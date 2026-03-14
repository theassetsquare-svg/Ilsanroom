-- Add staff columns to venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS staff_nickname VARCHAR(50);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS staff_phone VARCHAR(20);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS district VARCHAR(100);

-- Create index for district
CREATE INDEX IF NOT EXISTS idx_venues_district ON venues(district);
