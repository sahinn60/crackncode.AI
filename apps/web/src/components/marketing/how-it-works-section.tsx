import { SectionWrapper, SectionHeading, Container } from './primitives';
import { HOW_IT_WORKS } from '@/data/marketing';

export function HowItWorksSection() {
  return (
    <SectionWrapper id="how-it-works">
      <Container>
        <SectionHeading
          label="How It Works"
          title="From idea to output in seconds"
          description="Four simple steps to unlock the full power of AI for your workflow."
        />
        <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connector line — desktop only */}
          <div
            aria-hidden="true"
            className="absolute hidden lg:block h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent"
            style={{ top: '2.75rem', left: '10%', right: '10%' }}
          />
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative flex flex-col items-center text-center">
                <div className="relative mb-5 flex h-[56px] w-[56px] items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/[0.06]">
                  <Icon className="h-6 w-6 text-violet-400" />
                  <span className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </SectionWrapper>
  );
}
