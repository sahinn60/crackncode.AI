'use client';

import * as React from 'react';
import { Card, CardContent, Button, cn } from '@crackncode/ui';
import { Search, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Star, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ListSkeleton, ErrorState, EmptyState } from '@/components/dashboard/states';

const PAGE_SIZE = 20;

const EMPTY_TOOL = {
  name: '', slug: '', description: '', shortDescription: '', categoryId: '',
  isPremium: false, isFeatured: false, isActive: true, sortOrder: 0,
  configuration: { systemPrompt: '', userPromptTemplate: '', inputSchema: '{}', outputFormat: 'text', aiModel: 'gpt-4o', maxTokens: 2048, temperature: 0.7, creditCost: 1 },
};

export default function AdminToolsPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [acting, setActing] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [modal, setModal] = React.useState<{ mode: 'create' | 'edit'; tool: any } | null>(null);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const d = await apiClient.admin.tools({ skip: page * PAGE_SIZE, take: PAGE_SIZE, search: search || undefined });
      const r = (d as any)?.data ?? d;
      setItems(r.items ?? []); setTotal(r.total ?? 0);
    } catch (e: any) { setError(e?.message); }
    finally { setLoading(false); }
  }, [page, search]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    apiClient.categories.list().then(d => {
      const r = (d as any)?.data ?? d;
      setCategories(Array.isArray(r) ? r : []);
    });
  }, []);

  const act = async (id: string, fn: () => Promise<any>) => {
    setActing(id);
    try { await fn(); await load(); } catch (e: any) { alert(e?.message); }
    finally { setActing(null); }
  };

  const openCreate = () => setModal({ mode: 'create', tool: JSON.parse(JSON.stringify(EMPTY_TOOL)) });
  const openEdit = (tool: any) => setModal({
    mode: 'edit',
    tool: {
      ...tool,
      configuration: tool.configuration ?? { ...EMPTY_TOOL.configuration },
    },
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
          maxTokens: +configuration.maxTokens,
          temperature: +configuration.temperature,
          creditCost: +configuration.creditCost,
        },
      };
      if (modal.mode === 'create') await apiClient.admin.createTool(payload);
      else await apiClient.admin.updateTool(modal.tool.id, payload);
      setModal(null);
      await load();
    } catch (e: any) { alert(e?.message); }
    finally { setSaving(false); }
  };

  const set = (field: string, value: any) => setModal(m => m ? { ...m, tool: { ...m.tool, [field]: value } } : m);
  const setConf = (field: string, value: any) => setModal(m => m ? { ...m, tool: { ...m.tool, configuration: { ...m.tool.configuration, [field]: value } } } : m);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tools</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} tools</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5"><Plus className="h-4 w-4" /> New Tool</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search tools…" className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <ListSkeleton count={8} /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? (
            <EmptyState icon={Zap} title="No tools found" action={<Button size="sm" onClick={openCreate} className="gap-1"><Plus className="h-3.5 w-3.5" />Create Tool</Button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Tool</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Credits</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Usage</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Flags</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
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
                      <td className="px-4 py-3 text-xs text-muted-foreground">{t.usageCount?.toLocaleString() ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {t.isPremium && <span className="text-2xs bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Premium</span>}
                          {t.isFeatured && <span className="text-2xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">Featured</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', t.isActive ? 'bg-green-500/10 text-green-700' : 'bg-muted text-muted-foreground')}>
                          {t.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(t)} title="Edit" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => act(t.id, () => apiClient.admin.updateTool(t.id, { isActive: !t.isActive }))} disabled={acting === t.id} title={t.isActive ? 'Disable' : 'Enable'} className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50">
                            {t.isActive ? <ToggleRight className="h-3.5 w-3.5 text-green-600" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => act(t.id, () => apiClient.admin.updateTool(t.id, { isFeatured: !t.isFeatured }))} disabled={acting === t.id} title="Toggle featured" className="rounded p-1.5 transition-colors disabled:opacity-50">
                            <Star className={cn('h-3.5 w-3.5', t.isFeatured ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground')} />
                          </button>
                          <button onClick={() => { if (confirm('Delete this tool?')) act(t.id, () => apiClient.admin.deleteTool(t.id)); }} disabled={acting === t.id} title="Delete" className="rounded p-1.5 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 0} className="gap-1"><ChevronLeft className="h-3.5 w-3.5" />Prev</Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="gap-1">Next<ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-background shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold">{modal.mode === 'create' ? 'Create Tool' : 'Edit Tool'}</h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground">Name</label><input value={modal.tool.name} onChange={e => set('name', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Slug</label><input value={modal.tool.slug} onChange={e => set('slug', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Description</label><textarea value={modal.tool.description} onChange={e => set('description', e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select value={modal.tool.categoryId} onChange={e => set('categoryId', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Select…</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Credit Cost</label><input type="number" value={modal.tool.configuration.creditCost} onChange={e => setConf('creditCost', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={modal.tool.isPremium} onChange={e => set('isPremium', e.target.checked)} className="rounded" />Premium</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={modal.tool.isFeatured} onChange={e => set('isFeatured', e.target.checked)} className="rounded" />Featured</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={modal.tool.isActive} onChange={e => set('isActive', e.target.checked)} className="rounded" />Active</label>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">AI Configuration</p>
                <div><label className="text-xs font-medium text-muted-foreground">System Prompt</label><textarea value={modal.tool.configuration.systemPrompt} onChange={e => setConf('systemPrompt', e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                <div className="mt-3"><label className="text-xs font-medium text-muted-foreground">User Prompt Template</label><textarea value={modal.tool.configuration.userPromptTemplate} onChange={e => setConf('userPromptTemplate', e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div><label className="text-xs font-medium text-muted-foreground">Model</label><input value={modal.tool.configuration.aiModel} onChange={e => setConf('aiModel', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Max Tokens</label><input type="number" value={modal.tool.configuration.maxTokens} onChange={e => setConf('maxTokens', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Temperature</label><input type="number" step="0.1" min="0" max="2" value={modal.tool.configuration.temperature} onChange={e => setConf('temperature', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : modal.mode === 'create' ? 'Create Tool' : 'Save Changes'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
