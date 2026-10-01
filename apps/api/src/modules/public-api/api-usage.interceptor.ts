import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { DeveloperService } from '../developer/developer.service';

@Injectable()
export class ApiUsageInterceptor implements NestInterceptor {
  constructor(private developer: DeveloperService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<any>();
    const res = context.switchToHttp().getResponse<any>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(req, res, start),
        error: () => this.log(req, res, start),
      }),
    );
  }

  private log(req: any, res: any, start: number) {
    if (!req.apiKey) return;
    this.developer
      .recordUsage(req.apiKey.id, req.user.id, {
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })
      .catch(() => null);
  }
}
