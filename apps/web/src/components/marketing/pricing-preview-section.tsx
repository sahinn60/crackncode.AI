'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionWrapper, SectionHeading, Container } from './primitives';
import { PRICING_PLANS } from '@/data/marketing';

export function PricingPreviewSection() {
  const [yearly, setYearly] = React.useState(false);

  return (
    <SectionWrapper subtle id="pricing">
      <Container>
        <SectionHeading
          label="Pricing"
          title={<>Simple, <span className="text-violet-400">transparent</span> pricing</>}
          description="Start free. Upgrade when you're ready. No hidden fees, no surprises."
        />

        {/* Toggle */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <span className={cn('text-sm font-medium transition-colors', !yearly ? 'text-white' : 'text-zinc-500')}>Monthly</span>
          <button
            role="switch"
            aria-checked={yearly}
            onClick={() => setYearly((v) => !v)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
              yearly ? 'bg-violet-600' : 'bg-zinc-700',
            )}
          >
            <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200', yearly ? 'translate-x-5' : 'translate-x-0.5')} />
          </button>
          <span className={cn('flex items-center gap-2 text-sm font-medium transition-colors', yearly ? 'text-white' : 'text-zinc-500')}>
            Yearly
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">Save 35%</span>
          </span>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-2xl border p-8 transition-all duration-200',
                plan.popular
                  ? 'border-violet-500/40 bg-violet-500/[0.04] shadow-[0_0_40px_rgba(139,92,246,0.08)]'
                  : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]',
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-1 text-xs font-semibold text-white">
                    <Zap className="h-3 w-3" /> Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-base font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">
                    ${yearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="mb-1.5 text-sm text-zinc-500">/mo</span>
                  )}
                </div>
                {yearly && plan.price.monthly > 0 && (
                  <p className="mt-1 text-xs text-zinc-600">Billed ${plan.price.yearly * 12}/year</p>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="text-sm text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.id === 'enterprise' ? '/contact' : '/register'}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200',
                  plan.popular
                    ? 'bg-violet-600 text-white hover:bg-violet-500'
                    : 'border border-white/[0.1] bg-white/[0.03] text-white hover:bg-white/[0.08]',
                )}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-zinc-600">
          All plans include a 14-day free trial. No credit card required.{' '}
          <Link href="/pricing" className="text-violet-400 hover:text-violet-300 transition-colors">
            Compare all features →
          </Link>
        </p>
      </Container>
    </SectionWrapper>
  );
}
