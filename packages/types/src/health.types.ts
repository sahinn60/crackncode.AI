export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface ServiceHealth {
  status: HealthStatus;
  latency?: number;
  message?: string;
}

export interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    storage: ServiceHealth;
  };
}
