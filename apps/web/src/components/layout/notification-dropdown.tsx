'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Bell,
  CreditCard,
  Zap,
  Shield,
  Coins,
  RefreshCw,
  HeadphonesIcon,
  CheckCheck,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useNotifications, useUnreadCount } from '@/hooks/use-dashboard';

const TYPE_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  info:         { icon: Bell,            color: 'text-blue-500',   label: 'Info' },
  SYSTEM:       { icon: Zap,             color: 'text-blue-500',   label: 'System' },
  BILLING:      { icon: CreditCard,      color: 'text-violet-500', label: 'Billing' },
  SUBSCRIPTION: { icon: RefreshCw,       color: 'text-indigo-500', label: 'Subscription' },
  CREDITS:      { icon: Coins,           color: 'text-amber-500',  label: 'Credits' },
  GENERATION:   { icon: Zap,             color: 'text-green-500',  label: 'Generation' },
  SECURITY:     { icon: Shield,          color: 'text-red-500',    label: 'Security' },
  SUPPORT:      { icon: HeadphonesIcon,  color: 'text-sky-500',    label: 'Support' },
};

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ open, onClose }: Props) {
  const { data, refetch } = useNotifications(10);
  const { refetch: refetchCount } = useUnreadCount();
  const [marking, setMarking] = React.useState(false);

  const items: any[] = (data as any)?.items ?? (data as any)?.data ?? [];

  const handleMarkRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    await apiClient.notifications.markRead(id);
    refetch();
    refetchCount();
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await apiClient.notifications.markAllRead();
      refetch();
      refetchCount();
    } finally {
      setMarking(false);
    }
  };

  if (!open) return null;

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-popover shadow-xl z-50 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Notifications</span>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-2xs font-bold text-primary-foreground">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={marking}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Mark all read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              All read
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <ul className="max-h-[360px] overflow-y-auto divide-y divide-border">
        {items.length === 0 ? (
          <li className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Bell className="h-8 w-8 opacity-30" />
            <span className="text-sm">You're all caught up!</span>
          </li>
        ) : (
          items.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
            const Icon = meta.icon;
            return (
              <li
                key={n.id}
                onClick={() => handleMarkRead(n.id, n.isRead)}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50',
                  !n.isRead && 'bg-primary/5',
                )}
              >
                <span className={cn('mt-0.5 shrink-0', meta.color)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-2xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </li>
            );
          })
        )}
      </ul>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5">
        <Link
          href="/notifications"
          onClick={onClose}
          className="block text-center text-xs font-medium text-primary hover:underline"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
