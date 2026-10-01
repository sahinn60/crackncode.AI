'use client';

import * as React from 'react';
import { Key, Plus, Trash2, Eye, Copy, Check, AlertTriangle, Activity } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { PageHeader } from '@/components/layout/page-header';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  expiresAt: string | null;
  createdAt: string;
  totalRequests: number;
}

interface UsageLog {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number | null;
  ipAddress: string | null;
  createdAt: string;
}

function CreateKeyModal({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [expiresAt, setExpiresAt] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [newKey, setNewKey] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.developer.create({ name, expiresAt: expiresAt || undefined }) as any;
      setNewKey(res.key);
      onCreated();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create key');
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function close() {
    setOpen(false);
    setNewKey(null);
    setName('');
    setExpiresAt('');
    setError('');
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" /> Create API Key
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            {newKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-semibold">Copy your key now — it won't be shown again.</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3">
                  <code className="flex-1 break-all text-xs font-mono text-foreground">{newKey}</code>
                  <button onClick={copy} className="shrink-0 text-muted-foreground hover:text-foreground">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  onClick={close}
                  className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h2 className="text-base font-semibold text-foreground">Create API Key</h2>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Key Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Production App"
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Expiry Date (optional)</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function UsageDrawer({ keyId, keyName, onClose }: { keyId: string; keyName: string; onClose: () => void }) {
  const [logs, setLogs] = React.useState<UsageLog[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiClient.developer.usage(keyId).then((res: any) => {
      setLogs(res.items);
      setTotal(res.total);
    }).finally(() => setLoading(false));
  }, [keyId]);

  const statusColor = (code: number) =>
    code < 300 ? 'text-green-500' : code < 500 ? 'text-amber-500' : 'text-destructive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 p-4">
      <div className="h-full w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{keyName}</p>
            <p className="text-xs text-muted-foreground">{total} total requests</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
        </div>
        <div className="p-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 rounded-lg border border-border p-3 text-xs">
                  <span className="w-10 shrink-0 font-mono font-bold text-muted-foreground">{log.method}</span>
                  <span className="flex-1 truncate font-mono text-foreground">{log.endpoint}</span>
                  <span className={`shrink-0 font-bold ${statusColor(log.statusCode)}`}>{log.statusCode}</span>
                  {log.durationMs != null && (
                    <span className="shrink-0 text-muted-foreground">{log.durationMs}ms</span>
                  )}
                  <span className="shrink-0 text-muted-foreground">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DeveloperPage() {
  const [keys, setKeys] = React.useState<ApiKey[]>([]);
  const [limits, setLimits] = React.useState<{ apiKeysAllowed: number; apiRateLimit: number } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [revoking, setRevoking] = React.useState<string | null>(null);
  const [viewUsage, setViewUsage] = React.useState<{ id: string; name: string } | null>(null);

  async function load() {
    try {
      const res = await apiClient.developer.keys() as any;
      setKeys(res.keys);
      setLimits(res.limits);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function revoke(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    setRevoking(id);
    try {
      await apiClient.developer.revoke(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } finally {
      setRevoking(null);
    }
  }

  const noAccess = limits?.apiKeysAllowed === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer API"
        description="Manage API keys to access CracknCode AI programmatically."
      />

      {/* Plan info banner */}
      {limits && (
        <div className={`rounded-lg border p-4 text-sm ${noAccess ? 'border-amber-500/30 bg-amber-500/10 text-amber-600' : 'border-border bg-muted/40 text-muted-foreground'}`}>
          {noAccess ? (
            <span>⚠️ Your current plan does not include API access. Upgrade to a paid plan to create API keys.</span>
          ) : (
            <span>
              Your plan allows <strong className="text-foreground">{limits.apiKeysAllowed === -1 ? 'unlimited' : limits.apiKeysAllowed}</strong> API key(s) and{' '}
              <strong className="text-foreground">{limits.apiRateLimit}</strong> requests/minute.
            </span>
          )}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {keys.length} active key{keys.length !== 1 ? 's' : ''}
        </p>
        {!noAccess && <CreateKeyModal onCreated={load} />}
      </div>

      {/* Keys table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Key className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No API keys yet.</p>
          {!noAccess && <CreateKeyModal onCreated={load} />}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Key</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Requests</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Last Used</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Expires</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{key.name}</td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                      {key.keyPrefix}••••••••
                    </code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{key.totalRequests.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {key.lastUsedAt
                      ? new Date(key.lastUsedAt).toLocaleDateString()
                      : <span className="text-xs italic">Never</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {key.expiresAt
                      ? new Date(key.expiresAt).toLocaleDateString()
                      : <span className="text-xs italic">Never</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setViewUsage({ id: key.id, name: key.name })}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="View usage"
                      >
                        <Activity className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => revoke(key.id)}
                        disabled={revoking === key.id}
                        className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                        title="Revoke key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* API Reference */}
      <div className="rounded-xl border border-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Quick Reference</h3>
        <div className="space-y-3 text-xs font-mono">
          {[
            { method: 'GET',  path: '/api/v1/public/tools',    desc: 'List all available tools' },
            { method: 'GET',  path: '/api/v1/public/tools/:slug', desc: 'Get tool details' },
            { method: 'POST', path: '/api/v1/public/generate', desc: 'Run a generation' },
          ].map((r) => (
            <div key={r.path} className="flex items-center gap-3">
              <span className={`w-12 shrink-0 rounded px-1.5 py-0.5 text-center font-bold ${r.method === 'GET' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                {r.method}
              </span>
              <code className="flex-1 text-muted-foreground">{r.path}</code>
              <span className="text-muted-foreground/60 hidden sm:block">{r.desc}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-muted p-3 text-xs font-mono text-muted-foreground">
          <p className="mb-1 text-foreground font-semibold">Authentication</p>
          <p>X-Api-Key: cnc_your_api_key_here</p>
        </div>
      </div>

      {viewUsage && (
        <UsageDrawer
          keyId={viewUsage.id}
          keyName={viewUsage.name}
          onClose={() => setViewUsage(null)}
        />
      )}
    </div>
  );
}
