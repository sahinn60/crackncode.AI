'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

const sizeClasses = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  '2xl':'max-w-2xl',
  full: 'max-w-full mx-4',
};

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: keyof typeof sizeClasses;
  children: React.ReactNode;
  className?: string;
  hideClose?: boolean;
}

function Dialog({ open, onClose, title, description, size = 'md', children, className, hideClose }: DialogProps) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full rounded-xl border border-border bg-card shadow-xl animate-zoom-in',
          sizeClasses[size],
          className,
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between p-6 pb-4">
            <div>
              {title && (
                <h2 id="dialog-title" className="text-base font-semibold text-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                className="ml-4 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        <div className={cn('px-6 pb-6', (title || !hideClose) && 'pt-0')}>{children}</div>
      </div>
    </div>
  );
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-end gap-3 pt-4 border-t border-border mt-4', className)}
      {...props}
    />
  );
}

export { Dialog, DialogFooter };
