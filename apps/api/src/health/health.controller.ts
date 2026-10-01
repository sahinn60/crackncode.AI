import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';
import type { HealthCheckResponse } from '@crackncode/types';

@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** GET /health — full readiness check (DB + Redis + Queue) */
  @Get()
  check(): Promise<HealthCheckResponse> {
    return this.healthService.check();
  }

  /** GET /health/live — liveness probe (process alive, no external deps) */
  @Get('live')
  liveness() {
    return this.healthService.liveness();
  }

  /** GET /health/ready — readiness probe (all deps reachable) */
  @Get('ready')
  readiness(): Promise<HealthCheckResponse> {
    return this.healthService.check();
  }
}
