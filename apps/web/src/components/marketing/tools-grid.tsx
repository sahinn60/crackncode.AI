'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { cn } from '@crackncode/ui';

const BADGE_STYLES: Record<string, string> = {
  New:      'bg-blue-500/15 text-blue-300',
  Hot:      'bg-red-500/15 text-red-300',
  Popular:  'bg-violet-500/15 text-violet-300',
  Featured: 'bg-amber-500/15 text-amber-300',
};

export function ToolsGrid({ tools: initialTools, categories, total }: {
  tools: any[];
  categories: any[];
  total: number;
}) {
  const [activeCategory, setActiveCategory] = React.useState('all');
  const [displayTools, setDisplayTools] = React.useState(initialTools);
  const [loading, setLoading] = React.useState(false);

  const handleCategory = async (slug: string) => {
    setActiveCategory(slug);
    setLoading(true);
    try {
      const url = `/api/v1/landing-page/tools${slug !== 'all' ? `?category=${slug}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      const raw = json.data ?? json;
      setDisplayTools(Array.isArray(raw) ? raw : (raw.data ?? []));
    } catch {
      setDisplayTools([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => handleCategory('all')}
          className={cn(
            'rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200',
            activeCategory === 'all'
              ? 'border-violet-500/60 bg-violet-500/15 text-violet-300'
              : 'border-white/[0.08] bg-transparent text-zinc-400 hover:border-white/[0.18] hover:text-white',
          )}
        >
          All Tools
        </button>
        {categories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => handleCategory(cat.slug)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200',
              activeCategory === cat.slug
                ? 'border-violet-500/60 bg-violet-500/15 text-violet-300'
                : 'border-white/[0.08] bg-transparent text-zinc-400 hover:border-white/[0.18] hover:text-white',
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-white/[0.07] bg-white/[0.02]" />
          ))}
        </div>
      ) : displayTools.length === 0 ? (
        <div className="py-20 text-center text-zinc-500">No tools found in this category yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayTools.map((tool: any) => <ToolCard key={tool.id} tool={tool} />)}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.07] hover:border-white/[0.18] transition-all duration-200"
        >
          View All {total > 0 ? total : '100+'} Tools <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}

function ToolCard({ tool }: { tool: any }) {
  const imageUrl = tool.coverImageUrl || tool.iconUrl;
  const price = tool.price != null ? Number(tool.price) : null;
  const currency = tool.currency ?? 'BDT';
  const cta = tool.ctaText || 'Buy Now';
  const href = tool.destinationUrl || `/tools/${tool.slug}`;

  return (
    <div className="group flex flex-col rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden transition-all duration-200 hover:border-violet-500/30 hover:bg-white/[0.04] hover:-translate-y-0.5">
      <div className="relative h-36 w-full bg-white/[0.03] flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={tool.name}
            fill
            className="object-contain p-4"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 text-xl font-bold">
            {tool.name.charAt(0)}
          </div>
        )}
        {tool.badge && (
          <span className={cn(
            'absolute top-2 right-2 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            BADGE_STYLES[tool.badge] ?? 'bg-zinc-500/15 text-zinc-300',
          )}>
            {tool.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="mb-1 text-[11px] text-zinc-500">{tool.category?.name ?? ''}</span>
        <h3 className="mb-1.5 text-sm font-semibold text-white leading-snug line-clamp-1">{tool.name}</h3>
        <p className="flex-1 text-xs text-zinc-500 leading-relaxed line-clamp-2">{tool.shortDescription || tool.description}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          {price != null ? (
            <span className="text-sm font-semibold text-white">
              {currency === 'BDT' ? '৳' : '$'}{price.toLocaleString()}
              <span className="text-xs font-normal text-zinc-500"> / mo</span>
            </span>
          ) : (
            <span className="text-sm font-semibold text-emerald-400">Free</span>
          )}
          <Link
            href={href}
            className="shrink-0 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition-colors duration-200 flex items-center gap-1"
          >
            {cta} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
