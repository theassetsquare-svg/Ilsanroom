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
  // 커뮤니티를 보고 있으면 = 다 읽은 것 → 기준선 갱신 + 신호 0 (로그인 여부 무관)
  if (pathname.startsWith('/community')) {
    try { localStorage.setItem('community_seen_at', String(Date.now())); } catch {}
    sharedState = { count: 0, posts: [] };
    notify();
    return;
  }
  const supabase = createClient();
  if (!supabase) return;
  try {
    // 비로그인 방문자에게도 "지난 방문 이후 새 글 N개" 변동 보상을 켠다 — 방문자 대다수가
    // 구글에서 온 비로그인. 단 *첫 방문*엔 '놓친 글' 기준이 없으므로 과장 없이 기준선만 심고 0.
    const seenRaw = localStorage.getItem('community_seen_at');
    if (!seenRaw) {
      try { localStorage.setItem('community_seen_at', String(Date.now())); } catch {}
      sharedState = { count: 0, posts: [] };
      notify();
      return;
    }
    const since = new Date(Number(seenRaw)).toISOString();
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
