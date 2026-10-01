import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Strips HTML tags and null bytes from all string values in the incoming DTO.
 * Applied globally — runs after ValidationPipe so the DTO is already typed.
 * This is a defence-in-depth measure; the DB layer (Prisma parameterised queries)
 * already prevents SQL injection, but this stops stored-XSS via text fields.
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    return this.sanitize(value);
  }

  private sanitize(value: unknown): unknown {
    if (typeof value === 'string') {
      return value
        .replace(/<[^>]*>/g, '')   // strip HTML tags
        .replace(/\0/g, '')         // strip null bytes
        .trim();
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.sanitize(v));
    }
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, this.sanitize(v)]),
      );
    }
    return value;
  }
}
