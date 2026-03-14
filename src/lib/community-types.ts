// ── Level System ────────────────────────────────────────
export const LEVELS = [
  { name: '뉴비', minXp: 0, color: 'text-neutral-400', bg: 'bg-neutral-700', icon: '🌱' },
  { name: '클러버', minXp: 100, color: 'text-blue-400', bg: 'bg-blue-500/20', icon: '🎵' },
  { name: '파티피플', minXp: 500, color: 'text-violet-400', bg: 'bg-violet-500/20', icon: '🎉' },
  { name: 'VIP', minXp: 2000, color: 'text-amber-400', bg: 'bg-amber-500/20', icon: '👑' },
  { name: '레전드', minXp: 5000, color: 'text-rose-400', bg: 'bg-rose-500/20', icon: '🔥' },
] as const;

export type LevelName = (typeof LEVELS)[number]['name'];

// XP rewards
export const XP_REWARDS = {
  post: 20,
  review: 50,
  comment: 5,
  attendance: 10,
} as const;

export function getLevelInfo(xp: number) {
  let level: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXp) level = l;
  }
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
  const progress = nextLevel
    ? ((xp - level.minXp) / (nextLevel.minXp - level.minXp)) * 100
    : 100;
  return { ...level, xp, progress: Math.min(progress, 100), nextLevel };
}

// ── Post Types ─────────────────────────────────────────
export type BoardType = 'free' | 'reviews' | 'party' | 'tips' | 'fashion' | 'qna';

export interface Author {
  id: string;
  nickname: string;
  level: LevelName;
  xp: number;
  avatar?: string;
}

export interface PostImage {
  id: string;
  url: string;
  alt: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: Author;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  parentId?: string;
  replies?: Comment[];
}

export interface Post {
  id: string;
  board: BoardType;
  title: string;
  content: string;
  excerpt: string;
  author: Author;
  createdAt: string;
  views: number;
  likes: number;
  isLiked: boolean;
  isBookmarked: boolean;
  commentCount: number;
  comments: Comment[];
  images: PostImage[];
  hashtags: string[];
  readTimeMin: number;
  isPopular: boolean;
  isReported: boolean;
  // Review-specific
  venueTag?: string;
  venueRegion?: string;
  rating?: number;
  // Party-specific
  partyDate?: string;
  partyRegion?: string;
  currentMembers?: number;
  maxMembers?: number;
  ageRange?: string;
  partyStatus?: '모집중' | '마감';
  totalBudget?: number;
  // QnA-specific
  isSolved?: boolean;
  answerCount?: number;
  // Tips-specific
  tipCategory?: string;
  bookmarks?: number;
  // Fashion-specific
  fashionCategory?: string;
  fashionTags?: string[];
}

// ── Chat Types ─────────────────────────────────────────
export interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  level: LevelName;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'comment' | 'like' | 'reply' | 'level_up' | 'party_join';
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

// ── Read Time Calculator ──────────────────────────────
export function calcReadTime(content: string): number {
  // Average Korean reading speed: ~500 chars/min
  const charCount = content.replace(/\s/g, '').length;
  return Math.max(1, Math.ceil(charCount / 500));
}
