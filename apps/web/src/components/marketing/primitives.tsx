import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
      className={cn('py-20 lg:py-28', subtle ? 'bg-[#0a0a0a]' : 'bg-[#080808]', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

/* ── SectionLabel ───────────────────────────────────────────────────────────── */
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-violet-400', className)}>
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
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-white">
        {title}
      </h2>
      {description && (
        <p className={cn('mt-4 text-base text-zinc-400 leading-relaxed sm:text-lg', centered && 'mx-auto max-w-2xl')}>
          {description}
        </p>
      )}
    </div>
  );
}

/* ── GradientText ───────────────────────────────────────────────────────────── */
export function GradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent', className)}>
      {children}
    </span>
  );
}

/* ── Divider ────────────────────────────────────────────────────────────────── */
export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent', className)} />;
}
