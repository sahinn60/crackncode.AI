import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Private/reserved IP ranges that must never be targeted
const BLOCKED_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0/,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,           // link-local / AWS metadata
  /^100\.64\./,            // shared address space
  /^::1$/,                 // IPv6 loopback
  /^fc00:/i,               // IPv6 ULA
  /^fe80:/i,               // IPv6 link-local
  /metadata\.google\.internal/i,
  /169\.254\.169\.254/,    // cloud metadata
];

@Injectable()
export class BrowserSecurityService {
  private readonly allowedDomains: Set<string>;

  constructor(private config: ConfigService) {
    const raw = this.config.get<string>('BROWSER_TOOL_ALLOWED_DOMAINS', '');
    this.allowedDomains = new Set(
      raw.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean),
    );
  }

  validateWebsiteUrl(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new BadRequestException('Only http/https URLs are allowed');
    }

    const host = parsed.hostname.toLowerCase();

    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(host)) {
        throw new BadRequestException('URL targets a blocked/private network address');
      }
    }

    // If allowlist is configured, enforce it
    if (this.allowedDomains.size > 0) {
      const allowed = [...this.allowedDomains].some(
        (d) => host === d || host.endsWith(`.${d}`),
      );
      if (!allowed) {
        throw new BadRequestException(
          `Domain "${host}" is not in the approved allowlist`,
        );
      }
    }
  }

  isDomainAllowed(url: string): boolean {
    try {
      this.validateWebsiteUrl(url);
      return true;
    } catch {
      return false;
    }
  }
}
