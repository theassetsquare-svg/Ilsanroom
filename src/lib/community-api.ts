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

function getLocalPosts(category: PostCategory): Post[] {
  try {
    const key = `community_posts_${category}`;
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    return stored as Post[];
  } catch { return []; }
}

// Fetch posts by category
export async function fetchPosts(category: PostCategory, limit = 20, offset = 0) {
  const supabase = createClient();
  if (!supabase) return { data: [] as Post[], count: 0 };

  try {
    const { data, count, error } = await supabase
      .from('posts')
      .select('*, users(nickname, avatar_url)', { count: 'exact' })
      .eq('category', category)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!error && data && data.length > 0) {
      // Supabase 데이터 + localStorage 데이터 병합
      const localPosts = getLocalPosts(category);
      const merged = [...localPosts, ...(data as unknown as Post[])];
      return { data: merged, count: (count || 0) + localPosts.length };
    }
  } catch {}

  // Supabase 실패 시 localStorage만
  const localPosts = getLocalPosts(category);
  return { data: localPosts, count: localPosts.length };
}

// Create post — Supabase 실패 시 localStorage fallback
export async function createPost(post: {
  category: PostCategory;
  title: string;
  content: string;
  venue_slug?: string;
  rating?: number;
}) {
  const supabase = createClient();
  const userId = await (async () => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  })();

  // Supabase 시도
  if (supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({ ...post, user_id: userId })
        .select()
        .single();
      if (!error && data) return { data };
    } catch {}
  }

  // Fallback: localStorage에 저장
  const localPost = {
    id: `local-${Date.now()}`,
    user_id: userId,
    ...post,
    likes: 0,
    views: 0,
    is_pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    comment_count: 0,
  };
  try {
    const key = `community_posts_${post.category}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(localPost);
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {}
  return { data: localPost };
}

// Fetch comments for a post
export async function fetchComments(postId: string) {
  const supabase = createClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*, users(nickname, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) return [];
    return (data || []) as unknown as Comment[];
  } catch {
    return [];
  }
}

// Create comment — Supabase 실패 시 localStorage fallback
export async function createComment(postId: string, content: string, parentId?: string) {
  const supabase = createClient();

  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('comments')
          .insert({ post_id: postId, user_id: user.id, content, parent_id: parentId || null })
          .select('*, users(nickname, avatar_url)')
          .single();
        if (!error && data) return { data: data as unknown as Comment };
      }
    } catch {}
  }

  // Fallback: localStorage
  const localComment = {
    id: `lc-${Date.now()}`,
    post_id: postId,
    user_id: null,
    content,
    likes: 0,
    parent_id: parentId || null,
    created_at: new Date().toISOString(),
  };
  return { data: localComment as unknown as Comment };
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
