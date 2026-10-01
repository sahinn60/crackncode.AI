import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
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
                className="group flex flex-col items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 text-center transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.04] hover:-translate-y-0.5"
              >
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]', cat.color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{cat.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{cat.count} tools</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:text-zinc-400 transition-all duration-200" />
              </Link>
            );
          })}
        </div>
      </Container>
    </SectionWrapper>
  );
}
