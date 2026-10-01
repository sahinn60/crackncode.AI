import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';

const CACHE_TTL = 60;

@Public()
@Controller('landing-page')
export class LandingPageController {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  @Get('tools')
  async getTools(@Query('category') category?: string) {
    const cacheKey = `cache:landing:tools:${category ?? 'all'}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where: any = { status: 'published', deletedAt: null };
    if (category && category !== 'all') where.category = { slug: category };

    const [data, total] = await Promise.all([
      this.prisma.aITool.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        take: 12,
      }),
      this.prisma.aITool.count({ where: { status: 'published', deletedAt: null } }),
    ]);

    const result = { data, total };
    await this.redis.set(cacheKey, JSON.stringify(result), CACHE_TTL);
    return result;
  }

  @Get('categories')
  async getCategories() {
    const cacheKey = 'cache:landing:categories';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const categories = await this.prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, slug: true },
      orderBy: { sortOrder: 'asc' },
    });

    await this.redis.set(cacheKey, JSON.stringify(categories), CACHE_TTL);
    return categories;
  }
}
