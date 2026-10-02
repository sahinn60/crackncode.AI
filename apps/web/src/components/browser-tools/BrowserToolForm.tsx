'use client';

import * as React from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

interface Props {
  mode:       'create' | 'edit';
  tool?:      any;
  categories: any[];
  onClose:    () => void;
  onSaved:    () => void;
}

const EMPTY = {
  name: '', slug: '', description: '', websiteUrl: 'https://',
  categoryId: '', imageUrl: '', price: '', currency: 'USD',
  ctaText: 'Use Tool', featured: false, displayOrder: 0, creditCost: 1,
  inputSchema: '{}',
};

export function BrowserToolForm({ mode, tool, categories, onClose, onSaved }: Props) {
  const [form, setForm] = React.useState(() =>
    mode === 'edit' && tool
      ? { ...EMPTY, ...tool, price: tool.price ?? '', inputSchema: JSON.stringify(tool.inputSchema ?? {}, null, 2) }
      : { ...EMPTY },
  );
  const [saving, setSaving] = React.useState(false);
  const [err, setErr]       = React.useState<string | null>(null);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true); setErr(null);
    try {
      let schema: any = {};
      try { schema = JSON.parse(form.inputSchema); } catch { throw new Error('Input Schema must be valid JSON'); }

      const payload = {
        ...form,
        price:       form.price ? Number(form.price) : undefined,
        displayOrder: Number(form.displayOrder),
        creditCost:  Number(form.creditCost),
        inputSchema: schema,
      };

      if (mode === 'create') await apiClient.browserTools.adminCreate(payload);
      else await apiClient.browserTools.adminUpdate(tool.id, payload);

      onSaved();
    } catch (e: any) { setErr(e?.message ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-background shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {mode === 'create' ? 'Create Browser Tool' : 'Edit Browser Tool'}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {err && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{err}</p>}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Name"><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="AI Writing Tool" className={input} /></Field>
            <Field label="Slug"><input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="ai-writing-tool" className={cn(input, 'font-mono')} /></Field>
          </div>

          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="What does this tool do?" className={cn(input, 'resize-none')} />
          </Field>

          <Field label="Website URL">
            <input value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)} placeholder="https://example.com" className={input} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className={input}>
                <option value="">Select category…</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Image URL (optional)">
              <input value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://…/logo.png" className={input} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Price (optional)">
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0" className={input} />
            </Field>
            <Field label="Currency">
              <select value={form.currency} onChange={e => set('currency', e.target.value)} className={input}>
                {['USD', 'BDT', 'EUR', 'GBP', 'INR'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Credit Cost">
              <input type="number" min={1} value={form.creditCost} onChange={e => set('creditCost', e.target.value)} className={input} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="CTA Text">
              <input value={form.ctaText} onChange={e => set('ctaText', e.target.value)} placeholder="Use Tool" className={input} />
            </Field>
            <Field label="Display Order">
              <input type="number" min={0} value={form.displayOrder} onChange={e => set('displayOrder', e.target.value)} className={input} />
            </Field>
          </div>

          <div className="flex gap-5">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} className="rounded border-input" />
              Featured
            </label>
          </div>

          <Field label="Input Schema (JSON)">
            <textarea value={form.inputSchema} onChange={e => set('inputSchema', e.target.value)} rows={4} className={cn(input, 'font-mono text-xs resize-none')} />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? 'Saving…' : mode === 'create' ? 'Create Tool' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

const input = 'w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
