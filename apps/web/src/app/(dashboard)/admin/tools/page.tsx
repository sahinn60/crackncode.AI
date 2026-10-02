'use client';

import * as React from 'react';
import { Search, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Star, ChevronLeft, ChevronRight, Zap, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

const PAGE_SIZE = 20;

const EMPTY_TOOL = {
  name: '', slug: '', description: '', shortDescription: '', categoryId: '',
  isPremium: false, isFeatured: false, isActive: true, sortOrder: 0,
  configuration: {
    systemPrompt: '', userPromptTemplate: '', inputSchema: '{}',
    outputFormat: 'text', aiModel: 'gpt-4o', maxTokens: 2048,
    temperature: 0.7, creditCost: 1,
  },
};

/* ── Reusable primitives ──────────────────────────────────────────────────── */
function Btn({
  children, onClick, disabled, variant = 'primary', size = 'md', className, type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'outline' && 'border border-border bg-background text-foreground hover:bg-accent',
        variant === 'ghost'   && 'text-muted-foreground hover:bg-accent hover:text-foreground',
        variant === 'danger'  && 'text-destructive hover:bg-destructive/10',
        className,
      )}
    >
      {children}
    </button>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>}
      <input
        {...props}
        className={cn(
          'w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          props.className,
        )}
      />
    </div>
  );
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>}
      <textarea
        {...props}
        className={cn(
          'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none',
          props.className,
        )}
      />
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function AdminToolsPage() {
  const [items, setItems]       = React.useState<any[]>([]);
  const [total, setTotal]       = React.useState(0);
  const [page, setPage]         = React.useState(0);
  const [search, setSearch]     = React.useState('');
  const [loading, setLoading]   = React.useState(true);
  const [error, setError]       = React.useState<string | null>(null);
  const [acting, setActing]     = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [modal, setModal]       = React.useState<{ mode: 'create' | 'edit'; tool: any } | null>(null);
  const [saving, setSaving]     = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const d = await apiClient.admin.tools({ skip: page * PAGE_SIZE, take: PAGE_SIZE, search: search || undefined });
      const r = (d as any)?.data ?? d;
      setItems(r.items ?? r.data ?? []);
      setTotal(r.total ?? 0);
    } catch (e: any) { setError(e?.message ?? 'Failed to load tools'); }
    finally { setLoading(false); }
  }, [page, search]);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    apiClient.categories.list().then(d => {
      const r = (d as any)?.data ?? d;
      setCategories(Array.isArray(r) ? r : r?.data ?? []);
    }).catch(() => {});
  }, []);

  const act = async (id: string, fn: () => Promise<any>) => {
    setActing(id);
    try { await fn(); await load(); } catch (e: any) { alert(e?.message); }
    finally { setActing(null); }
  };

  const openCreate = () => setModal({ mode: 'create', tool: JSON.parse(JSON.stringify(EMPTY_TOOL)) });
  const openEdit   = (tool: any) => setModal({
    mode: 'edit',
    tool: { ...tool, configuration: tool.configuration ?? { ...EMPTY_TOOL.configuration } },
  });

  const handleSave = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      const { configuration, ...toolData } = modal.tool;
      const payload = {
        ...toolData,
        configuration: {
          ...configuration,
          inputSchema: (() => { try { return JSON.parse(configuration.inputSchema); } catch { return {}; } })(),
          maxTokens:   +configuration.maxTokens,
          temperature: +configuration.temperature,
          creditCost:  +configuration.creditCost,
        },
      };
      if (modal.mode === 'create') await apiClient.admin.createTool(payload);
      else await apiClient.admin.updateTool(modal.tool.id, payload);
      setModal(null);
      await load();
    } catch (e: any) { alert(e?.message); }
    finally { setSaving(false); }
  };

  const set     = (field: string, value: any) => setModal(m => m ? { ...m, tool: { ...m.tool, [field]: value } } : m);
  const setConf = (field: string, value: any) => setModal(m => m ? { ...m, tool: { ...m.tool, configuration: { ...m.tool.configuration, [field]: value } } } : m);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tools</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} tools total</p>
        </div>
        <Btn onClick={openCreate}><Plus className="h-4 w-4" /> New Tool</Btn>
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

      {/* Table card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <Btn variant="outline" size="sm" onClick={load}>Retry</Btn>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Zap className="h-8 w-8 opacity-30" />
            <p className="text-sm">No tools found</p>
            <Btn size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Create Tool</Btn>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Tool', 'Category', 'Credits', 'Usage', 'Flags', 'Status', ''].map(h => (
                    <th key={h} className={cn('px-4 py-3 text-xs font-semibold text-muted-foreground', h === '' ? 'text-right' : 'text-left')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono">{t.configuration?.creditCost ?? 1}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{(t.usageCount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {t.isPremium  && <span className="text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium">Premium</span>}
                        {t.isFeatured && <span className="text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">Featured</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', t.isActive ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground')}>
                        {t.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <Btn variant="ghost" size="sm" onClick={() => openEdit(t)} className="p-1.5">
                          <Pencil className="h-3.5 w-3.5" />
                        </Btn>
                        <Btn variant="ghost" size="sm" disabled={acting === t.id} onClick={() => act(t.id, () => apiClient.admin.updateTool(t.id, { isActive: !t.isActive }))} className="p-1.5">
                          {t.isActive ? <ToggleRight className="h-3.5 w-3.5 text-green-500" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                        </Btn>
                        <Btn variant="ghost" size="sm" disabled={acting === t.id} onClick={() => act(t.id, () => apiClient.admin.updateTool(t.id, { isFeatured: !t.isFeatured }))} className="p-1.5">
                          <Star className={cn('h-3.5 w-3.5', t.isFeatured ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground')} />
                        </Btn>
                        <Btn variant="danger" size="sm" disabled={acting === t.id} onClick={() => { if (confirm('Delete this tool?')) act(t.id, () => apiClient.admin.deleteTool(t.id)); }} className="p-1.5">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Btn>
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
              <Btn variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </Btn>
              <Btn variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Btn>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-background shadow-2xl overflow-y-auto max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                {modal.mode === 'create' ? 'Create Tool' : 'Edit Tool'}
              </h2>
              <button onClick={() => setModal(null)} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Name" value={modal.tool.name} onChange={e => set('name', e.target.value)} placeholder="Blog Writer" />
                <Input label="Slug" value={modal.tool.slug} onChange={e => set('slug', e.target.value)} placeholder="blog-writer" className="font-mono" />
              </div>

              <Textarea label="Description" value={modal.tool.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="What does this tool do?" />

              <Textarea label="Short Description (optional)" value={modal.tool.shortDescription ?? ''} onChange={e => set('shortDescription', e.target.value)} rows={1} placeholder="One-line summary" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                  <select
                    value={modal.tool.categoryId}
                    onChange={e => set('categoryId', e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select category…</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Input label="Sort Order" type="number" value={modal.tool.sortOrder} onChange={e => set('sortOrder', +e.target.value)} />
              </div>

              <div className="flex gap-5">
                {[
                  { field: 'isPremium',  label: 'Premium' },
                  { field: 'isFeatured', label: 'Featured' },
                  { field: 'isActive',   label: 'Active' },
                ].map(({ field, label }) => (
                  <label key={field} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={modal.tool[field]}
                      onChange={e => set(field, e.target.checked)}
                      className="rounded border-input"
                    />
                    {label}
                  </label>
                ))}
              </div>

              {/* AI Config */}
              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">AI Configuration</p>

                <Textarea label="System Prompt" value={modal.tool.configuration.systemPrompt} onChange={e => setConf('systemPrompt', e.target.value)} rows={3} className="font-mono text-xs" placeholder="You are a helpful AI assistant..." />

                <Textarea label="User Prompt Template" value={modal.tool.configuration.userPromptTemplate} onChange={e => setConf('userPromptTemplate', e.target.value)} rows={2} className="font-mono text-xs" placeholder="Write about: {{topic}}" />

                <Textarea label="Input Schema (JSON)" value={modal.tool.configuration.inputSchema} onChange={e => setConf('inputSchema', e.target.value)} rows={3} className="font-mono text-xs" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Output Format</label>
                    <select
                      value={modal.tool.configuration.outputFormat}
                      onChange={e => setConf('outputFormat', e.target.value)}
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {['text', 'markdown', 'html', 'json', 'code'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">AI Model</label>
                    <select
                      value={modal.tool.configuration.aiModel}
                      onChange={e => setConf('aiModel', e.target.value)}
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Input label="Max Tokens" type="number" value={modal.tool.configuration.maxTokens} onChange={e => setConf('maxTokens', e.target.value)} />
                  <Input label="Temperature" type="number" step="0.1" min="0" max="2" value={modal.tool.configuration.temperature} onChange={e => setConf('temperature', e.target.value)} />
                  <Input label="Credit Cost" type="number" value={modal.tool.configuration.creditCost} onChange={e => setConf('creditCost', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <Btn variant="outline" size="sm" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn size="sm" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {saving ? 'Saving…' : modal.mode === 'create' ? 'Create Tool' : 'Save Changes'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
