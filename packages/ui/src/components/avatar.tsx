import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const avatarVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground select-none',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-2xs',
        sm: 'h-8 w-8 text-xs',
        md: 'h-9 w-9 text-sm',
        lg: 'h-10 w-10 text-sm',
        xl: 'h-12 w-12 text-base',
        '2xl': 'h-16 w-16 text-lg',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

function getInitials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const statusColors = {
  online:  'bg-success',
  offline: 'bg-muted-foreground',
  busy:    'bg-destructive',
  away:    'bg-warning',
};

function Avatar({ src, alt, fallback, status, size, className }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={cn(avatarVariants({ size }), className)}>
      {src && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? fallback ?? 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span aria-label={alt ?? fallback}>{getInitials(fallback)}</span>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
            statusColors[status],
            size === 'xs' || size === 'sm' ? 'h-1.5 w-1.5' : 'h-2.5 w-2.5',
          )}
        />
      )}
    </div>
  );
}

function AvatarGroup({ children, max = 4 }: { children: React.ReactNode; max?: number }) {
  const items = React.Children.toArray(children);
  const visible = items.slice(0, max);
  const overflow = items.length - max;
  return (
    <div className="flex -space-x-2">
      {visible.map((child, i) => (
        <div key={i} className="ring-2 ring-background rounded-full">
          {child}
        </div>
      ))}
      {overflow > 0 && (
        <div className="ring-2 ring-background rounded-full inline-flex h-9 w-9 items-center justify-center bg-muted text-xs font-medium text-muted-foreground">
          +{overflow}
        </div>
      )}
    </div>
  );
}

export { Avatar, AvatarGroup };
