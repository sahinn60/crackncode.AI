import { Card, CardContent, CardHeader, CardTitle, Button } from '@crackncode/ui';
import { PageHeader } from '@/components/layout/page-header';
import { BookOpen, MessageCircle, Mail, ExternalLink, ChevronDown } from 'lucide-react';
import Link from 'next/link';

const RESOURCES = [
  { icon: BookOpen,      title: 'Documentation',   description: 'Guides, API reference and tutorials.',  href: '#', cta: 'Browse docs' },
  { icon: MessageCircle, title: 'Live Chat',        description: 'Chat with our support team in real time.', href: '#', cta: 'Start chat' },
  { icon: Mail,          title: 'Email Support',    description: 'Get a response within 24 hours.',       href: '/contact', cta: 'Send email' },
];

const FAQS = [
  { q: 'How do I upgrade my plan?',         a: 'Go to Billing in the sidebar and click "Upgrade" on the plan you want.' },
  { q: 'How do I get my API key?',           a: 'Your API key is available in Settings → API Key. Keep it secret.' },
  { q: 'Can I cancel my subscription?',     a: 'Yes, go to Billing and click "Manage" to cancel at any time.' },
  { q: 'What AI models are available?',     a: 'Pro plan includes GPT-4o, Claude 3.5 Sonnet and Gemini Pro.' },
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Support"
        description="Find answers or get in touch with our team."
        breadcrumbs={[{ label: 'Help' }]}
      />

      {/* Resources */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {RESOURCES.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.title} hoverable>
              <CardContent className="p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">{r.title}</h3>
                <p className="mb-4 text-xs text-muted-foreground">{r.description}</p>
                <Button variant="outline" size="sm" className="gap-1.5 w-full" asChild>
                  <Link href={r.href}>
                    {r.cta} <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {FAQS.map((faq, i) => (
            <details key={i} className={`group px-6 ${i < FAQS.length - 1 ? 'border-b border-border' : ''}`}>
              <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-sm font-semibold text-foreground list-none">
                {faq.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </CardContent>
      </Card>

      {/* Contact CTA */}
      <div className="rounded-2xl border border-border bg-primary/5 p-6 text-center">
        <h3 className="text-base font-semibold text-foreground mb-1">Still need help?</h3>
        <p className="text-sm text-muted-foreground mb-4">Our support team is available Monday–Friday, 9am–6pm EST.</p>
        <Button asChild>
          <Link href="/contact">Contact Support</Link>
        </Button>
      </div>
    </div>
  );
}
