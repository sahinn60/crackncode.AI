import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GenerationsController } from './generations.controller';
import { GenerationsService } from './generations.service';
import { GenerationProcessor, GENERATION_QUEUE } from './generation.processor';
import { AIEngineModule } from './ai-engine/ai-engine.module';
import { CreditsModule } from '../credits/credits.module';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: GENERATION_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2_000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 200 },
      },
    }),
    AIEngineModule,
    CreditsModule,
    ToolsModule,
  ],
  controllers: [GenerationsController],
  providers: [GenerationsService, GenerationProcessor],
  exports: [GenerationsService, BullModule],
})
export class GenerationsModule {}
