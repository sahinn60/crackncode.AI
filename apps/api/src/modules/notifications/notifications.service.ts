import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string, skip = 0, take = 20) {
    return this.prisma.$transaction([
      this.prisma.notification.count({
        where: { userId, deletedAt: null },
      }),
      this.prisma.notification.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]).then(([total, items]) => ({ items, total, skip, take }));
  }

  countUnread(userId: string) {
    return this.prisma.notification
      .count({ where: { userId, isRead: false, deletedAt: null } })
      .then((count) => ({ count }));
  }

  async markRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false, deletedAt: null },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    actionUrl?: string,
  ) {
    return this.prisma.notification.create({
      data: { userId, type, title, body, actionUrl },
    });
  }
}
