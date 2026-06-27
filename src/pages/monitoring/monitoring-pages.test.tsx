import { render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { MonitoringAlertsPage } from "./MonitoringAlertsPage";
import { MonitoringHealthPage } from "./MonitoringHealthPage";

vi.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({
    currentTenant: {
      id: "tenant_demo",
      name: "Demo 公司",
      plan: "pro",
      createdAt: "2026-06-14T00:00:00Z",
      updatedAt: "2026-06-14T00:00:00Z",
    },
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/components/guards", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/services/monitoringService", () => ({
  getMonitoringHealth: vi.fn().mockResolvedValue({
    success: true,
    data: {
      overallStatus: "degraded",
      generatedAt: "2026-06-14T09:00:00Z",
      services: [
        {
          id: "api-gateway",
          name: "API 网关",
          status: "healthy",
          latencyMs: 32,
          errorRate: 0.01,
          traceId: "trace-health-api",
        },
      ],
      latency: [{ path: "/api/users", p95Ms: 120, avgMs: 48, samples: 260 }],
      errorRates: [{ path: "/api/files/upload", rate: 0.03, count: 3, window: "5m" }],
    },
  }),
  getMonitoringAlerts: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: "alert_1",
        title: "错误率升高",
        severity: "critical",
        status: "open",
        source: "api-gateway",
        triggeredAt: "2026-06-14T09:00:00Z",
        traceId: "trace-alert-1",
      },
    ],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  }),
  acknowledgeMonitoringAlert: vi.fn(),
  resolveMonitoringAlert: vi.fn(),
  silenceMonitoringAlert: vi.fn(),
}));

describe("monitoring pages", () => {
  it("renders monitoring health with observability boundary and trace id", async () => {
    render(<MonitoringHealthPage />);

    expect(screen.getByRole("heading", { name: "监控健康" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("API 网关")).toBeInTheDocument());
    expect(screen.getByText("指标采集、健康判定和告警触发由外部监控平台或 API 提供")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("trace-health-api")).toBeInTheDocument());
    expect(screen.getByText("monitoring.health.read")).toBeInTheDocument();
  });

  it("renders monitoring alerts with alert history and management permission", async () => {
    render(<MonitoringAlertsPage />);

    expect(screen.getByRole("heading", { name: "监控告警" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("错误率升高")).toBeInTheDocument());
    expect(screen.getByText("告警规则和告警历史来自 external API，前端不内置告警引擎")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("trace-alert-1")).toBeInTheDocument());
    expect(screen.getByText("monitoring.alerts.manage")).toBeInTheDocument();
  });
});
