// ─── Prisma mock ─────────────────────────────────────────────────────────────

export const mockPrisma = () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  plan: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  subscription: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
  creditAccount: {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    upsert: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  creditTransaction: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  generation: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  generationResult: { create: jest.fn() },
  history: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  aITool: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  toolConfiguration: {
    create: jest.fn(),
    upsert: jest.fn(),
  },
  favorite: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  },
  apiKey: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  apiUsageLog: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  loginAttempt: { create: jest.fn() },
  adminLog: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  payment: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  invoice: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  supportConversation: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  supportMessage: {
    findMany: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  category: { count: jest.fn() },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
});

// ─── Redis mock ───────────────────────────────────────────────────────────────

export const mockRedis = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  getClient: jest.fn().mockReturnValue({
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
  }),
});

// ─── JWT mock ─────────────────────────────────────────────────────────────────

export const mockJwt = () => ({
  signAsync: jest.fn().mockResolvedValue('mock.jwt.token'),
  verify: jest.fn(),
  decode: jest.fn(),
});

// ─── Config mock ──────────────────────────────────────────────────────────────

export const mockConfig = () => ({
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      'jwt.secret': 'test-secret',
      'jwt.refreshSecret': 'test-refresh-secret',
      'jwt.expiresIn': '15m',
      'jwt.refreshExpiresIn': '30d',
      'stripe.secretKey': 'sk_test_mock',
      'stripe.webhookSecret': 'whsec_test_mock',
      FRONTEND_URL: 'http://localhost:3000',
    };
    return map[key];
  }),
  getOrThrow: jest.fn((key: string) => key),
});

// ─── Fixture builders ─────────────────────────────────────────────────────────

export const makeUser = (overrides: Partial<any> = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: '$2a$12$hashedpassword',
  role: 'user',
  status: 'active',
  isEmailVerified: true,
  deletedAt: null,
  lastLoginAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  profile: { id: 'profile-1', userId: 'user-1', name: 'Test User', avatarUrl: null },
  ...overrides,
});

export const makeAdminUser = (overrides: Partial<any> = {}) =>
  makeUser({ id: 'admin-1', email: 'admin@example.com', role: 'admin', ...overrides });

export const makePlan = (overrides: Partial<any> = {}) => ({
  id: 'plan-free',
  name: 'Free',
  tier: 'free',
  creditsPerMonth: 100,
  monthlyPriceUsd: 0,
  yearlyPriceUsd: 0,
  maxGenerations: 50,
  features: [],
  isActive: true,
  sortOrder: 0,
  stripePriceIdMonthly: null,
  stripePriceIdYearly: null,
  apiKeysAllowed: 0,
  apiRateLimit: 0,
  ...overrides,
});

export const makeProPlan = (overrides: Partial<any> = {}) =>
  makePlan({
    id: 'plan-pro',
    name: 'Pro',
    tier: 'pro',
    creditsPerMonth: 1000,
    monthlyPriceUsd: 29,
    stripePriceIdMonthly: 'price_pro_monthly',
    apiKeysAllowed: 5,
    apiRateLimit: 100,
    ...overrides,
  });

export const makeCreditAccount = (overrides: Partial<any> = {}) => ({
  id: 'account-1',
  userId: 'user-1',
  balance: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const makeTool = (overrides: Partial<any> = {}) => ({
  id: 'tool-1',
  name: 'Blog Writer',
  slug: 'blog-writer',
  description: 'Writes blog posts',
  categoryId: 'cat-1',
  isActive: true,
  isPremium: false,
  isFeatured: false,
  usageCount: 0,
  deletedAt: null,
  configuration: {
    id: 'config-1',
    toolId: 'tool-1',
    systemPrompt: 'You are a blog writer.',
    userPromptTemplate: 'Write about: {{topic}}',
    inputSchema: { type: 'object', properties: { topic: { type: 'string' } } },
    outputFormat: 'markdown',
    aiProvider: 'openai',
    aiModel: 'gpt-4o',
    maxTokens: 2048,
    temperature: 0.7,
    creditCost: 5,
  },
  ...overrides,
});

export const makeGeneration = (overrides: Partial<any> = {}) => ({
  id: 'gen-1',
  userId: 'user-1',
  toolId: 'tool-1',
  input: { topic: 'AI testing' },
  status: 'completed',
  creditsCost: 5,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  result: { id: 'result-1', generationId: 'gen-1', output: 'Generated content', outputFormat: 'markdown' },
  tool: { name: 'Blog Writer', slug: 'blog-writer' },
  ...overrides,
});

export const makeApiKey = (overrides: Partial<any> = {}) => ({
  id: 'key-1',
  userId: 'user-1',
  name: 'Test Key',
  keyHash: 'abc123hash',
  keyPrefix: 'cnc_abc12345',
  isActive: true,
  lastUsedAt: null,
  lastUsedIp: null,
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
