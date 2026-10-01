export type FieldType = 'text' | 'textarea' | 'select';

export interface ToolField {
  key: string;
  title: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  default?: string;
  required?: boolean;
  rows?: number;
}

/** Maps tool slug → ordered input fields for the Universal Tool Workspace */
export const TOOL_DEFINITIONS: Record<string, ToolField[]> = {

  // ── Writing ──────────────────────────────────────────────────────────────────
  'ai-blog-writer': [
    { key: 'topic',     title: 'Blog Topic',       type: 'textarea', placeholder: 'e.g. 10 tips for remote work productivity', required: true, rows: 2 },
    { key: 'keywords',  title: 'Target Keywords',  type: 'text',     placeholder: 'e.g. remote work, productivity, home office' },
    { key: 'tone',      title: 'Tone',             type: 'select',   options: ['professional','casual','humorous','authoritative'], default: 'professional' },
    { key: 'wordCount', title: 'Word Count',        type: 'select',   options: ['500','800','1200','1500'], default: '800' },
  ],
  'ai-article-writer': [
    { key: 'topic',    title: 'Article Topic',    type: 'textarea', placeholder: 'e.g. The future of renewable energy', required: true, rows: 2 },
    { key: 'angle',    title: 'Angle or Focus',   type: 'text',     placeholder: 'e.g. economic impact on developing countries' },
    { key: 'audience', title: 'Target Audience',  type: 'text',     placeholder: 'e.g. business professionals' },
    { key: 'tone',     title: 'Tone',             type: 'select',   options: ['informative','analytical','persuasive','neutral'], default: 'informative' },
  ],
  'ai-rewriter': [
    { key: 'text', title: 'Text to Rewrite', type: 'textarea', placeholder: 'Paste your text here...', required: true, rows: 6 },
    { key: 'goal', title: 'Rewrite Goal',    type: 'select',   options: ['improve clarity','make more formal','make more casual','make more concise','make more engaging'], default: 'improve clarity' },
    { key: 'tone', title: 'Output Tone',     type: 'select',   options: ['professional','casual','academic','conversational'], default: 'professional' },
  ],
  'ai-summarizer': [
    { key: 'text',   title: 'Text to Summarize', type: 'textarea', placeholder: 'Paste the text you want to summarize...', required: true, rows: 8 },
    { key: 'length', title: 'Summary Length',    type: 'select',   options: ['brief (3-5 sentences)','medium (1 paragraph)','detailed (3 paragraphs)'], default: 'medium (1 paragraph)' },
    { key: 'format', title: 'Output Format',     type: 'select',   options: ['paragraph','bullet points'], default: 'bullet points' },
  ],
  'ai-paraphraser': [
    { key: 'text',  title: 'Text to Paraphrase', type: 'textarea', placeholder: 'Paste your text here...', required: true, rows: 6 },
    { key: 'style', title: 'Paraphrase Style',   type: 'select',   options: ['standard','fluency','formal','simple','creative'], default: 'standard' },
  ],
  'grammar-checker': [
    { key: 'text', title: 'Text to Check', type: 'textarea', placeholder: 'Paste your text here to check for grammar errors...', required: true, rows: 8 },
  ],
  'email-writer': [
    { key: 'purpose',   title: 'Email Purpose',         type: 'textarea', placeholder: 'e.g. Follow up on a job application', required: true, rows: 2 },
    { key: 'recipient', title: 'Recipient',             type: 'text',     placeholder: 'e.g. Hiring Manager' },
    { key: 'points',    title: 'Key Points to Cover',   type: 'textarea', placeholder: 'e.g. Mention interview date, express enthusiasm', rows: 3 },
    { key: 'tone',      title: 'Tone',                  type: 'select',   options: ['formal','semi-formal','casual'], default: 'semi-formal' },
  ],
  'product-description': [
    { key: 'productName', title: 'Product Name',     type: 'text',     placeholder: 'e.g. Wireless Noise-Cancelling Headphones', required: true },
    { key: 'features',    title: 'Key Features',     type: 'textarea', placeholder: 'e.g. 30hr battery, active noise cancellation, foldable design', required: true, rows: 3 },
    { key: 'audience',    title: 'Target Audience',  type: 'text',     placeholder: 'e.g. remote workers, commuters' },
    { key: 'tone',        title: 'Tone',             type: 'select',   options: ['professional','casual','luxury','playful'], default: 'professional' },
  ],
  'headline-generator': [
    { key: 'topic',       title: 'Topic',           type: 'textarea', placeholder: 'e.g. productivity tips for entrepreneurs', required: true, rows: 2 },
    { key: 'contentType', title: 'Content Type',    type: 'select',   options: ['blog post','email subject','ad headline','landing page','social post'], default: 'blog post' },
    { key: 'audience',    title: 'Target Audience', type: 'text',     placeholder: 'e.g. small business owners' },
  ],
  'story-generator': [
    { key: 'premise',   title: 'Story Premise',   type: 'textarea', placeholder: 'e.g. A detective discovers their partner is the killer', required: true, rows: 3 },
    { key: 'genre',     title: 'Genre',           type: 'select',   options: ['fantasy','sci-fi','romance','thriller','horror','comedy','mystery'], default: 'thriller' },
    { key: 'character', title: 'Main Character',  type: 'text',     placeholder: 'e.g. A retired detective named Sarah' },
    { key: 'length',    title: 'Length',          type: 'select',   options: ['short (300 words)','medium (600 words)','long (1000 words)'], default: 'medium (600 words)' },
  ],

  // ── Marketing ─────────────────────────────────────────────────────────────────
  'facebook-ad-generator': [
    { key: 'product',  title: 'Product or Service', type: 'textarea', placeholder: 'e.g. Online fitness coaching program', required: true, rows: 2 },
    { key: 'audience', title: 'Target Audience',    type: 'text',     placeholder: 'e.g. Women aged 25-40 who want to lose weight', required: true },
    { key: 'benefit',  title: 'Main Benefit',       type: 'text',     placeholder: 'e.g. Lose 10kg in 90 days' },
    { key: 'cta',      title: 'Call to Action',     type: 'text',     placeholder: 'e.g. Sign up for free trial', default: 'Learn More' },
    { key: 'tone',     title: 'Tone',               type: 'select',   options: ['urgent','friendly','professional','bold'], default: 'friendly' },
  ],
  'google-ad-generator': [
    { key: 'product', title: 'Product or Service',   type: 'textarea', placeholder: 'e.g. Cloud accounting software', required: true, rows: 2 },
    { key: 'keyword', title: 'Target Keyword',       type: 'text',     placeholder: 'e.g. accounting software for small business', required: true },
    { key: 'usp',     title: 'Unique Selling Point', type: 'text',     placeholder: 'e.g. Free 30-day trial, no credit card' },
    { key: 'goal',    title: 'Landing Page Goal',    type: 'select',   options: ['sign up','buy now','get quote','book demo','download'], default: 'sign up' },
  ],
  'marketing-plan': [
    { key: 'business',  title: 'Business Name/Type', type: 'text',     placeholder: 'e.g. SaaS startup for project management', required: true },
    { key: 'product',   title: 'Product or Service', type: 'textarea', placeholder: 'e.g. Team collaboration tool', required: true, rows: 2 },
    { key: 'market',    title: 'Target Market',      type: 'text',     placeholder: 'e.g. Remote teams of 10-50 people' },
    { key: 'budget',    title: 'Monthly Budget',     type: 'text',     placeholder: 'e.g. $5,000' },
    { key: 'timeframe', title: 'Timeframe',          type: 'select',   options: ['1 month','3 months','6 months','12 months'], default: '3 months' },
  ],
  'cta-generator': [
    { key: 'product',   title: 'Product or Service', type: 'text',   placeholder: 'e.g. Email marketing tool', required: true },
    { key: 'action',    title: 'Desired Action',     type: 'text',   placeholder: 'e.g. Start free trial', required: true },
    { key: 'placement', title: 'Placement',          type: 'select', options: ['landing page button','email','popup','ad','social post'], default: 'landing page button' },
    { key: 'tone',      title: 'Tone',               type: 'select', options: ['urgent','friendly','bold','professional'], default: 'bold' },
  ],
  'slogan-generator': [
    { key: 'brand',    title: 'Brand or Product Name',  type: 'text',     placeholder: 'e.g. FreshBrew Coffee', required: true },
    { key: 'value',    title: 'Core Value or Benefit',  type: 'textarea', placeholder: 'e.g. Premium coffee that energises your day', required: true, rows: 2 },
    { key: 'audience', title: 'Target Audience',        type: 'text',     placeholder: 'e.g. Young professionals' },
    { key: 'tone',     title: 'Tone',                   type: 'select',   options: ['fun','professional','inspirational','bold','minimalist'], default: 'bold' },
  ],
  'brand-name-generator': [
    { key: 'businessType', title: 'Business Type',    type: 'text',     placeholder: 'e.g. AI productivity SaaS', required: true },
    { key: 'offering',     title: 'Core Offering',    type: 'textarea', placeholder: 'e.g. Automates repetitive tasks for teams', required: true, rows: 2 },
    { key: 'audience',     title: 'Target Audience',  type: 'text',     placeholder: 'e.g. Startup founders' },
    { key: 'style',        title: 'Name Style',       type: 'select',   options: ['modern & tech','classic & trustworthy','fun & playful','abstract','descriptive'], default: 'modern & tech' },
  ],
  'email-campaign': [
    { key: 'product',  title: 'Product or Service', type: 'textarea', placeholder: 'e.g. Online course on digital marketing', required: true, rows: 2 },
    { key: 'goal',     title: 'Campaign Goal',      type: 'select',   options: ['launch product','nurture leads','re-engage subscribers','promote sale','onboard users'], default: 'launch product', required: true },
    { key: 'audience', title: 'Target Audience',    type: 'text',     placeholder: 'e.g. Small business owners' },
    { key: 'count',    title: 'Number of Emails',   type: 'select',   options: ['3','5','7'], default: '3' },
    { key: 'tone',     title: 'Tone',               type: 'select',   options: ['professional','conversational','urgent','friendly'], default: 'conversational' },
  ],

  // ── SEO ───────────────────────────────────────────────────────────────────────
  'keyword-generator': [
    { key: 'topic',       title: 'Topic or Niche',   type: 'textarea', placeholder: 'e.g. home office furniture', required: true, rows: 2 },
    { key: 'businessType',title: 'Business Type',    type: 'text',     placeholder: 'e.g. ecommerce store' },
    { key: 'country',     title: 'Target Country',   type: 'text',     placeholder: 'e.g. United States', default: 'United States' },
    { key: 'keywordType', title: 'Keyword Type',     type: 'select',   options: ['all types','informational','commercial','transactional','long-tail'], default: 'all types' },
  ],
  'meta-title-generator': [
    { key: 'topic',    title: 'Page Topic',     type: 'textarea', placeholder: 'e.g. Best project management tools for remote teams', required: true, rows: 2 },
    { key: 'keyword',  title: 'Target Keyword', type: 'text',     placeholder: 'e.g. project management tools', required: true },
    { key: 'brand',    title: 'Brand Name',     type: 'text',     placeholder: 'e.g. Acme Inc (optional)' },
    { key: 'pageType', title: 'Page Type',      type: 'select',   options: ['blog post','product page','homepage','category page','landing page'], default: 'blog post' },
  ],
  'meta-description-generator': [
    { key: 'topic',    title: 'Page Topic',     type: 'textarea', placeholder: 'e.g. Guide to remote work productivity', required: true, rows: 2 },
    { key: 'keyword',  title: 'Target Keyword', type: 'text',     placeholder: 'e.g. remote work productivity', required: true },
    { key: 'benefit',  title: 'Key Benefit',    type: 'text',     placeholder: 'e.g. Actionable tips to double your output' },
    { key: 'pageType', title: 'Page Type',      type: 'select',   options: ['blog post','product page','homepage','category page','landing page'], default: 'blog post' },
  ],
  'seo-article-writer': [
    { key: 'keyword',   title: 'Target Keyword', type: 'text',     placeholder: 'e.g. best CRM software for small business', required: true },
    { key: 'topic',     title: 'Article Topic',  type: 'textarea', placeholder: 'e.g. Top 10 CRM tools reviewed', required: true, rows: 2 },
    { key: 'wordCount', title: 'Word Count',      type: 'select',   options: ['800','1200','1500','2000'], default: '1200' },
    { key: 'intent',    title: 'Search Intent',   type: 'select',   options: ['informational','commercial','transactional'], default: 'informational' },
  ],
  'seo-content-outline': [
    { key: 'keyword',     title: 'Target Keyword',    type: 'text',     placeholder: 'e.g. how to start a podcast', required: true },
    { key: 'contentType', title: 'Content Type',      type: 'select',   options: ['how-to guide','listicle','comparison','review','pillar page'], default: 'how-to guide' },
    { key: 'angle',       title: 'Unique Angle',      type: 'text',     placeholder: 'e.g. focus on budget-friendly equipment' },
    { key: 'wordCount',   title: 'Target Word Count', type: 'select',   options: ['800','1200','1500','2000','3000'], default: '1500' },
  ],
  'keyword-clustering': [
    { key: 'keywords', title: 'Keywords (one per line)', type: 'textarea', placeholder: 'best running shoes\nrunning shoes for beginners\nhow to choose running shoes', required: true, rows: 8 },
    { key: 'niche',    title: 'Niche or Industry',       type: 'text',     placeholder: 'e.g. fitness and sports' },
  ],
  'schema-generator': [
    { key: 'schemaType',  title: 'Schema Type',        type: 'select',   options: ['Article','Product','FAQ','LocalBusiness','Recipe','Event','Review','HowTo'], default: 'Article', required: true },
    { key: 'name',        title: 'Name or Title',      type: 'text',     placeholder: 'e.g. How to Make Perfect Sourdough Bread', required: true },
    { key: 'description', title: 'Description',        type: 'textarea', placeholder: 'e.g. A step-by-step guide to baking sourdough', rows: 3 },
    { key: 'details',     title: 'Additional Details', type: 'textarea', placeholder: 'e.g. Author: John Doe, Published: 2024-01-01', rows: 2 },
  ],
  'internal-link-suggestions': [
    { key: 'topic',         title: 'Page Topic',                    type: 'text',     placeholder: 'e.g. Guide to email marketing', required: true },
    { key: 'keyword',       title: 'Target Keyword',                type: 'text',     placeholder: 'e.g. email marketing guide' },
    { key: 'existingPages', title: 'Existing Site Pages (one/line)',type: 'textarea', placeholder: 'Email subject line tips\nEmail list building guide\nEmail automation tools', rows: 4 },
    { key: 'content',       title: 'Content Excerpt',               type: 'textarea', placeholder: 'Paste a section of your content here...', required: true, rows: 5 },
  ],
  'seo-content-optimizer': [
    { key: 'keyword',   title: 'Target Keyword',     type: 'text',     placeholder: 'e.g. best project management software', required: true },
    { key: 'secondary', title: 'Secondary Keywords', type: 'text',     placeholder: 'e.g. project management tools, team collaboration' },
    { key: 'content',   title: 'Content to Optimise',type: 'textarea', placeholder: 'Paste your existing content here...', required: true, rows: 10 },
  ],

  // ── Social Media ──────────────────────────────────────────────────────────────
  'facebook-post': [
    { key: 'topic', title: 'Post Topic',     type: 'textarea', placeholder: 'e.g. Announcing our new product launch', required: true, rows: 2 },
    { key: 'goal',  title: 'Post Goal',      type: 'select',   options: ['engagement','awareness','promotion','education','entertainment'], default: 'engagement' },
    { key: 'brand', title: 'Brand or Business', type: 'text', placeholder: 'e.g. FreshBrew Coffee' },
    { key: 'tone',  title: 'Tone',           type: 'select',   options: ['fun','professional','inspirational','conversational'], default: 'conversational' },
  ],
  'instagram-caption': [
    { key: 'topic', title: 'Post Topic',          type: 'textarea', placeholder: 'e.g. Morning coffee ritual flat lay photo', required: true, rows: 2 },
    { key: 'brand', title: 'Brand or Account Type', type: 'text',  placeholder: 'e.g. Lifestyle brand, fitness coach' },
    { key: 'tone',  title: 'Tone',                type: 'select',   options: ['fun','inspirational','educational','aesthetic','bold'], default: 'fun' },
  ],
  'linkedin-post': [
    { key: 'topic',    title: 'Post Topic',          type: 'textarea', placeholder: 'e.g. Lessons learned from my first startup failure', required: true, rows: 2 },
    { key: 'insight',  title: 'Key Insight or Story',type: 'textarea', placeholder: 'e.g. I lost $50k but learned these 3 things...', rows: 3 },
    { key: 'audience', title: 'Target Audience',     type: 'text',     placeholder: 'e.g. Entrepreneurs and startup founders' },
    { key: 'format',   title: 'Post Format',         type: 'select',   options: ['story','tips list','opinion','case study','question'], default: 'story' },
  ],
  'tiktok-script': [
    { key: 'topic',     title: 'Video Topic',         type: 'textarea', placeholder: 'e.g. 3 productivity hacks that changed my life', required: true, rows: 2 },
    { key: 'length',    title: 'Video Length',        type: 'select',   options: ['15 seconds','30 seconds','60 seconds'], default: '30 seconds' },
    { key: 'niche',     title: 'Niche or Account Type', type: 'text',  placeholder: 'e.g. Business and productivity' },
    { key: 'hookStyle', title: 'Hook Style',          type: 'select',   options: ['question','bold statement','story','controversy','tip reveal'], default: 'bold statement' },
  ],
  'youtube-description': [
    { key: 'title',   title: 'Video Title',   type: 'text',     placeholder: 'e.g. How I Made $10k in 30 Days with Dropshipping', required: true },
    { key: 'topic',   title: 'Video Topic',   type: 'textarea', placeholder: 'e.g. Dropshipping success story and strategy breakdown', required: true, rows: 2 },
    { key: 'keyword', title: 'Target Keyword',type: 'text',     placeholder: 'e.g. dropshipping for beginners' },
    { key: 'niche',   title: 'Channel Niche', type: 'text',     placeholder: 'e.g. E-commerce and online business' },
  ],
  'hashtag-generator': [
    { key: 'topic',    title: 'Post Topic', type: 'textarea', placeholder: 'e.g. Morning workout routine', required: true, rows: 2 },
    { key: 'platform', title: 'Platform',   type: 'select',   options: ['Instagram','TikTok','Twitter/X','LinkedIn'], default: 'Instagram', required: true },
    { key: 'niche',    title: 'Niche',      type: 'text',     placeholder: 'e.g. Fitness and wellness' },
    { key: 'count',    title: 'Number of Hashtags', type: 'select', options: ['10','20','30'], default: '20' },
  ],
  'social-media-ideas': [
    { key: 'brand',    title: 'Brand or Business', type: 'text',     placeholder: 'e.g. Organic skincare brand', required: true },
    { key: 'platform', title: 'Platform',          type: 'select',   options: ['Instagram','Facebook','LinkedIn','TikTok','Twitter/X','All platforms'], default: 'Instagram' },
    { key: 'niche',    title: 'Niche',             type: 'text',     placeholder: 'e.g. Natural beauty and skincare', required: true },
    { key: 'count',    title: 'Number of Ideas',   type: 'select',   options: ['7','14','21','30'], default: '7' },
  ],
  'content-calendar': [
    { key: 'brand',     title: 'Brand or Business',   type: 'text',     placeholder: 'e.g. Digital marketing agency', required: true },
    { key: 'platform',  title: 'Primary Platform',    type: 'select',   options: ['Instagram','Facebook','LinkedIn','TikTok','Multi-platform'], default: 'Instagram', required: true },
    { key: 'month',     title: 'Month or Theme',      type: 'text',     placeholder: 'e.g. January - New Year, New Goals' },
    { key: 'frequency', title: 'Posting Frequency',   type: 'select',   options: ['daily','5x per week','3x per week','every other day'], default: '5x per week' },
    { key: 'goals',     title: 'Business Goals',      type: 'textarea', placeholder: 'e.g. Grow followers, drive website traffic', rows: 2 },
  ],

  // ── Code & Business ───────────────────────────────────────────────────────────
  'code-explainer': [
    { key: 'code',     title: 'Code to Explain',     type: 'textarea', placeholder: 'Paste your code here...', required: true, rows: 8 },
    { key: 'language', title: 'Programming Language', type: 'text',    placeholder: 'e.g. javascript', default: 'javascript' },
    { key: 'level',    title: 'Explanation Level',   type: 'select',   options: ['beginner','intermediate','expert'], default: 'intermediate' },
  ],
  'code-generator': [
    { key: 'task',         title: 'What to Build',          type: 'textarea', placeholder: 'e.g. REST API endpoint for user authentication', required: true, rows: 3 },
    { key: 'language',     title: 'Programming Language',   type: 'text',     placeholder: 'e.g. TypeScript', required: true },
    { key: 'framework',    title: 'Framework',              type: 'text',     placeholder: 'e.g. NestJS (optional)' },
    { key: 'requirements', title: 'Additional Requirements',type: 'textarea', placeholder: 'e.g. Use JWT, include error handling', rows: 2 },
  ],
  'business-plan-generator': [
    { key: 'idea',     title: 'Business Idea',   type: 'textarea', placeholder: 'e.g. AI-powered meal planning app', required: true, rows: 2 },
    { key: 'industry', title: 'Industry',        type: 'text',     placeholder: 'e.g. Health & Wellness Tech' },
    { key: 'market',   title: 'Target Market',   type: 'text',     placeholder: 'e.g. Health-conscious millennials' },
    { key: 'budget',   title: 'Initial Budget',  type: 'text',     placeholder: 'e.g. $50,000' },
  ],
};

export function getToolFields(slug: string): ToolField[] {
  return TOOL_DEFINITIONS[slug] ?? [];
}
