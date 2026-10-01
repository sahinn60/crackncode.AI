'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge,
} from '@crackncode/ui';
import { PageHeader } from '@/components/layout/page-header';
import { ErrorState, EmptyState } from '@/components/dashboard/states';
import { apiClient } from '@/lib/api-client';
import { useApi } from '@/hooks/use-api';
import {
  Heart, ArrowRight, Zap, Search, Trash2, Loader2, X,
} from 'lucide-react';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FavoritesPage() {
  const { data, loading, error, refetch } = useApi(() => apiClient.favorites.list());
  const rawList: any[] = Array.isArray(data) ? data : ((data as any)?.data ?? []);

  const [search, setSearch] = React.useState('');
  const [removing, setRemoving] = React.useState<string | null>(null);

  const list = search
    ? rawList.filter((fav) => {
        const tool = fav.tool ?? fav;
        return (
          tool.name?.toLowerCase().includes(search.toLowerCase()) ||
          tool.category?.name?.toLowerCase().includes(search.toLowerCase())
        );
      })
    : rawList;

  const handleRemove = async (toolId: string) => {
    setRemoving(toolId);
    try {
      await apiClient.favorites.remove(toolId);
      refetch();
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Favorites"
        description="Your saved AI tools for quick access."
        breadcrumbs={[{ label: 'Favorites' }]}
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-destructive" />
              Saved Tools
              {rawList.length > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">{rawList.length}</Badge>
              )}
            </CardTitle>
            <Button size="sm" asChild>
              <Link href="/tools" className="gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Browse Tools
              </Link>
            </Button>
          </div>

          {rawList.length > 0 && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search favorites…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState message={error} onRetry={refetch} />
            </div>
          ) : rawList.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No favorites yet"
              description="Browse tools and click the heart icon to save them here."
              action={
                <Button size="sm" asChild>
                  <Link href="/tools">Browse Tools</Link>
                </Button>
              }
            />
          ) : list.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No results"
              description={`No favorites match "${search}".`}
            />
          ) : (
            <div className="divide-y divide-border">
              {list.map((fav: any) => {
                const tool = fav.tool ?? fav;
                const isRemoving = removing === tool.id;
                return (
                  <div key={fav.id} className="flex items-center gap-4 px-5 py-4">
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Zap className="h-5 w-5" />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground text-sm">{tool.name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {tool.shortDescription ?? tool.description ?? ''}
                      </p>
                    </div>

                    {/* Badges + actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {tool.isPremium && (
                        <Badge variant="warning" className="text-2xs">Pro</Badge>
                      )}
                      {tool.category?.name && (
                        <Badge variant="outline" className="text-2xs">{tool.category.name}</Badge>
                      )}
                      <Button size="sm" asChild>
                        <Link href={`/tools/${tool.slug ?? tool.id}`} className="gap-1">
                          Use <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemove(tool.id)}
                        disabled={isRemoving}
                        title="Remove from favorites"
                      >
                        {isRemoving
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
