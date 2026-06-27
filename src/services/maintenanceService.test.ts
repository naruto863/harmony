import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearMaintenanceCache,
  getMaintenanceResources,
  syncMaintenanceReferenceData,
} from "./maintenanceService";

const jsonResponse = (data: unknown) => new Response(JSON.stringify({
  code: 0,
  message: "OK",
  data,
  traceId: "trace-maintenance",
  timestamp: "2026-06-14T00:00:00Z",
}), { status: 200 });

describe("maintenanceService external API contract", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("loads maintenance resources from the controlled maintenance endpoint", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({
      list: [
        {
          id: "cache_menu_tree",
          name: "菜单树缓存",
          type: "cache",
          status: "healthy",
          scope: "tenant",
          updatedAt: "2026-06-14T08:00:00Z",
          auditRequired: true,
          allowedOperations: ["refresh", "clear"],
        },
      ],
      total: 1,
      page: 1,
      size: 20,
    }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await getMaintenanceResources({
      tenantId: "tenant_demo",
      type: "cache",
      page: 1,
      pageSize: 20,
    });

    expect(response.success).toBe(true);
    expect(response.data?.[0]).toMatchObject({ id: "cache_menu_tree", type: "cache" });
    expect(response.meta).toMatchObject({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:9080/api/maintenance/resources?tenantId=tenant_demo&page=1&size=20&type=cache"
    );
  });

  it("submits only controlled cache clear and reference-data sync commands", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({
      accepted: true,
      traceId: "trace-maintenance-command",
      auditLogId: "audit_001",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await clearMaintenanceCache("cache_menu_tree", {
      tenantId: "tenant_demo",
      reason: "刷新菜单权限后清理",
      confirmationText: "CLEAR cache_menu_tree",
    });
    await syncMaintenanceReferenceData("ref_region_cn", {
      tenantId: "tenant_demo",
      reason: "同步外部地区字典",
      confirmationText: "SYNC ref_region_cn",
    });

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "http://localhost:9080/api/maintenance/cache/cache_menu_tree/clear",
      "http://localhost:9080/api/maintenance/reference-data/ref_region_cn/sync",
    ]);
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toEqual({
      tenantId: "tenant_demo",
      reason: "刷新菜单权限后清理",
      confirmationText: "CLEAR cache_menu_tree",
    });
  });
});
