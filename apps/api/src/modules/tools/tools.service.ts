import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateToolDto, UpdateToolDto, QueryToolsDto } from './tools.dto';

const CACHE_TTL = 300; // 5 minutes
const TOOLS_LIST_KEY = 'cache:tools:list';

@Injectable()
export class ToolsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(dto: CreateToolDto) {
    const exists = await this.prisma.aITool.findUnique({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('Tool slug already exists');
    const tool = await this.prisma.aITool.create({ data: dto });
    await this.bustCache();
    return tool;
  }

  async findAll(query: QueryToolsDto = {}) {
    const {
      search, categoryId, categorySlug, featured, premium,
      skip = 0, take = 50,
    } = query;

    // Only cache the default (no filters) listing — used by marketing pages
    const isDefaultQuery = !search && !categoryId && !categorySlug &&
      featured === undefined && premium === undefined && skip === 0 && take === 50;

    if (isDefaultQuery) {
      const cached = await this.redis.get(TOOLS_LIST_KEY);
      if (cached) return JSON.parse(cached);
    }

    const where: any = { isActive: true, deletedAt: null };
    if (categoryId) where.categoryId = categoryId;
    if (categorySlug) where.category = { slug: categorySlug };
    if (featured === true) where.isFeatured = true;
    if (premium === true) where.isPremium = true;
    if (premium === false) where.isPremium = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const orderBy =
      query.sort === 'popular'
        ? { usageCount: 'desc' as const }
        : { sortOrder: 'asc' as const };

    const [data, total] = await Promise.all([
      this.prisma.aITool.findMany({
        where,
        include: {
          category: true,
          configuration: { select: { creditCost: true, outputFormat: true } },
        },
        orderBy,
        skip: Number(skip),
        take: Number(take),
      }),
      this.prisma.aITool.count({ where }),
    ]);

    const result = { data, total, skip: Number(skip), take: Number(take) };

    if (isDefaultQuery) {
      await this.redis.set(TOOLS_LIST_KEY, JSON.stringify(result), CACHE_TTL);
    }

    return result;
  }

  async findOne(id: string) {
    const tool = await this.prisma.aITool.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, configuration: true },
    });
    if (!tool) throw new NotFoundException('Tool not found');
    return tool;
  }

  async findBySlug(slug: string) {
    const cacheKey = `cache:tools:slug:${slug}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const tool = await this.prisma.aITool.findFirst({
      where: { slug, deletedAt: null },
      include: { category: true, configuration: true },
    });
    if (!tool) throw new NotFoundException('Tool not found');

    await this.redis.set(cacheKey, JSON.stringify(tool), CACHE_TTL);
    return tool;
  }

  async update(id: string, dto: UpdateToolDto) {
    await this.findOne(id);
    const tool = await this.prisma.aITool.update({ where: { id }, data: dto });
    await this.bustCache(tool.slug);
    return tool;
  }

  async remove(id: string) {
    const tool = await this.findOne(id);
    await this.prisma.aITool.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.bustCache(tool.slug);
    return { message: 'Tool deleted' };
  }

  async incrementUsage(id: string) {
    return this.prisma.aITool.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }

  private async bustCache(slug?: string) {
    await this.redis.del(TOOLS_LIST_KEY);
    if (slug) await this.redis.del(`cache:tools:slug:${slug}`);
  }
}
