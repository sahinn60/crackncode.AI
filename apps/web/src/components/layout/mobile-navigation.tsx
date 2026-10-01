'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X, Code2, LayoutDashboard, Zap, Heart, History,
  Coins, Crown, CreditCard, Bell, MessageCircle, Settings,
} from 'lucide-react';
import { cn } from '@crackncode/ui';

const navItems = [
  { label: 'Dashboard',     href: '/dashboard',     icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'AI Tools',      href: '/tools',         icon: <Zap className="h-4 w-4" /> },
  { label: 'Favorites',     href: '/favorites',     icon: <Heart className="h-4 w-4" /> },
  { label: 'History',       href: '/history',       icon: <History className="h-4 w-4" /> },
  { label: 'Credits',       href: '/credits',       icon: <Coins className="h-4 w-4" /> },
  { label: 'Subscription',  href: '/subscription',  icon: <Crown className="h-4 w-4" /> },
  { label: 'Billing',       href: '/billing',       icon: <CreditCard className="h-4 w-4" /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell className="h-4 w-4" /> },
  { label: 'Live Chat',     href: '/chat',          icon: <MessageCircle className="h-4 w-4" /> },
  { label: 'Settings',      href: '/settings',      icon: <Settings className="h-4 w-4" /> },
];

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  const pathname = usePathname();

  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] md:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="absolute left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border animate-slide-in-right flex flex-col">
        <div className="flex h-topbar items-center justify-between border-b border-sidebar-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Code2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">CracknCode AI</span>
          </Link>
          <button onClick={onClose} className="rounded-md p-1.5 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
