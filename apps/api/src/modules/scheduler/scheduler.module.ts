import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [CreditsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
