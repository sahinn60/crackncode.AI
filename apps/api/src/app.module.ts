import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { configs } from './config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ToolsModule } from './modules/tools/tools.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { GenerationsModule } from './modules/generations/generations.module';
import { HistoryModule } from './modules/history/history.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { CreditsModule } from './modules/credits/credits.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ChatModule } from './modules/chat/chat.module';
import { AdminModule } from './modules/admin/admin.module';
import { DeveloperModule } from './modules/developer/developer.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { LandingPageModule } from './modules/landing-page/landing-page.module';
import { UploadModule } from './modules/upload/upload.module';
import { BrowserToolsModule } from './modules/browser-tools/browser-tools.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: configs }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD') || undefined,
        },
        // Global defaults — overridden per-queue in each module
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2_000 },
        },
      }),
    }),
    ThrottlerModule.forRoot([
      { name: 'short',  ttl: 1000,      limit: 10   }, // 10 req/s
      { name: 'medium', ttl: 60_000,    limit: 200  }, // 200 req/min
      { name: 'long',   ttl: 3_600_000, limit: 2000 }, // 2000 req/hr
    ]),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    ToolsModule,
    CategoriesModule,
    GenerationsModule,
    HistoryModule,
    FavoritesModule,
    CreditsModule,
    SubscriptionsModule,
    BillingModule,
    NotificationsModule,
    ChatModule,
    AdminModule,
    DeveloperModule,
    PublicApiModule,
    SchedulerModule,
    LandingPageModule,
    UploadModule,
    BrowserToolsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
