import Link from 'next/link';
import { Code2, Twitter, Github, Linkedin, Youtube } from 'lucide-react';
import { Container, Divider } from './primitives';

const FOOTER_LINKS = [
  {
    heading: 'Product',
    links: [
      { label: 'AI Tools',   href: '/tools' },
      { label: 'Features',   href: '/features' },
      { label: 'Pricing',    href: '/pricing' },
      { label: 'Changelog',  href: '#' },
      { label: 'Roadmap',    href: '#' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'API Reference',  href: '#' },
      { label: 'Blog',           href: '#' },
      { label: 'FAQ',            href: '/faq' },
      { label: 'Contact',        href: '/contact' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',       href: '#' },
      { label: 'Careers',     href: '#' },
      { label: 'Press',       href: '#' },
      { label: 'Partners',    href: '#' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy',    href: '#' },
      { label: 'Terms of Service',  href: '#' },
      { label: 'Cookie Policy',     href: '#' },
      { label: 'Security',          href: '#' },
    ],
  },
];

const SOCIALS = [
  { icon: Twitter,  href: '#', label: 'Twitter' },
  { icon: Github,   href: '#', label: 'GitHub' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Youtube,  href: '#', label: 'YouTube' },
];

export function MarketingFooter() {
  return (
    <footer className="bg-background-subtle border-t border-border">
      <Container className="py-16">
        {/* Top row */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Code2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-base text-foreground">CracknCode AI</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              All your AI tools in one powerful workspace. Write, market, code and create faster than ever.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.heading}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.heading}
              </p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Divider className="my-8" />

        {/* Bottom row */}
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CracknCode AI. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
            All systems operational
          </div>
        </div>
      </Container>
    </footer>
  );
}
