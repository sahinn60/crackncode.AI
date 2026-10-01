'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, cn,
} from '@crackncode/ui';
import { PageHeader } from '@/components/layout/page-header';
import { StatSkeleton, ListSkeleton, ErrorState, EmptyState } from '@/components/dashboard/states';
import { useApi } from '@/hooks/use-api';
import { apiClient } from '@/lib/api-client';
import {
  Coins, TrendingUp, TrendingDown, ArrowRight,
  ChevronLeft, ChevronRight, Loader2,
  Gift, ShoppingCart, RefreshCw, Zap, Settings, Calendar,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString();
}

const TX_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  usage:              { label: 'Generation',         icon: Zap,          color: 'text-destructive bg-destructive/10' },
  purchase:           { label: 'Purchase',           icon: ShoppingCart, color: 'text-success bg-success/10' },
  monthly_allocation: { label: 'Monthly Allocation', icon: Calendar,     color: 'text-primary bg-primary/10' },
  bonus:              { label: 'Bonus',              icon: Gift,         color: 'text-warning bg-warning/10' },
  refund:             { label: 'Refund',             icon: RefreshCw,    color: 'text-success bg-success/10' },
  admin_adjustment:   { label: 'Admin Adjustment',   icon: Settings,     color: 'text-muted-foreground bg-muted' },
  grant:              { label: 'Grant',              icon: Gift,         color: 'text-success bg-success/10' },
  expiry:             { label: 'Expiry',             icon: TrendingDown, color: 'text-destructive bg-destructive/10' },
};

function txMeta(type: string) {
  return TX_META[type] ?? { label: type, icon: Coins, color: 'text-muted-foreground bg-muted' };
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, highlight,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ElementType;
  highlight?: 'warning' | 'success' | 'destructive';
}) {
  const colorMap = {
    warning: 'text-warning',
    success: 'text-success',
    destructive: 'text-destructive',
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className={cn('h-5 w-5', highlight ? colorMap[highlight] : 'text-muted-foreground')} />
        </div>
        <p className={cn('text-3xl font-bold', highlight ? colorMap[highlight] : 'text-foreground')}>
          {value.toLocaleString()}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function CreditsPage() {
  const account = useApi(() => apiClient.credits.account());
  const [page, setPage] = React.useState(0);
  const txData = useApi(
    () => apiClient.credits.transactions(page * PAGE_SIZE, PAGE_SIZE),
    [page],
  );

  const acc = account.data as any;
  const balance: number        = acc?.balance ?? 0;
  const totalAllocated: number = acc?.totalAllocated ?? 0;
  const totalUsed: number      = acc?.totalUsed ?? 0;
  const totalPurchased: number = acc?.totalPurchased ?? 0;
  const totalRefunded: number  = acc?.totalRefunded ?? 0;

  const txItems: any[] = (txData.data as any)?.items ?? [];
  const txTotal: number = (txData.data as any)?.total ?? 0;
  const totalPages = Math.ceil(txTotal / PAGE_SIZE);

  const usagePct = totalAllocated > 0 ? Math.min(100, Math.round((totalUsed / totalAllocated) * 100)) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credits"
        description="Track your credit balance and usage."
        breadcrumbs={[{ label: 'Credits' }]}
        actions={
          <Button size="sm" asChild>
            <Link href="/billing" className="gap-1.5">
              Buy Credits <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {account.loading ? (
          <><StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
        ) : account.error ? (
          <div className="col-span-4">
            <ErrorState message={account.error} onRetry={account.refetch} />
          </div>
        ) : (
          <>
            <StatCard label="Balance"         value={balance}        sub="credits remaining"  icon={Coins}       highlight="warning" />
            <StatCard label="Used"            value={totalUsed}      sub={`${usagePct}% of allocated`} icon={TrendingUp} />
            <StatCard label="Total Allocated" value={totalAllocated} sub="all time"            icon={Calendar}    highlight="success" />
            <StatCard label="Purchased"       value={totalPurchased} sub="via billing"         icon={ShoppingCart} />
          </>
        )}
      </div>

      {/* ── Usage bar ── */}
      {!account.loading && !account.error && totalAllocated > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between mb-2 text-sm">
              <span className="font-medium text-foreground">Credit Usage</span>
              <span className="text-muted-foreground">
                {totalUsed.toLocaleString()} used · {totalRefunded.toLocaleString()} refunded · {balance.toLocaleString()} remaining
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  usagePct >= 90 ? 'bg-destructive' : usagePct >= 70 ? 'bg-warning' : 'bg-primary',
                )}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{usagePct}% used</p>
          </CardContent>
        </Card>
      )}

      {/* ── Transaction ledger ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                {txTotal > 0 ? `${txTotal} total transactions` : 'All credit activity'}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={txData.refetch} className="gap-1.5 h-8">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {txData.loading ? (
            <ListSkeleton count={8} />
          ) : txData.error ? (
            <div className="p-6">
              <ErrorState message={txData.error} onRetry={txData.refetch} />
            </div>
          ) : txItems.length === 0 ? (
            <EmptyState icon={Coins} title="No transactions yet" description="Credit activity will appear here." />
          ) : (
            <ul>
              {txItems.map((tx: any, i: number) => {
                const meta = txMeta(tx.type);
                const Icon = meta.icon;
                const isCredit = tx.amount > 0;
                return (
                  <li
                    key={tx.id}
                    className={cn(
                      'flex items-center gap-4 px-5 py-3.5',
                      i < txItems.length - 1 && 'border-b border-border',
                    )}
                  >
                    {/* Icon */}
                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', meta.color)}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{tx.description}</p>
                        <Badge variant="outline" className="text-2xs">{meta.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(tx.createdAt)}</p>
                    </div>

                    {/* Amount + balance */}
                    <div className="text-right shrink-0">
                      <p className={cn('text-sm font-bold tabular-nums', isCredit ? 'text-success' : 'text-destructive')}>
                        {isCredit ? '+' : ''}{tx.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        bal: {tx.balanceAfter?.toLocaleString() ?? '—'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages} · {txTotal} transactions
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="icon" className="h-7 w-7"
                  disabled={page === 0 || txData.loading}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {txData.loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-1" />}
                <Button
                  variant="outline" size="icon" className="h-7 w-7"
                  disabled={page >= totalPages - 1 || txData.loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
