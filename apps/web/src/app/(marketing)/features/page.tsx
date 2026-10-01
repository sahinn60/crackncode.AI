import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button, cn } from '@crackncode/ui';
import { Container, SectionWrapper, SectionHeading, SectionLabel, GradientText } from '@/components/marketing/primitives';
import { FEATURES } from '@/data/marketing';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Everything you need to produce world-class content at scale.',
};

const FEATURE_DETAILS = FEATURES.map((f, i) => ({
  ...f,
  bullets: [
    'Designed for speed and reliability',
    'Works seamlessly with your existing workflow',
    'Continuously improved with user feedback',
  ],
}));

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-background pt-32 pb-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/8 blur-[100px]" />
        </div>
        <Container className="relative text-center">
          <div className="mb-4 flex justify-center">
            <SectionLabel>Features</SectionLabel>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Built for <GradientText>serious creators</GradientText>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Every feature in CracknCode AI is designed to help you produce better content, faster — without sacrificing quality.
          </p>
        </Container>
      </section>

      {/* Features grid */}
      <SectionWrapper>
        <Container>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {FEATURE_DETAILS.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex gap-5 rounded-2xl border border-border bg-card p-7 hover:border-border-strong hover:shadow-md transition-all">
                  <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted', feature.color)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-base font-semibold text-foreground">{feature.title}</h3>
                    <p className="mb-4 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </SectionWrapper>

      {/* CTA */}
      <section className="py-20 bg-background-subtle border-t border-border">
        <Container className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Join 50,000+ creators using CracknCode AI to produce better content, faster.</p>
          <Button size="lg" asChild>
            <Link href="/signup" className="gap-2">Get Started Free <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </Container>
      </section>
    </>
  );
}
