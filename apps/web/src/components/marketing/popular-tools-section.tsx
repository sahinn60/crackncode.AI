import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import { Badge, Button, cn } from '@crackncode/ui';
import { SectionWrapper, SectionHeading, Container } from './primitives';
import { AI_TOOLS } from '@/data/marketing';

const POPULAR = AI_TOOLS.filter((t) => t.popular);

export function PopularToolsSection() {
  return (
    <SectionWrapper subtle id="popular-tools">
      <Container>
        <SectionHeading
          label="Most Popular"
          title={<>Tools our users <span className="text-primary">love most</span></>}
          description="The most-used AI tools on the platform, trusted by thousands of creators every day."
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {POPULAR.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={`/tools/${tool.id}`}
                className="group relative flex gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-border-strong hover:shadow-md"
              >
                {i === 0 && (
                  <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-0.5 text-2xs font-bold text-white">
                    <Flame className="h-3 w-3" /> #1 Tool
                  </span>
                )}
                <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted', tool.color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{tool.name}</h3>
                    {tool.badge && (
                      <Badge variant="default" className="text-2xs">{tool.badge}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{tool.description}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Try now <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-10 flex justify-center">
          <Button size="lg" asChild>
            <Link href="/tools" className="gap-2">
              Explore All Tools <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </SectionWrapper>
  );
}
