import * as React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const alertVariants = cva(
  'relative flex items-start gap-3 rounded-lg border p-4 text-sm',
  {
    variants: {
      variant: {
        default:     'bg-background border-border text-foreground',
        info:        'bg-info/10 border-info/20 text-foreground',
        success:     'bg-success/10 border-success/20 text-foreground',
        warning:     'bg-warning/10 border-warning/20 text-foreground',
        destructive: 'bg-destructive/10 border-destructive/20 text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

const icons = {
  default:     <Info className="h-4 w-4 text-muted-foreground mt-0.5" />,
  info:        <Info className="h-4 w-4 text-info mt-0.5" />,
  success:     <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />,
  warning:     <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />,
  destructive: <XCircle className="h-4 w-4 text-destructive mt-0.5" />,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  onDismiss?: () => void;
}

function Alert({ className, variant = 'default', title, children, onDismiss, ...props }: AlertProps) {
  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert" {...props}>
      <span className="shrink-0">{icons[variant ?? 'default']}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium mb-0.5">{title}</p>}
        {children && <div className="text-sm text-muted-foreground">{children}</div>}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export { Alert };
