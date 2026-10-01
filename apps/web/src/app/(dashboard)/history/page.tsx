'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, cn,
} from '@crackncode/ui';
import { PageHeader } from '@/components/layout/page-header';
import { ErrorState, EmptyState } from '@/components/dashboard/states';
import { useHistory } from '@/hooks/use-history';
import { useCategories } from '@/hooks/use-dashboard';
import {
  History, Search, Filter, Trash2, Pin, Copy, Download,
  RefreshCw, Eye, Clock, Coins, ChevronLeft, ChevronRight,
  Loader2, X, Check, Zap,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function statusVariant(s: string) {
  if (s === 'completed') return 'success';
  if (s === 'failed') return 'destructive';
  if (s === 'processing') return 'info';
  return 'default';
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handle} title="Copy output">
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

// ─── Download button ──────────────────────────────────────────────────────────

function DownloadButton({ text, slug }: { text: string; slug: string }) {
  const handle = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-output.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handle} title="Download output">
      <Download className="h-3.5 w-3.5" />
    </Button>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({
  filters,
  categories,
  onChange,
  onClear,
}: {
  filters: ReturnType<typeof useHistory>['filters'];
  categories: any[];
  onChange: (f: Partial<typeof filters>) => void;
  onClear: () => void;
}) {
  const hasActive = filters.search || filters.categorySlug || filters.dateFrom || filters.dateTo;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search by tool name…"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Category */}
      <select
        value={filters.categorySlug}
        onChange={(e) => onChange({ categorySlug: e.target.value })}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
      >
        <option value="">All categories</option>
        {categories.map((c: any) => (
          <option key={c.slug} value={c.slug}>{c.name}</option>
        ))}
      </select>

      {/* Date from */}
      <input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => onChange({ dateFrom: e.target.value })}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        title="From date"
      />

      {/* Date to */}
      <input
        type="date"
        value={filters.dateTo}
        onChange={(e) => onChange({ dateTo: e.target.value })}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        title="To date"
      />

      {hasActive && (
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5 text-muted-foreground">
          <X className="h-3.5 w-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}

// ─── History row ──────────────────────────────────────────────────────────────

function HistoryRow({
  item,
  onDelete,
  onPin,
}: {
  item: ReturnType<typeof useHistory>['items'][number];
  onDelete: () => void;
  onPin: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const { generation } = item;
  const output = generation.result?.output ?? '';

  return (
    <li className="border-b border-border last:border-0">
      <div className="flex items-start gap-3 px-5 py-4">
        {/* Icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
          <Zap className="h-4 w-4" />
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">
              {generation.tool.name}
            </span>
            {generation.tool.category && (
              <Badge variant="outline" className="text-2xs">{generation.tool.category.name}</Badge>
            )}
            {item.isPinned && (
              <Badge variant="info" className="text-2xs">Pinned</Badge>
            )}
            <Badge variant={statusVariant(generation.status) as any} className="text-2xs">
              {generation.status}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {timeAgo(item.createdAt)}
            </span>
            {generation.creditsCost > 0 && (
              <span className="flex items-center gap-1">
                <Coins className="h-3 w-3 text-warning" /> {generation.creditsCost} credits
              </span>
            )}
            {generation.durationMs && (
              <span>{(generation.durationMs / 1000).toFixed(1)}s</span>
            )}
            {generation.aiModel && (
              <span className="text-muted-foreground/60">{generation.aiModel}</span>
            )}
          </div>

          {/* Collapsed preview */}
          {output && !expanded && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{output}</p>
          )}

          {/* Expanded output */}
          {expanded && output && (
            <pre className="mt-2 whitespace-pre-wrap text-xs text-foreground bg-muted/40 rounded-lg p-3 max-h-64 overflow-y-auto font-sans leading-relaxed">
              {output}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {output && (
            <>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => setExpanded((v) => !v)}
                title={expanded ? 'Collapse' : 'View output'}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <CopyButton text={output} />
              <DownloadButton text={output} slug={generation.tool.slug} />
            </>
          )}
          <Button
            variant="ghost" size="icon"
            className={cn('h-7 w-7', item.isPinned && 'text-primary')}
            onClick={onPin}
            title={item.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="h-3.5 w-3.5" />
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-7 w-7" title="Use tool again">
            <Link href={`/tools/${generation.tool.slug}`}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const {
    items, total, page, totalPages, loading, error,
    filters, applyFilters, setPage, remove, togglePin, clear, refetch,
  } = useHistory();

  const { data: catData } = useCategories();
  const categories: any[] = Array.isArray(catData) ? catData : ((catData as any)?.data ?? []);

  const [clearing, setClearing] = React.useState(false);

  const handleClear = async () => {
    if (!confirm('Delete all history? This cannot be undone.')) return;
    setClearing(true);
    try { await clear(); } finally { setClearing(false); }
  };

  const clearFilters = () =>
    applyFilters({ search: '', categorySlug: '', dateFrom: '', dateTo: '' });

  return (
    <div className="space-y-6">
      <PageHeader
        title="History"
        description="All your past AI generations."
        breadcrumbs={[{ label: 'History' }]}
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Generation History
              {total > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">{total}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5 h-8">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
              {total > 0 && (
                <Button
                  variant="outline" size="sm"
                  onClick={handleClear}
                  disabled={clearing}
                  className="gap-1.5 h-8 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
                >
                  {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mt-3">
            <FilterBar
              filters={filters}
              categories={categories}
              onChange={applyFilters}
              onClear={clearFilters}
            />
          </div>
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
          ) : items.length === 0 ? (
            <EmptyState
              icon={History}
              title="No history found"
              description={
                filters.search || filters.categorySlug || filters.dateFrom || filters.dateTo
                  ? 'No results match your filters.'
                  : 'Your AI generations will appear here.'
              }
            />
          ) : (
            <ul>
              {items.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  onDelete={() => remove(item.id)}
                  onPin={() => togglePin(item.id)}
                />
              ))}
            </ul>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages} · {total} total
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="icon" className="h-7 w-7"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = totalPages <= 5 ? i : Math.max(0, page - 2) + i;
                  if (p >= totalPages) return null;
                  return (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'outline'}
                      size="icon"
                      className="h-7 w-7 text-xs"
                      onClick={() => setPage(p)}
                    >
                      {p + 1}
                    </Button>
                  );
                })}
                <Button
                  variant="outline" size="icon" className="h-7 w-7"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
