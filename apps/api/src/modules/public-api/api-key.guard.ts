import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { DeveloperService } from '../developer/developer.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private developer: DeveloperService,
    private redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();

    const raw =
      req.headers['x-api-key'] ??
      req.query?.api_key;

    if (!raw) throw new UnauthorizedException('API key required. Pass via X-Api-Key header.');

    const key = await this.developer.validateKey(raw);
    if (!key) throw new UnauthorizedException('Invalid or expired API key.');

    const plan = key.user.subscription?.plan;
    const rateLimit = plan?.apiRateLimit ?? 0;

    if (rateLimit > 0) {
      const rateLimitKey = `api:rl:${key.id}`;
      const client = this.redis.getClient();
      const current = await client.incr(rateLimitKey);
      if (current === 1) await client.expire(rateLimitKey, 60);
      if (current > rateLimit) {
        throw new ForbiddenException(
          `Rate limit exceeded. Your plan allows ${rateLimit} requests/minute.`,
        );
      }
    }

    // Attach to request for downstream use
    req.apiKey = key;
    req.user = key.user;

    return true;
  }
}
