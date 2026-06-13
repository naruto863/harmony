import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addTenantMember,
  getTenantMembers,
  getTenants,
  removeTenantMember,
  updateTenantMember,
} from "./tenantService";

const jsonResponse = (data: unknown) => new Response(JSON.stringify({
  code: 0,
  message: "OK",
  data,
  traceId: "trace-tenant",
  timestamp: "2026-06-13T00:00:00Z",
}), { status: 200 });

describe("tenantService governance API", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("loads tenant list from the governance endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse([
      {
        id: "tenant_demo",
        code: "DEMO",
        name: "Demo 公司",
        plan: "pro",
        status: "active",
        createdAt: "2026-06-13T00:00:00Z",
        updatedAt: "2026-06-13T00:00:00Z",
      },
    ])));

    await expect(getTenants()).resolves.toHaveLength(1);
  });

  it("loads tenant members and updates member role and admin flag", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, _init?: RequestInit) => {
      const requestUrl = String(url);
      if (requestUrl.endsWith("/api/tenants/tenant_demo/members") && fetchMock.mock.calls.length === 1) {
        return jsonResponse([
          {
            userId: "user_1",
            userName: "Admin",
            email: "admin@example.com",
            status: "active",
            roleId: "role_admin",
            roleName: "管理员",
            isAdmin: true,
            joinedAt: "2026-06-13T00:00:00Z",
          },
        ]);
      }
      return jsonResponse({
        userId: "user_1",
        userName: "Admin",
        email: "admin@example.com",
        status: "active",
        roleId: "role_viewer",
        roleName: "查看者",
        isAdmin: false,
        joinedAt: "2026-06-13T00:00:00Z",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getTenantMembers("tenant_demo")).resolves.toHaveLength(1);
    await expect(updateTenantMember("tenant_demo", "user_1", {
      roleId: "role_viewer",
      isAdmin: false,
    })).resolves.toMatchObject({ roleId: "role_viewer", isAdmin: false });

    const updateInit = fetchMock.mock.calls[1][1] as RequestInit;
    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:9080/api/tenants/tenant_demo/members/user_1");
    expect(JSON.parse(String(updateInit.body))).toEqual({ roleId: "role_viewer", isAdmin: false });
  });

  it("adds and removes tenant members", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({
      userId: "user_2",
      userName: "New User",
      email: "new@example.com",
      status: "pending",
      roleId: "role_viewer",
      roleName: "查看者",
      isAdmin: false,
      joinedAt: "2026-06-13T00:00:00Z",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await addTenantMember("tenant_demo", { email: "new@example.com", roleId: "role_viewer" });
    await removeTenantMember("tenant_demo", "user_2");

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "http://localhost:9080/api/tenants/tenant_demo/members",
      "http://localhost:9080/api/tenants/tenant_demo/members/user_2",
    ]);
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toEqual({
      email: "new@example.com",
      roleId: "role_viewer",
    });
  });
});
