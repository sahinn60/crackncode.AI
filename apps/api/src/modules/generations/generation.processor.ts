import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, Logger, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { GenerationsService } from './generations.service';

export const GENERATION_QUEUE = 'generation';

export interface GenerationJobData {
  generationId: string;
  userId: string;
}

@Processor(GENERATION_QUEUE, {
  concurrency: 5,           // process up to 5 jobs in parallel per worker
  stalledInterval: 30_000,  // re-queue stalled jobs every 30s
  maxStalledCount: 2,       // mark as failed after 2 stall cycles
})
export class GenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(GenerationProcessor.name);

  constructor(
    @Inject(forwardRef(() => GenerationsService))
    private readonly generationsService: GenerationsService,
  ) {
    super();
  }

  async process(job: Job<GenerationJobData>): Promise<void> {
    this.logger.log(`Job ${job.id} started — generation ${job.data.generationId}`);
    await job.updateProgress(10);

    try {
      await this.generationsService.processGeneration(
        job.data.generationId,
        job.data.userId,
      );
      await job.updateProgress(100);
    } catch (err) {
      this.logger.error(`Job ${job.id} failed — generation ${job.data.generationId}`, String(err));
      throw err; // BullMQ retries based on queue config
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed in ${Date.now() - job.timestamp}ms`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts ?? 1}): ${err.message}`,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    this.logger.warn(`Job ${jobId} stalled — will be re-queued`);
  }
}
