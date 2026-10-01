'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart, ArrowRight, Zap, Star, Crown, Flame } from 'lucide-react';
import { Card, CardContent, Badge, Button, cn } from '@crackncode/ui';
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
    } catch {
      // revert on error
    } finally {
      setFavLoading(false);
    }
  };

  const toolHref = href ?? `/tools/${tool.slug}`;

  return (
    <Card hoverable className="group relative flex flex-col">
      {/* Featured ribbon */}
      {tool.isFeatured && (
        <span className="absolute -top-2.5 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-0.5 text-2xs font-bold text-white">
          <Star className="h-2.5 w-2.5 fill-white" /> Featured
        </span>
      )}

      <CardContent className="flex flex-col flex-1 p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          {/* Icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {tool.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tool.iconUrl} alt={tool.name} className="h-6 w-6 object-contain" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
          </div>

          {/* Badges + favorite */}
          <div className="flex items-center gap-1.5">
            {tool.isPremium && (
              <Badge variant="warning" className="text-2xs gap-0.5">
                <Crown className="h-2.5 w-2.5" /> Pro
              </Badge>
            )}
            {tool.usageCount > 1000 && (
              <Badge variant="destructive" className="text-2xs gap-0.5">
                <Flame className="h-2.5 w-2.5" /> Hot
              </Badge>
            )}
            {isAuthenticated && (
              <button
                onClick={toggleFav}
                disabled={favLoading}
                aria-label={faved ? 'Remove from favorites' : 'Add to favorites'}
                className={cn(
                  'rounded-md p-1 transition-colors',
                  faved
                    ? 'text-destructive hover:text-destructive/80'
                    : 'text-muted-foreground hover:text-destructive',
                )}
              >
                <Heart className={cn('h-4 w-4', faved && 'fill-current')} />
              </button>
            )}
          </div>
        </div>

        {/* Name + description */}
        <h3 className="mb-1 text-sm font-semibold text-foreground leading-snug">{tool.name}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
          {tool.shortDescription ?? tool.description}
        </p>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {tool.category && (
              <Badge variant="outline" className="text-2xs">{tool.category.name}</Badge>
            )}
            {tool.configuration?.creditCost != null && (
              <span className="text-2xs text-muted-foreground flex items-center gap-0.5">
                <Zap className="h-2.5 w-2.5" />{tool.configuration.creditCost}cr
              </span>
            )}
          </div>
          <Link
            href={toolHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Open <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
