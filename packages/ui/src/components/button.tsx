import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98]',
        outline:
          'border border-border bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 active:scale-[0.98]',
        ghost:
          'hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
        link:
          'text-primary underline-offset-4 hover:underline',
        success:
          'bg-success text-success-foreground shadow-sm hover:bg-success/90 active:scale-[0.98]',
      },
      size: {
        xs:      'h-7 rounded px-2.5 text-xs',
        sm:      'h-8 rounded-md px-3 text-xs',
        default: 'h-9 px-4 py-2',
        lg:      'h-10 rounded-md px-6',
        xl:      'h-12 rounded-lg px-8 text-base',
        icon:    'h-9 w-9',
        'icon-sm': 'h-7 w-7 rounded',
        'icon-lg': 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  ),
);
Button.displayName = 'Button';

export { Button, buttonVariants };
