import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Tenant } from "@/types";
import { MenuProvider, useMenu } from "./MenuContext";

const mocks = vi.hoisted(() => ({
  authState: {
    isAuthenticated: false,
  },
  tenantState: {
    currentTenant: null as Tenant | null,
  },
  getMenuTree: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mocks.authState,
}));

vi.mock("@/contexts/TenantContext", () => ({
  useTenant: () => mocks.tenantState,
}));

vi.mock("@/services/menuService", () => ({
  getMenuTree: mocks.getMenuTree,
}));

const tenant = {
  id: "tenant_demo",
  name: "Demo",
  plan: "pro" as const,
  createdAt: "2026-05-28T00:00:00Z",
  updatedAt: "2026-05-28T00:00:00Z",
};

const Probe = () => {
  const menu = useMenu();
  return (
    <>
      <span data-testid="status">{menu.loadStatus}</span>
      <span data-testid="loading">{menu.isLoading ? "loading" : "ready"}</span>
      <span data-testid="count">{menu.menuItems.length}</span>
      <span data-testid="error">{menu.errorMessage ?? "none"}</span>
    </>
  );
};

describe("MenuContext", () => {
  beforeEach(() => {
    mocks.authState.isAuthenticated = false;
    mocks.tenantState.currentTenant = null;
    mocks.getMenuTree.mockReset();
  });

  it("stays idle without authentication or tenant", async () => {
    render(
      <MenuProvider>
        <Probe />
      </MenuProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));
    expect(screen.getByTestId("status")).toHaveTextContent("idle");
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(mocks.getMenuTree).not.toHaveBeenCalled();
  });

  it("loads menu items for an authenticated tenant", async () => {
    mocks.authState.isAuthenticated = true;
    mocks.tenantState.currentTenant = tenant;
    mocks.getMenuTree.mockResolvedValue({
      success: true,
      data: [{ id: "users", label: "用户管理", icon: "Users", path: "/users", permission: "users.read" }],
    });

    render(
      <MenuProvider>
        <Probe />
      </MenuProvider>
    );

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("ready"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(mocks.getMenuTree).toHaveBeenCalledWith("tenant_demo");
  });

  it("exposes error state when menu loading fails", async () => {
    mocks.authState.isAuthenticated = true;
    mocks.tenantState.currentTenant = tenant;
    mocks.getMenuTree.mockResolvedValue({
      success: false,
      error: { message: "菜单服务不可用" },
    });

    render(
      <MenuProvider>
        <Probe />
      </MenuProvider>
    );

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("error"));
    expect(screen.getByTestId("error")).toHaveTextContent("菜单服务不可用");
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
});
