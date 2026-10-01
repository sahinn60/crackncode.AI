'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { Button, cn } from '@crackncode/ui';
import { Container, SectionLabel, GradientText, SectionWrapper } from '@/components/marketing/primitives';
import { FAQ_ITEMS } from '@/data/marketing';

const FAQ_CATEGORIES = [
  { label: 'General',     items: FAQ_ITEMS.slice(0, 3) },
  { label: 'Billing',     items: FAQ_ITEMS.slice(3, 6) },
  { label: 'Technical',   items: FAQ_ITEMS.slice(6, 8) },
];

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground">{question}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="pb-5 animate-in">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-background pt-32 pb-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/8 blur-[100px]" />
        </div>
        <Container className="relative text-center">
          <div className="mb-4 flex justify-center"><SectionLabel>FAQ</SectionLabel></div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
            Frequently asked <GradientText>questions</GradientText>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Everything you need to know about CracknCode AI. Can't find the answer? We're here to help.
          </p>
        </Container>
      </section>

      {/* FAQ by category */}
      <SectionWrapper>
        <Container>
          <div className="mx-auto max-w-3xl space-y-10">
            {FAQ_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <h2 className="mb-4 text-lg font-bold text-foreground">{cat.label}</h2>
                <div className="rounded-2xl border border-border bg-card px-6">
                  {cat.items.map((item) => (
                    <AccordionItem key={item.question} {...item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </SectionWrapper>

      {/* Contact CTA */}
      <section className="py-16 bg-background-subtle border-t border-border">
        <Container className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Still have questions?</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Our support team is available 24/7 to help you with anything.
          </p>
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </Container>
      </section>
    </>
  );
}
