'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@crackncode/ui';
import {
  Users, Zap, DollarSign, CreditCard, Coins, Bot,
  MessageCircle, TrendingUp, UserCheck, UserPlus,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { StatSkeleton, ErrorState } from '@/components/dashboard/states';

function StatCard({
  title, value, sub, icon: Icon, color, href,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; href?: string;
}) {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-1.5 text-2xl font-bold text-foreground">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiClient.admin.stats()
      .then((d) => setStats((d as any)?.data ?? d))
      .catch((e) => setError(e?.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform metrics at a glance</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
    </div>
  );

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const s = stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform metrics at a glance</p>
      </div>

      {/* Users */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Users</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Users" value={s.users.total.toLocaleString()} icon={Users} color="bg-blue-500/10 text-blue-600" href="/admin/users" />
          <StatCard title="Active Users" value={s.users.active.toLocaleString()} sub="status = active" icon={UserCheck} color="bg-green-500/10 text-green-600" href="/admin/users?status=active" />
          <StatCard title="New This Month" value={s.users.newThisMonth.toLocaleString()} icon={UserPlus} color="bg-violet-500/10 text-violet-600" />
        </div>
      </div>

      {/* Revenue */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Revenue</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Revenue" value={`$${Number(s.revenue.totalUsd).toLocaleString('en', { minimumFractionDigits: 2 })}`} icon={DollarSign} color="bg-emerald-500/10 text-emerald-600" href="/admin/payments" />
          <StatCard title="This Month" value={`$${Number(s.revenue.thisMonthUsd).toFixed(2)}`} icon={TrendingUp} color="bg-emerald-500/10 text-emerald-600" />
          <StatCard title="Active Subscriptions" value={s.subscriptions.active.toLocaleString()} icon={CreditCard} color="bg-indigo-500/10 text-indigo-600" href="/admin/payments" />
        </div>
      </div>

      {/* AI & Credits */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">AI & Credits</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Generations" value={s.generations.total.toLocaleString()} icon={Zap} color="bg-amber-500/10 text-amber-600" />
          <StatCard title="This Month" value={s.generations.thisMonth.toLocaleString()} sub="generations" icon={Zap} color="bg-amber-500/10 text-amber-600" />
          <StatCard title="Credits Consumed" value={s.credits.consumed.toLocaleString()} icon={Coins} color="bg-orange-500/10 text-orange-600" />
          <StatCard title="Est. AI Cost" value={`$${s.estimatedAiCostUsd}`} sub="~$0.002/1k tokens" icon={Bot} color="bg-red-500/10 text-red-600" />
        </div>
      </div>

      {/* Support */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Support</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Waiting" value={s.support.waiting} sub="needs agent" icon={MessageCircle} color="bg-amber-500/10 text-amber-600" href="/admin/support" />
          <StatCard title="Active Chats" value={s.support.active} icon={MessageCircle} color="bg-green-500/10 text-green-600" href="/admin/support" />
          <StatCard title="Active Tools" value={s.tools.total} sub={`${s.tools.categories} categories`} icon={Zap} color="bg-primary/10 text-primary" href="/admin/tools" />
        </div>
      </div>
    </div>
  );
}
