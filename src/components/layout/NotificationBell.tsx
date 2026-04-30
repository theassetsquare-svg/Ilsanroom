import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchNotifications, getUnreadCount, markAsRead, markAllAsRead, type Notification } from '@/lib/notification-api';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

const typeIcon: Record<string, string> = {
  comment: '💬',
  reply: '↩️',
  like: '👍',
  upvote: '👍',
  level_up: '🎉',
  best: '🏆',
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    getUnreadCount().then(setUnread);
    const timer = setInterval(() => getUnreadCount().then(setUnread), 60000);
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = async () => {
    if (!open && !loaded) {
      const data = await fetchNotifications();
      setNotifications(data);
      setLoaded(true);
    }
    setOpen(!open);
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      await markAsRead(n.id);
      setUnread(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    if (n.link) window.location.href = n.link;
    setOpen(false);
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    setUnread(0);
    setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neon-text-muted hover:bg-neon-surface-2 hover:text-neon-text transition"
        aria-label="알림"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-neon-border bg-neon-bg shadow-xl">
          <div className="flex items-center justify-between border-b border-neon-border px-4 py-3">
            <h3 className="text-sm font-bold text-neon-text">알림</h3>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-violet-400 hover:underline">
                모두 읽음
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-neon-text-muted">알림이 없습니다</div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-neon-surface-2 transition ${
                    n.is_read ? 'opacity-60' : ''
                  }`}
                >
                  <span className="text-lg mt-0.5">{typeIcon[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neon-text font-medium line-clamp-1">{n.title}</p>
                    {n.message && <p className="text-xs text-neon-text-muted line-clamp-1">{n.message}</p>}
                    <span className="text-[10px] text-neon-text-muted">{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.is_read && (
                    <span className="mt-2 h-2 w-2 rounded-full bg-violet-500 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
