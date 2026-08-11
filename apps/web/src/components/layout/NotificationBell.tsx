'use client';
import * as React from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/endpoints';

type Props = {
  unreadCount: number;
  notifications: Array<{
    id: string;
    title: string;
    body: string | null;
    readAt: string | null;
    createdAt: string;
    type?: string;
  }>;
};

export function NotificationBell({ unreadCount, notifications }: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  
  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] }),
  });
  
  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] }),
  });
  
  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
  
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-muted)] transition hover:bg-[var(--site-hover)] hover:text-[var(--site-text)]"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--site-border)] px-4 py-3">
            <span className="font-semibold text-sm text-[var(--site-text)]">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs text-[var(--site-primary)] hover:opacity-80"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--site-muted)]">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.readAt) markRead.mutate(n.id); }}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[var(--site-hover)]"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--site-primary)]/10">
                    <Bell className="h-3 w-3 text-[var(--site-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--site-text)] text-left truncate">{n.title}</p>
                    {n.body && <p className="text-xs text-[var(--site-muted)] line-clamp-2 text-left mt-0.5">{n.body}</p>}
                    <p className="text-[10px] text-[var(--site-muted)] mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.readAt && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                </button>
              ))
            )}
          </div>
          
          <div className="border-t border-[var(--site-border)] p-2">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="block w-full rounded-xl px-3 py-2 text-center text-xs font-medium text-[var(--site-primary)] transition hover:bg-[var(--site-primary)]/10"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
