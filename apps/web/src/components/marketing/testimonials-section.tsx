import { Star } from 'lucide-react';
import { SectionWrapper, SectionHeading, Container } from './primitives';
import { TESTIMONIALS } from '@/data/marketing';

export function TestimonialsSection() {
  return (
    <SectionWrapper id="testimonials">
      <Container>
        <SectionHeading
          label="Testimonials"
          title={<>Trusted by <span className="text-violet-400">50,000+ creators</span></>}
          description="Don't take our word for it. Here's what our users have to say."
        />
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="mb-5 break-inside-avoid rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-4 text-sm text-zinc-300 leading-relaxed">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-300">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.role} · {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
}
