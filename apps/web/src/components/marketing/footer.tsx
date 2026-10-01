import Link from 'next/link';
import { Zap, Twitter, Github, Linkedin, Youtube } from 'lucide-react';
import { Container } from './primitives';

const FOOTER_LINKS = [
  {
    heading: 'Product',
    links: [
      { label: 'AI Tools',  href: '/tools' },
      { label: 'Features',  href: '#features' },
      { label: 'Pricing',   href: '#pricing' },
      { label: 'Changelog', href: '#' },
      { label: 'Roadmap',   href: '#' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'API Reference',  href: '#' },
      { label: 'Blog',           href: '#' },
      { label: 'FAQ',            href: '#faq' },
      { label: 'Contact',        href: '/contact' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',    href: '#' },
      { label: 'Careers',  href: '#' },
      { label: 'Press',    href: '#' },
      { label: 'Partners', href: '#' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy',   href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy',    href: '#' },
      { label: 'Security',         href: '#' },
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
    <footer className="bg-[#050505] border-t border-white/[0.05]">
      <Container className="py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c8f135]">
                <Zap className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-[15px] text-white">
                CracknCode <span className="text-[#c8f135]">AI</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-[220px]">
              All your AI tools in one powerful workspace. Write, market, code and create faster than ever.
            </p>
            <div className="flex items-center gap-2.5 mt-5">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-zinc-500 hover:text-white hover:border-white/[0.18] transition-all duration-200"
                >
                  <Icon className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.heading}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-600 hover:text-zinc-300 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-zinc-700">
            © {new Date().getFullYear()} CracknCode AI. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </div>
        </div>
      </Container>
    </footer>
  );
}
