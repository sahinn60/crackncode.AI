'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, cn,
} from '@crackncode/ui';
import { PageHeader } from '@/components/layout/page-header';
import {
  StatSkeleton, ListSkeleton, ErrorState, EmptyState, CardSkeleton,
} from '@/components/dashboard/states';
import {
  useCredits, useGenerations, useFavorites,
  usePopularTools, useNotifications, useSubscription,
} from '@/hooks/use-dashboard';
import { useAuth } from '@/providers/auth-provider';
import {
  Zap, Heart, History, ArrowRight, CheckCircle2,
  AlertTriangle, Info, Bell, TrendingUp, Coins,
  Crown, Clock,
} from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
function planColor(tier: string) {
  if (tier === 'pro') return 'text-violet-500';
  if (tier === 'enterprise') return 'text-amber-500';
  return 'text-muted-foreground';
}

function notifIcon(type: string) {
  if (type === 'success') return <CheckCircle2 className="h-4 w-4 text-success shrink-0" />;
  if (type === 'warning') return <AlertTriangle className="h-4 w-4 text-warning shrink-0" />;
  if (type === 'error') return <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />;
  return <Info className="h-4 w-4 text-info shrink-0" />;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Stat card ───────────────────────────────────────────────────────────────── */
function StatCard({
  label, value, sub, icon: Icon, iconColor, href,
}: {
  label: string; value: React.ReactNode; sub?: string;
  icon: React.ComponentType<{ className?: string }>; iconColor: string; href?: string;
}) {
  const inner = (
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-muted', iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </CardContent>
  );
  return (
    <Card className={href ? 'hover:border-border-strong hover:shadow-md transition-all cursor-pointer' : ''}>
      {href ? <Link href={href}>{inner}</Link> : inner}
    </Card>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const credits = useCredits();
  const generations = useGenerations(5);
  const favorites = useFavorites();
  const popularTools = usePopularTools();
  const notifications = useNotifications(5);
  const subscription = useSubscription();

  const creditData = credits.data as any;
  const subData = subscription.data as any;
  const genList = (generations.data as any)?.data ?? (Array.isArray(generations.data) ? generations.data : []);
  const favList = Array.isArray(favorites.data) ? favorites.data : ((favorites.data as any)?.data ?? []);
  const toolList = (popularTools.data as any)?.data ?? (Array.isArray(popularTools.data) ? popularTools.data : []);
  const notifList = (notifications.data as any)?.items ?? (notifications.data as any)?.data ?? (Array.isArray(notifications.data) ? notifications.data : []);

  const balance = creditData?.balance ?? 0;
  const totalAllocated = creditData?.totalAllocated ?? 0;
  const totalUsed = creditData?.totalUsed ?? 0;
  const usedCredits = totalUsed;
  const usagePct = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;

  const displayName = (user as any)?.profile?.name ?? user?.email?.split('@')[0] ?? 'there';
  const planTier = subData?.plan?.tier ?? user?.role ?? 'free';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${displayName} 👋`}
        description="Here's what's happening with your account today."
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <Button size="sm" asChild>
            <Link href="/tools" className="gap-1.5">
              <Zap className="h-3.5 w-3.5" /> New Generation
            </Link>
          </Button>
        }
      />

      {/* ── Stats row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {credits.loading ? (
          <>
            <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
          </>
        ) : credits.error ? (
          <div className="col-span-full">
            <ErrorState message={credits.error} onRetry={credits.refetch} />
          </div>
        ) : (
          <>
            <StatCard
              label="Available Credits"
              value={balance.toLocaleString()}
              sub="Resets monthly"
              icon={Coins}
              iconColor="text-warning"
              href="/credits"
            />
            <StatCard
              label="Credits Used"
              value={usedCredits.toLocaleString()}
              sub={`${usagePct}% of allocated`}
              icon={TrendingUp}
              iconColor="text-primary"
            />
            <StatCard
              label="Total Generations"
              value={(generations.data as any)?.total ?? genList.length}
              sub="All time"
              icon={History}
              iconColor="text-emerald-500"
              href="/history"
            />
            <StatCard
              label="Current Plan"
              value={<span className={cn('capitalize', planColor(planTier))}>{planTier}</span>}
              sub={subData?.status ?? 'active'}
              icon={Crown}
              iconColor="text-amber-500"
              href="/subscription"
            />
          </>
        )}
      </div>

      {/* ── Usage bar ─────────────────────────────────────────────────────────── */}
      {!credits.loading && !credits.error && totalAllocated > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Credit Usage</span>
              <span className="text-sm text-muted-foreground">{usedCredits.toLocaleString()} / {totalAllocated.toLocaleString()}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  usagePct >= 90 ? 'bg-destructive' : usagePct >= 70 ? 'bg-warning' : 'bg-primary',
                )}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">{usagePct}% used</span>
              {usagePct >= 80 && (
                <Link href="/billing" className="text-xs text-primary hover:underline">Upgrade plan →</Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Main grid ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Recent Generations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Generations</CardTitle>
                <CardDescription>Your latest AI outputs</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/history" className="gap-1 text-xs">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {generations.loading ? (
              <ListSkeleton count={5} />
            ) : generations.error ? (
              <ErrorState message={generations.error} onRetry={generations.refetch} />
            ) : genList.length === 0 ? (
              <EmptyState
                icon={History}
                title="No generations yet"
                description="Use an AI tool to create your first generation."
                action={
                  <Button size="sm" asChild>
                    <Link href="/tools">Browse Tools</Link>
                  </Button>
                }
              />
            ) : (
              <ul>
                {genList.map((gen: any, i: number) => (
                  <li
                    key={gen.id}
                    className={cn('flex items-center gap-3 px-5 py-3.5', i < genList.length - 1 && 'border-b border-border')}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {gen.tool?.name ?? 'AI Tool'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {timeAgo(gen.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        gen.status === 'completed' ? 'success' :
                        gen.status === 'failed' ? 'destructive' :
                        gen.status === 'processing' ? 'info' : 'default'
                      }
                      className="text-2xs shrink-0"
                    >
                      {gen.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Notifications</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/notifications" className="gap-1 text-xs">All <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.loading ? (
              <CardSkeleton rows={4} />
            ) : notifications.error ? (
              <ErrorState message={notifications.error} onRetry={notifications.refetch} />
            ) : notifList.length === 0 ? (
              <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
            ) : (
              <ul>
                {notifList.map((n: any, i: number) => (
                  <li
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 px-5 py-3.5',
                      !n.isRead && 'bg-primary/5',
                      i < notifList.length - 1 && 'border-b border-border',
                    )}
                  >
                    {notifIcon(n.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-2xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Favorite Tools */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Favorite Tools</CardTitle>
                <CardDescription>Your saved tools</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/favorites" className="gap-1 text-xs">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {favorites.loading ? (
              <ListSkeleton count={4} />
            ) : favorites.error ? (
              <ErrorState message={favorites.error} onRetry={favorites.refetch} />
            ) : favList.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No favorites yet"
                description="Heart a tool to save it here."
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/tools">Browse Tools</Link>
                  </Button>
                }
              />
            ) : (
              <ul>
                {favList.slice(0, 5).map((fav: any, i: number) => {
                  const tool = fav.tool ?? fav;
                  return (
                    <li
                      key={fav.id}
                      className={cn('flex items-center gap-3 px-5 py-3', i < Math.min(favList.length, 5) - 1 && 'border-b border-border')}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{tool.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{tool.category?.name ?? tool.shortDescription ?? ''}</p>
                      </div>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/tools/${tool.slug ?? tool.id}`}>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Popular Tools */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Popular Tools</CardTitle>
                <CardDescription>Most used across the platform</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tools" className="gap-1 text-xs">All tools <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {popularTools.loading ? (
              <ListSkeleton count={4} />
            ) : popularTools.error ? (
              <ErrorState message={popularTools.error} onRetry={popularTools.refetch} />
            ) : toolList.length === 0 ? (
              <EmptyState icon={Zap} title="No tools available" description="Tools will appear here once added." />
            ) : (
              <ul>
                {toolList.slice(0, 5).map((tool: any, i: number) => (
                  <li
                    key={tool.id}
                    className={cn('flex items-center gap-3 px-5 py-3', i < Math.min(toolList.length, 5) - 1 && 'border-b border-border')}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{tool.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{tool.category?.name ?? ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {tool.isPremium && <Badge variant="warning" className="text-2xs">Pro</Badge>}
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/tools/${tool.slug ?? tool.id}`}>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
