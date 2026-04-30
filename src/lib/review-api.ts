import { createClient } from '@/lib/supabase';

export interface Review {
  id: string;
  user_id: string | null;
  venue_id: string;
  rating: number;
  title: string | null;
  content: string;
  images: string[];
  visit_date: string | null;
  is_anonymous: boolean;
  is_verified: boolean;
  upvote_count: number;
  reply_count: number;
  view_count: number;
  status: string;
  created_at: string;
  user_profiles?: { nickname: string | null; avatar_url: string | null; level: string } | null;
}

export interface ReviewComment {
  id: string;
  review_id: string;
  user_id: string | null;
  parent_id: string | null;
  content: string;
  upvote_count: number;
  created_at: string;
  user_profiles?: { nickname: string | null; avatar_url: string | null; level: string } | null;
}

// 업소별 후기 목록
export async function fetchReviews(venueId: string, limit = 20, offset = 0) {
  const supabase = createClient();
  if (!supabase) return { data: [] as Review[], count: 0 };

  try {
    const { data, count, error } = await supabase
      .from('reviews')
      .select('*, user_profiles!left(nickname, avatar_url, level)', { count: 'exact' })
      .eq('venue_id', venueId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      const { data: fb, count: c2 } = await supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .eq('venue_id', venueId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      return { data: (fb || []) as Review[], count: c2 || 0 };
    }
    return { data: (data || []) as unknown as Review[], count: count || 0 };
  } catch {
    return { data: [] as Review[], count: 0 };
  }
}

// 후기 작성
export async function submitReview(review: {
  venue_id: string;
  rating: number;
  title?: string;
  content: string;
  images?: string[];
  visit_date?: string;
  is_anonymous?: boolean;
}) {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data, error } = await supabase
    .from('reviews')
    .insert({ ...review, user_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  // 포인트 적립: user_profiles 업데이트
  await supabase.rpc('increment_user_points', { uid: user.id, pts: 10, reviews: 1 }).then(() => {}, () => {});

  return { data };
}

// 후기 댓글 작성
export async function submitReviewComment(reviewId: string, content: string, parentId?: string) {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const insertData: Record<string, unknown> = { review_id: reviewId, user_id: user.id, content };
  if (parentId) insertData.parent_id = parentId;

  const { data, error } = await supabase
    .from('review_comments')
    .insert(insertData)
    .select()
    .single();

  if (error) return { error: error.message };

  // reply_count 증가
  await supabase.rpc('increment_review_replies', { rid: reviewId }).then(() => {}, () => {});
  // 포인트
  await supabase.rpc('increment_user_points', { uid: user.id, pts: 5, comments: 1 }).then(() => {}, () => {});

  return { data: data as unknown as ReviewComment };
}

// 후기 추천
export async function toggleReviewUpvote(reviewId: string) {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data: existing } = await supabase
    .from('review_upvotes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('review_id', reviewId)
    .single();

  if (existing) {
    await supabase.from('review_upvotes').delete().eq('user_id', user.id).eq('review_id', reviewId);
    // upvote_count 감소는 트리거로 처리 (여기선 생략)
    return { upvoted: false };
  } else {
    await supabase.from('review_upvotes').insert({ user_id: user.id, review_id: reviewId });
    return { upvoted: true };
  }
}

// 후기 이미지 업로드
export async function uploadReviewImage(file: File): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `reviews/${user.id}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('post-media')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(data.path);
  return { url: urlData.publicUrl };
}

// 최근 전체 후기 (홈용)
export async function fetchLatestReviews(limit = 5) {
  const supabase = createClient();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from('reviews')
      .select('id, venue_id, rating, title, content, created_at, upvote_count')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}
