'use client';

import * as React from 'react';
import { Mail, MessageSquare, Clock, MapPin, Send } from 'lucide-react';
import { Button, Card, CardContent } from '@crackncode/ui';
import { Container, SectionLabel, GradientText, SectionWrapper } from '@/components/marketing/primitives';

const CONTACT_CARDS = [
  { icon: Mail,          title: 'Email us',       description: 'Our team will respond within 24 hours.',  value: 'hello@crackncode.ai' },
  { icon: MessageSquare, title: 'Live chat',       description: 'Available Monday–Friday, 9am–6pm EST.',   value: 'Start a conversation' },
  { icon: Clock,         title: 'Response time',  description: 'We aim to respond to all queries.',        value: 'Under 24 hours' },
  { icon: MapPin,        title: 'Office',          description: 'Come say hello at our HQ.',               value: 'San Francisco, CA' },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-background pt-32 pb-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/8 blur-[100px]" />
        </div>
        <Container className="relative text-center">
          <div className="mb-4 flex justify-center"><SectionLabel>Contact</SectionLabel></div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
            Get in <GradientText>touch</GradientText>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Have a question, feedback or want to explore enterprise options? We'd love to hear from you.
          </p>
        </Container>
      </section>

      {/* Contact cards */}
      <SectionWrapper>
        <Container>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-16">
            {CONTACT_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title}>
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1 text-sm font-semibold text-foreground">{card.title}</h3>
                    <p className="mb-2 text-xs text-muted-foreground">{card.description}</p>
                    <p className="text-sm font-medium text-primary">{card.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Form + info */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
            {/* Form */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-8">
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                        <Send className="h-7 w-7 text-success" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Message sent!</h3>
                      <p className="text-muted-foreground">Thanks for reaching out. We'll get back to you within 24 hours.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <h2 className="text-xl font-bold text-foreground mb-6">Send us a message</h2>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-foreground">Name</label>
                          <input
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Your name"
                            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-foreground">Email</label>
                          <input
                            required
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="you@example.com"
                            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Subject</label>
                        <select
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Select a subject</option>
                          <option>General inquiry</option>
                          <option>Technical support</option>
                          <option>Billing question</option>
                          <option>Enterprise sales</option>
                          <option>Partnership</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Message</label>
                        <textarea
                          required
                          rows={5}
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          placeholder="Tell us how we can help..."
                          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      <Button type="submit" size="lg" className="w-full gap-2">
                        <Send className="h-4 w-4" /> Send Message
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-3">Enterprise inquiries</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Looking to deploy CracknCode AI across your organisation? Our enterprise team can help with custom pricing, dedicated infrastructure, SSO setup and onboarding.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-3">Support hours</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday – Friday</span>
                    <span className="text-foreground font-medium">9am – 6pm EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday</span>
                    <span className="text-foreground font-medium">10am – 4pm EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="text-muted-foreground">Closed</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-primary/5 p-5">
                <p className="text-sm font-semibold text-foreground mb-1">Pro & Enterprise users</p>
                <p className="text-xs text-muted-foreground">Get priority support with guaranteed response times under 4 hours.</p>
              </div>
            </div>
          </div>
        </Container>
      </SectionWrapper>
    </>
  );
}
