export type MonitoringOverallStatus = "healthy" | "degraded" | "down";
export type MonitoringServiceStatus = "healthy" | "degraded" | "down" | "unknown";
export type MonitoringAlertSeverity = "info" | "warning" | "critical";
export type MonitoringAlertStatus = "open" | "acknowledged" | "resolved" | "silenced";

export interface MonitoringServiceHealth {
  id: string;
  name: string;
  status: MonitoringServiceStatus;
  latencyMs?: number | null;
  errorRate?: number | null;
  traceId?: string | null;
}

export interface MonitoringLatencyMetric {
  path: string;
  p95Ms: number;
  avgMs: number;
  samples: number;
}

export interface MonitoringErrorRateMetric {
  path: string;
  rate: number;
  count: number;
  window: string;
}

export interface MonitoringHealthSummary {
  overallStatus: MonitoringOverallStatus;
  generatedAt: string;
  services: MonitoringServiceHealth[];
  latency: MonitoringLatencyMetric[];
  errorRates: MonitoringErrorRateMetric[];
}

export interface MonitoringAlert {
  id: string;
  title: string;
  severity: MonitoringAlertSeverity;
  status: MonitoringAlertStatus;
  source: string;
  triggeredAt: string;
  traceId?: string | null;
  description?: string | null;
}

export interface MonitoringCommandResult {
  accepted: boolean;
  traceId?: string | null;
}
