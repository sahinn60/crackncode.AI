'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, cn,
} from '@crackncode/ui';
import { PageHeader } from '@/components/layout/page-header';
import { ListSkeleton, ErrorState, EmptyState } from '@/components/dashboard/states';
import { useApi } from '@/hooks/use-api';
import { useSubscription } from '@/hooks/use-dashboard';
import { apiClient } from '@/lib/api-client';
import {
  CheckCircle2, CreditCard, Zap, ArrowRight, Download,
  Crown, AlertTriangle, Loader2, ExternalLink, RefreshCw,
  TrendingUp, Calendar, Sparkles,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusVariant(s: string) {
  if (s === 'active' || s === 'trialing') return 'success';
  if (s === 'past_due' || s === 'unpaid') return 'warning';
  if (s === 'canceled') return 'destructive';
  return 'default';
}

function paymentStatusVariant(s: string) {
  if (s === 'succeeded') return 'success';
  if (s === 'failed') return 'destructive';
  if (s === 'refunded') return 'warning';
  return 'default';
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap,
  starter: Sparkles,
  pro: Crown,
  business: Crown,
};

// ─── Portal redirect button ───────────────────────────────────────────────────

function PortalButton({ label, variant = 'outline', size = 'sm' }: {
  label: string;
  variant?: 'outline' | 'default' | 'destructive';
  size?: 'sm' | 'default';
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.billing.portal() as any;
      if (res?.url) window.location.href = res.url;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to open billing portal');
      setLoading(false);
    }
  };

  return (
    <div>
      <Button variant={variant} size={size} onClick={handleClick} disabled={loading} className="gap-1.5">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
        {label}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Checkout button ──────────────────────────────────────────────────────────

function CheckoutButton({ planId, interval, label, variant = 'default' }: {
  planId: string;
  interval: 'monthly' | 'yearly';
  label: string;
  variant?: 'default' | 'outline';
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.billing.checkout({ planId, interval }) as any;
      if (res?.url) window.location.href = res.url;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to start checkout');
      setLoading(false);
    }
  };

  return (
    <div>
      <Button variant={variant} size="sm" onClick={handleClick} disabled={loading} className="gap-1.5">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
        {label}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { data: subData, loading: subLoading, error: subError, refetch: subRefetch } = useSubscription();
  const { data: plansData, loading: plansLoading } = useApi(() => apiClient.billing.plans());
  const { data: invoicesData, loading: invoicesLoading } = useApi(() => apiClient.billing.invoices());
  const { data: paymentsData, loading: paymentsLoading } = useApi(() => apiClient.billing.payments());

  const sub = subData as any;
  const plans: any[] = Array.isArray(plansData) ? plansData : ((plansData as any)?.data ?? (plansData as any)?.items ?? []);
  const invoices: any[] = (invoicesData as any)?.items ?? (invoicesData as any)?.data ?? [];
  const payments: any[] = (paymentsData as any)?.items ?? (paymentsData as any)?.data ?? [];

  const currentTier = sub?.plan?.tier ?? 'free';
  const Icon = PLAN_ICONS[currentTier] ?? Zap;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage your subscription, payment method, and invoices."
        breadcrumbs={[{ label: 'Billing' }]}
        actions={
          <Button variant="outline" size="sm" onClick={subRefetch} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        }
      />

      {/* ── Current plan ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription</CardDescription>
            </div>
            {sub && (
              <Badge variant={statusVariant(sub.status) as any} dot className="capitalize">
                {sub.status?.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {subLoading ? (
            <div className="h-20 rounded-xl bg-muted animate-pulse" />
          ) : subError ? (
            <ErrorState message={subError} onRetry={subRefetch} />
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
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground capitalize">{sub.plan?.name ?? 'Plan'}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {sub.billingInterval} billing
                      {sub.currentPeriodEnd && ` · Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PortalButton label="Manage Subscription" />
                </div>
              </div>

              {sub.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Subscription cancels on {new Date(sub.currentPeriodEnd).toLocaleDateString()}. You retain access until then.
                </div>
              )}

              {sub.status === 'past_due' && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Payment failed. Please update your payment method to avoid service interruption.
                  <PortalButton label="Update Payment" variant="outline" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">Plan</p>
                  <p className="font-semibold text-foreground capitalize">{sub.plan?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Credits/mo</p>
                  <p className="font-semibold text-foreground">{sub.plan?.creditsPerMonth?.toLocaleString()}</p>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Available plans ── */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Available Plans</h2>
        {plansLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isCurrent = plan.tier === currentTier;
              const PlanIcon = PLAN_ICONS[plan.tier] ?? Zap;
              const features: string[] = Array.isArray(plan.features) ? plan.features : [];
              const isUpgrade = ['free', 'starter', 'pro', 'business'].indexOf(plan.tier) >
                ['free', 'starter', 'pro', 'business'].indexOf(currentTier);

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative rounded-xl border p-5 flex flex-col gap-3',
                    isCurrent ? 'border-primary bg-primary/5' : 'border-border bg-card',
                    plan.tier === 'pro' && !isCurrent && 'border-primary/40',
                  )}
                >
                  {isCurrent && (
                    <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                      Current
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <PlanIcon className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-foreground capitalize">{plan.name}</h3>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    ${Number(plan.monthlyPriceUsd).toFixed(0)}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                  <ul className="space-y-1.5 flex-1">
                    {features.slice(0, 4).map((f: string) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-foreground">
                        <CheckCircle2 className="h-3 w-3 text-success shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" size="sm" disabled className="w-full">Current plan</Button>
                  ) : plan.tier === 'free' ? (
                    <Button variant="outline" size="sm" disabled className="w-full">Free</Button>
                  ) : (
                    <CheckoutButton
                      planId={plan.id}
                      interval="monthly"
                      label={isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                      variant={plan.tier === 'pro' ? 'default' : 'outline'}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Payment method ── */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Managed securely via Stripe. We never store card details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Managed by Stripe</p>
                <p className="text-xs text-muted-foreground">Click to update your card via the secure billing portal</p>
              </div>
            </div>
            <PortalButton label="Update Card" />
          </div>
        </CardContent>
      </Card>

      {/* ── Invoice history ── */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Download PDF invoices for your records</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {invoicesLoading ? (
            <ListSkeleton count={4} />
          ) : invoices.length === 0 ? (
            <EmptyState icon={Calendar} title="No invoices yet" description="Invoices will appear here after your first payment." />
          ) : (
            <ul>
              {invoices.map((inv: any, i: number) => (
                <li
                  key={inv.id}
                  className={cn('flex items-center gap-4 px-5 py-3.5', i < invoices.length - 1 && 'border-b border-border')}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {inv.number ?? `INV-${inv.id.slice(-6).toUpperCase()}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {inv.periodStart ? new Date(inv.periodStart).toLocaleDateString() : new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-foreground">
                      ${Number(inv.amountPaid).toFixed(2)}
                    </span>
                    <Badge variant={inv.status === 'paid' ? 'success' : 'warning' as any} className="text-2xs capitalize">
                      {inv.status}
                    </Badge>
                    {inv.invoicePdfUrl && (
                      <a
                        href={inv.invoicePdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Payment history ── */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All charges and refunds</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {paymentsLoading ? (
            <ListSkeleton count={4} />
          ) : payments.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No payments yet" description="Payment records will appear here." />
          ) : (
            <ul>
              {payments.map((pay: any, i: number) => (
                <li
                  key={pay.id}
                  className={cn('flex items-center gap-4 px-5 py-3.5', i < payments.length - 1 && 'border-b border-border')}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{pay.description ?? 'Subscription payment'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(pay.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-foreground">
                      ${Number(pay.amountUsd).toFixed(2)}
                    </span>
                    <Badge variant={paymentStatusVariant(pay.status) as any} className="text-2xs capitalize">
                      {pay.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
