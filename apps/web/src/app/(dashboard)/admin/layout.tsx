'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Wrench, CreditCard, BarChart3,
  MessageCircle, FileText, Shield, ChevronLeft, LogOut, Globe,
} from 'lucide-react';
import { cn } from '@crackncode/ui';
import { useAuth } from '@/providers/auth-provider';

const NAV = [
  { label: 'Overview',  href: '/admin',           icon: LayoutDashboard },
  { label: 'Users',     href: '/admin/users',      icon: Users },
  { label: 'Tools',     href: '/admin/tools',      icon: Wrench },
  { label: 'Plans',     href: '/admin/plans',      icon: Shield },
  { label: 'Payments',  href: '/admin/payments',   icon: CreditCard },
  { label: 'Support',   href: '/admin/support',    icon: MessageCircle },
  { label: 'Analytics', href: '/admin/analytics',  icon: BarChart3 },
  { label: 'Audit Log',    href: '/admin/logs',          icon: FileText },
  { label: 'Landing Page', href: '/admin/landing-page',  icon: Globe },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && (!user || (user as any).role !== 'admin')) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || (user as any).role !== 'admin') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--topbar-height))] -mx-6 -my-6">
      <aside className="w-52 shrink-0 flex flex-col border-r border-border bg-card">
        <div className="flex h-12 items-center gap-2 border-b border-border px-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-destructive">
            <Shield className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground leading-none">Admin Panel</p>
            <p className="text-2xs text-muted-foreground mt-0.5 truncate max-w-[120px]">{(user as any).email}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-2 space-y-0.5">
          <Link href="/dashboard" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to App
          </Link>
          <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto p-6 min-w-0">
        {children}
      </div>
    </div>
  );
}
