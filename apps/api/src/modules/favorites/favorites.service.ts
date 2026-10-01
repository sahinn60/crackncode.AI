import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: { tool: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async add(userId: string, toolId: string) {
    const exists = await this.prisma.favorite.findUnique({
      where: { userId_toolId: { userId, toolId } },
    });
    if (exists) throw new ConflictException('Already in favorites');
    return this.prisma.favorite.create({ data: { userId, toolId } });
  }

  async remove(userId: string, toolId: string) {
    const fav = await this.prisma.favorite.findUnique({
      where: { userId_toolId: { userId, toolId } },
    });
    if (!fav) throw new NotFoundException('Favorite not found');
    await this.prisma.favorite.delete({ where: { userId_toolId: { userId, toolId } } });
    return { message: 'Removed from favorites' };
  }
}
