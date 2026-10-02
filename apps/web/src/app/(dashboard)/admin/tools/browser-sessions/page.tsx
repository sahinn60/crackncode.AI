'use client';

import * as React from 'react';
import {
  Plus, Search, Pencil, Trash2, Globe, Loader2, X,
  Wifi, WifiOff, RefreshCw, ShieldCheck, Power, PowerOff,
  ExternalLink, Star, ChevronLeft, ChevronRight, AlertCircle,
  CheckCircle2, Clock, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { BrowserToolConnectionModal } from '@/components/browser-tools/BrowserToolConnectionModal';
import { BrowserToolForm } from '@/components/browser-tools/BrowserToolForm';

/* ── Status badge ─────────────────────────────────────────────────────────── */
function ConnectionBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    CONNECTED:    { label: 'Connected',    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
    CONNECTING:   { label: 'Connecting…',  className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',         icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    EXPIRED:      { label: 'Expired',      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',      icon: <Clock className="h-3 w-3" /> },
    ERROR:        { label: 'Error',        className: 'bg-red-500/10 text-red-400 border-red-500/20',            icon: <AlertCircle className="h-3 w-3" /> },
    DISCONNECTED: { label: 'Disconnected', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',         icon: <WifiOff className="h-3 w-3" /> },
    PENDING:      { label: 'Pending',      className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',         icon: <Clock className="h-3 w-3" /> },
  };
  const cfg = map[status ?? 'DISCONNECTED'] ?? map['DISCONNECTED'];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', cfg.className)}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function ToolStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:   'bg-emerald-500/10 text-emerald-400',
    inactive: 'bg-zinc-500/10 text-zinc-400',
    draft:    'bg-amber-500/10 text-amber-400',
  };
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', map[status] ?? map.draft)}>
      {status}
    </span>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
const PAGE_SIZE = 20;

export default function BrowserSessionsPage() {
  const [items, setItems]         = React.useState<any[]>([]);
  const [total, setTotal]         = React.useState(0);
  const [page, setPage]           = React.useState(0);
  const [search, setSearch]       = React.useState('');
  const [loading, setLoading]     = React.useState(true);
  const [error, setError]         = React.useState<string | null>(null);
  const [acting, setActing]       = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<any[]>([]);

  // Modals
  const [formModal, setFormModal]   = React.useState<{ mode: 'create' | 'edit'; tool?: any } | null>(null);
  const [connectModal, setConnectModal] = React.useState<any | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const d = await apiClient.browserTools.adminList({ skip: page * PAGE_SIZE, take: PAGE_SIZE, search: search || undefined });
      const r = (d as any)?.data ?? d;
      setItems(r.items ?? []);
      setTotal(r.total ?? 0);
    } catch (e: any) { setError(e?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, [page, search]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    apiClient.categories.list().then(d => {
      const r = (d as any)?.data ?? d;
      setCategories(Array.isArray(r) ? r : r?.data ?? []);
    }).catch(() => {});
  }, []);

  const act = async (id: string, fn: () => Promise<any>, successMsg?: string) => {
    setActing(id);
    try { await fn(); await load(); if (successMsg) alert(successMsg); }
    catch (e: any) { alert(e?.message ?? 'Action failed'); }
    finally { setActing(null); }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Browser Session Tools</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage authorized browser-based tool connections — {total} tools
          </p>
        </div>
        <button
          onClick={() => setFormModal({ mode: 'create' })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Tool
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search tools…"
          className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={load} className="text-xs text-primary hover:underline">Retry</button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Globe className="h-8 w-8 opacity-30" />
            <p className="text-sm">No browser tools yet</p>
            <button onClick={() => setFormModal({ mode: 'create' })} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus className="h-3.5 w-3.5" /> Create your first tool
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Tool', 'Website', 'Category', 'Price', 'Status', 'Connection', 'Last Verified', 'Actions'].map(h => (
                    <th key={h} className={cn('px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap', h === 'Actions' ? 'text-right' : 'text-left')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    {/* Tool */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {t.imageUrl ? (
                          <img src={t.imageUrl} alt={t.name} className="h-8 w-8 rounded-lg object-cover border border-border" />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-foreground text-sm">{t.name}</p>
                            {t.featured && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Website */}
                    <td className="px-4 py-3">
                      <a href={t.websiteUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline max-w-[140px] truncate">
                        {new URL(t.websiteUrl).hostname}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.category?.name ?? '—'}</td>

                    {/* Price */}
                    <td className="px-4 py-3 text-xs font-mono">
                      {t.price ? `${t.currency} ${Number(t.price).toFixed(2)}` : 'Free'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3"><ToolStatusBadge status={t.status} /></td>

                    {/* Connection */}
                    <td className="px-4 py-3"><ConnectionBadge status={t.connection?.status} /></td>

                    {/* Last Verified */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {t.connection?.lastVerifiedAt
                        ? new Date(t.connection.lastVerifiedAt).toLocaleDateString()
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        {/* Connect / Reconnect */}
                        {(!t.connection || ['DISCONNECTED', 'PENDING', 'ERROR', 'EXPIRED'].includes(t.connection?.status)) ? (
                          <ActionBtn title="Connect Account" onClick={() => setConnectModal(t)} disabled={acting === t.id}>
                            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                          </ActionBtn>
                        ) : (
                          <ActionBtn title="Reconnect" onClick={() => setConnectModal(t)} disabled={acting === t.id}>
                            <RefreshCw className="h-3.5 w-3.5 text-blue-400" />
                          </ActionBtn>
                        )}

                        {/* Verify */}
                        {t.connection?.status === 'CONNECTED' && (
                          <ActionBtn title="Verify Connection" disabled={acting === t.id}
                            onClick={() => act(t.id, () => apiClient.browserTools.verify(t.id))}>
                            <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
                          </ActionBtn>
                        )}

                        {/* Disconnect */}
                        {t.connection?.status === 'CONNECTED' && (
                          <ActionBtn title="Disconnect" disabled={acting === t.id}
                            onClick={() => { if (confirm('Disconnect this tool?')) act(t.id, () => apiClient.browserTools.disconnect(t.id)); }}>
                            <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                          </ActionBtn>
                        )}

                        {/* Enable / Disable */}
                        <ActionBtn
                          title={t.status === 'active' ? 'Disable' : 'Enable'}
                          disabled={acting === t.id}
                          onClick={() => act(t.id, () => apiClient.browserTools.adminUpdate(t.id, { status: t.status === 'active' ? 'inactive' : 'active' }))}
                        >
                          {t.status === 'active'
                            ? <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
                            : <Power className="h-3.5 w-3.5 text-emerald-500" />}
                        </ActionBtn>

                        {/* Edit */}
                        <ActionBtn title="Edit" onClick={() => setFormModal({ mode: 'edit', tool: t })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </ActionBtn>

                        {/* Delete */}
                        <ActionBtn title="Delete" disabled={acting === t.id}
                          onClick={() => { if (confirm('Delete this tool?')) act(t.id, () => apiClient.browserTools.adminDelete(t.id)); }}
                          className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </ActionBtn>
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
            <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <PaginationBtn onClick={() => setPage(p => p - 1)} disabled={page === 0}><ChevronLeft className="h-3.5 w-3.5" /> Prev</PaginationBtn>
              <PaginationBtn onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next <ChevronRight className="h-3.5 w-3.5" /></PaginationBtn>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit form modal */}
      {formModal && (
        <BrowserToolForm
          mode={formModal.mode}
          tool={formModal.tool}
          categories={categories}
          onClose={() => setFormModal(null)}
          onSaved={() => { setFormModal(null); load(); }}
        />
      )}

      {/* Connection modal */}
      {connectModal && (
        <BrowserToolConnectionModal
          tool={connectModal}
          onClose={() => { setConnectModal(null); load(); }}
        />
      )}
    </div>
  );
}

function ActionBtn({ children, title, onClick, disabled, className }: {
  children: React.ReactNode; title: string; onClick?: () => void;
  disabled?: boolean; className?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn('rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40', className)}
    >
      {children}
    </button>
  );
}

function PaginationBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-40 transition-colors"
    >
      {children}
    </button>
  );
}
