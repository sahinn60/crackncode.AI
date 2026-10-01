'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Zap, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Data ─────────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Tools',            href: '#tools' },
  { label: 'Features',         href: '#features' },
  { label: 'Tools Limitation', href: '/tools' },
] as const;

/* ── Logo ─────────────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0 group">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c8f135] shadow-[0_0_14px_rgba(200,241,53,0.35)] transition-shadow duration-300 group-hover:shadow-[0_0_22px_rgba(200,241,53,0.55)]">
        <Zap className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
      </div>
      <span className="text-[15px] font-bold tracking-tight text-white">
        CracknCode <span className="text-[#c8f135]">AI</span>
      </span>
    </Link>
  );
}

/* ── Desktop NavLink ──────────────────────────────────────────────────────── */
function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const isHash = href.startsWith('#');

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isHash) {
      e.preventDefault();
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        'relative px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-200 rounded-md',
        isActive
          ? 'text-white'
          : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]',
      )}
    >
      {label}
      {isActive && (
        <span className="absolute bottom-1 left-3.5 right-3.5 h-px rounded-full bg-[#c8f135]/70" />
      )}
    </a>
  );
}

/* ── Main Header ──────────────────────────────────────────────────────────── */
export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[200] transition-all duration-300',
        scrolled
          ? 'bg-[#080808]/95 backdrop-blur-xl border-b border-white/[0.07] shadow-[0_1px_24px_rgba(0,0,0,0.5)]'
          : 'bg-transparent border-b border-white/[0.04]',
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[62px] items-center justify-between gap-6">

          {/* Left — Logo */}
          <Logo />

          {/* Center — Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.label} href={link.href} label={link.label} />
            ))}
          </nav>

          {/* Right — Actions */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Currency badge */}
            <span className="text-[11px] font-semibold text-zinc-500 border border-zinc-700/80 rounded-md px-2 py-1 select-none tracking-wide">
              ৳ BDT
            </span>

            {/* Primary CTA */}
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#c8f135] px-4 py-1.5 text-[12.5px] font-bold text-black hover:bg-[#d6f74e] transition-all duration-200 shadow-[0_0_14px_rgba(200,241,53,0.2)] hover:shadow-[0_0_22px_rgba(200,241,53,0.38)]"
            >
              <Zap className="h-3 w-3" strokeWidth={2.5} />
              Let&apos;s Build Your AI Start-up
            </Link>

            {/* Sign In */}
            <Link
              href="/login"
              className="px-3 py-1.5 text-[13px] font-medium text-zinc-400 hover:text-white transition-colors duration-200"
            >
              Sign In
            </Link>

            {/* Get Started */}
            <Link
              href="/register"
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-white/[0.08] hover:border-white/[0.18] transition-all duration-200"
            >
              Get Started
              <span className="text-zinc-400 text-sm">→</span>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'lg:hidden overflow-hidden transition-all duration-300 ease-in-out',
          mobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="border-t border-white/[0.06] bg-[#080808]/98 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-4 space-y-1">
            {NAV_LINKS.map((link) => {
              const isHash = link.href.startsWith('#');
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    if (isHash) {
                      e.preventDefault();
                      setMobileOpen(false);
                      setTimeout(() => {
                        document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                      }, 200);
                    } else {
                      setMobileOpen(false);
                    }
                  }}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#c8f135]/8 text-[#c8f135]'
                      : 'text-zinc-400 hover:bg-white/[0.05] hover:text-white',
                  )}
                >
                  {link.label}
                </a>
              );
            })}

            <div className="pt-3 mt-1 border-t border-white/[0.06] space-y-2">
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full rounded-full bg-[#c8f135] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#d6f74e] transition-colors"
              >
                <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
                Let&apos;s Build Your AI Start-up
              </Link>
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08] transition-colors"
                >
                  Get Started →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
