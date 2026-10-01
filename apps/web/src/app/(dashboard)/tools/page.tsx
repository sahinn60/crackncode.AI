'use client';

import * as React from 'react';
import { Button, cn } from '@crackncode/ui';
import { PageHeader } from '@/components/layout/page-header';
import { ToolCard, type ToolCardTool } from '@/components/tools/tool-card';
import { ToolSearch } from '@/components/tools/tool-search';
import { ToolFilters, type ToolFiltersState } from '@/components/tools/tool-filters';
import { ToolGridSkeleton } from '@/components/tools/tool-grid-skeleton';
import { ErrorState, EmptyState } from '@/components/dashboard/states';
import { useCategories } from '@/hooks/use-dashboard';
import { useApi } from '@/hooks/use-api';
import { apiClient } from '@/lib/api-client';
import { Zap, RefreshCw } from 'lucide-react';

const DEFAULT_FILTERS: ToolFiltersState = {
  categoryId: '',
  sort: 'default',
  featured: false,
  premium: 'all',
};

const PAGE_SIZE = 24;

export default function ToolsPage() {
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [filters, setFilters] = React.useState<ToolFiltersState>(DEFAULT_FILTERS);
  const [page, setPage] = React.useState(0);
  const [favoritedIds, setFavoritedIds] = React.useState<Set<string>>(new Set());

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  const updateFilters = (next: Partial<ToolFiltersState>) => {
    setFilters((f) => ({ ...f, ...next }));
    setPage(0);
  };

  // Build API params
  const params = React.useMemo(() => ({
    search: debouncedSearch || undefined,
    categoryId: filters.categoryId || undefined,
    sort: filters.sort !== 'default' ? filters.sort : undefined,
    featured: filters.featured || undefined,
    premium: filters.premium === 'pro' ? true : filters.premium === 'free' ? false : undefined,
    skip: page * PAGE_SIZE,
    take: PAGE_SIZE,
  }), [debouncedSearch, filters, page]);

  const tools = useApi(() => apiClient.tools.list(params), [JSON.stringify(params)]);
  const categories = useCategories();

  // Load favorites to mark favorited state
  const favs = useApi(() => apiClient.favorites.list());
  React.useEffect(() => {
    const list: any[] = Array.isArray(favs.data) ? favs.data : ((favs.data as any)?.data ?? []);
    setFavoritedIds(new Set(list.map((f: any) => f.toolId ?? f.tool?.id)));
  }, [favs.data]);

  const toolList: ToolCardTool[] = (tools.data as any)?.data ?? (Array.isArray(tools.data) ? tools.data : []);
  const total: number = (tools.data as any)?.total ?? toolList.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const catList: any[] = Array.isArray(categories.data) ? categories.data : ((categories.data as any)?.data ?? []);

  const handleFavoriteToggle = (toolId: string, next: boolean) => {
    setFavoritedIds((prev) => {
      const s = new Set(prev);
      next ? s.add(toolId) : s.delete(toolId);
      return s;
    });
  };

  const hasActiveFilters =
    filters.categoryId !== '' ||
    filters.sort !== 'default' ||
    filters.featured ||
    filters.premium !== 'all' ||
    search !== '';

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Tools"
        description="Browse and launch 100+ AI-powered tools."
        breadcrumbs={[{ label: 'AI Tools' }]}
      />

      {/* Search */}
      <ToolSearch value={search} onChange={setSearch} className="max-w-xl" />

      {/* Filters */}
      <ToolFilters
        filters={filters}
        onChange={updateFilters}
        categories={catList}
        totalCount={total}
      />

      {/* Results bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tools.loading ? (
            'Loading...'
          ) : (
            <>
              <strong className="text-foreground">{total.toLocaleString()}</strong> tools
              {debouncedSearch && (
                <> for &ldquo;<strong className="text-foreground">{debouncedSearch}</strong>&rdquo;</>
              )}
            </>
          )}
        </p>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(''); setFilters(DEFAULT_FILTERS); setPage(0); }}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Clear filters
          </Button>
        )}
      </div>

      {/* Grid */}
      {tools.loading ? (
        <ToolGridSkeleton count={PAGE_SIZE} />
      ) : tools.error ? (
        <ErrorState message={tools.error} onRetry={tools.refetch} />
      ) : toolList.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No tools found"
          description={hasActiveFilters ? 'Try adjusting your filters or search term.' : 'No tools available yet.'}
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilters(DEFAULT_FILTERS); }}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {toolList.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isFavorited={favoritedIds.has(tool.id)}
                onFavoriteToggle={handleFavoriteToggle}
                href={`/tools/${tool.slug}`}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const start = Math.max(0, Math.min(page - 3, totalPages - 7));
                  const p = start + i;
                  if (p >= totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'h-8 w-8 rounded-md text-sm font-medium transition-colors',
                        page === p
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      {p + 1}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
