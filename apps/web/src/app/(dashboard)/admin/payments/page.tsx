'use client';

import * as React from 'react';
import { Card, CardContent, Button, cn } from '@crackncode/ui';
import { ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ListSkeleton, ErrorState, EmptyState } from '@/components/dashboard/states';

type Tab = 'payments' | 'subscriptions' | 'invoices';
const PAGE_SIZE = 20;

const PAY_STATUS_COLOR: Record<string, string> = {
  succeeded: 'bg-green-500/10 text-green-700',
  pending:   'bg-amber-500/10 text-amber-700',
  failed:    'bg-red-500/10 text-red-700',
  refunded:  'bg-blue-500/10 text-blue-700',
};

const SUB_STATUS_COLOR: Record<string, string> = {
  active:    'bg-green-500/10 text-green-700',
  trialing:  'bg-blue-500/10 text-blue-700',
  past_due:  'bg-amber-500/10 text-amber-700',
  canceled:  'bg-muted text-muted-foreground',
  unpaid:    'bg-red-500/10 text-red-700',
};

export default function AdminPaymentsPage() {
  const [tab, setTab] = React.useState<Tab>('payments');
  const [items, setItems] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let d: any;
      const p = { skip: page * PAGE_SIZE, take: PAGE_SIZE, status: statusFilter || undefined };
      if (tab === 'payments') d = await apiClient.admin.payments(p);
      else if (tab === 'subscriptions') d = await apiClient.admin.subscriptions(p);
      else d = await apiClient.admin.invoices(page * PAGE_SIZE, PAGE_SIZE);
      const r = (d as any)?.data ?? d;
      setItems(r.items ?? []); setTotal(r.total ?? 0);
    } catch (e: any) { setError(e?.message); }
    finally { setLoading(false); }
  }, [tab, page, statusFilter]);

  React.useEffect(() => { setPage(0); }, [tab, statusFilter]);
  React.useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">Transactions, subscriptions, and invoices</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['payments', 'subscriptions', 'invoices'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px', tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {t}
          </button>
        ))}
      </div>

      {/* Status filter */}
      {tab !== 'invoices' && (
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">All statuses</option>
          {tab === 'payments'
            ? ['succeeded', 'pending', 'failed', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)
            : ['active', 'trialing', 'past_due', 'canceled', 'unpaid'].map(s => <option key={s} value={s}>{s}</option>)
          }
        </select>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? <ListSkeleton count={8} /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? (
            <EmptyState icon={DollarSign} title={`No ${tab}`} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {tab === 'payments' && <>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                    </>}
                    {tab === 'subscriptions' && <>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Interval</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Period End</th>
                    </>}
                    {tab === 'invoices' && <>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Number</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Amount Due</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                    </>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      {tab === 'payments' && <>
                        <td className="px-4 py-3"><p className="font-medium">{item.user?.profile?.name ?? item.user?.email ?? '—'}</p><p className="text-xs text-muted-foreground">{item.user?.email}</p></td>
                        <td className="px-4 py-3 font-semibold">${Number(item.amountUsd).toFixed(2)}</td>
                        <td className="px-4 py-3"><span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', PAY_STATUS_COLOR[item.status] ?? '')}>{item.status}</span></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{item.subscription?.plan?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{item.paidAt ? new Date(item.paidAt).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}</td>
                      </>}
                      {tab === 'subscriptions' && <>
                        <td className="px-4 py-3"><p className="font-medium">{item.user?.profile?.name ?? item.user?.email ?? '—'}</p><p className="text-xs text-muted-foreground">{item.user?.email}</p></td>
                        <td className="px-4 py-3 text-xs">{item.plan?.name ?? '—'}</td>
                        <td className="px-4 py-3"><span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', SUB_STATUS_COLOR[item.status] ?? '')}>{item.status}</span></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{item.billingInterval}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{item.currentPeriodEnd ? new Date(item.currentPeriodEnd).toLocaleDateString() : '—'}</td>
                      </>}
                      {tab === 'invoices' && <>
                        <td className="px-4 py-3"><p className="font-medium">{item.subscription?.user?.profile?.name ?? item.subscription?.user?.email ?? '—'}</p></td>
                        <td className="px-4 py-3 text-xs font-mono">{item.number ?? item.stripeInvoiceId?.slice(0, 12) ?? '—'}</td>
                        <td className="px-4 py-3 font-semibold">${Number(item.amountDue).toFixed(2)}</td>
                        <td className="px-4 py-3"><span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', item.status === 'paid' ? 'bg-green-500/10 text-green-700' : 'bg-amber-500/10 text-amber-700')}>{item.status}</span></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</td>
                      </>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages} · {total} records</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 0} className="gap-1"><ChevronLeft className="h-3.5 w-3.5" />Prev</Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="gap-1">Next<ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
