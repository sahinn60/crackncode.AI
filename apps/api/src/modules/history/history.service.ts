import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface HistoryQuery {
  skip?: number;
  take?: number;
  search?: string;
  categorySlug?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, query: HistoryQuery = {}) {
    const { skip = 0, take = 20, search, categorySlug, dateFrom, dateTo } = query;

    const where: any = { userId, deletedAt: null };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search || categorySlug) {
      where.generation = {
        tool: {
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
          ...(categorySlug && { category: { slug: categorySlug } }),
        },
      };
    }

    const include = {
      generation: {
        include: {
          tool: {
            select: {
              id: true,
              name: true,
              slug: true,
              iconUrl: true,
              category: { select: { name: true, slug: true } },
            },
          },
          result: { select: { output: true, outputFormat: true } },
        },
      },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.history.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.history.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async findOne(id: string, userId: string) {
    const item = await this.prisma.history.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        generation: {
          include: {
            tool: { select: { id: true, name: true, slug: true, iconUrl: true } },
            result: true,
          },
        },
      },
    });
    if (!item) throw new NotFoundException('History item not found');
    return item;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // ownership check
    await this.prisma.history.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Deleted' };
  }

  async clear(userId: string) {
    await this.prisma.history.updateMany({
      where: { userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { message: 'History cleared' };
  }

  async togglePin(id: string, userId: string) {
    const item = await this.findOne(id, userId);
    return this.prisma.history.update({ where: { id }, data: { isPinned: !item.isPinned } });
  }
}
