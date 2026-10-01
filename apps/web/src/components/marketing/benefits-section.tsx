import { CheckCircle2 } from 'lucide-react';
import { SectionWrapper, SectionHeading, Container, GradientText } from './primitives';

const BENEFITS = [
  {
    label: 'For Content Creators',
    title: <>Stop staring at a blank page. <GradientText>Start creating.</GradientText></>,
    description: "CracknCode AI eliminates writer's block forever. Generate blog posts, social captions, email sequences and ad copy in seconds — all perfectly tailored to your brand voice.",
    points: [
      'Generate a full blog post in under 60 seconds',
      'Maintain consistent brand voice across all content',
      'Repurpose one piece of content into 10 formats',
      'Write in 50+ languages with native-level quality',
    ],
    gradient: 'from-violet-600/15 to-pink-600/15',
    emoji: '✍️',
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
    gradient: 'from-emerald-600/15 to-cyan-600/15',
    emoji: '💻',
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
    gradient: 'from-blue-600/15 to-indigo-600/15',
    emoji: '📈',
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
        <div className="space-y-20 lg:space-y-24">
          {BENEFITS.map((benefit, i) => (
            <div
              key={benefit.label}
              className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}
            >
              {/* Visual */}
              <div className={`relative flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br ${benefit.gradient} border border-white/[0.07] overflow-hidden`}>
                <span className="text-7xl select-none" aria-hidden="true">{benefit.emoji}</span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Text */}
              <div>
                <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-violet-400">
                  {benefit.label}
                </span>
                <h3 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl text-white leading-tight">
                  {benefit.title}
                </h3>
                <p className="mb-6 text-zinc-400 leading-relaxed text-[15px]">{benefit.description}</p>
                <ul className="space-y-3">
                  {benefit.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span className="text-sm text-zinc-300">{point}</span>
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
