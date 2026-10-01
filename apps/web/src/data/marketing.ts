import {
  PenLine, Megaphone, Search, Share2, Image, Code2, Brain,
  FileText, Mail, BarChart2, Globe, Lightbulb, Video,
  MessageSquare, Sparkles, Zap, Shield, Clock, Users,
  TrendingUp, CheckCircle2, Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────────── */
export interface AiTool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: LucideIcon;
  color: string;
  badge?: string;
  popular?: boolean;
}

export interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
  count: number;
  color: string;
}

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: { monthly: number; yearly: number };
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Step {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/* ── AI Tools ───────────────────────────────────────────────────────────────── */
export const AI_TOOLS: AiTool[] = [
  { id: 'blog-writer',      name: 'Blog Writer',         description: 'Generate SEO-optimized blog posts in seconds.',          category: 'Writing',     icon: PenLine,      color: 'text-violet-500',  badge: 'Popular', popular: true },
  { id: 'ad-copy',          name: 'Ad Copy Generator',   description: 'Create high-converting ads for any platform.',           category: 'Marketing',   icon: Megaphone,    color: 'text-pink-500',    badge: 'Hot',     popular: true },
  { id: 'seo-optimizer',    name: 'SEO Optimizer',       description: 'Analyze and optimize content for search engines.',       category: 'SEO',         icon: Search,       color: 'text-blue-500',    popular: true },
  { id: 'social-caption',   name: 'Social Captions',     description: 'Craft engaging captions for every social platform.',     category: 'Social',      icon: Share2,       color: 'text-cyan-500' },
  { id: 'image-prompt',     name: 'Image Prompt Gen',    description: 'Generate detailed prompts for AI image tools.',          category: 'Images',      icon: Image,        color: 'text-amber-500',   badge: 'New' },
  { id: 'code-review',      name: 'Code Reviewer',       description: 'Get instant AI-powered code reviews and suggestions.',   category: 'Coding',      icon: Code2,        color: 'text-emerald-500', popular: true },
  { id: 'email-writer',     name: 'Email Writer',        description: 'Write professional emails that get responses.',          category: 'Writing',     icon: Mail,         color: 'text-indigo-500' },
  { id: 'content-ideas',    name: 'Content Ideas',       description: 'Never run out of content ideas for your niche.',         category: 'Marketing',   icon: Lightbulb,    color: 'text-yellow-500' },
  { id: 'meta-tags',        name: 'Meta Tag Generator',  description: 'Generate perfect meta titles and descriptions.',         category: 'SEO',         icon: Globe,        color: 'text-sky-500' },
  { id: 'tweet-thread',     name: 'Tweet Thread',        description: 'Create viral Twitter/X threads effortlessly.',           category: 'Social',      icon: MessageSquare,color: 'text-blue-400' },
  { id: 'video-script',     name: 'Video Script',        description: 'Write compelling scripts for YouTube and TikTok.',       category: 'Writing',     icon: Video,        color: 'text-red-500',     badge: 'New' },
  { id: 'analytics-report', name: 'Analytics Report',    description: 'Turn raw data into clear, readable reports.',            category: 'Productivity',icon: BarChart2,    color: 'text-teal-500' },
  { id: 'ai-chat',          name: 'AI Assistant',        description: 'Your always-on AI assistant for any task.',              category: 'Productivity',icon: Brain,        color: 'text-purple-500',  popular: true },
  { id: 'doc-summarizer',   name: 'Doc Summarizer',      description: 'Summarize long documents into key takeaways.',           category: 'Productivity',icon: FileText,     color: 'text-orange-500' },
  { id: 'test-generator',   name: 'Test Generator',      description: 'Auto-generate unit and integration tests for your code.',category: 'Coding',      icon: Code2,        color: 'text-green-500',   badge: 'New' },
  { id: 'hashtag-gen',      name: 'Hashtag Generator',   description: 'Find the best hashtags to maximize your reach.',         category: 'Social',      icon: Sparkles,     color: 'text-fuchsia-500' },
];

/* ── Categories ─────────────────────────────────────────────────────────────── */
export const CATEGORIES: Category[] = [
  { id: 'writing',     label: 'Writing',      icon: PenLine,      count: 24, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  { id: 'marketing',   label: 'Marketing',    icon: Megaphone,    count: 18, color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  { id: 'seo',         label: 'SEO',          icon: Search,       count: 12, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { id: 'social',      label: 'Social Media', icon: Share2,       count: 15, color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
  { id: 'images',      label: 'Images',       icon: Image,        count: 8,  color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { id: 'coding',      label: 'Coding',       icon: Code2,        count: 10, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { id: 'productivity',label: 'Productivity', icon: Brain,        count: 14, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  { id: 'video',       label: 'Video',        icon: Video,        count: 6,  color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
];

/* ── Features ───────────────────────────────────────────────────────────────── */
export const FEATURES: Feature[] = [
  { icon: Zap,          title: 'Lightning Fast',       description: 'Generate high-quality content in seconds, not minutes. Our optimized AI pipeline delivers results at blazing speed.',                    color: 'text-yellow-500' },
  { icon: Brain,        title: 'Multi-Model AI',       description: 'Access GPT-4o, Claude 3.5, Gemini Pro and more from a single interface. Switch models per tool or let us pick the best one.',          color: 'text-violet-500' },
  { icon: Shield,       title: 'Enterprise Security',  description: 'SOC 2 Type II compliant. Your data is encrypted at rest and in transit. We never train on your content.',                               color: 'text-blue-500' },
  { icon: Globe,        title: '50+ Languages',        description: 'Generate content in over 50 languages. Reach global audiences without hiring translators.',                                              color: 'text-cyan-500' },
  { icon: Clock,        title: 'Save 10+ Hours/Week',  description: 'Automate repetitive content tasks. Our users report saving an average of 10 hours per week on content creation.',                       color: 'text-emerald-500' },
  { icon: Users,        title: 'Team Collaboration',   description: 'Invite your team, share workspaces, manage permissions and review AI outputs together in real time.',                                    color: 'text-pink-500' },
  { icon: TrendingUp,   title: 'Analytics & Insights', description: 'Track usage, monitor output quality and understand which AI tools drive the most value for your workflow.',                              color: 'text-orange-500' },
  { icon: Sparkles,     title: 'Custom Templates',     description: 'Build and save your own prompt templates. Train the AI on your brand voice for consistent, on-brand outputs every time.',               color: 'text-indigo-500' },
];

/* ── How It Works ───────────────────────────────────────────────────────────── */
export const HOW_IT_WORKS: Step[] = [
  { step: '01', title: 'Choose a Tool',    description: 'Browse 100+ AI tools across writing, marketing, SEO, coding and more. Find exactly what you need.',                icon: Sparkles },
  { step: '02', title: 'Enter Your Input', description: 'Provide a brief description, keywords or context. Our smart forms guide you to get the best results.',              icon: PenLine },
  { step: '03', title: 'Generate & Refine',description: 'Get instant AI-generated output. Regenerate, edit inline or adjust the tone with one click.',                       icon: Zap },
  { step: '04', title: 'Export & Use',     description: 'Copy, download or publish directly. Integrate with your favourite tools via our API.',                              icon: CheckCircle2 },
];

/* ── Pricing ────────────────────────────────────────────────────────────────── */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for trying out CracknCode AI.',
    features: [
      '10,000 words / month',
      '20+ AI tools',
      'GPT-3.5 model',
      '3 saved templates',
      'Community support',
    ],
    cta: 'Get Started Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 29, yearly: 19 },
    description: 'For creators and professionals who need more.',
    features: [
      'Unlimited words',
      '100+ AI tools',
      'GPT-4o + Claude 3.5',
      'Unlimited templates',
      'Priority support',
      'API access',
      'Advanced analytics',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 99, yearly: 79 },
    description: 'For teams and organisations at scale.',
    features: [
      'Everything in Pro',
      'Unlimited team seats',
      'Custom AI fine-tuning',
      'SSO / SAML',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
  },
];

/* ── Testimonials ───────────────────────────────────────────────────────────── */
export const TESTIMONIALS: Testimonial[] = [
  { name: 'Sarah Chen',      role: 'Content Director',    company: 'GrowthLab',    avatar: 'SC', content: 'CracknCode AI has completely transformed our content workflow. We produce 5x more content with the same team size. The quality is consistently impressive.',                                rating: 5 },
  { name: 'Marcus Williams', role: 'Founder',             company: 'LaunchPad',    avatar: 'MW', content: 'The SEO tools alone are worth the subscription. Our organic traffic increased 180% in 3 months after using the SEO optimizer and meta tag generator.',                                  rating: 5 },
  { name: 'Priya Patel',     role: 'Marketing Manager',   company: 'ScaleUp Co',   avatar: 'PP', content: 'I was skeptical about AI writing tools but CracknCode AI changed my mind. The ad copy generator produces better copy than our previous agency at a fraction of the cost.',             rating: 5 },
  { name: 'James O\'Brien',  role: 'Lead Developer',      company: 'DevForge',     avatar: 'JO', content: 'The code review and test generator tools are phenomenal. They catch issues I miss and the test coverage suggestions have improved our codebase quality significantly.',                  rating: 5 },
  { name: 'Aisha Kamara',    role: 'Social Media Lead',   company: 'BrandBoost',   avatar: 'AK', content: 'Managing social content for 12 clients used to take my whole week. Now I do it in a day. The social caption and hashtag tools are incredibly accurate for each niche.',               rating: 5 },
  { name: 'Tom Nakamura',    role: 'CEO',                 company: 'Nexus Digital', avatar: 'TN', content: 'We rolled out CracknCode AI across our 40-person team. The ROI was clear within the first month. Productivity is up, costs are down, and the team loves using it.',                  rating: 5 },
];

/* ── FAQ ────────────────────────────────────────────────────────────────────── */
export const FAQ_ITEMS: FaqItem[] = [
  { question: 'What AI models does CracknCode AI use?',              answer: 'We support GPT-4o, GPT-3.5 Turbo, Claude 3.5 Sonnet, Claude 3 Haiku, and Gemini Pro. The Pro plan gives you access to all models. You can select a specific model per tool or let our system automatically choose the best one for your task.' },
  { question: 'Is there a free plan?',                               answer: 'Yes! Our free plan includes 10,000 words per month and access to 20+ AI tools. No credit card required. You can upgrade to Pro or Enterprise at any time as your needs grow.' },
  { question: 'Can I cancel my subscription at any time?',           answer: 'Absolutely. You can cancel your subscription at any time from your account settings. You\'ll retain access to your plan until the end of your current billing period. No cancellation fees.' },
  { question: 'Is my data safe and private?',                        answer: 'Yes. We are SOC 2 Type II compliant. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We never use your content to train AI models. You own everything you create.' },
  { question: 'Do you offer an API?',                                answer: 'Yes, API access is available on the Pro and Enterprise plans. Our REST API lets you integrate any CracknCode AI tool directly into your own applications, workflows or internal tools.' },
  { question: 'What languages are supported?',                       answer: 'CracknCode AI supports content generation in 50+ languages including English, Spanish, French, German, Portuguese, Japanese, Chinese, Arabic and many more. Simply specify your target language in the tool.' },
  { question: 'Can I use CracknCode AI for my team?',                answer: 'Yes! The Enterprise plan includes unlimited team seats, shared workspaces, role-based permissions and team analytics. You can also manage billing centrally for your entire organisation.' },
  { question: 'How is the yearly plan different from monthly?',      answer: 'The yearly plan gives you a significant discount — up to 35% off compared to monthly billing. You\'re billed once per year and the price is locked in for the duration of your subscription.' },
];

/* ── Stats ──────────────────────────────────────────────────────────────────── */
export const STATS = [
  { value: '100+',   label: 'AI Tools' },
  { value: '50K+',   label: 'Active Users' },
  { value: '10M+',   label: 'Words Generated' },
  { value: '4.9/5',  label: 'Average Rating', icon: Star },
];
