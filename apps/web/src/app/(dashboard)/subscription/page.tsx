'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, cn,
} from '@crackncode/ui';
import { PageHeader } from '@/components/layout/page-header';
import { CardSkeleton, ErrorState } from '@/components/dashboard/states';
import { useSubscription } from '@/hooks/use-dashboard';
import { apiClient } from '@/lib/api-client';
import {
  CheckCircle2, Crown, ArrowRight, AlertTriangle,
  Loader2, ExternalLink, Zap, Sparkles,
} from 'lucide-react';

function statusVariant(s: string) {
  if (s === 'active' || s === 'trialing') return 'success';
  if (s === 'past_due' || s === 'unpaid') return 'warning';
  if (s === 'canceled') return 'destructive';
  return 'default';
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap,
  starter: Sparkles,
  pro: Crown,
  business: Crown,
};

export default function SubscriptionPage() {
  const { data, loading, error, refetch } = useSubscription();
  const sub = data as any;

  const [canceling, setCanceling] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [portalLoading, setPortalLoading] = React.useState(false);
  const [portalError, setPortalError] = React.useState<string | null>(null);

  const handlePortal = async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await apiClient.billing.portal() as any;
      if (res?.url) window.location.href = res.url;
    } catch (err: any) {
      setPortalError(err?.message ?? 'Failed to open billing portal');
      setPortalLoading(false);
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    setCancelError(null);
    try {
      await apiClient.subscriptions.cancel();
      setShowConfirm(false);
      refetch();
    } catch (err: any) {
      setCancelError(err?.message ?? 'Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  };

  const Icon = PLAN_ICONS[sub?.plan?.tier ?? 'free'] ?? Zap;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        description="Manage your plan and billing cycle."
        breadcrumbs={[{ label: 'Subscription' }]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </div>
            {sub && (
              <Badge variant={statusVariant(sub.status) as any} dot className="capitalize">
                {sub.status?.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <CardSkeleton rows={5} />
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : !sub ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <Crown className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-semibold text-foreground">No active subscription</p>
                <p className="text-sm text-muted-foreground mt-1">Upgrade to unlock more credits and features.</p>
              </div>
              <Button asChild>
                <Link href="/pricing" className="gap-1.5">View Plans <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Plan summary */}
              <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4 flex-wrap">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-lg capitalize">{sub.plan?.name ?? 'Plan'}</p>
                  <p className="text-sm text-muted-foreground capitalize">{sub.billingInterval} billing</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-foreground">
                    ${sub.billingInterval === 'yearly'
                      ? Number(sub.plan?.yearlyPriceUsd ?? 0).toFixed(0)
                      : Number(sub.plan?.monthlyPriceUsd ?? 0).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">/{sub.billingInterval === 'yearly' ? 'yr' : 'mo'}</p>
                </div>
              </div>

              {/* Features */}
              {Array.isArray(sub.plan?.features) && sub.plan.features.length > 0 && (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(sub.plan.features as string[]).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">Credits/month</p>
                  <p className="font-semibold text-foreground">{sub.plan?.creditsPerMonth?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold text-foreground capitalize">{sub.status?.replace('_', ' ')}</p>
                </div>
                {sub.currentPeriodStart && (
                  <div>
                    <p className="text-muted-foreground">Period start</p>
                    <p className="font-semibold text-foreground">{new Date(sub.currentPeriodStart).toLocaleDateString()}</p>
                  </div>
                )}
                {sub.currentPeriodEnd && (
                  <div>
                    <p className="text-muted-foreground">{sub.cancelAtPeriodEnd ? 'Cancels on' : 'Renews on'}</p>
                    <p className="font-semibold text-foreground">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Cancel warning */}
              {sub.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Your subscription will cancel on {new Date(sub.currentPeriodEnd).toLocaleDateString()}. You retain full access until then.
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-1">
                <Button asChild>
                  <Link href="/pricing" className="gap-1.5">
                    <ArrowRight className="h-4 w-4" /> Upgrade Plan
                  </Link>
                </Button>

                <Button variant="outline" onClick={handlePortal} disabled={portalLoading} className="gap-1.5">
                  {portalLoading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <ExternalLink className="h-3.5 w-3.5" />}
                  Billing Portal
                </Button>

                {!sub.cancelAtPeriodEnd && sub.status !== 'canceled' && (
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
                    onClick={() => setShowConfirm(true)}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>

              {portalError && <p className="text-xs text-destructive">{portalError}</p>}

              {/* Cancel confirmation */}
              {showConfirm && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Cancel subscription?</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        You'll retain access until {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'end of period'}.
                        After that, your account will revert to the free plan.
                      </p>
                    </div>
                  </div>
                  {cancelError && <p className="text-xs text-destructive">{cancelError}</p>}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={canceling}
                      className="gap-1.5"
                    >
                      {canceling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Yes, cancel
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowConfirm(false)}>
                      Keep subscription
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
