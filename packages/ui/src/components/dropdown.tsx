'use client';

import * as React from 'react';
import { cn } from '../lib/utils';

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separator?: never;
}

export interface DropdownSeparator {
  separator: true;
  label?: string;
}

export type DropdownMenuItem = DropdownItem | DropdownSeparator;

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  className?: string;
}

function Dropdown({ trigger, items, align = 'left', className }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-[100] mt-1.5 min-w-[180px] rounded-lg border border-border bg-popover p-1 shadow-lg animate-in',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          role="menu"
        >
          {items.map((item, i) => {
            if ('separator' in item) {
              return (
                <div key={i}>
                  {item.label && (
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{item.label}</p>
                  )}
                  {!item.label && <div className="my-1 h-px bg-border" />}
                </div>
              );
            }
            return (
              <button
                key={i}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:bg-accent',
                  item.destructive
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-foreground hover:bg-accent',
                  item.disabled && 'pointer-events-none opacity-50',
                )}
              >
                {item.icon && (
                  <span className="h-4 w-4 shrink-0 text-muted-foreground">{item.icon}</span>
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { Dropdown };
