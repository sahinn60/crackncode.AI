'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from '@crackncode/ui';
import { PageHeader } from '@/components/layout/page-header';
import { ListSkeleton, ErrorState, EmptyState } from '@/components/dashboard/states';
import { apiClient } from '@/lib/api-client';
import { useApi } from '@/hooks/use-api';
import { useUnreadCount } from '@/hooks/use-dashboard';
import {
  Bell, CreditCard, Zap, Shield, Coins, RefreshCw,
  HeadphonesIcon, Check, ChevronLeft, ChevronRight,
} from 'lucide-react';

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  info:         { icon: Bell,           color: 'text-blue-500',   bg: 'bg-blue-500/10',   label: 'Info' },
  SYSTEM:       { icon: Zap,            color: 'text-blue-500',   bg: 'bg-blue-500/10',   label: 'System' },
  BILLING:      { icon: CreditCard,     color: 'text-violet-500', bg: 'bg-violet-500/10', label: 'Billing' },
  SUBSCRIPTION: { icon: RefreshCw,      color: 'text-indigo-500', bg: 'bg-indigo-500/10', label: 'Subscription' },
  CREDITS:      { icon: Coins,          color: 'text-amber-500',  bg: 'bg-amber-500/10',  label: 'Credits' },
  GENERATION:   { icon: Zap,            color: 'text-green-500',  bg: 'bg-green-500/10',  label: 'Generation' },
  SECURITY:     { icon: Shield,         color: 'text-red-500',    bg: 'bg-red-500/10',    label: 'Security' },
  SUPPORT:      { icon: HeadphonesIcon, color: 'text-sky-500',    bg: 'bg-sky-500/10',    label: 'Support' },
};

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const [page, setPage] = React.useState(0);
  const skip = page * PAGE_SIZE;

  const { data, loading, error, refetch } = useApi(
    () => apiClient.notifications.list(skip, PAGE_SIZE),
    [skip],
  );
  const { refetch: refetchCount } = useUnreadCount();

  const [marking, setMarking] = React.useState(false);
  const [readingId, setReadingId] = React.useState<string | null>(null);

  const items: any[] = (data as any)?.items ?? (data as any)?.data ?? [];
  const total: number = (data as any)?.total ?? items.length;
  const unread = items.filter((n: any) => !n.isRead).length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const markOne = async (id: string, isRead: boolean) => {
    if (isRead) return;
    setReadingId(id);
    try {
      await apiClient.notifications.markRead(id);
      refetch();
      refetchCount();
    } finally {
      setReadingId(null);
    }
  };

  const markAll = async () => {
    setMarking(true);
    try {
      await apiClient.notifications.markAllRead();
      refetch();
      refetchCount();
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay up to date with your account activity."
        breadcrumbs={[{ label: 'Notifications' }]}
        actions={
          unread > 0 ? (
            <Button size="sm" variant="outline" onClick={markAll} disabled={marking} className="gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>All Notifications</CardTitle>
            {unread > 0 && <Badge variant="default">{unread} unread</Badge>}
            {total > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">{total} total</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <ListSkeleton count={6} />
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You're all caught up! We'll notify you when something needs your attention."
            />
          ) : (
            <>
              <ul>
                {items.map((n: any, i: number) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
                  const Icon = meta.icon;
                  return (
                    <li
                      key={n.id}
                      onClick={() => markOne(n.id, n.isRead)}
                      className={cn(
                        'flex items-start gap-4 px-6 py-4 transition-colors',
                        !n.isRead && 'bg-primary/5 hover:bg-primary/10 cursor-pointer',
                        n.isRead && 'hover:bg-accent/50',
                        i < items.length - 1 && 'border-b border-border',
                      )}
                    >
                      <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', meta.bg)}>
                        <Icon className={cn('h-4 w-4', meta.color)} />
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={cn('text-sm font-semibold text-foreground', n.isRead && 'font-medium')}>
                            {n.title}
                          </p>
                          <span className={cn('text-2xs font-medium px-1.5 py-0.5 rounded-full', meta.bg, meta.color)}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                        {n.actionUrl && (
                          <a
                            href={n.actionUrl}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                          >
                            View details →
                          </a>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {readingId === n.id && (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        )}
                        {!n.isRead && readingId !== n.id && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Page {page + 1} of {totalPages} · {total} total
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm" variant="outline"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 0 || loading}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Prev
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1 || loading}
                      className="gap-1"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
