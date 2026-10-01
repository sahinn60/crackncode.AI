import { cn } from '@crackncode/ui';
import { SectionWrapper, SectionHeading, Container } from './primitives';
import { FEATURES } from '@/data/marketing';

export function FeaturesSection() {
  return (
    <SectionWrapper subtle id="features">
      <Container>
        <SectionHeading
          label="Features"
          title={<>Built for <span className="text-primary">serious creators</span></>}
          description="Everything you need to produce world-class content at scale. No compromises."
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-border-strong hover:shadow-md"
              >
                <div className={cn('mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted', feature.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </SectionWrapper>
  );
}
