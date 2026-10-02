import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdminBrowserToolsController, BrowserToolsController } from './browser-tools.controller';
import { BrowserToolsService } from './browser-tools.service';
import { BrowserSessionService, BROWSER_CONNECT_QUEUE, BROWSER_EXEC_QUEUE } from './services/browser-session.service';
import { BrowserEncryptionService } from './services/browser-encryption.service';
import { BrowserSecurityService } from './services/browser-security.service';
import { BrowserConnectWorker } from './workers/browser-connect.worker';
import { BrowserExecWorker } from './workers/browser-exec.worker';
import { DatabaseModule } from '../../database/database.module';
import { RedisModule } from '../../redis/redis.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    CreditsModule,
    BullModule.registerQueue(
      { name: BROWSER_CONNECT_QUEUE },
      { name: BROWSER_EXEC_QUEUE },
    ),
  ],
  controllers: [AdminBrowserToolsController, BrowserToolsController],
  providers: [
    BrowserToolsService,
    BrowserSessionService,
    BrowserEncryptionService,
    BrowserSecurityService,
    BrowserConnectWorker,
    BrowserExecWorker,
  ],
  exports: [BrowserToolsService],
})
export class BrowserToolsModule {}
