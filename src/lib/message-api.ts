import { createClient } from '@/lib/supabase';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender?: { nickname: string | null; avatar_url: string | null };
  receiver?: { nickname: string | null; avatar_url: string | null };
}

/** 쪽지 보내기 */
export async function sendMessage(receiverId: string, content: string) {
  const supabase = createClient();
  if (!supabase) return { error: 'DB 연결 실패' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };
  if (user.id === receiverId) return { error: '자신에게 쪽지를 보낼 수 없습니다' };

  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: user.id, receiver_id: receiverId, content: content.trim() })
    .select()
    .single();

  return { data, error: error?.message };
}

/** 받은 쪽지 목록 */
export async function fetchReceivedMessages(limit = 50) {
  const supabase = createClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('messages')
    .select('*, sender:users!messages_sender_id_fkey(nickname, avatar_url)')
    .eq('receiver_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []) as Message[];
}

/** 보낸 쪽지 목록 */
export async function fetchSentMessages(limit = 50) {
  const supabase = createClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('messages')
    .select('*, receiver:users!messages_receiver_id_fkey(nickname, avatar_url)')
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []) as Message[];
}

/** 쪽지 읽음 처리 */
export async function markAsRead(messageId: string) {
  const supabase = createClient();
  if (!supabase) return;

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
    .is('read_at', null);
}

/** 안 읽은 쪽지 수 */
export async function getUnreadCount(): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .is('read_at', null);

  return count ?? 0;
}

/** 특정 유저와의 대화 내역 */
export async function fetchConversation(otherUserId: string, limit = 50) {
  const supabase = createClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('messages')
    .select('*, sender:users!messages_sender_id_fkey(nickname, avatar_url), receiver:users!messages_receiver_id_fkey(nickname, avatar_url)')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })
    .limit(limit);

  return (data || []) as Message[];
}
