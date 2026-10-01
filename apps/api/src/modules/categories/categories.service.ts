import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const exists = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('Category slug already exists');
    return this.prisma.category.create({ data: dto });
  }

  findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      include: { _count: { select: { tools: { where: { isActive: true, deletedAt: null } } } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const cat = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { tools: { where: { isActive: true, deletedAt: null } } } } },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async findToolsBySlug(slug: string, search?: string, skip = 0, take = 50) {
    const category = await this.prisma.category.findFirst({ where: { slug, deletedAt: null } });
    if (!category) throw new NotFoundException('Category not found');

    const where: any = { categoryId: category.id, isActive: true, deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.aITool.findMany({
        where,
        include: { category: true, configuration: { select: { creditCost: true } } },
        orderBy: { sortOrder: 'asc' },
        skip,
        take,
      }),
      this.prisma.aITool.count({ where }),
    ]);

    return { category, data, total, skip, take };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Category deleted' };
  }
}
