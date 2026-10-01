import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { ApiKeyGuard } from './api-key.guard';
import { ApiUsageInterceptor } from './api-usage.interceptor';
import { DeveloperModule } from '../developer/developer.module';
import { GenerationsModule } from '../generations/generations.module';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [DeveloperModule, GenerationsModule, ToolsModule],
  controllers: [PublicApiController],
  providers: [ApiKeyGuard, ApiUsageInterceptor],
})
export class PublicApiModule {}
