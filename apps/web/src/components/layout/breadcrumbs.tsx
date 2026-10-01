import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@crackncode/ui';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  const all = showHome ? [{ label: 'Home', href: '/dashboard' }, ...items] : items;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        {all.map((item, i) => {
          const isLast = i === all.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {i === 0 && showHome ? (
                <Link
                  href={item.href ?? '/'}
                  className="hover:text-foreground transition-colors"
                  aria-label="Home"
                >
                  <Home className="h-3.5 w-3.5" />
                </Link>
              ) : isLast ? (
                <span className="font-medium text-foreground truncate max-w-[200px]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href ?? '#'}
                  className="hover:text-foreground transition-colors truncate max-w-[120px]"
                >
                  {item.label}
                </Link>
              )}
              {!isLast && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
