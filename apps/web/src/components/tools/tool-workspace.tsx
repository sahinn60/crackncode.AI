'use client';

import * as React from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, cn,
} from '@crackncode/ui';
import {
  Zap, Copy, Download, RefreshCw, History, Check,
  Clock, Coins, ChevronDown, ChevronUp, Loader2,
  AlertTriangle, FileText,
} from 'lucide-react';
import { useGeneration } from '@/hooks/use-generation';
import { getToolFields, type ToolField } from '@/lib/tool-definitions';

// ─── Field renderer ────────────────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: ToolField;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const base =
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 transition-colors';

  if (field.type === 'select') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(base, 'cursor-pointer')}
      >
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        rows={field.rows ?? 4}
        className={cn(base, 'resize-y min-h-[80px]')}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      disabled={disabled}
      className={base}
    />
  );
}

// ─── Result panel ──────────────────────────────────────────────────────────────

function ResultPanel({
  output,
  outputFormat,
  creditsUsed,
  durationMs,
  onRegenerate,
  loading,
}: {
  output: string;
  outputFormat: string | null;
  creditsUsed: number;
  durationMs: number | null;
  onRegenerate: () => void;
  loading: boolean;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = outputFormat === 'markdown' ? 'md' : 'txt';
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crackncode-result.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Meta bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Coins className="h-3.5 w-3.5 text-warning" />
            {creditsUsed} credit{creditsUsed !== 1 ? 's' : ''} used
          </span>
          {durationMs && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {(durationMs / 1000).toFixed(1)}s
            </span>
          )}
          {outputFormat && (
            <Badge variant="outline" className="text-2xs capitalize">{outputFormat}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 h-7 text-xs">
            {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 h-7 text-xs">
            <Download className="h-3 w-3" /> Download
          </Button>
          <Button variant="outline" size="sm" onClick={onRegenerate} disabled={loading} className="gap-1.5 h-7 text-xs">
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} /> Regenerate
          </Button>
        </div>
      </div>

      {/* Output */}
      <div className="relative rounded-xl border border-border bg-muted/30 p-4 min-h-[200px]">
        <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
          {output}
        </pre>
      </div>
    </div>
  );
}

// ─── History panel ─────────────────────────────────────────────────────────────

function HistoryPanel({
  history,
  loading,
  onSelect,
}: {
  history: ReturnType<typeof useGeneration>['history'];
  loading: boolean;
  onSelect: (output: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No previous generations for this tool.
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {history.map((entry) => (
        <button
          key={entry.id}
          onClick={() => onSelect(entry.output)}
          className="w-full text-left rounded-lg border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
        >
          <p className="text-xs font-medium text-foreground line-clamp-1">
            {Object.values(entry.input)[0] as string || 'Generation'}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {entry.output.slice(0, 120)}…
          </p>
          <p className="text-2xs text-muted-foreground mt-1">
            {new Date(entry.createdAt).toLocaleDateString()}
          </p>
        </button>
      ))}
    </div>
  );
}

// ─── Main Workspace ────────────────────────────────────────────────────────────

interface ToolWorkspaceProps {
  tool: {
    id: string;
    name: string;
    slug: string;
    description: string;
    configuration?: { creditCost: number; aiModel: string } | null;
  };
}

export function ToolWorkspace({ tool }: ToolWorkspaceProps) {
  const fields = getToolFields(tool.slug);
  const { status, result, error, history, historyLoading, generate, regenerate, loadHistory } =
    useGeneration(tool.id);

  // Form state — initialise with field defaults
  const [values, setValues] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [f.key, String(f.default ?? '')]),
    ),
  );
  const [showHistory, setShowHistory] = React.useState(false);
  const [historyOutput, setHistoryOutput] = React.useState<string | null>(null);

  const isLoading = status === 'loading';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHistoryOutput(null);
    generate(values);
  };

  const handleHistoryToggle = () => {
    if (!showHistory) loadHistory();
    setShowHistory((v) => !v);
  };

  const displayOutput = historyOutput ?? result?.output ?? null;

  // No field definitions — show fallback
  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
          This tool is not yet configured for the workspace.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Input panel ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Input
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1">
                  {field.title}
                  {field.required && <span className="text-destructive">*</span>}
                </label>
                <FieldInput
                  field={field}
                  value={values[field.key] ?? ''}
                  onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
                  disabled={isLoading}
                />
              </div>
            ))}

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 gap-2"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                ) : (
                  <><Zap className="h-4 w-4" /> Generate</>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleHistoryToggle}
                title="View history"
                className={cn(showHistory && 'bg-muted')}
              >
                <History className="h-4 w-4" />
              </Button>
            </div>

            {tool.configuration && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Coins className="h-3 w-3 text-warning" />
                {tool.configuration.creditCost} credit{tool.configuration.creditCost !== 1 ? 's' : ''} per generation
                <span className="mx-1">·</span>
                {tool.configuration.aiModel}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* ── Output panel ── */}
      <div className="space-y-4">
        <Card className="min-h-[300px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Result</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Idle */}
            {status === 'idle' && !historyOutput && (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Fill in the form and click Generate
                </p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">AI is generating your content…</p>
              </div>
            )}

            {/* Error */}
            {status === 'error' && (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-sm text-destructive font-medium">{error}</p>
                <Button variant="outline" size="sm" onClick={regenerate} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> Try Again
                </Button>
              </div>
            )}

            {/* Success or history selection */}
            {(status === 'success' || historyOutput) && displayOutput && (
              <ResultPanel
                output={displayOutput}
                outputFormat={result?.outputFormat ?? null}
                creditsUsed={result?.creditsUsed ?? 0}
                durationMs={result?.durationMs ?? null}
                onRegenerate={regenerate}
                loading={isLoading}
              />
            )}
          </CardContent>
        </Card>

        {/* History drawer */}
        {showHistory && (
          <Card>
            <CardHeader className="pb-2">
              <button
                onClick={handleHistoryToggle}
                className="flex items-center justify-between w-full text-sm font-semibold text-foreground"
              >
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4" /> Previous Generations
                </span>
                {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </CardHeader>
            <CardContent>
              <HistoryPanel
                history={history}
                loading={historyLoading}
                onSelect={(output) => {
                  setHistoryOutput(output);
                  setShowHistory(false);
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
