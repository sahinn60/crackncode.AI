'use client';

import * as React from 'react';
import { Card, CardContent, Button, cn } from '@crackncode/ui';
import { Plus, Pencil, ToggleLeft, ToggleRight, Shield } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ListSkeleton, ErrorState, EmptyState } from '@/components/dashboard/states';

const TIER_COLOR: Record<string, string> = {
  free:       'bg-muted text-muted-foreground',
  starter:    'bg-blue-500/10 text-blue-700',
  pro:        'bg-violet-500/10 text-violet-700',
  enterprise: 'bg-amber-500/10 text-amber-700',
};

const EMPTY_PLAN = {
  name: '', tier: 'starter', description: '',
  monthlyPriceUsd: 0, yearlyPriceUsd: 0,
  creditsPerMonth: 1000, maxGenerations: null,
  features: '[]', isActive: true, sortOrder: 0,
  stripePriceIdMonthly: '', stripePriceIdYearly: '',
};

export default function AdminPlansPage() {
  const [plans, setPlans] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modal, setModal] = React.useState<{ mode: 'create' | 'edit'; plan: any } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [acting, setActing] = React.useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const d = await apiClient.admin.plans();
      const r = (d as any)?.data ?? d;
      setPlans(Array.isArray(r) ? r : []);
    } catch (e: any) { setError(e?.message); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, []);

  const openCreate = () => setModal({ mode: 'create', plan: { ...EMPTY_PLAN } });
  const openEdit = (plan: any) => setModal({
    mode: 'edit',
    plan: { ...plan, features: JSON.stringify(plan.features ?? [], null, 2) },
  });

  const set = (field: string, value: any) => setModal(m => m ? { ...m, plan: { ...m.plan, [field]: value } } : m);

  const handleSave = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      const { features, ...rest } = modal.plan;
      const payload = {
        ...rest,
        features: (() => { try { return JSON.parse(features); } catch { return []; } })(),
        monthlyPriceUsd: +rest.monthlyPriceUsd,
        yearlyPriceUsd: +rest.yearlyPriceUsd,
        creditsPerMonth: +rest.creditsPerMonth,
        sortOrder: +rest.sortOrder,
      };
      if (modal.mode === 'create') await apiClient.admin.createPlan(payload);
      else await apiClient.admin.updatePlan(modal.plan.id, payload);
      setModal(null);
      await load();
    } catch (e: any) { alert(e?.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (plan: any) => {
    setActing(plan.id);
    try { await apiClient.admin.updatePlan(plan.id, { isActive: !plan.isActive }); await load(); }
    catch (e: any) { alert(e?.message); }
    finally { setActing(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage subscription plans</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5"><Plus className="h-4 w-4" /> New Plan</Button>
      </div>

      {loading ? <ListSkeleton count={4} /> : error ? <ErrorState message={error} onRetry={load} /> : plans.length === 0 ? (
        <EmptyState icon={Shield} title="No plans" action={<Button size="sm" onClick={openCreate} className="gap-1"><Plus className="h-3.5 w-3.5" />Create Plan</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className={cn(!plan.isActive && 'opacity-60')}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', TIER_COLOR[plan.tier] ?? TIER_COLOR.starter)}>{plan.tier}</span>
                    <p className="mt-2 text-base font-bold text-foreground">{plan.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(plan)} className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => toggleActive(plan)} disabled={acting === plan.id} className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50">
                      {plan.isActive ? <ToggleRight className="h-3.5 w-3.5 text-green-600" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Monthly</span><span className="font-semibold">${Number(plan.monthlyPriceUsd).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Yearly</span><span className="font-semibold">${Number(plan.yearlyPriceUsd).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Credits/mo</span><span className="font-semibold">{plan.creditsPerMonth === -1 ? '∞' : plan.creditsPerMonth.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Subscribers</span><span className="font-semibold">{plan._count?.subscriptions ?? 0}</span></div>
                </div>
                {Array.isArray(plan.features) && plan.features.length > 0 && (
                  <ul className="space-y-1 border-t border-border pt-3">
                    {plan.features.slice(0, 4).map((f: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-primary shrink-0" />{f}
                      </li>
                    ))}
                    {plan.features.length > 4 && <li className="text-xs text-muted-foreground">+{plan.features.length - 4} more</li>}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-background shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold">{modal.mode === 'create' ? 'Create Plan' : 'Edit Plan'}</h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground text-lg">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground">Name</label><input value={modal.plan.name} onChange={e => set('name', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Tier</label>
                  <select value={modal.plan.tier} onChange={e => set('tier', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="free">Free</option><option value="starter">Starter</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Description</label><input value={modal.plan.description ?? ''} onChange={e => set('description', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs font-medium text-muted-foreground">Monthly $</label><input type="number" step="0.01" value={modal.plan.monthlyPriceUsd} onChange={e => set('monthlyPriceUsd', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Yearly $</label><input type="number" step="0.01" value={modal.plan.yearlyPriceUsd} onChange={e => set('yearlyPriceUsd', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Credits/mo</label><input type="number" value={modal.plan.creditsPerMonth} onChange={e => set('creditsPerMonth', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Features (JSON array)</label><textarea value={modal.plan.features} onChange={e => set('features', e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-muted-foreground">Stripe Monthly Price ID</label><input value={modal.plan.stripePriceIdMonthly ?? ''} onChange={e => set('stripePriceIdMonthly', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Stripe Yearly Price ID</label><input value={modal.plan.stripePriceIdYearly ?? ''} onChange={e => set('stripePriceIdYearly', e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={modal.plan.isActive} onChange={e => set('isActive', e.target.checked)} className="rounded" />Active</label>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : modal.mode === 'create' ? 'Create Plan' : 'Save Changes'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
