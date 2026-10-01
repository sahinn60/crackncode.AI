import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string;
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const raw =
        typeof res === 'object' && res !== null ? (res as any).message : res;
      message = Array.isArray(raw) ? raw.join(', ') : String(raw ?? exception.message);
    } else {
      message = isProd ? 'Internal server error' : String(exception);
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status} rid=${request.requestId ?? '-'}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      requestId: request.requestId ?? null,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
