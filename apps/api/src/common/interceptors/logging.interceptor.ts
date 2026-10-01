import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { requestId?: string; user?: { id?: string } }>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url } = req;
    const start = Date.now();
    const requestId = req.requestId ?? '-';
    const userId = req.user?.id ?? '-';

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const status = res.statusCode;
          this.logger.log(`${method} ${url} ${status} ${ms}ms rid=${requestId} uid=${userId}`);
        },
        error: (err: Error) => {
          const ms = Date.now() - start;
          this.logger.error(`${method} ${url} ERR ${ms}ms rid=${requestId} uid=${userId} — ${err.message}`);
        },
      }),
    );
  }
}
