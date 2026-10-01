'use client';

import * as React from 'react';
import { apiClient } from '@/lib/api-client';

export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface GenerationResult {
  generationId: string;
  output: string;
  outputFormat: string | null;
  creditsUsed: number;
  durationMs: number | null;
}

export interface HistoryEntry {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  output: string;
  createdAt: string;
}

export function useGeneration(toolId: string) {
  const [status, setStatus] = React.useState<GenerationStatus>('idle');
  const [result, setResult] = React.useState<GenerationResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const lastInputRef = React.useRef<Record<string, unknown>>({});

  const generate = React.useCallback(
    async (input: Record<string, unknown>) => {
      setStatus('loading');
      setError(null);
      lastInputRef.current = input;
      try {
        const res = await apiClient.generations.create({ toolId, input }) as any;
        setResult({
          generationId: res.generationId,
          output: res.result ?? '',
          outputFormat: res.outputFormat ?? null,
          creditsUsed: res.creditsUsed ?? 0,
          durationMs: res.durationMs ?? null,
        });
        setStatus('success');
      } catch (err: any) {
        setError(err?.message ?? 'Generation failed. Please check your credits and try again.');
        setStatus('error');
      }
    },
    [toolId],
  );

  const regenerate = React.useCallback(() => {
    if (Object.keys(lastInputRef.current).length > 0) {
      generate(lastInputRef.current);
    }
  }, [generate]);

  const reset = React.useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  const loadHistory = React.useCallback(async () => {
    setHistoryLoading(true);
    try {
      // API returns { data: Generation[], total: number } or Generation[]
      const res = await apiClient.generations.list(0, 20) as any;
      const list: any[] = res?.data ?? (Array.isArray(res) ? res : []);
      const filtered = list
        .filter((g: any) => g.toolId === toolId && g.result)
        .map((g: any) => ({
          id: g.id,
          toolName: g.tool?.name ?? '',
          input: g.input ?? {},
          output: g.result?.output ?? '',
          createdAt: g.createdAt,
        }));
      setHistory(filtered);
    } catch {
      // silently fail — history is non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, [toolId]);

  return { status, result, error, history, historyLoading, generate, regenerate, reset, loadHistory };
}
