'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from '@crackncode/ui';
import { Search, UserCheck, UserX, Trash2, CreditCard, Coins, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ListSkeleton, ErrorState, EmptyState } from '@/components/dashboard/states';

const STATUS_COLOR: Record<string, string> = {
  active:    'bg-green-500/10 text-green-700',
  suspended: 'bg-amber-500/10 text-amber-700',
  deleted:   'bg-red-500/10 text-red-700',
};

const ROLE_COLOR: Record<string, string> = {
  admin:         'bg-red-500/10 text-red-700',
  support_agent: 'bg-blue-500/10 text-blue-700',
  user:          'bg-muted text-muted-foreground',
};

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [acting, setActing] = React.useState<string | null>(null);

  // Credit adjust modal state
  const [creditModal, setCreditModal] = React.useState<{ userId: string; name: string } | null>(null);
  const [creditAmount, setCreditAmount] = React.useState('');
  const [creditDesc, setCreditDesc] = React.useState('');

  // Plan change modal
  const [planModal, setPlanModal] = React.useState<{ userId: string; name: string } | null>(null);
  const [plans, setPlans] = React.useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const d = await apiClient.admin.users({ skip: page * PAGE_SIZE, take: PAGE_SIZE, search: search || undefined, status: status || undefined });
      const r = (d as any)?.data ?? d;
      setItems(r.items ?? []);
      setTotal(r.total ?? 0);
    } catch (e: any) { setError(e?.message); }
    finally { setLoading(false); }
  }, [page, search, status]);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    apiClient.admin.plans().then((d) => {
      const r = (d as any)?.data ?? d;
      setPlans(Array.isArray(r) ? r : []);
    });
  }, []);

  const act = async (id: string, fn: () => Promise<any>) => {
    setActing(id);
    try { await fn(); await load(); } catch (e: any) { alert(e?.message); }
    finally { setActing(null); }
  };

  const handleCreditAdjust = async () => {
    if (!creditModal || !creditAmount) return;
    await act(creditModal.userId, () =>
      apiClient.admin.adjustCredits({ userId: creditModal.userId, amount: +creditAmount, description: creditDesc || 'Admin adjustment' })
    );
    setCreditModal(null); setCreditAmount(''); setCreditDesc('');
  };

  const handlePlanChange = async () => {
    if (!planModal || !selectedPlan) return;
    await act(planModal.userId, () => apiClient.admin.changeUserPlan(planModal.userId, selectedPlan));
    setPlanModal(null); setSelectedPlan('');
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name or email…"
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <ListSkeleton count={8} /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? (
            <EmptyState icon={Search} title="No users found" description="Try adjusting your search or filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Credits</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Generations</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Joined</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{u.profile?.name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', ROLE_COLOR[u.role] ?? ROLE_COLOR.user)}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_COLOR[u.status] ?? STATUS_COLOR.active)}>{u.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.subscription?.plan?.name ?? 'Free'}</td>
                      <td className="px-4 py-3 text-xs font-mono">{u.creditAccount?.balance?.toLocaleString() ?? 0}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{u._count?.generations ?? 0}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {u.status === 'active' ? (
                            <button onClick={() => act(u.id, () => apiClient.admin.suspendUser(u.id))} disabled={acting === u.id} title="Suspend" className="rounded p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors disabled:opacity-50">
                              <UserX className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button onClick={() => act(u.id, () => apiClient.admin.activateUser(u.id))} disabled={acting === u.id} title="Activate" className="rounded p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors disabled:opacity-50">
                              <UserCheck className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => { setPlanModal({ userId: u.id, name: u.profile?.name ?? u.email }); setSelectedPlan(u.subscription?.planId ?? ''); }} title="Change plan" className="rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                            <CreditCard className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { setCreditModal({ userId: u.id, name: u.profile?.name ?? u.email }); }} title="Adjust credits" className="rounded p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                            <Coins className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { if (confirm('Delete this user?')) act(u.id, () => apiClient.admin.deleteUser(u.id)); }} disabled={acting === u.id} title="Delete" className="rounded p-1.5 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages} · {total} users</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 0} className="gap-1">
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="gap-1">
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit adjust modal */}
      {creditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl">
            <h2 className="text-base font-semibold mb-1">Adjust Credits</h2>
            <p className="text-sm text-muted-foreground mb-4">{creditModal.name}</p>
            <input type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="Amount (negative to deduct)" className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <input value={creditDesc} onChange={e => setCreditDesc(e.target.value)} placeholder="Description (optional)" className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setCreditModal(null)}>Cancel</Button>
              <Button size="sm" onClick={handleCreditAdjust} disabled={!creditAmount}>Apply</Button>
            </div>
          </div>
        </div>
      )}

      {/* Plan change modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl">
            <h2 className="text-base font-semibold mb-1">Change Plan</h2>
            <p className="text-sm text-muted-foreground mb-4">{planModal.name}</p>
            <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Select plan…</option>
              {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setPlanModal(null)}>Cancel</Button>
              <Button size="sm" onClick={handlePlanChange} disabled={!selectedPlan}>Apply</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
