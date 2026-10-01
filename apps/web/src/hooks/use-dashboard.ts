'use client';

import * as React from 'react';
import { apiClient } from '@/lib/api-client';
import { useApi } from './use-api';

export function useCredits() {
  return useApi(() => apiClient.credits.account());
}

export function useGenerations(take = 5) {
  return useApi(() => apiClient.generations.list(0, take));
}

export function useFavorites() {
  return useApi(() => apiClient.favorites.list());
}

export function usePopularTools() {
  return useApi(() => apiClient.tools.list({ sort: 'popular', take: 6 }));
}

export function useNotifications(take = 20, skip = 0) {
  return useApi(() => apiClient.notifications.list(skip, take), [skip, take]);
}

export function useUnreadCount(pollMs = 30000) {
  const result = useApi(() => apiClient.notifications.unreadCount());

  React.useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(result.refetch, pollMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollMs]);

  return result;
}

export function useSubscription() {
  return useApi(() => apiClient.subscriptions.mine());
}

export function useCategories() {
  return useApi(() => apiClient.categories.list());
}

export function useAllTools(params: Parameters<typeof apiClient.tools.list>[0] = {}) {
  return useApi(() => apiClient.tools.list(params), [JSON.stringify(params)]);
}
