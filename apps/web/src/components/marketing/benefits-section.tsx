import { CheckCircle2 } from 'lucide-react';
import { SectionWrapper, SectionHeading, Container, GradientText } from './primitives';

const BENEFITS = [
  {
    label: 'For Content Creators',
    title: <>Stop staring at a blank page. <GradientText>Start creating.</GradientText></>,
    description: 'CracknCode AI eliminates writer\'s block forever. Generate blog posts, social captions, email sequences and ad copy in seconds — all perfectly tailored to your brand voice.',
    points: [
      'Generate a full blog post in under 60 seconds',
      'Maintain consistent brand voice across all content',
      'Repurpose one piece of content into 10 formats',
      'Write in 50+ languages with native-level quality',
    ],
    visual: 'from-violet-500/20 to-pink-500/20',
    icon: '✍️',
  },
  {
    label: 'For Developers',
    title: <>Ship better code, <GradientText>faster.</GradientText></>,
    description: 'From code reviews to test generation, CracknCode AI integrates into your development workflow. Catch bugs before they ship, generate tests automatically and get instant explanations for complex code.',
    points: [
      'Automated code review with actionable suggestions',
      'Generate unit and integration tests instantly',
      'Explain complex code in plain English',
      'Refactor and optimise with one click',
    ],
    visual: 'from-emerald-500/20 to-cyan-500/20',
    icon: '💻',
  },
  {
    label: 'For Marketing Teams',
    title: <>Run campaigns that <GradientText>actually convert.</GradientText></>,
    description: 'From ad copy to SEO strategy, CracknCode AI gives your marketing team an unfair advantage. Generate, test and optimise content at a scale that was previously impossible.',
    points: [
      'A/B test ad copy variations in minutes',
      'SEO-optimised content that ranks on page one',
      'Social media calendars planned in advance',
      'Analytics reports written automatically',
    ],
    visual: 'from-blue-500/20 to-indigo-500/20',
    icon: '📈',
  },
];

export function BenefitsSection() {
  return (
    <SectionWrapper id="benefits">
      <Container>
        <SectionHeading
          label="Benefits"
          title="Built for every team"
          description="Whether you're a solo creator or a 100-person team, CracknCode AI adapts to your workflow."
        />
        <div className="space-y-20">
          {BENEFITS.map((benefit, i) => (
            <div
              key={benefit.label}
              className={`grid grid-cols-1 items-center gap-12 lg:grid-cols-2 ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}
            >
              {/* Visual */}
              <div className={`relative flex h-72 items-center justify-center rounded-2xl bg-gradient-to-br ${benefit.visual} border border-border overflow-hidden`}>
                <span className="text-8xl select-none" aria-hidden="true">{benefit.icon}</span>
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </div>

              {/* Text */}
              <div>
                <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-primary">
                  {benefit.label}
                </span>
                <h3 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                  {benefit.title}
                </h3>
                <p className="mb-6 text-muted-foreground leading-relaxed">{benefit.description}</p>
                <ul className="space-y-3">
                  {benefit.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="text-sm text-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
}
