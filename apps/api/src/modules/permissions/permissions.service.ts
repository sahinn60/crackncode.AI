import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePermissionDto } from './permissions.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePermissionDto) {
    const exists = await this.prisma.permission.findUnique({
      where: { action_subject: { action: dto.action, subject: dto.subject } },
    });
    if (exists) throw new ConflictException('Permission already exists');
    return this.prisma.permission.create({ data: dto });
  }

  findAll() {
    return this.prisma.permission.findMany({ orderBy: [{ subject: 'asc' }, { action: 'asc' }] });
  }

  async findOne(id: string) {
    const perm = await this.prisma.permission.findUnique({ where: { id } });
    if (!perm) throw new NotFoundException('Permission not found');
    return perm;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.permission.delete({ where: { id } });
    return { message: 'Permission deleted' };
  }
}
