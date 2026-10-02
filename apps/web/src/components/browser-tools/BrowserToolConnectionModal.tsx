'use client';

import * as React from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, Globe, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

interface Props {
  tool:    any;
  onClose: () => void;
}

type Phase = 'idle' | 'launching' | 'waiting_login' | 'connected' | 'error';

export function BrowserToolConnectionModal({ tool, onClose }: Props) {
  const [phase, setPhase]   = React.useState<Phase>('idle');
  const [jobId, setJobId]   = React.useState<string | null>(null);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);
  const [connStatus, setConnStatus] = React.useState(tool.connection?.status ?? 'DISCONNECTED');
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const isConnected = connStatus === 'CONNECTED';

  const startConnect = async () => {
    setPhase('launching'); setErrMsg(null);
    try {
      const res = await apiClient.browserTools.connect(tool.id);
      const r   = (res as any)?.data ?? res;
      setJobId(r.jobId);
      setPhase('waiting_login');
      startPolling();
    } catch (e: any) {
      setErrMsg(e?.message ?? 'Failed to start connection');
      setPhase('error');
    }
  };

  const startPolling = () => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiClient.browserTools.connectionStatus(tool.id);
        const r   = (res as any)?.data ?? res;
        setConnStatus(r?.status ?? 'PENDING');

        if (r?.status === 'CONNECTED') {
          clearInterval(pollRef.current!);
          setPhase('connected');
        } else if (r?.status === 'ERROR') {
          clearInterval(pollRef.current!);
          setErrMsg(r?.lastError ?? 'Connection failed');
          setPhase('error');
        }
      } catch {}
    }, 3000);
  };

  React.useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleVerify = async () => {
    try {
      await apiClient.browserTools.verify(tool.id);
      const res = await apiClient.browserTools.connectionStatus(tool.id);
      const r   = (res as any)?.data ?? res;
      setConnStatus(r?.status ?? connStatus);
    } catch (e: any) { setErrMsg(e?.message); }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect this tool? The session will be removed.')) return;
    try {
      await apiClient.browserTools.disconnect(tool.id);
      setConnStatus('DISCONNECTED');
      setPhase('idle');
    } catch (e: any) { setErrMsg(e?.message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Connect Account</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Tool info */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            {tool.imageUrl ? (
              <img src={tool.imageUrl} alt={tool.name} className="h-10 w-10 rounded-lg object-cover border border-border" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">{tool.name}</p>
              <p className="text-xs text-muted-foreground">{tool.websiteUrl}</p>
            </div>
          </div>

          {/* Status display */}
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Connection Status</span>
              <StatusDot status={connStatus} />
            </div>

            {phase === 'idle' && !isConnected && (
              <p className="text-sm text-muted-foreground">
                Click <strong className="text-foreground">Connect Account</strong> to open a secure browser window.
                You will log in to <strong className="text-foreground">{new URL(tool.websiteUrl).hostname}</strong> normally.
              </p>
            )}

            {phase === 'launching' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Opening secure browser session…
              </div>
            )}

            {phase === 'waiting_login' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Browser is open — please complete login
                </div>
                <p className="text-xs text-muted-foreground">
                  Complete any MFA, CAPTCHA or OTP challenges as normal.
                  This window will update automatically once login is detected.
                </p>
                {jobId && <p className="text-[11px] text-muted-foreground font-mono">Job: {jobId}</p>}
              </div>
            )}

            {phase === 'connected' && (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Account connected successfully
              </div>
            )}

            {phase === 'error' && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{errMsg ?? 'Connection failed. Please try again.'}</span>
              </div>
            )}

            {isConnected && tool.connection?.lastVerifiedAt && (
              <p className="text-xs text-muted-foreground">
                Last verified: {new Date(tool.connection.lastVerifiedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Security notice */}
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2.5">
            <p className="text-xs text-amber-400 leading-relaxed">
              <strong>Security:</strong> Your login credentials are never stored or transmitted.
              Only the resulting authorized session is encrypted and stored server-side.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors">
            Close
          </button>

          <div className="flex gap-2">
            {isConnected && (
              <>
                <button onClick={handleVerify} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors">
                  <RefreshCw className="h-3.5 w-3.5" /> Verify
                </button>
                <button onClick={handleDisconnect} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                  <WifiOff className="h-3.5 w-3.5" /> Disconnect
                </button>
              </>
            )}

            {!isConnected && phase !== 'waiting_login' && phase !== 'launching' && (
              <button onClick={startConnect} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                <Wifi className="h-3.5 w-3.5" />
                {phase === 'error' ? 'Retry Connection' : 'Connect Account'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    CONNECTED:    { color: 'bg-emerald-500', label: 'Connected' },
    CONNECTING:   { color: 'bg-blue-500 animate-pulse', label: 'Connecting' },
    EXPIRED:      { color: 'bg-amber-500', label: 'Expired' },
    ERROR:        { color: 'bg-red-500', label: 'Error' },
    DISCONNECTED: { color: 'bg-zinc-500', label: 'Disconnected' },
    PENDING:      { color: 'bg-zinc-500', label: 'Pending' },
  };
  const cfg = map[status] ?? map['DISCONNECTED'];
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
      <span className={cn('h-2 w-2 rounded-full', cfg.color)} />
      {cfg.label}
    </span>
  );
}
