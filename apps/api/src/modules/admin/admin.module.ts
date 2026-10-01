import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { CreditsModule } from '../credits/credits.module';
import { RedisModule } from '../../redis/redis.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [UsersModule, CreditsModule, RedisModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
