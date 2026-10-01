import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@crackncode/ui';
import { SectionWrapper, SectionHeading, Container } from './primitives';
import { CATEGORIES } from '@/data/marketing';

export function CategoriesSection() {
  return (
    <SectionWrapper id="categories">
      <Container>
        <SectionHeading
          label="Categories"
          title="Find tools by category"
          description="Organised into 8 powerful categories so you can find exactly what you need in seconds."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={`/tools?category=${cat.id}`}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-border-strong hover:shadow-md"
              >
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', cat.color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.count} tools</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      </Container>
    </SectionWrapper>
  );
}
