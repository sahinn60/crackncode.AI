'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge, Button, Card, CardContent, cn } from '@crackncode/ui';
import { SectionWrapper, SectionHeading, Container } from './primitives';
import { AI_TOOLS, CATEGORIES } from '@/data/marketing';

export function ToolsShowcaseSection() {
  const [activeCategory, setActiveCategory] = React.useState('all');

  const filtered = activeCategory === 'all'
    ? AI_TOOLS.slice(0, 12)
    : AI_TOOLS.filter((t) => t.category.toLowerCase() === activeCategory).slice(0, 12);

  return (
    <SectionWrapper subtle id="tools">
      <Container>
        <SectionHeading
          label="AI Tools"
          title={<>Everything you need to <span className="text-primary">create faster</span></>}
          description="100+ AI-powered tools across every category. From writing to coding, marketing to SEO — we have you covered."
        />

        {/* Category filter */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
              activeCategory === 'all'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground',
            )}
          >
            All Tools
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.label.toLowerCase())}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                activeCategory === cat.label.toLowerCase()
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.id} hoverable className="group">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-muted', tool.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {tool.badge && (
                      <Badge variant={tool.badge === 'New' ? 'info' : tool.badge === 'Hot' ? 'destructive' : 'default'} className="text-2xs">
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">{tool.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{tool.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className="text-2xs">{tool.category}</Badge>
                    <Link
                      href={`/tools/${tool.id}`}
                      className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                    >
                      Try it <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/tools" className="gap-2">
              View All 100+ Tools <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </SectionWrapper>
  );
}
