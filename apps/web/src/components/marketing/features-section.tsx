import { cn } from '@/lib/utils';
import { SectionWrapper, SectionHeading, Container } from './primitives';
import { FEATURES } from '@/data/marketing';

export function FeaturesSection() {
  return (
    <SectionWrapper subtle id="features">
      <Container>
        <SectionHeading
          label="Features"
          title={<>Built for <span className="text-violet-400">serious creators</span></>}
          description="Everything you need to produce world-class content at scale. No compromises."
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.04] hover:-translate-y-0.5"
              >
                <div className={cn('mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04]', feature.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </SectionWrapper>
  );
}
