import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ChangePasswordDto, UpdateUserDto } from './users.dto';
import { UsersRepository } from './users.repository';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    private repo: UsersRepository,
    private redis: RedisService,
  ) {}

  async findById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    return this.repo.updateProfile(id, dto);
  }

  async changePassword(id: string, dto: ChangePasswordDto, currentAccessToken?: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.repo.updatePassword(id, passwordHash);

    // Invalidate all sessions — force re-login with new password
    await this.redis.del(`refresh:${id}`);

    // Blacklist current access token for its remaining TTL
    if (currentAccessToken) {
      try {
        const parts = currentAccessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64url').toString('utf8'),
          ) as { exp?: number };
          if (payload.exp) {
            const ttl = payload.exp - Math.floor(Date.now() / 1000);
            if (ttl > 0) await this.redis.set(`blacklist:${currentAccessToken}`, '1', ttl);
          }
        }
      } catch {
        // Non-fatal — refresh token already invalidated above
      }
    }

    return { message: 'Password changed successfully. Please log in again.' };
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.softDelete(id);
    await this.redis.del(`refresh:${id}`);
    return { message: 'Account deleted' };
  }
}
