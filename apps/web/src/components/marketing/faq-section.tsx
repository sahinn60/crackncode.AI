'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@crackncode/ui';
import { SectionWrapper, SectionHeading, Container } from './primitives';
import { FAQ_ITEMS } from '@/data/marketing';

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground">{question}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="pb-5 animate-in">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
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
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card px-6">
          {FAQ_ITEMS.slice(0, 6).map((item) => (
            <FaqItem key={item.question} {...item} />
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
}
