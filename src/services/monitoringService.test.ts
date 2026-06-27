import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  acknowledgeMonitoringAlert,
  getMonitoringAlerts,
  getMonitoringHealth,
  resolveMonitoringAlert,
} from "./monitoringService";

const jsonResponse = (data: unknown) => new Response(JSON.stringify({
  code: 0,
  message: "OK",
  data,
  traceId: "trace-monitoring",
  timestamp: "2026-06-14T00:00:00Z",
}), { status: 200 });

describe("monitoringService external API contract", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("loads health summary from the external monitoring endpoint", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({
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
      latency: [
        { path: "/api/users", p95Ms: 120, avgMs: 48, samples: 260 },
      ],
      errorRates: [
        { path: "/api/files/upload", rate: 0.03, count: 3, window: "5m" },
      ],
    }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await getMonitoringHealth({ tenantId: "tenant_demo" });

    expect(response.success).toBe(true);
    expect(response.data?.overallStatus).toBe("degraded");
    expect(response.data?.services[0]).toMatchObject({ id: "api-gateway", traceId: "trace-health-api" });
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:9080/api/monitoring/health?tenantId=tenant_demo");
  });

  it("loads alerts and submits ack and resolve commands", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, _init?: RequestInit) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/api/monitoring/alerts?")) {
        return jsonResponse({
          list: [
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
          total: 1,
          page: 1,
          size: 20,
        });
      }
      return jsonResponse({ accepted: true, traceId: "trace-alert-command" });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getMonitoringAlerts({
      tenantId: "tenant_demo",
      page: 1,
      pageSize: 20,
      status: "open",
      severity: "critical",
    })).resolves.toMatchObject({
      success: true,
      data: [expect.objectContaining({ id: "alert_1", traceId: "trace-alert-1" })],
    });

    await acknowledgeMonitoringAlert("alert_1", { tenantId: "tenant_demo", note: "处理中" });
    await resolveMonitoringAlert("alert_1", { tenantId: "tenant_demo", note: "已恢复" });

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "http://localhost:9080/api/monitoring/alerts?tenantId=tenant_demo&page=1&size=20&status=open&severity=critical",
      "http://localhost:9080/api/monitoring/alerts/alert_1/ack",
      "http://localhost:9080/api/monitoring/alerts/alert_1/resolve",
    ]);
    expect(JSON.parse(String((fetchMock.mock.calls[1][1] as RequestInit).body))).toEqual({
      tenantId: "tenant_demo",
      note: "处理中",
    });
    expect(JSON.parse(String((fetchMock.mock.calls[2][1] as RequestInit).body))).toEqual({
      tenantId: "tenant_demo",
      note: "已恢复",
    });
  });
});
