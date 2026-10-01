'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, X, ArrowRight, Zap, Loader2, Crown, Sparkles } from 'lucide-react';
import { Button, Badge, cn } from '@crackncode/ui';
import { Container, SectionLabel, GradientText, SectionWrapper } from '@/components/marketing/primitives';
import { FAQ_ITEMS } from '@/data/marketing';
import { useApi } from '@/hooks/use-api';
import { apiClient } from '@/lib/api-client';

// ─── Plan feature matrix ───────────────────────────────────────────────────────

const COMPARISON_ROWS = [
  { feature: 'Credits / month',       free: '100',        starter: '1,000',    pro: '5,000',      business: 'Unlimited' },
  { feature: 'AI tools access',       free: '20+',        starter: '60+',      pro: '100+',       business: '100+' },
  { feature: 'AI models',             free: 'GPT-3.5',    starter: 'GPT-4o',   pro: 'All models', business: 'All models' },
  { feature: 'Image generation',      free: false,        starter: '10/mo',    pro: '100/mo',     business: 'Unlimited' },
  { feature: 'API access',            free: false,        starter: false,      pro: true,         business: true },
  { feature: 'Team seats',            free: '1',          starter: '3',        pro: '10',         business: 'Unlimited' },
  { feature: 'Priority support',      free: false,        starter: 'Email',    pro: 'Priority',   business: 'Dedicated' },
  { feature: 'Custom fine-tuning',    free: false,        starter: false,      pro: false,        business: true },
  { feature: 'SSO / SAML',            free: false,        starter: false,      pro: false,        business: true },
  { feature: 'SLA guarantee',         free: false,        starter: false,      pro: false,        business: true },
  { feature: 'Analytics',             free: 'Basic',      starter: 'Standard', pro: 'Advanced',   business: 'Advanced' },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true)  return <CheckCircle2 className="mx-auto h-4 w-4 text-success" />;
  if (value === false) return <X className="mx-auto h-4 w-4 text-muted-foreground/40" />;
  return <span className="text-sm text-foreground">{value}</span>;
}

// ─── Plan card ────────────────────────────────────────────────────────────────

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap,
  starter: Sparkles,
  pro: Crown,
  business: Crown,
};

const PLAN_COLORS: Record<string, string> = {
  free: 'text-muted-foreground',
  starter: 'text-primary',
  pro: 'text-warning',
  business: 'text-success',
};

