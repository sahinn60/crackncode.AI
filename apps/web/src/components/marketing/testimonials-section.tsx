import { Star } from 'lucide-react';
import { Card, CardContent } from '@crackncode/ui';
import { SectionWrapper, SectionHeading, Container } from './primitives';
import { TESTIMONIALS } from '@/data/marketing';

export function TestimonialsSection() {
  return (
    <SectionWrapper id="testimonials">
      <Container>
        <SectionHeading
          label="Testimonials"
          title={<>Trusted by <span className="text-primary">50,000+ creators</span></>}
          description="Don't take our word for it. Here's what our users have to say."
        />
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="mb-5 break-inside-avoid">
              <CardContent className="p-6">
                {/* Stars */}
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                {/* Quote */}
                <p className="mb-4 text-sm text-foreground leading-relaxed">
                  &ldquo;{t.content}&rdquo;
                </p>
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
}
