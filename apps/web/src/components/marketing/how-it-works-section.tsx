import { cn } from '@crackncode/ui';
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
          {/* Connecting line (desktop) */}
          <div
            aria-hidden="true"
            className="absolute top-10 left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
            style={{ top: '2.5rem' }}
          />
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative flex flex-col items-center text-center">
                {/* Step number bubble */}
                <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary/5">
                  <Icon className="h-8 w-8 text-primary" />
                  <span className="absolute -top-2.5 -right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-2xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </SectionWrapper>
  );
}
