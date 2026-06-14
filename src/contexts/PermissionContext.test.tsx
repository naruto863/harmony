import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Role, Tenant } from "@/types";
import { PermissionProvider, usePermission } from "./PermissionContext";

const mocks = vi.hoisted(() => ({
  authState: {
    isAuthenticated: false,
  },
  tenantState: {
    currentTenant: null as Tenant | null,
  },
  getMyRole: vi.fn(),
  getMyPermissions: vi.fn(),
}));

vi.mock("./AuthContext", () => ({
  useAuth: () => mocks.authState,
}));

vi.mock("./TenantContext", () => ({
  useTenant: () => mocks.tenantState,
}));

vi.mock("@/services/roleService", () => ({
  getMyRole: mocks.getMyRole,
}));

vi.mock("@/services/permissionService", () => ({
  getMyPermissions: mocks.getMyPermissions,
}));

const tenant = {
  id: "tenant_demo",
  name: "Demo",
  plan: "pro" as const,
  createdAt: "2026-05-28T00:00:00Z",
  updatedAt: "2026-05-28T00:00:00Z",
};

const buildRole = (overrides: Partial<Role>): Role => ({
  id: "role_1",
  name: "Role",
  type: "manager",
  description: "Role",
  permissions: [],
  createdAt: "2026-05-28T00:00:00Z",
  updatedAt: "2026-05-28T00:00:00Z",
  ...overrides,
});

const Probe = () => {
  const permission = usePermission();
  return (
    <>
      <span data-testid="role">{permission.role?.type ?? "none"}</span>
      <span data-testid="users-read">{permission.hasPermission("users.read") ? "yes" : "no"}</span>
      <span data-testid="roles-update">{permission.hasPermission("roles.update") ? "yes" : "no"}</span>
      <span data-testid="super-admin">{permission.isSuperAdmin ? "yes" : "no"}</span>
      <span data-testid="tenant-admin">{permission.isTenantAdmin ? "yes" : "no"}</span>
    </>
  );
};

describe("PermissionContext", () => {
  beforeEach(() => {
    mocks.authState.isAuthenticated = false;
    mocks.tenantState.currentTenant = null;
    mocks.getMyRole.mockReset();
    mocks.getMyPermissions.mockReset();
  });

  it("exposes an empty permission state without authentication or tenant", async () => {
    render(
      <PermissionProvider>
        <Probe />
      </PermissionProvider>
    );

    await waitFor(() => expect(screen.getByTestId("role")).toHaveTextContent("none"));
    expect(screen.getByTestId("users-read")).toHaveTextContent("no");
    expect(mocks.getMyRole).not.toHaveBeenCalled();
    expect(mocks.getMyPermissions).not.toHaveBeenCalled();
  });

  it("loads role and permissions for the current tenant", async () => {
    mocks.authState.isAuthenticated = true;
    mocks.tenantState.currentTenant = tenant;
    mocks.getMyRole.mockResolvedValue({
      success: true,
      data: buildRole({ type: "manager", permissions: ["users.read"] }),
    });
    mocks.getMyPermissions.mockResolvedValue(["users.read"]);

    render(
      <PermissionProvider>
        <Probe />
      </PermissionProvider>
    );

    await waitFor(() => expect(screen.getByTestId("role")).toHaveTextContent("manager"));
    expect(screen.getByTestId("users-read")).toHaveTextContent("yes");
    expect(screen.getByTestId("roles-update")).toHaveTextContent("no");
  });

  it("treats super admin as having every frontend permission", async () => {
    mocks.authState.isAuthenticated = true;
    mocks.tenantState.currentTenant = tenant;
    mocks.getMyRole.mockResolvedValue({
      success: true,
      data: buildRole({ type: "super_admin", permissions: [] }),
    });
    mocks.getMyPermissions.mockResolvedValue([]);

    render(
      <PermissionProvider>
        <Probe />
      </PermissionProvider>
    );

    await waitFor(() => expect(screen.getByTestId("super-admin")).toHaveTextContent("yes"));
    expect(screen.getByTestId("users-read")).toHaveTextContent("yes");
    expect(screen.getByTestId("roles-update")).toHaveTextContent("yes");
  });
});
