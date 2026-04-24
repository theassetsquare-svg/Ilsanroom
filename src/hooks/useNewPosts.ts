import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';

export interface NewPost { id: string; title: string; category: string; created_at: string; }

// 싱글톤 — Header + MobileBottomNav에서 동시 사용해도 1개 인터벌만 실행
let sharedState = { count: 0, posts: [] as NewPost[] };
let listeners: Set<() => void> = new Set();
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let lastUser: any = null;
let lastPathname: string = '';

function notify() {
  listeners.forEach(fn => fn());
}

async function fetchNewPosts(user: any, pathname: string) {
  if (!user) {
    sharedState = { count: 0, posts: [] };
    notify();
    return;
  }
  if (pathname.startsWith('/community')) {
    try { localStorage.setItem('community_seen_at', String(Date.now())); } catch {}
    sharedState = { count: 0, posts: [] };
    notify();
    return;
  }
  const supabase = createClient();
  if (!supabase) return;
  try {
    const seenAt = localStorage.getItem('community_seen_at') || '0';
    const since = seenAt === '0'
      ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      : new Date(Number(seenAt)).toISOString();
    const { data, count: c } = await supabase
      .from('posts')
      .select('id, title, category, created_at', { count: 'exact' })
      .gt('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10);
    sharedState = { count: c ?? 0, posts: (data || []) as NewPost[] };
    notify();
  } catch { /* noop */ }
}

function startPolling(user: any, pathname: string) {
  lastUser = user;
  lastPathname = pathname;
  fetchNewPosts(user, pathname);

  if (pollingTimer) clearInterval(pollingTimer);
  if (!user) return;
  pollingTimer = setInterval(() => {
    fetchNewPosts(lastUser, lastPathname);
  }, 60_000);
}

function stopPollingIfNoListeners() {
  if (listeners.size === 0 && pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

export function useNewPosts(user: any, pathname: string) {
  const [, forceUpdate] = useState(0);

  // user나 pathname이 변경되면 즉시 fetch
  const prevUser = useRef(user);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    listeners.add(listener);

    if (prevUser.current !== user || prevPathname.current !== pathname || !pollingTimer) {
      prevUser.current = user;
      prevPathname.current = pathname;
      startPolling(user, pathname);
    }

    return () => {
      listeners.delete(listener);
      stopPollingIfNoListeners();
    };
  }, [user, pathname]);

  const refresh = useCallback(() => {
    fetchNewPosts(user, pathname);
  }, [user, pathname]);

  return { count: sharedState.count, posts: sharedState.posts, refresh };
}
