import * as React from 'react';
import { cn } from '@crackncode/ui';

/* ── Container ──────────────────────────────────────────────────────────────── */
export function Container({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)} {...props}>
      {children}
    </div>
  );
}

/* ── SectionWrapper ─────────────────────────────────────────────────────────── */
interface SectionWrapperProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div';
  subtle?: boolean;
}
export function SectionWrapper({ as: Tag = 'section', subtle, className, children, ...props }: SectionWrapperProps) {
  return (
    <Tag
      className={cn('py-20 lg:py-28', subtle && 'bg-background-subtle', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

/* ── SectionLabel ───────────────────────────────────────────────────────────── */
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-primary', className)}>
      {children}
    </div>
  );
}

/* ── SectionHeading ─────────────────────────────────────────────────────────── */
interface SectionHeadingProps {
  label?: string;
  title: React.ReactNode;
  description?: string;
  centered?: boolean;
  className?: string;
}
export function SectionHeading({ label, title, description, centered = true, className }: SectionHeadingProps) {
  return (
    <div className={cn('mb-12 lg:mb-16', centered && 'text-center', className)}>
      {label && (
        <div className={cn('mb-4', centered && 'flex justify-center')}>
          <SectionLabel>{label}</SectionLabel>
        </div>
      )}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
        {title}
      </h2>
      {description && (
        <p className={cn('mt-4 text-lg text-muted-foreground leading-relaxed', centered && 'mx-auto max-w-2xl')}>
          {description}
        </p>
      )}
    </div>
  );
}

/* ── GradientText ───────────────────────────────────────────────────────────── */
export function GradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('bg-gradient-to-r from-primary via-violet-400 to-pink-400 bg-clip-text text-transparent', className)}>
      {children}
    </span>
  );
}

/* ── Divider ────────────────────────────────────────────────────────────────── */
export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-gradient-to-r from-transparent via-border to-transparent', className)} />;
}
