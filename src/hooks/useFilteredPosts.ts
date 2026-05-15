/**
 * useFilteredPosts — 차단 단어/닉네임 적용한 게시글 리스트
 * 영역 L (시즌38) — useUserBlocks 위에서 동작, 비어있으면 원본 그대로
 */
import { useMemo } from 'react';
import { useUserBlocks } from './useUserBlocks';

interface PostLike {
  title?: string;
  content?: string;
  excerpt?: string;
  author?: string;
  nickname?: string;
}

export function useFilteredPosts<T extends PostLike>(posts: T[]): T[] {
  const { words, names } = useUserBlocks();
  return useMemo(() => {
    if (words.length === 0 && names.length === 0) return posts;
    return posts.filter((p) => {
      const author = p.author ?? p.nickname ?? '';
      if (author && names.includes(author)) return false;
      if (words.length > 0) {
        const text = `${p.title ?? ''} ${p.content ?? ''} ${p.excerpt ?? ''}`;
        if (words.some((w) => text.includes(w))) return false;
      }
      return true;
    });
  }, [posts, words, names]);
}
