'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, cn } from '@crackncode/ui';
import { PageHeader } from '@/components/layout/page-header';
import { CardSkeleton, ErrorState } from '@/components/dashboard/states';
import { ToolWorkspace } from '@/components/tools/tool-workspace';
import { useApi } from '@/hooks/use-api';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import { Zap, Crown, Star, Heart, ArrowLeft, Tag, Coins, FileText, Code2, Globe } from 'lucide-react';

function outputFormatIcon(fmt: string) {
  if (fmt === 'markdown') return <FileText className="h-4 w-4" />;
  if (fmt === 'json') return <Code2 className="h-4 w-4" />;
  return <Globe className="h-4 w-4" />;
}

export default function ToolDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const tool = useApi(() => apiClient.tools.bySlug(slug), [slug]);
  const favs = useApi(() => apiClient.favorites.list());

  const [faved, setFaved] = React.useState(false);
  const [favLoading, setFavLoading] = React.useState(false);

  const toolData = tool.data as any;

  React.useEffect(() => {
    if (!toolData || !favs.data) return;
  const list: any[] = (favs.data as any)?.data ?? (Array.isArray(favs.data) ? favs.data : []);
    setFaved(list.some((f: any) => (f.toolId ?? f.tool?.id) === toolData.id));
  }, [toolData, favs.data]);

  const toggleFav = async () => {
    if (!isAuthenticated || favLoading || !toolData) return;
    setFavLoading(true);
    try {
      if (faved) { await apiClient.favorites.remove(toolData.id); setFaved(false); }
      else { await apiClient.favorites.add(toolData.id); setFaved(true); }
    } finally { setFavLoading(false); }
  };

  if (tool.loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <Card><CardSkeleton rows={6} /></Card>
      </div>
    );
  }

  if (tool.error || !toolData) {
    return <ErrorState message={tool.error ?? 'Tool not found'} onRetry={tool.refetch} />;
  }

  const config = toolData.configuration;

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={toolData.name}
        description={toolData.shortDescription ?? toolData.description}
        breadcrumbs={[
          { label: 'AI Tools', href: '/tools' },
          { label: toolData.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFav}
                loading={favLoading}
                className={cn('gap-1.5', faved && 'text-destructive border-destructive/30')}
              >
                <Heart className={cn('h-3.5 w-3.5', faved && 'fill-current')} />
                {faved ? 'Saved' : 'Save'}
              </Button>
            )}
          </div>
        }
      />

      {/* Tool meta */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {toolData.iconUrl
                ? <img src={toolData.iconUrl} alt={toolData.name} className="h-7 w-7 object-contain" />
                : <Zap className="h-6 w-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {toolData.category && <Badge variant="outline">{toolData.category.name}</Badge>}
                {toolData.isPremium && <Badge variant="warning" className="gap-1"><Crown className="h-3 w-3" /> Pro</Badge>}
                {toolData.isFeatured && <Badge variant="default" className="gap-1"><Star className="h-3 w-3" /> Featured</Badge>}
                {toolData.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="gap-1 text-2xs">
                    <Tag className="h-2.5 w-2.5" />{tag}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{toolData.description}</p>
            </div>
          </div>

          {config && (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 mt-4 pt-4 border-t border-border">
              {[
                { label: 'Credit Cost', value: `${config.creditCost} credits`, icon: <Coins className="h-3.5 w-3.5 text-warning" /> },
                { label: 'AI Model', value: config.aiModel, icon: <Zap className="h-3.5 w-3.5 text-primary" /> },
                { label: 'Provider', value: config.aiProvider, icon: <Globe className="h-3.5 w-3.5 text-info" /> },
                { label: 'Output', value: config.outputFormat, icon: outputFormatIcon(config.outputFormat) },
              ].map(({ label, value, icon }) => (
                <div key={label} className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
                  <p className="text-sm font-semibold text-foreground capitalize">{value}</p>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Universal Workspace — only shown when authenticated */}
      {isAuthenticated ? (
        <ToolWorkspace tool={toolData} />
      ) : (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Zap className="h-10 w-10 mx-auto text-primary opacity-60" />
            <p className="text-sm font-semibold text-foreground">Sign in to use this tool</p>
            <p className="text-xs text-muted-foreground">Create a free account to start generating content.</p>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/login"><Zap className="h-3.5 w-3.5" /> Get Started Free</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{toolData.usageCount?.toLocaleString() ?? 0} total generations</span>
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/tools"><ArrowLeft className="h-3.5 w-3.5" /> Back to Tools</Link>
        </Button>
      </div>
    </div>
  );
}
