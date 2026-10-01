'use client';

import * as React from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Check, Upload, ImageIcon } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Tool = {
  id: string; name: string; slug: string; description: string;
  shortDescription?: string; categoryId: string; category?: { id: string; name: string; slug: string };
  coverImageUrl?: string; iconUrl?: string; price?: number; currency: string;
  badge?: string; status: string; isFeatured: boolean; sortOrder: number;
  ctaText: string; destinationUrl?: string;
};
type Category = { id: string; name: string; slug: string };

const EMPTY: Partial<Tool> = {
  name: '', slug: '', description: '', shortDescription: '', categoryId: '',
  price: undefined, currency: 'BDT', badge: '', status: 'draft',
  isFeatured: false, sortOrder: 0, ctaText: 'Buy Now', destinationUrl: '', coverImageUrl: '',
};

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-500/15 text-emerald-400',
  draft:     'bg-zinc-500/15 text-zinc-400',
  archived:  'bg-red-500/15 text-red-400',
};

export default function AdminLandingPage() {
  const [tools, setTools]         = React.useState<Tool[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [stats, setStats]         = React.useState({ total: 0, published: 0, draft: 0, archived: 0 });
  const [search, setSearch]       = React.useState('');
  const [loading, setLoading]     = React.useState(true);
  const [modal, setModal]         = React.useState<'add' | 'edit' | null>(null);
  const [editing, setEditing]     = React.useState<Partial<Tool>>(EMPTY);
  const [deleteId, setDeleteId]   = React.useState<string | null>(null);
  const [saving, setSaving]       = React.useState(false);
  const [error, setError]         = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string>('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  const apiFetch = React.useCallback(async (path: string, opts?: RequestInit) => {
    const res = await fetch(`${API}/api/v1${path}`, {
      ...opts,
      credentials: 'include',
      headers: opts?.body instanceof FormData
        ? { ...(opts?.headers ?? {}) }
        : { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? 'Request failed');
    return json.data ?? json;
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [t, c, s] = await Promise.all([
        apiFetch(`/admin/landing-page/tools?take=100${search ? `&search=${search}` : ''}`),
        apiFetch('/landing-page/categories'),
        apiFetch('/admin/landing-page/stats'),
      ]);
      setTools(t.items ?? t);
      setCategories(Array.isArray(c) ? c : []);
      setStats(s);
    } catch { /* ignore */ }
    setLoading(false);
  }, [apiFetch, search]);

  React.useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing({ ...EMPTY }); setModal('add'); setError(''); setImagePreview('');
  };
  const openEdit = (t: Tool) => {
    setEditing({ ...t }); setModal('edit'); setError('');
    setImagePreview(t.coverImageUrl || t.iconUrl || '');
  };
  const closeModal = () => { setModal(null); setEditing(EMPTY); setError(''); setImagePreview(''); };

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Cloudinary via API
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const result = await apiFetch('/admin/upload/image', { method: 'POST', body: form });
      setEditing((prev) => ({ ...prev, coverImageUrl: result.url }));
    } catch (e: any) {
      setError(e.message);
      setImagePreview(editing.coverImageUrl || '');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setEditing((prev) => ({ ...prev, coverImageUrl: '' }));
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Save tool ─────────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true); setError('');
    try {
      const body = {
        ...editing,
        price: editing.price != null && editing.price !== ('' as any) ? Number(editing.price) : undefined,
        sortOrder: Number(editing.sortOrder ?? 0),
      };
      if (modal === 'add') await apiFetch('/admin/tools', { method: 'POST', body: JSON.stringify(body) });
      else await apiFetch(`/admin/tools/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      closeModal(); load();
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  const toggleStatus = async (tool: Tool) => {
    const ep = tool.status === 'published'
      ? `/admin/landing-page/tools/${tool.id}/archive`
      : `/admin/landing-page/tools/${tool.id}/publish`;
    try { await apiFetch(ep, { method: 'POST' }); load(); } catch { /* ignore */ }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try { await apiFetch(`/admin/tools/${deleteId}`, { method: 'DELETE' }); load(); } catch { /* ignore */ }
    setDeleteId(null);
  };

  const set = (field: keyof Tool) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setEditing((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Landing Page</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage AI Tools shown on the public landing page</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Tool
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Tools', value: stats.total },
          { label: 'Published',   value: stats.published, color: 'text-emerald-400' },
          { label: 'Draft',       value: stats.draft,     color: 'text-zinc-400' },
          { label: 'Archived',    value: stats.archived,  color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color ?? 'text-foreground'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tools..."
        className={inp}
      />

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Tool', 'Category', 'Price', 'Status', 'Featured', 'Order', ''].map((h) => (
                  <th key={h} className={`px-4 py-3 text-xs font-medium text-muted-foreground ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={7} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-muted" /></td>
                  </tr>
                ))
              ) : tools.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No tools yet. Click &quot;Add Tool&quot; to create one.</td></tr>
              ) : tools.map((tool) => {
                const img = tool.coverImageUrl || tool.iconUrl;
                return (
                  <tr key={tool.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center">
                          {img
                            ? <Image src={img} alt={tool.name} width={36} height={36} className="object-contain" />
                            : <span className="text-xs font-bold text-muted-foreground">{tool.name.charAt(0)}</span>}
                        </div>
                        <div>
                          <p className="font-medium text-foreground leading-none">{tool.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{tool.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tool.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-foreground">
                      {tool.price != null
                        ? `${tool.currency === 'BDT' ? '৳' : '$'}${Number(tool.price).toLocaleString()}`
                        : <span className="text-emerald-400">Free</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_COLORS[tool.status] ?? ''}`}>
                        {tool.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {tool.isFeatured ? <Check className="h-4 w-4 text-emerald-400" /> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tool.sortOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggleStatus(tool)} title={tool.status === 'published' ? 'Unpublish' : 'Publish'}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          {tool.status === 'published' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => openEdit(tool)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(tool.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">{modal === 'add' ? 'Add New Tool' : 'Edit Tool'}</h2>
              <button onClick={closeModal} className="rounded-md p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-6 space-y-4">
              {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

              {/* Image Upload */}
              <Field label="Tool Image">
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="h-20 w-20 shrink-0 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden">
                    {imagePreview
                      ? <img src={imagePreview} alt="preview" className="h-full w-full object-contain p-1" />
                      : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  {/* Buttons */}
                  <div className="flex flex-col gap-2">
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={handleFileChange} />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading...' : imagePreview ? 'Replace Image' : 'Upload Image'}
                    </button>
                    {imagePreview && (
                      <button type="button" onClick={removeImage} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                        <X className="h-4 w-4" /> Remove
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP · Max 5MB</p>
                  </div>
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Tool Name *"><input value={editing.name ?? ''} onChange={set('name')} className={inp} /></Field>
                <Field label="Slug *"><input value={editing.slug ?? ''} onChange={set('slug')} className={inp} /></Field>
              </div>

              <Field label="Description *">
                <textarea value={editing.description ?? ''} onChange={set('description')} rows={2} className={inp} />
              </Field>
              <Field label="Short Description">
                <input value={editing.shortDescription ?? ''} onChange={set('shortDescription')} className={inp} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category *">
                  <select value={editing.categoryId ?? ''} onChange={set('categoryId')} className={inp}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={editing.status ?? 'draft'} onChange={set('status')} className={inp}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Price">
                  <input type="number" min={0} value={editing.price ?? ''} onChange={set('price')} placeholder="Empty = Free" className={inp} />
                </Field>
                <Field label="Currency">
                  <select value={editing.currency ?? 'BDT'} onChange={set('currency')} className={inp}>
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Badge">
                  <select value={editing.badge ?? ''} onChange={set('badge')} className={inp}>
                    <option value="">None</option>
                    <option value="Popular">Popular</option>
                    <option value="Hot">Hot</option>
                    <option value="New">New</option>
                    <option value="Featured">Featured</option>
                  </select>
                </Field>
                <Field label="Display Order">
                  <input type="number" min={0} value={editing.sortOrder ?? 0} onChange={set('sortOrder')} className={inp} />
                </Field>
              </div>

              <Field label="CTA Button Text">
                <input value={editing.ctaText ?? 'Buy Now'} onChange={set('ctaText')} className={inp} />
              </Field>
              <Field label="Destination URL">
                <input value={editing.destinationUrl ?? ''} onChange={set('destinationUrl')} placeholder="/tools/slug or https://..." className={inp} />
              </Field>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isFeatured ?? false}
                  onChange={(e) => setEditing((p) => ({ ...p, isFeatured: e.target.checked }))}
                  className="h-4 w-4 rounded accent-primary"
                />
                <span className="text-sm text-foreground">Featured tool</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={closeModal} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || uploading} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : modal === 'add' ? 'Create Tool' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-foreground">Delete Tool?</h2>
            <p className="mt-2 text-sm text-muted-foreground">This action cannot be easily undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive/90 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
