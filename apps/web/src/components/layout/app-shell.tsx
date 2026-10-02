'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileNavigation } from './mobile-navigation';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      </div>

      {/* Mobile navigation drawer */}
      <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Topbar */}
      <Topbar
        onMobileMenuOpen={() => setMobileOpen(true)}
        sidebarCollapsed={collapsed}
      />

      {/* Main content — single render, offset by sidebar on desktop */}
      <main
        className={cn(
          'pt-topbar transition-all duration-200',
          'md:pl-[var(--sidebar-width)]',
          collapsed && 'md:pl-[var(--sidebar-collapsed-width)]',
        )}
      >
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
