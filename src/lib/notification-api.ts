import { createClient } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// 알림 목록 조회
export async function fetchNotifications(limit = 20) {
  const supabase = createClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []) as Notification[];
}

// 읽지 않은 알림 개수
export async function getUnreadCount() {
  const supabase = createClient();
  if (!supabase) return 0;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  return count || 0;
}

// 알림 읽음 처리
export async function markAsRead(notificationId: string) {
  const supabase = createClient();
  if (!supabase) return;

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

// 전체 읽음
export async function markAllAsRead() {
  const supabase = createClient();
  if (!supabase) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
}

// 알림 생성 (서버사이드용이지만 클라이언트에서도 사용 가능)
export async function createNotification(params: {
  user_id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
}) {
  const supabase = createClient();
  if (!supabase) return;

  await supabase.from('notifications').insert(params);
}
