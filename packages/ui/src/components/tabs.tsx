'use client';

import * as React from 'react';
import { cn } from '../lib/utils';

interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  variant?: 'underline' | 'pill' | 'boxed';
  className?: string;
}

function Tabs({ items, value, onValueChange, variant = 'underline', className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex',
        variant === 'underline' && 'border-b border-border gap-0',
        variant === 'pill' && 'gap-1 bg-muted p-1 rounded-lg',
        variant === 'boxed' && 'gap-0 border border-border rounded-lg overflow-hidden',
        className,
      )}
    >
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          aria-selected={value === item.value}
          disabled={item.disabled}
          onClick={() => !item.disabled && onValueChange(item.value)}
          className={cn(
            'inline-flex items-center gap-2 text-sm font-medium transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-50',
            variant === 'underline' && [
              'px-4 py-2.5 border-b-2 -mb-px',
              value === item.value
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            ],
            variant === 'pill' && [
              'px-3 py-1.5 rounded-md',
              value === item.value
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            ],
            variant === 'boxed' && [
              'px-4 py-2 border-r border-border last:border-r-0',
              value === item.value
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50',
            ],
          )}
        >
          {item.icon}
          {item.label}
          {item.badge !== undefined && (
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export { Tabs, type TabItem };
