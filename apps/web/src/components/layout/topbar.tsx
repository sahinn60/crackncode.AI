'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Bell, Sun, Moon, Menu, Coins, ChevronDown, User, Settings, CreditCard, LogOut } from 'lucide-react';
import { Avatar, Badge, cn } from '@crackncode/ui';
import { useTheme } from '@/providers/theme-provider';
import { useAuth } from '@/providers/auth-provider';
import { useCredits, useUnreadCount } from '@/hooks/use-dashboard';
import { NotificationDropdown } from './notification-dropdown';

interface TopbarProps {
  onMobileMenuOpen: () => void;
  sidebarCollapsed: boolean;
}

export function Topbar({ onMobileMenuOpen, sidebarCollapsed }: TopbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { data: creditsData } = useCredits();
  const { data: unreadData } = useUnreadCount();

  const balance = (creditsData as any)?.balance ?? '—';
  const unread = (unreadData as any)?.count ?? 0;

  const [profileOpen, setProfileOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);
  const notifRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = (user as any)?.profile?.name ?? user?.email ?? '';

  return (
    <header
      className="fixed top-0 right-0 z-[200] flex h-topbar items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 transition-all duration-200"
      style={{ left: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
    >
      {/* Mobile menu */}
      <button
        onClick={onMobileMenuOpen}
        className="md:hidden rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search tools, history..."
            className="h-8 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-2xs font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Credits */}
        <Link
          href="/credits"
          className="hidden sm:flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
        >
          <Coins className="h-3.5 w-3.5 text-warning" />
          {balance.toLocaleString?.() ?? balance}
        </Link>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-2xs font-bold text-primary-foreground">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* Profile dropdown */}
        <div className="relative ml-1" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md p-1 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar fallback={displayName} size="sm" status="online" />
            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform hidden sm:block', profileOpen && 'rotate-180')} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-popover p-1 shadow-lg animate-in z-50">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              {[
                { icon: User,        label: 'Profile',      href: '/settings' },
                { icon: CreditCard,  label: 'Billing',      href: '/billing' },
                { icon: Settings,    label: 'Settings',     href: '/settings' },
              ].map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </Link>
              ))}
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={() => { setProfileOpen(false); logout(); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
