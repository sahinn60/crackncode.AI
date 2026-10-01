import * as React from 'react';
import Link from 'next/link';
import { Code2, Sparkles, Shield, Zap } from 'lucide-react';

const FEATURES = [
  { icon: Sparkles, text: '100+ AI tools in one workspace' },
  { icon: Zap,      text: 'Generate content in seconds' },
  { icon: Shield,   text: 'Enterprise-grade security' },
];

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] shrink-0 flex-col justify-between bg-sidebar p-10 relative overflow-hidden">
        {/* Background orb */}
        <div aria-hidden="true" className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div aria-hidden="true" className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-2.5 w-fit">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Code2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-white">CracknCode AI</span>
        </Link>

        {/* Middle content */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              All Your AI Tools.<br />One Powerful Workspace.
            </h2>
            <p className="mt-3 text-sidebar-muted leading-relaxed">
              Join 50,000+ creators, marketers and developers who use CracknCode AI to produce better content, faster.
            </p>
          </div>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-sidebar-muted">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom testimonial */}
        <div className="relative rounded-xl border border-sidebar-border bg-sidebar-accent p-5">
          <p className="text-sm text-sidebar-muted leading-relaxed">
            &ldquo;CracknCode AI has completely transformed our content workflow. We produce 5x more content with the same team.&rdquo;
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">SC</div>
            <div>
              <p className="text-xs font-semibold text-white">Sarah Chen</p>
              <p className="text-xs text-sidebar-muted">Content Director, GrowthLab</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Code2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">CracknCode AI</span>
        </Link>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
