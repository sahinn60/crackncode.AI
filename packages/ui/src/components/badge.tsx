import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-primary text-primary-foreground',
        secondary:   'border-transparent bg-secondary text-secondary-foreground',
        outline:     'border-border text-foreground bg-transparent',
        destructive: 'border-transparent bg-destructive/15 text-destructive border-destructive/20',
        success:     'border-transparent bg-success/15 text-success border-success/20',
        warning:     'border-transparent bg-warning/15 text-warning border-warning/20',
        info:        'border-transparent bg-info/15 text-info border-info/20',
        muted:       'border-transparent bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-success',
            variant === 'destructive' && 'bg-destructive',
            variant === 'warning' && 'bg-warning',
            variant === 'info' && 'bg-info',
            (!variant || variant === 'default') && 'bg-primary-foreground',
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
