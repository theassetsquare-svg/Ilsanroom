-- ╔══════════════════════════════════════════════════════╗
-- ║ 011 — 클립 업로드용 post-media 스토리지 버킷         ║
-- ║                                                       ║
-- ║ 호스팅 Supabase는 storage.objects 정책을 SQL로       ║
-- ║ 추가할 수 없음 (must be owner of table objects).      ║
-- ║ → 정책은 functions/api/clip-upload.ts 에서            ║
-- ║   service_role 키로 RLS 우회하여 처리.                ║
-- ║                                                       ║
-- ║ 본 마이그레이션은 버킷 자체만 멱등 생성.              ║
-- ╚══════════════════════════════════════════════════════╝

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
