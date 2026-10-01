import type { Metadata } from 'next';
import { HeroSection }           from '@/components/marketing/hero-section';
import { ToolsShowcaseSection }  from '@/components/marketing/tools-showcase-section';
import { CategoriesSection }     from '@/components/marketing/categories-section';
import { FeaturesSection }       from '@/components/marketing/features-section';
import { HowItWorksSection }     from '@/components/marketing/how-it-works-section';
import { PopularToolsSection }   from '@/components/marketing/popular-tools-section';
import { BenefitsSection }       from '@/components/marketing/benefits-section';
import { PricingPreviewSection } from '@/components/marketing/pricing-preview-section';
import { TestimonialsSection }   from '@/components/marketing/testimonials-section';
import { FaqSection }            from '@/components/marketing/faq-section';
import { CtaSection }            from '@/components/marketing/cta-section';
import { Divider }               from '@/components/marketing/primitives';

// Revalidate every 5 minutes — ISR keeps marketing page fresh without full SSR
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'CracknCode AI — All Your AI Tools. One Powerful Workspace.',
  description:
    'Access 100+ AI tools for writing, marketing, SEO, social media, images, coding and productivity from one unified platform.',
  openGraph: {
    title: 'CracknCode AI — All Your AI Tools. One Powerful Workspace.',
    description:
      'Access 100+ AI tools for writing, marketing, SEO, social media, images, coding and productivity from one unified platform.',
    type: 'website',
    url: 'https://crackncode.ai',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CracknCode AI',
    description: 'Access 100+ AI tools from one unified platform.',
  },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Divider />
      <ToolsShowcaseSection />
      <Divider />
      <CategoriesSection />
      <Divider />
      <FeaturesSection />
      <Divider />
      <HowItWorksSection />
      <Divider />
      <PopularToolsSection />
      <Divider />
      <BenefitsSection />
      <Divider />
      <PricingPreviewSection />
      <Divider />
      <TestimonialsSection />
      <Divider />
      <FaqSection />
      <CtaSection />
    </>
  );
}
