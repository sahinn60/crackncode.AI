'use client';

import * as React from 'react';
import { apiClient } from '@/lib/api-client';

export interface HistoryFilters {
  search: string;
  categorySlug: string;
  dateFrom: string;
  dateTo: string;
}

export interface HistoryItem {
  id: string;
  isPinned: boolean;
  createdAt: string;
  generation: {
    id: string;
    input: Record<string, unknown>;
    status: string;
    creditsCost: number;
    durationMs: number | null;
    aiModel: string | null;
    tool: {
      id: string;
      name: string;
      slug: string;
      iconUrl: string | null;
      category: { name: string; slug: string } | null;
    };
    result: { output: string; outputFormat: string } | null;
  };
}

const PAGE_SIZE = 20;

export function useHistory() {
  const [items, setItems] = React.useState<HistoryItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState<HistoryFilters>({
    search: '',
    categorySlug: '',
    dateFrom: '',
    dateTo: '',
  });

  const fetchHistory = React.useCallback(
    async (currentPage: number, currentFilters: HistoryFilters) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.history.list({
          skip: currentPage * PAGE_SIZE,
          take: PAGE_SIZE,
          search: currentFilters.search || undefined,
          categorySlug: currentFilters.categorySlug || undefined,
          dateFrom: currentFilters.dateFrom || undefined,
          dateTo: currentFilters.dateTo || undefined,
        }) as any;
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load history');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Refetch when page or filters change
  React.useEffect(() => {
    fetchHistory(page, filters);
  }, [page, filters, fetchHistory]);

  const applyFilters = React.useCallback((next: Partial<HistoryFilters>) => {
    setPage(0);
    setFilters((prev) => ({ ...prev, ...next }));
  }, []);

  const remove = React.useCallback(async (id: string) => {
    await apiClient.history.remove(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotal((t) => t - 1);
  }, []);

  const togglePin = React.useCallback(async (id: string) => {
    const updated = await apiClient.history.togglePin(id) as any;
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isPinned: updated.isPinned } : i)),
    );
  }, []);

  const clear = React.useCallback(async () => {
    await apiClient.history.clear();
    setItems([]);
    setTotal(0);
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return {
    items,
    total,
    page,
    totalPages,
    loading,
    error,
    filters,
    applyFilters,
    setPage,
    remove,
    togglePin,
    clear,
    refetch: () => fetchHistory(page, filters),
  };
}
