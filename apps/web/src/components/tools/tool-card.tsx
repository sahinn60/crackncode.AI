'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart, ArrowRight, Zap, Star, Crown, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';

export interface ToolCardTool {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string | null;
  iconUrl?: string | null;
  isPremium: boolean;
  isFeatured: boolean;
  usageCount: number;
  category?: { id: string; name: string; color?: string | null } | null;
  configuration?: { creditCost: number } | null;
}

interface ToolCardProps {
  tool: ToolCardTool;
  isFavorited?: boolean;
  onFavoriteToggle?: (toolId: string, next: boolean) => void;
  href?: string;
}

export function ToolCard({ tool, isFavorited = false, onFavoriteToggle, href }: ToolCardProps) {
  const { isAuthenticated } = useAuth();
  const [faved, setFaved] = React.useState(isFavorited);
  const [favLoading, setFavLoading] = React.useState(false);

  React.useEffect(() => { setFaved(isFavorited); }, [isFavorited]);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || favLoading) return;
    setFavLoading(true);
    try {
      if (faved) {
        await apiClient.favorites.remove(tool.id);
        setFaved(false);
        onFavoriteToggle?.(tool.id, false);
      } else {
        await apiClient.favorites.add(tool.id);
        setFaved(true);
        onFavoriteToggle?.(tool.id, true);
      }
    } catch {}
    finally { setFavLoading(false); }
  };

  const toolHref = href ?? `/tools/${tool.slug}`;

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all">
      {tool.isFeatured && (
        <span className="absolute -top-2.5 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
          <Star className="h-2.5 w-2.5 fill-white" /> Featured
        </span>
      )}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {tool.iconUrl ? (
              <img src={tool.iconUrl} alt={tool.name} className="h-6 w-6 object-contain" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {tool.isPremium && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                <Crown className="h-2.5 w-2.5" /> Pro
              </span>
            )}
            {tool.usageCount > 1000 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                <Flame className="h-2.5 w-2.5" /> Hot
              </span>
            )}
            {isAuthenticated && (
              <button
                onClick={toggleFav}
                disabled={favLoading}
                aria-label={faved ? 'Remove from favorites' : 'Add to favorites'}
                className={cn('rounded-md p-1 transition-colors', faved ? 'text-destructive hover:text-destructive/80' : 'text-muted-foreground hover:text-destructive')}
              >
                <Heart className={cn('h-4 w-4', faved && 'fill-current')} />
              </button>
            )}
          </div>
        </div>
        <h3 className="mb-1 text-sm font-semibold text-foreground leading-snug">{tool.name}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
          {tool.shortDescription ?? tool.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {tool.category && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{tool.category.name}</span>
            )}
            {tool.configuration?.creditCost != null && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Zap className="h-2.5 w-2.5" />{tool.configuration.creditCost}cr
              </span>
            )}
          </div>
          <Link href={toolHref} className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Open <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
