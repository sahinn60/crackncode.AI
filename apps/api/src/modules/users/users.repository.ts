import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { profile: true },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  findAll(skip = 0, take = 20) {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      include: { profile: true },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  count() {
    return this.prisma.user.count({ where: { deletedAt: null } });
  }

  updateProfile(userId: string, data: Partial<{ name: string; avatarUrl: string; bio: string; timezone: string; locale: string }>) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: { userId, name: data.name ?? '', ...data },
      update: data,
    });
  }

  updatePassword(id: string, passwordHash: string) {
    return this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  softDelete(id: string) {
    return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), status: 'deleted' } });
  }
}
