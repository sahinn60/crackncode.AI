import { Badge, Card, CardContent, CardHeader, CardTitle } from '@crackncode/ui';
import type { HealthCheckResponse, HealthStatus, ServiceHealth } from '@crackncode/types';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Clock, Cpu } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

async function getHealth(): Promise<HealthCheckResponse | null> {
  try {
    return await apiClient.health.check();
  } catch {
    return null;
  }
}

function statusVariant(status: HealthStatus) {
  return status === 'ok' ? 'success' : status === 'degraded' ? 'warning' : 'destructive';
}

function StatusIcon({ status }: { status: HealthStatus }) {
  if (status === 'ok') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  if (status === 'degraded') return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
}

function ServiceRow({ name, service }: { name: string; service: ServiceHealth }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <StatusIcon status={service.status} />
        <span className="font-medium capitalize">{name}</span>
        {service.message && (
          <span className="text-sm text-muted-foreground">{service.message}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {service.latency !== undefined && (
          <span className="text-sm text-muted-foreground">{service.latency}ms</span>
        )}
        <Badge variant={statusVariant(service.status)}>{service.status}</Badge>
      </div>
    </div>
  );
}

export default async function StatusPage() {
  const health = await getHealth();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Activity className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">CracknCode AI — System Status</h1>
            <p className="text-muted-foreground text-sm">
              Real-time health of all platform services
            </p>
          </div>
        </div>

        {/* Overall status */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Overall Status</CardTitle>
              {health ? (
                <Badge variant={statusVariant(health.status)} className="text-sm px-3 py-1">
                  {health.status.toUpperCase()}
                </Badge>
              ) : (
                <Badge variant="destructive">UNREACHABLE</Badge>
              )}
            </div>
          </CardHeader>
          {health && (
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Uptime: {health.uptime}s</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cpu className="h-4 w-4" />
                  <span>v{health.version}</span>
                </div>
                <div className="text-muted-foreground">
                  {new Date(health.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent>
            {health ? (
              <>
                <ServiceRow name="database" service={health.services.database} />
                <ServiceRow name="redis" service={health.services.redis} />
                <ServiceRow name="storage" service={health.services.storage} />
              </>
            ) : (
              <div className="flex items-center gap-3 py-4 text-destructive">
                <XCircle className="h-5 w-5" />
                <span>Cannot reach API — ensure the backend is running on port 4000</span>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          API endpoint: <code className="font-mono">GET /api/v1/health</code>
        </p>
      </div>
    </main>
  );
}
