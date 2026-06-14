import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAccessToken, getRefreshToken } from "@/services/tokenStorage";
import { TenantProvider, useTenant } from "./TenantContext";

const mocks = vi.hoisted(() => ({
  authState: {
    user: null as { id: string } | null,
    isAuthenticated: false,
  },
  getMyTenants: vi.fn(),
  switchTenant: vi.fn(),
}));

vi.mock("./AuthContext", () => ({
  useAuth: () => mocks.authState,
}));

vi.mock("@/services/tenantService", () => ({
  getMyTenants: mocks.getMyTenants,
  switchTenant: mocks.switchTenant,
}));

const tenantA = {
  id: "tenant_a",
  name: "Tenant A",
  plan: "pro" as const,
  createdAt: "2026-05-28T00:00:00Z",
  updatedAt: "2026-05-28T00:00:00Z",
};

const tenantB = {
  id: "tenant_b",
  name: "Tenant B",
  plan: "free" as const,
  createdAt: "2026-05-29T00:00:00Z",
  updatedAt: "2026-05-29T00:00:00Z",
};

const Probe = () => {
  const tenant = useTenant();
  return (
    <>
      <span data-testid="current">{tenant.currentTenant?.id ?? "none"}</span>
      <span data-testid="count">{tenant.userTenants.length}</span>
      <span data-testid="loading">{tenant.isLoading ? "loading" : "ready"}</span>
      <button type="button" onClick={() => tenant.switchTenant("tenant_b")}>
        switch
      </button>
    </>
  );
};

describe("TenantContext", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.authState.user = null;
    mocks.authState.isAuthenticated = false;
    mocks.getMyTenants.mockReset();
    mocks.switchTenant.mockReset();
  });

  it("exposes an empty state when the user is not authenticated", async () => {
    render(
      <TenantProvider>
        <Probe />
      </TenantProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));
    expect(screen.getByTestId("current")).toHaveTextContent("none");
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(mocks.getMyTenants).not.toHaveBeenCalled();
  });

  it("auto-selects the only available tenant and persists it", async () => {
    mocks.authState.user = { id: "user_1" };
    mocks.authState.isAuthenticated = true;
    mocks.getMyTenants.mockResolvedValue([tenantA]);

    render(
      <TenantProvider>
        <Probe />
      </TenantProvider>
    );

    await waitFor(() => expect(screen.getByTestId("current")).toHaveTextContent("tenant_a"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(localStorage.getItem("admin_studio_tenant")).toBe("tenant_a");
  });

  it("switches tenant and stores returned tokens when the API provides them", async () => {
    mocks.authState.user = { id: "user_1" };
    mocks.authState.isAuthenticated = true;
    mocks.getMyTenants.mockResolvedValue([tenantA, tenantB]);
    mocks.switchTenant.mockResolvedValue({
      accessToken: "access-b",
      refreshToken: "refresh-b",
      tenant: tenantB,
    });

    render(
      <TenantProvider>
        <Probe />
      </TenantProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));
    await userEvent.click(screen.getByRole("button", { name: "switch" }));

    await waitFor(() => expect(screen.getByTestId("current")).toHaveTextContent("tenant_b"));
    expect(getAccessToken()).toBe("access-b");
    expect(getRefreshToken()).toBe("refresh-b");
    expect(localStorage.getItem("admin_studio_tenant")).toBe("tenant_b");
  });
});
