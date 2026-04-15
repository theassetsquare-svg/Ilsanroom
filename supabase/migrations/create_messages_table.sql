-- 놀쿨 쪽지 (내부 메시징) 테이블
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  read_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스: 받은쪽지 조회 (receiver_id 기준 + 시간순)
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages (receiver_id, created_at DESC);

-- 인덱스: 보낸쪽지 조회 (sender_id 기준 + 시간순)
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id, created_at DESC);

-- 인덱스: 안 읽은 쪽지 수 빠르게 조회
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages (receiver_id) WHERE read_at IS NULL;

-- RLS 활성화
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 정책: 본인이 보내거나 받은 쪽지만 조회
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 정책: 로그인한 사용자만 쪽지 발송 (sender_id = 본인)
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 정책: 받은 사람만 읽음 처리 가능
CREATE POLICY "Receiver can mark as read" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- FK alias for Supabase join queries
-- messages_sender_id_fkey → users (auto-created by REFERENCES)
-- messages_receiver_id_fkey → users (auto-created by REFERENCES)
-- Note: Supabase auto-creates foreign key constraints named "messages_sender_id_fkey" and "messages_receiver_id_fkey"
-- These are used in the API: .select('*, sender:users!messages_sender_id_fkey(nickname, avatar_url)')
