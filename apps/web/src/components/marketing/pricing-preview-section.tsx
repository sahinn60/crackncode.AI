'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import { Button, Badge, cn } from '@crackncode/ui';
import { SectionWrapper, SectionHeading, Container } from './primitives';
import { PRICING_PLANS } from '@/data/marketing';

export function PricingPreviewSection() {
  const [yearly, setYearly] = React.useState(false);

  return (
    <SectionWrapper subtle id="pricing">
      <Container>
        <SectionHeading
          label="Pricing"
          title={<>Simple, <span className="text-primary">transparent</span> pricing</>}
          description="Start free. Upgrade when you're ready. No hidden fees, no surprises."
        />

        {/* Toggle */}
        <div className="mb-10 flex items-center justify-center gap-3">
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
            Yearly
            <Badge variant="success" className="ml-2 text-2xs">Save 35%</Badge>
          </span>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-2xl border p-8 transition-all',
                plan.popular
                  ? 'border-primary bg-card shadow-xl shadow-primary/10 scale-[1.02]'
                  : 'border-border bg-card hover:border-border-strong hover:shadow-md',
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    <Zap className="h-3 w-3" /> Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    ${yearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="mb-1 text-sm text-muted-foreground">/month</span>
                  )}
                </div>
                {yearly && plan.price.monthly > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Billed ${plan.price.yearly * 12}/year
                  </p>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? 'default' : 'outline'}
                size="lg"
                className="w-full"
                asChild
              >
                <Link href={plan.id === 'enterprise' ? '/contact' : '/signup'} className="gap-2">
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          All plans include a 14-day free trial. No credit card required.{' '}
          <Link href="/pricing" className="text-primary hover:underline">
            Compare all features →
          </Link>
        </p>
      </Container>
    </SectionWrapper>
  );
}
