import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionWrapper, SectionHeading, Container } from './primitives';
import { AI_TOOLS } from '@/data/marketing';

const POPULAR = AI_TOOLS.filter((t) => t.popular);

export function PopularToolsSection() {
  return (
    <SectionWrapper subtle id="popular-tools">
      <Container>
        <SectionHeading
          label="Most Popular"
          title={<>Tools our users <span className="text-violet-400">love most</span></>}
          description="The most-used AI tools on the platform, trusted by thousands of creators every day."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {POPULAR.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={`/tools/${tool.id}`}
                className="group relative flex gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.04] hover:-translate-y-0.5"
              >
                {i === 0 && (
                  <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-yellow-500 px-2.5 py-0.5 text-[11px] font-bold text-black">
                    <Flame className="h-3 w-3" /> #1 Tool
                  </span>
                )}
                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]', tool.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white">{tool.name}</h3>
                    {tool.badge && (
                      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-medium text-violet-300">{tool.badge}</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{tool.description}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Try now <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-10 flex justify-center">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.07] hover:border-white/[0.18] transition-all duration-200"
          >
            Explore All Tools <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </SectionWrapper>
  );
}
