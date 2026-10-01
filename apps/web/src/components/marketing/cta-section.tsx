import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@crackncode/ui';
import { Container } from './primitives';

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-violet-500/10" />
        <div className="absolute top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[100px]" />
      </div>

      <Container className="relative text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Start for free today
            </span>
          </div>

          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground leading-[1.1]">
            Ready to 10x your{' '}
            <span className="bg-gradient-to-r from-primary via-violet-400 to-pink-400 bg-clip-text text-transparent">
              content output?
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
            Join 50,000+ creators, marketers and developers who use CracknCode AI every day to produce better content, faster.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="xl" asChild>
              <Link href="/signup" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/tools">Explore Tools</Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required · Free plan available · Cancel anytime
          </p>
        </div>
      </Container>
    </section>
  );
}
