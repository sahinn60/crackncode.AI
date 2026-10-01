import { Injectable, LoggerService, Scope } from '@nestjs/common';

const isProd = process.env.NODE_ENV === 'production';

function write(level: string, message: string, context: string, meta?: Record<string, unknown>) {
  if (isProd) {
    // Structured JSON — parseable by CloudWatch / Datadog / Loki
    process.stdout.write(
      JSON.stringify({ ts: new Date().toISOString(), level, ctx: context, msg: message, ...meta }) + '\n',
    );
  } else {
    const prefix = `[${new Date().toISOString()}] [${level.padEnd(5)}] [${context}]`;
    if (level === 'ERROR') console.error(prefix, message, meta ?? '');
    else if (level === 'WARN')  console.warn(prefix, message);
    else                        console.log(prefix, message);
  }
}

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private context = 'App';

  setContext(context: string) { this.context = context; }

  log(message: string, context?: string) {
    write('INFO', message, context ?? this.context);
  }

  error(message: string, trace?: string, context?: string) {
    write('ERROR', message, context ?? this.context, trace ? { trace } : undefined);
  }

  warn(message: string, context?: string) {
    write('WARN', message, context ?? this.context);
  }

  debug(message: string, context?: string) {
    if (!isProd) write('DEBUG', message, context ?? this.context);
  }

  verbose(message: string, context?: string) {
    if (!isProd) write('VERBOSE', message, context ?? this.context);
  }
}