function PlanCard({
  plan,
  yearly,
  onSelect,
  loading,
}: {
  plan: any;
  yearly: boolean;
  onSelect: (planId: string, interval: 'monthly' | 'yearly') => void;
  loading: string | null;
}) {
  const isPopular = plan.tier === 'pro';
  const isFree = plan.tier === 'free';
  const price = yearly ? Number(plan.yearlyPriceUsd) : Number(plan.monthlyPriceUsd);
  const Icon = PLAN_ICONS[plan.tier] ?? Zap;
  const iconColor = PLAN_COLORS[plan.tier] ?? 'text-primary';
  const features: string[] = Array.isArray(plan.features) ? plan.features : [];
  const isLoading = loading === plan.id;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border p-8 transition-all',
        isPopular
          ? 'border-primary bg-card shadow-xl shadow-primary/10 scale-[1.02]'
          : 'border-border bg-card hover:border-primary/30 hover:shadow-md',
      )}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
            <Zap className="h-3 w-3" /> Most Popular
          </span>
        </div>
      )}

      <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted', iconColor)}>
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="text-lg font-bold text-foreground capitalize">{plan.name}</h3>
      {plan.description && (
        <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
      )}

      <div className="my-6 flex items-end gap-1">
        <span className="text-4xl font-bold text-foreground">${price}</span>
        {price > 0 && (
          <span className="mb-1 text-sm text-muted-foreground">/{yearly ? 'mo, billed yearly' : 'mo'}</span>
        )}
        {price === 0 && <span className="mb-1 text-sm text-muted-foreground">forever</span>}
      </div>

      {yearly && price > 0 && (
        <p className="mb-4 -mt-4 text-xs text-success font-medium">
          Save ${((Number(plan.monthlyPriceUsd) - price) * 12).toFixed(0)}/year
        </p>
      )}

      <ul className="mb-8 flex-1 space-y-3">
        {features.map((f: string) => (
          <li key={f} className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span className="text-sm text-foreground">{f}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={isPopular ? 'default' : 'outline'}
        size="lg"
        className="w-full gap-2"
        disabled={isFree || isLoading}
        onClick={() => !isFree && onSelect(plan.id, yearly ? 'yearly' : 'monthly')}
      >
        {isLoading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</>
        ) : isFree ? (
          'Get Started Free'
        ) : (
          <>{`Start ${plan.name} Trial`} <ArrowRight className="h-4 w-4" /></>
        )}
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const router = useRouter();
  const [yearly, setYearly] = React.useState(false);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = React.useState<string | null>(null);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);

  const { data, loading } = useApi(() => apiClient.billing.plans());
  const plans: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  const handleSelect = async (planId: string, interval: 'monthly' | 'yearly') => {
    setCheckoutLoading(planId);
    setCheckoutError(null);
    try {
      const res = await apiClient.billing.checkout({ planId, interval }) as any;
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      setCheckoutError(err?.message ?? 'Failed to start checkout');
      setCheckoutLoading(null);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-background pt-32 pb-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/8 blur-[100px]" />
        </div>
        <Container className="relative text-center">
          <div className="mb-4 flex justify-center"><SectionLabel>Pricing</SectionLabel></div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
            Simple, <GradientText>transparent</GradientText> pricing
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Start free. Upgrade when you're ready. No hidden fees, no surprises.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={cn('text-sm font-medium', !yearly ? 'text-foreground' : 'text-muted-foreground')}>Monthly</span>
            <button
              role="switch"
              aria-checked={yearly}
              onClick={() => setYearly((v) => !v)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors',
                yearly ? 'bg-primary' : 'bg-input',
              )}
            >
              <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform', yearly ? 'translate-x-5' : 'translate-x-0')} />
            </button>
            <span className={cn('text-sm font-medium', yearly ? 'text-foreground' : 'text-muted-foreground')}>
              Yearly <Badge variant="success" className="ml-1.5 text-2xs">Save 35%</Badge>
            </span>
          </div>

          {checkoutError && (
            <p className="mt-4 text-sm text-destructive">{checkoutError}</p>
          )}
        </Container>
      </section>

      {/* Plans */}
      <SectionWrapper>
        <Container>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  yearly={yearly}
                  onSelect={handleSelect}
                  loading={checkoutLoading}
                />
              ))}
            </div>
          )}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            All paid plans include a 14-day free trial. No credit card required to start.
          </p>
        </Container>
      </SectionWrapper>

      {/* Comparison table */}
      <SectionWrapper subtle>
        <Container>
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Compare all features</h2>
          <div className="overflow-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Feature</th>
                  {['Free', 'Starter', 'Pro', 'Business'].map((name) => (
                    <th key={name} className="px-6 py-4 text-center font-semibold text-foreground">
                      {name}
                      {name === 'Pro' && <Badge variant="default" className="ml-2 text-2xs">Popular</Badge>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.feature} className={cn('border-t border-border', i % 2 === 0 && 'bg-muted/20')}>
                    <td className="px-6 py-3.5 text-muted-foreground">{row.feature}</td>
                    <td className="px-6 py-3.5 text-center"><Cell value={row.free} /></td>
                    <td className="px-6 py-3.5 text-center"><Cell value={row.starter} /></td>
                    <td className="px-6 py-3.5 text-center"><Cell value={row.pro} /></td>
                    <td className="px-6 py-3.5 text-center"><Cell value={row.business} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </SectionWrapper>

      {/* FAQ */}
      <SectionWrapper>
        <Container>
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Pricing FAQ</h2>
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card px-6">
            {FAQ_ITEMS.slice(0, 6).map((item, i) => (
              <div key={i} className="border-b border-border last:border-0">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-sm font-semibold text-foreground">{item.question}</span>
                  <span className={cn('text-muted-foreground transition-transform', openFaq === i && 'rotate-180')}>▾</span>
                </button>
                {openFaq === i && (
                  <div className="pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Container>
      </SectionWrapper>
    </>
  );
}
