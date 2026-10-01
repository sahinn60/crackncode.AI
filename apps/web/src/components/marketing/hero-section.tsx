import Link from 'next/link';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { Button, Badge } from '@crackncode/ui';
import { Container, GradientText } from './primitives';
import { STATS } from '@/data/marketing';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Background orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-violet-500/8 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-pink-500/8 blur-[80px]" />
      </div>

      <Container className="relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Announcement badge */}
          <div className="mb-6 flex justify-center">
            <Link href="/tools" className="group inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
              <Sparkles className="h-3.5 w-3.5" />
              Introducing 100+ AI Tools
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl text-foreground leading-[1.1]">
            All Your AI Tools.{' '}
            <GradientText>One Powerful</GradientText>{' '}
            Workspace.
          </h1>

          {/* Subtext */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed sm:text-xl">
            Access powerful AI tools for writing, marketing, SEO, social media, images, coding and productivity from one unified platform.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="xl" asChild>
              <Link href="/signup" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/tools">Explore AI Tools</Link>
            </Button>
          </div>

          {/* Trust signals */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Free plan available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Cancel anytime
            </span>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                  {stat.icon && <Star className="h-4 w-4 fill-warning text-warning" />}
                </div>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof avatars */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <div className="flex -space-x-2">
            {['SC', 'MW', 'PP', 'JO', 'AK'].map((initials) => (
              <div
                key={initials}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-xs font-semibold text-primary ring-0"
              >
                {initials}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
              ))}
            </div>
            <span>Loved by <strong className="text-foreground">50,000+</strong> creators</span>
          </div>
        </div>
      </Container>
    </section>
  );
}
