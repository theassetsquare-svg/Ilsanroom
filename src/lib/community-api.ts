import { createClient } from '@/lib/supabase';

export type PostCategory = 'reviews' | 'discussion' | 'party' | 'tips' | 'free';

export interface Post {
  id: string;
  user_id: string | null;
  category: PostCategory;
  title: string;
  content: string;
  venue_slug?: string;
  rating?: number;
  likes: number;
  views: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  users?: { nickname: string | null; avatar_url: string | null } | null;
  comment_count?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string | null;
  content: string;
  likes: number;
  parent_id: string | null;
  created_at: string;
  users?: { nickname: string | null; avatar_url: string | null } | null;
}

// Fetch posts by category
export async function fetchPosts(category: PostCategory, limit = 20, offset = 0) {
  const supabase = createClient();
  if (!supabase) return { data: [] as Post[], count: 0 };

  try {
    const { data, count, error } = await supabase
      .from('posts')
      .select('*, users!posts_user_id_fkey(nickname, avatar_url)', { count: 'exact' })
      .eq('category', category)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      // Fallback without join if FK doesn't exist
      const { data: fallback, count: c2, error: e2 } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('category', category)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (e2) return { data: [] as Post[], count: 0 };
      return { data: (fallback || []) as unknown as Post[], count: c2 || 0 };
    }
    return { data: (data || []) as unknown as Post[], count: count || 0 };
  } catch {
    return { data: [] as Post[], count: 0 };
  }
}

// Create post — Supabase에 저장
export async function createPost(post: {
  category: PostCategory;
  title: string;
  content: string;
  venue_slug?: string;
  rating?: number;
}) {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data, error } = await supabase
    .from('posts')
    .insert({ ...post, user_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

// Fetch comments for a post
export async function fetchComments(postId: string) {
  const supabase = createClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) return [];
    return (data || []) as unknown as Comment[];
  } catch {
    return [];
  }
}

// Create comment — Supabase에 저장
export async function createComment(postId: string, content: string, parentId?: string) {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: user.id, content, parent_id: parentId || null })
    .select('*')
    .single();

  if (error) return { error: error.message };
  return { data: data as unknown as Comment };
}

// Delete post — 본인 글만 삭제
export async function deletePost(postId: string) {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) return { error: error.message };
  return { success: true };
}

// Delete comment — 본인 댓글만 삭제
export async function deleteComment(commentId: string) {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) return { error: error.message };
  return { success: true };
}

// Toggle favorite
export async function toggleFavorite(venueSlug: string) {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('venue_slug', venueSlug)
    .single();

  if (existing) {
    await supabase.from('favorites').delete().eq('id', (existing as any).id);
    return { favorited: false };
  } else {
    await supabase.from('favorites').insert({ user_id: user.id, venue_slug: venueSlug } as any);
    return { favorited: true };
  }
}

// Get user favorites
export async function fetchFavorites() {
  const supabase = createClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('favorites')
    .select('venue_slug, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (data || []) as unknown as { venue_slug: string; created_at: string }[];
}

// Save viewed venue (for AI taste analysis)
export async function saveViewedVenue(venueSlug: string) {
  const supabase = createClient();
  if (!supabase) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Store in localStorage for guests
    const key = 'viewed_venues_guest';
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    if (!stored.includes(venueSlug)) {
      stored.unshift(venueSlug);
      localStorage.setItem(key, JSON.stringify(stored.slice(0, 50)));
    }
    return;
  }

  const key = `viewed_venues_${user.id}`;
  const stored = JSON.parse(localStorage.getItem(key) || '[]');
  if (!stored.includes(venueSlug)) {
    stored.unshift(venueSlug);
    localStorage.setItem(key, JSON.stringify(stored.slice(0, 50)));
  }
}

// Get user viewed venues
export function getViewedVenues(userId?: string): string[] {
  const key = userId ? `viewed_venues_${userId}` : 'viewed_venues_guest';
  return JSON.parse(localStorage.getItem(key) || '[]');
}

// Upload image to Supabase Storage
export async function uploadPostImage(file: File): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${user.id}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('post-media')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(data.path);
  return { url: urlData.publicUrl };
}

// Toggle post like
export async function togglePostLike(postId: string) {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { data: post } = await supabase.from('posts').select('likes').eq('id', postId).single();
  if (!post) return { error: '글을 찾을 수 없습니다' };

  const newLikes = (post.likes || 0) + 1;
  const { error } = await supabase.from('posts').update({ likes: newLikes }).eq('id', postId);
  if (error) return { error: error.message };
  return { likes: newLikes };
}

// Create review
export async function createReview(review: {
  venue_slug: string;
  rating: number;
  content?: string;
  atmosphere_rating?: number;
  service_rating?: number;
  visit_date?: string;
}) {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const insertData = { ...review, user_id: user.id } as any;

  const { data, error } = await supabase
    .from('reviews')
    .insert(insertData)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}
