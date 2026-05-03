-- ╔══════════════════════════════════════════════════════╗
-- ║ 011 — 클립 업로드용 post-media 스토리지 버킷 + 정책   ║
-- ║                                                       ║
-- ║ 문제: post-media 버킷이 존재하지 않아                ║
-- ║      GalleryPage 클립 업로드 전부 실패 (404)         ║
-- ║      → 이미지 업로드 실패 → 글 등록도 안 됨          ║
-- ║                                                       ║
-- ║ 해결: 버킷 생성 + 인증 사용자 업로드 정책            ║
-- ║      파일 경로: clips/{user_id}/{timestamp}.ext       ║
-- ╚══════════════════════════════════════════════════════╝

-- 1) 버킷 생성 (이미 있으면 건너뜀)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,                                            -- 공개 읽기
  10485760,                                        -- 10MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2) RLS 정책 — 누구나 읽기, 인증 사용자는 자기 폴더에만 쓰기/삭제

DROP POLICY IF EXISTS "post_media_public_read" ON storage.objects;
CREATE POLICY "post_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-media');

DROP POLICY IF EXISTS "post_media_auth_insert" ON storage.objects;
CREATE POLICY "post_media_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-media'
    AND (storage.foldername(name))[1] = 'clips'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "post_media_auth_update" ON storage.objects;
CREATE POLICY "post_media_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'post-media'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "post_media_auth_delete" ON storage.objects;
CREATE POLICY "post_media_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-media'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
