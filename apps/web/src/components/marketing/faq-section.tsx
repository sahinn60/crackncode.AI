'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionWrapper, SectionHeading, Container } from './primitives';
import { FAQ_ITEMS } from '@/data/marketing';

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-white">{question}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          open ? 'max-h-48 pb-5' : 'max-h-0',
        )}
      >
        <p className="text-sm text-zinc-400 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export function FaqSection() {
  return (
    <SectionWrapper subtle id="faq">
      <Container>
        <SectionHeading
          label="FAQ"
          title="Frequently asked questions"
          description="Everything you need to know about CracknCode AI. Can't find the answer? Contact our support team."
        />
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/[0.07] bg-white/[0.02] px-6">
          {FAQ_ITEMS.slice(0, 6).map((item) => (
            <FaqItem key={item.question} {...item} />
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
}
