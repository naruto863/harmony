import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSaasPlans, getSaasQuotaUsage, updateSaasModuleToggle } from "./saasService";

const jsonResponse = (data: unknown) => new Response(JSON.stringify({
  code: 0,
  message: "OK",
  data,
  traceId: "trace-saas",
  timestamp: "2026-06-14T00:00:00Z",
}), { status: 200 });

describe("saasService external API contract", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("loads plans and quota usage from external SaaS endpoints", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/api/saas/plans")) {
        return jsonResponse([
          {
            id: "enterprise",
            name: "企业版",
            tier: "enterprise",
            priceLabel: "联系销售",
            auditRetentionDays: 365,
            quotas: [],
            moduleCodes: ["workflows", "monitoring"],
          },
        ]);
      }
      return jsonResponse([
        {
          key: "members",
          label: "成员数",
          used: 8,
          limit: 50,
          unit: "人",
          enforcedBy: "external-api",
        },
      ]);
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSaasPlans({ tenantId: "tenant_demo" })).resolves.toMatchObject({
      success: true,
      data: [expect.objectContaining({ id: "enterprise", auditRetentionDays: 365 })],
    });
    await expect(getSaasQuotaUsage({ tenantId: "tenant_demo" })).resolves.toMatchObject({
      success: true,
      data: [expect.objectContaining({ key: "members", enforcedBy: "external-api" })],
    });

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "http://localhost:9080/api/saas/plans?tenantId=tenant_demo",
      "http://localhost:9080/api/saas/quotas?tenantId=tenant_demo",
    ]);
  });

  it("updates module toggles through the external SaaS command endpoint", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({
      accepted: true,
      traceId: "trace-saas-toggle",
      auditLogId: "audit_saas_001",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await updateSaasModuleToggle("workflows", {
      tenantId: "tenant_demo",
      enabled: false,
      reason: "套餐到期关闭",
      confirmationText: "DISABLE workflows",
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:9080/api/saas/modules/workflows/toggle"
    );
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toEqual({
      tenantId: "tenant_demo",
      enabled: false,
      reason: "套餐到期关闭",
      confirmationText: "DISABLE workflows",
    });
  });
});
