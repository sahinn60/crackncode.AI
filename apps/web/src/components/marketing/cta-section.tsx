import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Container } from './primitives';

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32 bg-[#080808]">
      {/* Glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.12] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-pink-600/[0.07] blur-[100px]" />
      </div>

      <Container className="relative text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.06] px-4 py-1.5 text-sm font-medium text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              Start for free today
            </span>
          </div>

          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[56px] text-white leading-[1.1]">
            Ready to 10x your{' '}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              content output?
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-[16px] text-zinc-400 leading-relaxed">
            Join 50,000+ creators, marketers and developers who use CracknCode AI every day to produce better content, faster.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-semibold text-black hover:bg-zinc-100 transition-colors shadow-[0_0_28px_rgba(255,255,255,0.12)] hover:shadow-[0_0_36px_rgba(255,255,255,0.2)]"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-7 py-3 text-sm font-semibold text-white hover:bg-white/[0.08] hover:border-white/[0.18] transition-all duration-200"
            >
              Explore Tools
            </Link>
          </div>

          <p className="mt-5 text-sm text-zinc-600">
            No credit card required · Free plan available · Cancel anytime
          </p>
        </div>
      </Container>
    </section>
  );
}
