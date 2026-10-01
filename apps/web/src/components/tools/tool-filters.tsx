'use client';

import { cn } from '@crackncode/ui';
import { Flame, Star, Crown, Zap, LayoutGrid } from 'lucide-react';

export interface ToolFiltersState {
  categoryId: string;
  sort: string;
  featured: boolean;
  premium: string; // 'all' | 'free' | 'pro'
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { tools: number };
}

interface ToolFiltersProps {
  filters: ToolFiltersState;
  onChange: (next: Partial<ToolFiltersState>) => void;
  categories: Category[];
  totalCount: number;
}

const SORT_OPTIONS = [
  { value: 'default',  label: 'Default',  icon: LayoutGrid },
  { value: 'popular',  label: 'Popular',  icon: Flame },
];

const PLAN_OPTIONS = [
  { value: 'all',  label: 'All',  icon: Zap },
  { value: 'free', label: 'Free', icon: Zap },
  { value: 'pro',  label: 'Pro',  icon: Crown },
];

function FilterPill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

export function ToolFilters({ filters, onChange, categories, totalCount }: ToolFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Sort + Plan row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">Sort</span>
        {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
          <FilterPill key={value} active={filters.sort === value} onClick={() => onChange({ sort: value })}>
            <Icon className="h-3 w-3" /> {label}
          </FilterPill>
        ))}

        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-3 mr-1">Plan</span>
        {PLAN_OPTIONS.map(({ value, label, icon: Icon }) => (
          <FilterPill key={value} active={filters.premium === value} onClick={() => onChange({ premium: value })}>
            <Icon className="h-3 w-3" /> {label}
          </FilterPill>
        ))}

        <FilterPill active={filters.featured} onClick={() => onChange({ featured: !filters.featured })}>
          <Star className="h-3 w-3" /> Featured
        </FilterPill>
      </div>

      {/* Category row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">Category</span>
        <FilterPill active={filters.categoryId === ''} onClick={() => onChange({ categoryId: '' })}>
          All ({totalCount})
        </FilterPill>
        {categories.map((cat) => (
          <FilterPill
            key={cat.id}
            active={filters.categoryId === cat.id}
            onClick={() => onChange({ categoryId: cat.id })}
          >
            {cat.name}
            {cat._count != null && (
              <span className="opacity-70">({cat._count.tools})</span>
            )}
          </FilterPill>
        ))}
      </div>
    </div>
  );
}
