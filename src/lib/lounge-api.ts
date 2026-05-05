import { createClient } from '@/lib/supabase';

export type LoungeType = 'night' | 'club' | 'room' | 'yojung' | 'hoppa' | 'lounge' | 'free' | 'qna';

export interface LoungePost {
  id: string;
  user_id: string | null;
  lounge_type: LoungeType;
  title: string;
  content: string;
  images: string[];
  view_count: number;
  upvote_count: number;
  comment_count: number;
  status: string;
  created_at: string;
  user_profiles?: { nickname: string | null; avatar_url: string | null; level: string } | null;
}

export const LOUNGE_DEFS: { type: LoungeType; name: string; icon: string; desc: string; href: string }[] = [
  { type: 'night', name: '나이트 라운지', icon: '🌙', desc: '부킹·매니저·양주 토크', href: '/lounge/night' },
  { type: 'club', name: '클럽 라운지', icon: '🎵', desc: 'DJ·게스트·라인업 정보', href: '/lounge/club' },
  { type: 'room', name: '룸 라운지', icon: '🚪', desc: '양주·인원·매니저 후기', href: '/lounge/room' },
  { type: 'yojung', name: '요정 라운지', icon: '🏮', desc: '정찬·국악 코스 정보', href: '/lounge/yojung' },
  { type: 'hoppa', name: '호빠 라운지', icon: '🥂', desc: '여성 사교 안전 후기', href: '/lounge/hoppa' },
  { type: 'lounge', name: '라운지바 라운지', icon: '🍸', desc: '칵테일·위스키 추천방', href: '/lounge/lounge' },
  { type: 'free', name: '자유게시판', icon: '💬', desc: '자유로운 대화', href: '/lounge/free' },
  { type: 'qna', name: '질문답변', icon: '❓', desc: '뭐든 물어보세요', href: '/lounge/qna' },
];

export async function fetchLoungePosts(loungeType: LoungeType, limit = 20, offset = 0) {
  const supabase = createClient();
  if (!supabase) return { data: [] as LoungePost[], count: 0 };

  try {
    const { data, count } = await supabase
      .from('lounge_posts')
      .select('*', { count: 'exact' })
      .eq('lounge_type', loungeType)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return { data: (data || []) as LoungePost[], count: count || 0 };
  } catch {
    return { data: [] as LoungePost[], count: 0 };
  }
}

export async function createLoungePost(post: {
  lounge_type: LoungeType;
  title: string;
  content: string;
  images?: string[];
}) {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data, error } = await supabase
    .from('lounge_posts')
    .insert({ ...post, user_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  // 포인트
  await supabase.rpc('increment_user_points', { uid: user.id, pts: 8, posts: 1 }).then(() => {}, () => {});

  return { data };
}

export async function createLoungeComment(postId: string, content: string, parentId?: string) {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const insertData: Record<string, unknown> = { post_id: postId, user_id: user.id, content };
  if (parentId) insertData.parent_id = parentId;

  const { data, error } = await supabase
    .from('lounge_comments')
    .insert(insertData)
    .select()
    .single();

  if (error) return { error: error.message };

  // comment_count는 트리거로 처리 (여기선 생략)

  return { data };
}

export async function fetchLoungeComments(postId: string) {
  const supabase = createClient();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from('lounge_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });
    return data || [];
  } catch {
    return [];
  }
}
