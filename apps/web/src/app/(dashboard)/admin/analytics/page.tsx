'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, cn } from '@crackncode/ui';
import { BarChart3, TrendingUp, Users, Zap, Coins } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { StatSkeleton, ErrorState } from '@/components/dashboard/states';

const DAYS_OPTIONS = [7, 14, 30, 90];

const CREDIT_TYPE_COLOR: Record<string, string> = {
  usage:             'bg-red-500',
  monthly_allocation:'bg-blue-500',
  grant:             'bg-green-500',
  purchase:          'bg-emerald-500',
  refund:            'bg-amber-500',
  bonus:             'bg-violet-500',
  admin_adjustment:  'bg-orange-500',
};

function MiniBar({ value, max, color = 'bg-primary' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

function SparkLine({ data, color = 'stroke-primary' }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 200; const h = 40; const pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((v / max) * (h - pad * 2));
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <polyline points={pts} fill="none" className={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = React.useState(30);
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const d = await apiClient.admin.analytics(days);
      setData((d as any)?.data ?? d);
    } catch (e: any) { setError(e?.message); }
    finally { setLoading(false); }
  }, [days]);

  React.useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Analytics</h1></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}</div>
    </div>
  );
  if (error) return <ErrorState message={error} onRetry={load} />;

  const userCounts = (data?.userGrowth ?? []).map((d: any) => +d.count);
  const revTotals = (data?.revenueByDay ?? []).map((d: any) => +d.total);
  const genCounts = (data?.generationsByDay ?? []).map((d: any) => +d.count);
  const maxTool = Math.max(...(data?.topTools ?? []).map((t: any) => t.usageCount), 1);
  const totalCredits = (data?.creditsByType ?? []).reduce((s: number, c: any) => s + Math.abs(c._sum?.amount ?? 0), 0);
  const totalPlanSubs = (data?.planDistribution ?? []).reduce((s: number, p: any) => s + (p._count?.id ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform performance over time</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1 bg-muted/50">
          {DAYS_OPTIONS.map(d => (
            <button key={d} onClick={() => setDays(d)} className={cn('px-3 py-1 text-xs font-medium rounded-md transition-colors', days === d ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Sparkline cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">User Signups</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{userCounts.reduce((a: number, b: number) => a + b, 0)}</p>
            <p className="text-xs text-muted-foreground mb-2">last {days} days</p>
            <SparkLine data={userCounts} color="stroke-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-muted-foreground">Revenue</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${revTotals.reduce((a: number, b: number) => a + b, 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mb-2">last {days} days</p>
            <SparkLine data={revTotals} color="stroke-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-muted-foreground">Generations</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{genCounts.reduce((a: number, b: number) => a + b, 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mb-2">last {days} days</p>
            <SparkLine data={genCounts} color="stroke-amber-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top tools */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Top Tools by Usage</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data?.topTools ?? []).map((tool: any) => (
              <div key={tool.id}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-medium text-foreground">{tool.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{tool.category?.name}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{tool.usageCount.toLocaleString()}</span>
                </div>
                <MiniBar value={tool.usageCount} max={maxTool} color="bg-primary" />
              </div>
            ))}
            {!data?.topTools?.length && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
          </CardContent>
        </Card>

        {/* Credits by type */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Credits by Transaction Type</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data?.creditsByType ?? []).map((c: any) => (
              <div key={c.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground capitalize">{c.type.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-mono text-muted-foreground">{Math.abs(c._sum?.amount ?? 0).toLocaleString()} · {c._count?.id} txns</span>
                </div>
                <MiniBar value={Math.abs(c._sum?.amount ?? 0)} max={totalCredits} color={CREDIT_TYPE_COLOR[c.type] ?? 'bg-muted-foreground'} />
              </div>
            ))}
            {!data?.creditsByType?.length && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Active Subscription Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data?.planDistribution ?? []).map((p: any) => (
              <div key={p.planId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{p.plan?.name ?? p.planId}</span>
                  <span className="text-xs font-mono text-muted-foreground">{p._count?.id} subscribers</span>
                </div>
                <MiniBar value={p._count?.id ?? 0} max={totalPlanSubs} color="bg-indigo-500" />
              </div>
            ))}
            {!data?.planDistribution?.length && <p className="text-sm text-muted-foreground text-center py-4">No active subscriptions</p>}
          </CardContent>
        </Card>

        {/* Daily breakdown table */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Daily Breakdown (last {Math.min(days, 14)} days)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Date</th>
                    <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Users</th>
                    <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Revenue</th>
                    <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Generations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(data?.userGrowth ?? []).slice(-14).map((row: any, i: number) => {
                    const rev = data?.revenueByDay?.find((r: any) => r.date === row.date);
                    const gen = data?.generationsByDay?.find((g: any) => g.date === row.date);
                    return (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-4 py-2 text-muted-foreground">{new Date(row.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-right font-mono">{row.count}</td>
                        <td className="px-4 py-2 text-right font-mono">${Number(rev?.total ?? 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-mono">{gen?.count ?? 0}</td>
                      </tr>
                    );
                  })}
                  {!data?.userGrowth?.length && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No data for this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
