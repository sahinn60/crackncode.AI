'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container, GradientText } from './primitives';

/* ── Configurable data ────────────────────────────────────────────────────── */
export const HERO_STATS = [
  { value: '100+',  label: 'AI Tools' },
  { value: '50K+',  label: 'Active Users' },
  { value: '10M+',  label: 'Words Generated' },
  { value: '4.9/5', label: 'Average Rating', star: true },
] as const;

export const SOCIAL_PROOF_AVATARS = ['SC', 'MW', 'PP', 'JO', 'AK'] as const;
export const SOCIAL_PROOF_COUNT   = '50,000+';

const TRUST_SIGNALS = [
  'No credit card required',
  'Free plan available',
  'Cancel anytime',
] as const;

/* ── CTAButton ────────────────────────────────────────────────────────────── */
export function CTAButton({
  href,
  variant = 'primary',
  children,
  className,
}: {
  href: string;
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200',
        variant === 'primary'
          ? 'bg-white text-black hover:bg-zinc-100 shadow-[0_0_28px_rgba(255,255,255,0.12)] hover:shadow-[0_0_36px_rgba(255,255,255,0.22)]'
          : 'border border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/[0.22]',
        className,
      )}
    >
      {children}
    </Link>
  );
}

/* ── HeroStats ────────────────────────────────────────────────────────────── */
export function HeroStats() {
  return (
    <div
      className="mx-auto mt-14 max-w-3xl animate-fade-up"
      style={{ animationDelay: '0.45s', animationFillMode: 'both' }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm divide-x divide-y sm:divide-y-0 divide-white/[0.06]">
        {HERO_STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1.5 px-4 py-5 text-center"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[22px] font-bold text-white tracking-tight leading-none">
                {stat.value}
              </span>
              {stat.star && <Star className="h-3.5 w-3.5 fill-[#c8f135] text-[#c8f135]" />}
            </div>
            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── SocialProof ──────────────────────────────────────────────────────────── */
export function SocialProof() {
  return (
    <div
      className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center animate-fade-up"
      style={{ animationDelay: '0.55s', animationFillMode: 'both' }}
    >
      {/* Avatars */}
      <div className="flex -space-x-2.5">
        {SOCIAL_PROOF_AVATARS.map((initials, i) => (
          <div
            key={initials}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#080808] text-[10px] font-bold text-white"
            style={{
              background: `linear-gradient(135deg, hsl(${260 + i * 20}, 60%, 45%), hsl(${300 + i * 15}, 55%, 40%))`,
              zIndex: SOCIAL_PROOF_AVATARS.length - i,
            }}
          >
            {initials}
          </div>
        ))}
      </div>

      {/* Stars + text */}
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-[#c8f135] text-[#c8f135]" />
          ))}
        </div>
        <span>
          Loved by{' '}
          <strong className="text-white font-semibold">{SOCIAL_PROOF_COUNT}</strong>{' '}
          creators
        </span>
      </div>
    </div>
  );
}

/* ── HeroSection ──────────────────────────────────────────────────────────── */
export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-[#080808] pt-28 pb-20 lg:pt-36 lg:pb-28"
    >
      {/* Background glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top center violet */}
        <div className="absolute -top-40 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/[0.09] blur-[160px]" />
        {/* Top right pink */}
        <div className="absolute -top-10 right-[-8%] h-[500px] w-[500px] rounded-full bg-pink-600/[0.07] blur-[130px]" />
        {/* Bottom left lime */}
        <div className="absolute bottom-[-8%] left-[-4%] h-[400px] w-[400px] rounded-full bg-[#c8f135]/[0.04] blur-[110px]" />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <Container className="relative">
        <div className="mx-auto max-w-4xl text-center">

          {/* Badge */}
          <div
            className="mb-8 flex justify-center animate-fade-up"
            style={{ animationDelay: '0s', animationFillMode: 'both' }}
          >
            <Link
              href="/tools"
              className="group inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 text-[13px] font-medium text-zinc-300 hover:border-white/[0.18] hover:text-white transition-all duration-200 backdrop-blur-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#c8f135] shrink-0" />
              <span>✦ Introducing 100+ AI Tools</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Headline */}
          <h1
            className="text-[42px] font-bold tracking-tight sm:text-5xl lg:text-[62px] xl:text-[68px] text-white leading-[1.07] animate-fade-up"
            style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
          >
            All Your AI Tools.
            <span className="block mt-2">
              <GradientText>One Powerful</GradientText>{' '}
              <span className="text-white">Workspace.</span>
            </span>
          </h1>

          {/* Subtext */}
          <p
            className="mx-auto mt-6 max-w-[600px] text-[15px] text-zinc-400 leading-[1.75] sm:text-[16.5px] animate-fade-up"
            style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
          >
            Access powerful AI tools for writing, marketing, SEO, social media,
            images, coding and productivity from one unified platform.
          </p>

          {/* CTAs */}
          <div
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-up"
            style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
          >
            <CTAButton href="/register" variant="primary">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="/tools" variant="secondary">
              Explore AI Tools
            </CTAButton>
          </div>

          {/* Trust signals */}
          <div
            className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 animate-fade-up"
            style={{ animationDelay: '0.38s', animationFillMode: 'both' }}
          >
            {TRUST_SIGNALS.map((signal) => (
              <span key={signal} className="flex items-center gap-1.5 text-[12px] text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c8f135]/70 shrink-0" />
                {signal}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <HeroStats />

        {/* Social proof */}
        <SocialProof />
      </Container>
    </section>
  );
}
