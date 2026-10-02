'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, LayoutDashboard, Zap, Heart,
  History, Coins, CreditCard, Bell, MessageCircle, Settings,
  Code2, Crown, LogOut, Shield, Terminal, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useUnreadCount } from '@/hooks/use-dashboard';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

function useNavGroups() {
  const { data: unreadData } = useUnreadCount();
  const { user } = useAuth();
  const unread = (unreadData as any)?.count ?? 0;
  const isAdmin = (user as any)?.role === 'admin';

  const groups: NavGroup[] = [
    {
      items: [
        { label: 'Dashboard',     href: '/dashboard',     icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'AI Tools',      href: '/tools',         icon: <Zap className="h-4 w-4" />, badge: 'New' },
        { label: 'Favorites',     href: '/favorites',     icon: <Heart className="h-4 w-4" /> },
        { label: 'History',       href: '/history',       icon: <History className="h-4 w-4" /> },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'Credits',       href: '/credits',       icon: <Coins className="h-4 w-4" /> },
        { label: 'Subscription',  href: '/subscription',  icon: <Crown className="h-4 w-4" /> },
        { label: 'Billing',       href: '/billing',       icon: <CreditCard className="h-4 w-4" /> },
        { label: 'Notifications', href: '/notifications', icon: <Bell className="h-4 w-4" />, badge: unread > 0 ? unread : undefined },
        { label: 'Live Chat',     href: '/chat',          icon: <MessageCircle className="h-4 w-4" /> },
        { label: 'Developer',     href: '/developer',     icon: <Terminal className="h-4 w-4" /> },
        { label: 'Settings',      href: '/settings',      icon: <Settings className="h-4 w-4" /> },
      ],
    },
    ...(isAdmin ? [{
      label: 'Admin',
      items: [
        { label: 'Admin Panel',      href: '/admin',                          icon: <Shield className="h-4 w-4" /> },
        { label: 'Browser Tools',    href: '/admin/tools/browser-sessions',   icon: <Globe className="h-4 w-4" /> },
      ],
    }] : []),
  ];

  return groups;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const navGroups = useNavGroups();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-[200] flex h-full flex-col bg-sidebar border-r border-sidebar-border sidebar-transition',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
      )}
    >
      {/* Logo */}
      <div className="flex h-topbar items-center border-b border-sidebar-border px-4 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Code2 className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground truncate">CracknCode AI</span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && !collapsed && (
              <p className="mb-1 px-2 text-2xs font-semibold uppercase tracking-widest text-sidebar-muted">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                const link = (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                      collapsed && 'justify-center px-2',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="shrink-0 relative">
                      {item.icon}
                      {collapsed && item.badge && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-2xs font-bold text-primary-foreground">
                          {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className={cn(
                            'rounded-full px-1.5 py-0.5 text-2xs font-semibold',
                            typeof item.badge === 'number'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-primary/10 text-primary',
                          )}>
                            {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {link}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User + logout */}
      {user && (
        <div className="border-t border-sidebar-border p-2 space-y-0.5">
          {!collapsed && (
            <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {(user as any).profile?.name?.[0] ?? user.email[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-sidebar-foreground">
                  {(user as any).profile?.name ?? user.email}
                </p>
                <p className="truncate text-2xs text-sidebar-muted capitalize">{user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-destructive transition-colors',
              collapsed && 'justify-center',
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
          <button
            onClick={onToggle}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors',
              collapsed && 'justify-center',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
          </button>
        </div>
      )}
    </aside>
  );
}
