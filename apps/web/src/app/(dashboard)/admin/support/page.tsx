'use client';

import * as React from 'react';
import { Card, CardContent, Button, cn } from '@crackncode/ui';
import { MessageCircle, UserCheck, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ListSkeleton, ErrorState, EmptyState } from '@/components/dashboard/states';

type Status = 'waiting' | 'ai_active' | 'assigned' | 'active' | 'resolved' | 'closed';
const TABS: { key: Status | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'active', label: 'Active' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];
const STATUS_COLOR: Record<string, string> = {
  waiting:   'bg-amber-500/10 text-amber-700',
  ai_active: 'bg-primary/10 text-primary',
  assigned:  'bg-blue-500/10 text-blue-700',
  active:    'bg-green-500/10 text-green-700',
  resolved:  'bg-muted text-muted-foreground',
  closed:    'bg-muted text-muted-foreground',
};
const PAGE_SIZE = 20;

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export default function AdminSupportPage() {
  const [tab, setTab] = React.useState<Status | 'all'>('all');
  const [items, setItems] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [acting, setActing] = React.useState<string | null>(null);
  const [agents, setAgents] = React.useState<any[]>([]);
  const [assignModal, setAssignModal] = React.useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const d = await apiClient.adminSupport.conversations(tab === 'all' ? undefined : tab, page * PAGE_SIZE, PAGE_SIZE);
      const r = (d as any)?.data ?? d;
      setItems(r.items ?? []); setTotal(r.total ?? 0);
    } catch (e: any) { setError(e?.message); }
    finally { setLoading(false); }
  }, [tab, page]);

  React.useEffect(() => { setPage(0); }, [tab]);
  React.useEffect(() => { load(); }, [load]);

  // Load agents (admin users)
  React.useEffect(() => {
    apiClient.admin.users({ take: 100 }).then(d => {
      const r = (d as any)?.data ?? d;
      setAgents((r.items ?? []).filter((u: any) => u.role === 'admin' || u.role === 'support_agent'));
    });
  }, []);

  const act = async (id: string, fn: () => Promise<any>) => {
    setActing(id);
    try { await fn(); await load(); } catch (e: any) { alert(e?.message); }
    finally { setActing(null); }
  };

  const handleAssign = async () => {
    if (!assignModal || !selectedAgent) return;
    await act(assignModal, () => apiClient.agent.assign(assignModal, selectedAgent));
    setAssignModal(null); setSelectedAgent('');
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Support</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all support conversations</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} className={cn('px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px', tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <ListSkeleton count={8} /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? (
            <EmptyState icon={MessageCircle} title="No conversations" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Last Message</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((conv) => (
                    <tr key={conv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{conv.user?.profile?.name ?? conv.user?.email ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{conv.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{conv.subject ?? conv.messages?.[0]?.content ?? '—'}</td>
                      <td className="px-4 py-3"><span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_COLOR[conv.status] ?? '')}>{conv.status.replace('_', ' ')}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{conv.assignedAgent?.profile?.name ?? conv.assignedAgent?.email ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setAssignModal(conv.id); setSelectedAgent(conv.assignedAgentId ?? ''); }} title="Assign" className="rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                            <UserCheck className="h-3.5 w-3.5" />
                          </button>
                          {['assigned', 'active', 'waiting', 'ai_active'].includes(conv.status) && (
                            <button onClick={() => act(conv.id, () => apiClient.agent.resolve(conv.id))} disabled={acting === conv.id} title="Resolve" className="rounded p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors disabled:opacity-50">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {['resolved', 'closed'].includes(conv.status) && (
                            <button onClick={() => act(conv.id, () => apiClient.agent.reopen(conv.id))} disabled={acting === conv.id} title="Reopen" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50">
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages} · {total} conversations</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 0} className="gap-1"><ChevronLeft className="h-3.5 w-3.5" />Prev</Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="gap-1">Next<ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl">
            <h2 className="text-base font-semibold mb-4">Assign Conversation</h2>
            <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Select agent…</option>
              {agents.map((a: any) => <option key={a.id} value={a.id}>{a.profile?.name ?? a.email}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAssignModal(null)}>Cancel</Button>
              <Button size="sm" onClick={handleAssign} disabled={!selectedAgent}>Assign</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
