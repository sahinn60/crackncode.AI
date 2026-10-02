import type { ApiResponse, HealthCheckResponse } from '@crackncode/types';
import { tokenStorage } from './token-storage';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function tryRefresh(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return res.ok;
}

async function apiFetch<T>(path: string, init?: RequestInit, auth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}/api/v1${path}`, { ...init, headers, credentials: 'include' });

  // Auto-refresh on 401
  if (res.status === 401 && auth) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshed = await tryRefresh().finally(() => { isRefreshing = false; });
      refreshQueue.forEach((cb) => cb(refreshed ? 'ok' : null));
      refreshQueue = [];

      if (refreshed) {
        const retryRes = await fetch(`${API_BASE}/api/v1${path}`, { ...init, headers, credentials: 'include' });
        const retryJson: ApiResponse<T> = await retryRes.json();
        if (!retryRes.ok || !retryJson.success) {
          throw new ApiError(retryRes.status, retryJson.error ?? retryJson.message ?? 'Request failed');
        }
        return retryJson.data as T;
      }
    } else {
      await new Promise<void>((resolve) => { refreshQueue.push(() => resolve()); });
      const retryRes = await fetch(`${API_BASE}/api/v1${path}`, { ...init, headers, credentials: 'include' });
      const retryJson: ApiResponse<T> = await retryRes.json();
      if (!retryRes.ok || !retryJson.success) {
        throw new ApiError(retryRes.status, retryJson.error ?? retryJson.message ?? 'Request failed');
      }
      return retryJson.data as T;
    }

    if (typeof window !== 'undefined') {
      tokenStorage.clear();
      window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.error ?? json.message ?? 'Request failed');
  }

  return json.data as T;
}

export const apiClient = {
  health: {
    check: () => apiFetch<HealthCheckResponse>('/health'),
  },

  auth: {
    register: (body: object) =>
      apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: object) =>
      apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () =>
      apiFetch('/auth/logout', { method: 'POST' }, true),
    me: () =>
      apiFetch('/auth/me', {}, true),
    forgotPassword: (body: object) =>
      apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
    resetPassword: (body: object) =>
      apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
    verifyEmail: (body: object) =>
      apiFetch('/auth/verify-email', { method: 'POST', body: JSON.stringify(body) }),
    refresh: () =>
      apiFetch('/auth/refresh', { method: 'POST' }),
    logoutAll: () =>
      apiFetch('/auth/logout-all', { method: 'POST' }, true),
    sessions: () =>
      apiFetch('/auth/sessions', {}, true),
    revokeSession: (sessionId: string) =>
      apiFetch(`/auth/sessions/${sessionId}`, { method: 'DELETE' }, true),
    changePassword: (body: object) =>
      apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify(body) }, true),
    refreshToken: (_refreshToken: string) =>
      apiFetch('/auth/refresh', { method: 'POST' }),
  },

  users: {
    me: () => apiFetch<any>('/users/me', {}, true),
    update: (body: object) => apiFetch<any>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }, true),
    changePassword: (body: object) =>
      apiFetch<any>('/users/me/change-password', { method: 'POST', body: JSON.stringify(body) }, true),
    delete: () => apiFetch<any>('/users/me', { method: 'DELETE' }, true),
  },

  credits: {
    account: () => apiFetch<any>('/credits', {}, true),
    transactions: (skip = 0, take = 20) =>
      apiFetch<any>(`/credits/transactions?skip=${skip}&take=${take}`, {}, true),
  },

  generations: {
    create: (body: { toolId: string; input: Record<string, unknown>; async?: boolean }) =>
      apiFetch<any>('/generations', { method: 'POST', body: JSON.stringify(body) }, true),
    list: (skip = 0, take = 10) => apiFetch<any>(`/generations?skip=${skip}&take=${take}`, {}, true),
    one: (id: string) => apiFetch<any>(`/generations/${id}`, {}, true),
    remove: (id: string) => apiFetch<any>(`/generations/${id}`, { method: 'DELETE' }, true),
  },

  tools: {
    list: (params: {
      search?: string; categoryId?: string; categorySlug?: string;
      sort?: string; featured?: boolean; premium?: boolean;
      skip?: number; take?: number;
    } = {}) => {
      const q = new URLSearchParams();
      if (params.search)       q.set('search', params.search);
      if (params.categoryId)   q.set('categoryId', params.categoryId);
      if (params.categorySlug) q.set('categorySlug', params.categorySlug);
      if (params.sort)         q.set('sort', params.sort);
      if (params.featured !== undefined) q.set('featured', String(params.featured));
      if (params.premium !== undefined)  q.set('premium', String(params.premium));
      if (params.skip !== undefined)     q.set('skip', String(params.skip));
      if (params.take !== undefined)     q.set('take', String(params.take));
      return apiFetch<any>(`/tools?${q.toString()}`, {}, false);
    },
    bySlug: (slug: string) => apiFetch<any>(`/tools/slug/${slug}`, {}, false),
    one: (id: string) => apiFetch<any>(`/tools/${id}`, {}, false),
  },

  categories: {
    list: () => apiFetch<any>('/categories', {}, false),
    toolsBySlug: (slug: string, search?: string, skip = 0, take = 50) => {
      const q = new URLSearchParams({ skip: String(skip), take: String(take) });
      if (search) q.set('search', search);
      return apiFetch<any>(`/categories/${slug}/tools?${q.toString()}`, {}, false);
    },
  },

  favorites: {
    list: () => apiFetch<any>('/favorites', {}, true),
    add: (toolId: string) => apiFetch<any>('/favorites', { method: 'POST', body: JSON.stringify({ toolId }) }, true),
    remove: (toolId: string) => apiFetch<any>(`/favorites/${toolId}`, { method: 'DELETE' }, true),
  },

  notifications: {
    list: (skip = 0, take = 20) => apiFetch<any>(`/notifications?skip=${skip}&take=${take}`, {}, true),
    unreadCount: () => apiFetch<any>('/notifications/unread-count', {}, true),
    markRead: (id: string) => apiFetch<any>(`/notifications/${id}/read`, { method: 'PATCH' }, true),
    markAllRead: () => apiFetch<any>('/notifications/read-all', { method: 'PATCH' }, true),
  },

  subscriptions: {
    mine: () => apiFetch<any>('/subscriptions', {}, true),
    cancel: () => apiFetch<any>('/subscriptions/cancel', { method: 'DELETE' }, true),
  },

  billing: {
    plans: () => apiFetch<any>('/billing/plans'),
    checkout: (body: { planId: string; interval: 'monthly' | 'yearly' }) =>
      apiFetch<any>('/billing/checkout', { method: 'POST', body: JSON.stringify(body) }, true),
    portal: () =>
      apiFetch<any>('/billing/portal', { method: 'POST' }, true),
    invoices: () => apiFetch<any>('/billing/invoices', {}, true),
    payments: () => apiFetch<any>('/billing/payments', {}, true),
  },

  support: {
    start: (body: { subject?: string }) =>
      apiFetch<any>('/support/conversations', { method: 'POST', body: JSON.stringify(body) }, true),
    conversations: () => apiFetch<any>('/support/conversations', {}, true),
    conversation: (id: string) => apiFetch<any>(`/support/conversations/${id}`, {}, true),
    messages: (id: string) => apiFetch<any>(`/support/conversations/${id}/messages`, {}, true),
    send: (id: string, body: { content: string; fileUrl?: string; fileName?: string; mimeType?: string }) =>
      apiFetch<any>(`/support/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify(body) }, true),
    handoff: (id: string) =>
      apiFetch<any>(`/support/conversations/${id}/handoff`, { method: 'POST' }, true),
    close: (id: string) =>
      apiFetch<any>(`/support/conversations/${id}/close`, { method: 'PATCH' }, true),
    markRead: (id: string) =>
      apiFetch<any>(`/support/conversations/${id}/read`, { method: 'PATCH' }, true),
  },

  agent: {
    conversations: (status?: string) =>
      apiFetch<any>(`/agent/support/conversations${status ? `?status=${status}` : ''}`, {}, true),
    messages: (id: string) => apiFetch<any>(`/agent/support/conversations/${id}/messages`, {}, true),
    assign: (id: string, agentId: string) =>
      apiFetch<any>(`/agent/support/conversations/${id}/assign`, { method: 'POST', body: JSON.stringify({ agentId }) }, true),
    send: (id: string, body: { content: string }) =>
      apiFetch<any>(`/agent/support/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify(body) }, true),
    note: (id: string, content: string) =>
      apiFetch<any>(`/agent/support/conversations/${id}/notes`, { method: 'POST', body: JSON.stringify({ content }) }, true),
    resolve: (id: string) =>
      apiFetch<any>(`/agent/support/conversations/${id}/resolve`, { method: 'PATCH' }, true),
    reopen: (id: string) =>
      apiFetch<any>(`/agent/support/conversations/${id}/reopen`, { method: 'PATCH' }, true),
  },

  adminSupport: {
    stats: () => apiFetch<any>('/admin/support/stats', {}, true),
    conversations: (status?: string, skip = 0, take = 20) =>
      apiFetch<any>(`/admin/support/conversations?skip=${skip}&take=${take}${status ? `&status=${status}` : ''}`, {}, true),
  },

  admin: {
    stats: () => apiFetch<any>('/admin/stats', {}, true),
    analytics: (days = 30) => apiFetch<any>(`/admin/analytics?days=${days}`, {}, true),
    users: (p: { skip?: number; take?: number; search?: string; status?: string } = {}) => {
      const q = new URLSearchParams();
      if (p.skip !== undefined) q.set('skip', String(p.skip));
      if (p.take !== undefined) q.set('take', String(p.take));
      if (p.search) q.set('search', p.search);
      if (p.status) q.set('status', p.status);
      return apiFetch<any>(`/admin/users?${q}`, {}, true);
    },
    user: (id: string) => apiFetch<any>(`/admin/users/${id}`, {}, true),
    suspendUser: (id: string) => apiFetch<any>(`/admin/users/${id}/suspend`, { method: 'PATCH' }, true),
    activateUser: (id: string) => apiFetch<any>(`/admin/users/${id}/activate`, { method: 'PATCH' }, true),
    deleteUser: (id: string) => apiFetch<any>(`/admin/users/${id}`, { method: 'DELETE' }, true),
    changeUserPlan: (id: string, planId: string) =>
      apiFetch<any>(`/admin/users/${id}/plan`, { method: 'PATCH', body: JSON.stringify({ planId }) }, true),
    adjustCredits: (body: { userId: string; amount: number; description: string }) =>
      apiFetch<any>('/admin/credits/adjust', { method: 'POST', body: JSON.stringify(body) }, true),
    tools: (p: { skip?: number; take?: number; search?: string } = {}) => {
      const q = new URLSearchParams();
      if (p.skip !== undefined) q.set('skip', String(p.skip));
      if (p.take !== undefined) q.set('take', String(p.take));
      if (p.search) q.set('search', p.search);
      return apiFetch<any>(`/admin/tools?${q}`, {}, true);
    },
    createTool: (body: any) => apiFetch<any>('/admin/tools', { method: 'POST', body: JSON.stringify(body) }, true),
    updateTool: (id: string, body: any) => apiFetch<any>(`/admin/tools/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, true),
    deleteTool: (id: string) => apiFetch<any>(`/admin/tools/${id}`, { method: 'DELETE' }, true),
    plans: () => apiFetch<any>('/admin/plans', {}, true),
    createPlan: (body: any) => apiFetch<any>('/admin/plans', { method: 'POST', body: JSON.stringify(body) }, true),
    updatePlan: (id: string, body: any) => apiFetch<any>(`/admin/plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, true),
    payments: (p: { skip?: number; take?: number; status?: string } = {}) => {
      const q = new URLSearchParams();
      if (p.skip !== undefined) q.set('skip', String(p.skip));
      if (p.take !== undefined) q.set('take', String(p.take));
      if (p.status) q.set('status', p.status);
      return apiFetch<any>(`/admin/payments?${q}`, {}, true);
    },
    subscriptions: (p: { skip?: number; take?: number; status?: string } = {}) => {
      const q = new URLSearchParams();
      if (p.skip !== undefined) q.set('skip', String(p.skip));
      if (p.take !== undefined) q.set('take', String(p.take));
      if (p.status) q.set('status', p.status);
      return apiFetch<any>(`/admin/subscriptions?${q}`, {}, true);
    },
    invoices: (skip = 0, take = 20) => apiFetch<any>(`/admin/invoices?skip=${skip}&take=${take}`, {}, true),
    logs: (skip = 0, take = 50) => apiFetch<any>(`/admin/logs?skip=${skip}&take=${take}`, {}, true),
  },

  browserTools: {
    adminList: (p: { skip?: number; take?: number; search?: string; status?: string } = {}) => {
      const q = new URLSearchParams();
      if (p.skip !== undefined) q.set('skip', String(p.skip));
      if (p.take !== undefined) q.set('take', String(p.take));
      if (p.search) q.set('search', p.search);
      if (p.status) q.set('status', p.status);
      return apiFetch<any>(`/admin/browser-tools?${q}`, {}, true);
    },
    adminCreate: (body: any) =>
      apiFetch<any>('/admin/browser-tools', { method: 'POST', body: JSON.stringify(body) }, true),
    adminUpdate: (id: string, body: any) =>
      apiFetch<any>(`/admin/browser-tools/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, true),
    adminDelete: (id: string) =>
      apiFetch<any>(`/admin/browser-tools/${id}`, { method: 'DELETE' }, true),
    connect: (id: string) =>
      apiFetch<any>(`/admin/browser-tools/${id}/connect`, { method: 'POST' }, true),
    verify: (id: string) =>
      apiFetch<any>(`/admin/browser-tools/${id}/verify`, { method: 'POST' }, true),
    reconnect: (id: string) =>
      apiFetch<any>(`/admin/browser-tools/${id}/reconnect`, { method: 'POST' }, true),
    disconnect: (id: string) =>
      apiFetch<any>(`/admin/browser-tools/${id}/disconnect`, { method: 'POST' }, true),
    connectionStatus: (id: string) =>
      apiFetch<any>(`/admin/browser-tools/${id}/connection`, {}, true),
    adminExecutions: (id: string, skip = 0, take = 20) =>
      apiFetch<any>(`/admin/browser-tools/${id}/executions?skip=${skip}&take=${take}`, {}, true),
    list: (skip = 0, take = 50) =>
      apiFetch<any>(`/browser-tools?skip=${skip}&take=${take}`, {}, false),
    bySlug: (slug: string) =>
      apiFetch<any>(`/browser-tools/slug/${slug}`, {}, false),
    execute: (id: string, body: { input: Record<string, unknown>; idempotencyKey?: string }) =>
      apiFetch<any>(`/browser-tools/${id}/execute`, { method: 'POST', body: JSON.stringify(body) }, true),
    myExecutions: (skip = 0, take = 20) =>
      apiFetch<any>(`/browser-tools/executions?skip=${skip}&take=${take}`, {}, true),
    execution: (id: string) =>
      apiFetch<any>(`/browser-tools/executions/${id}`, {}, true),
  },

  developer: {
    keys: () => apiFetch<any>('/developer/keys', {}, true),
    create: (body: { name: string; expiresAt?: string }) =>
      apiFetch<any>('/developer/keys', { method: 'POST', body: JSON.stringify(body) }, true),
    revoke: (id: string) =>
      apiFetch<any>(`/developer/keys/${id}`, { method: 'DELETE' }, true),
    usage: (id: string, skip = 0, take = 50) =>
      apiFetch<any>(`/developer/keys/${id}/usage?skip=${skip}&take=${take}`, {}, true),
  },

  history: {
    list: (params: {
      skip?: number; take?: number;
      search?: string; categorySlug?: string;
      dateFrom?: string; dateTo?: string;
    } = {}) => {
      const q = new URLSearchParams();
      if (params.skip !== undefined)    q.set('skip', String(params.skip));
      if (params.take !== undefined)    q.set('take', String(params.take));
      if (params.search)                q.set('search', params.search);
      if (params.categorySlug)          q.set('categorySlug', params.categorySlug);
      if (params.dateFrom)              q.set('dateFrom', params.dateFrom);
      if (params.dateTo)                q.set('dateTo', params.dateTo);
      return apiFetch<any>(`/history?${q.toString()}`, {}, true);
    },
    one: (id: string) => apiFetch<any>(`/history/${id}`, {}, true),
    remove: (id: string) => apiFetch<any>(`/history/${id}`, { method: 'DELETE' }, true),
    clear: () => apiFetch<any>('/history/clear', { method: 'DELETE' }, true),
    togglePin: (id: string) => apiFetch<any>(`/history/${id}/pin`, { method: 'PATCH' }, true),
  },
};
