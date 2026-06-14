import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionGuard } from "./PermissionGuard";

const permissionState = {
  hasPermission: vi.fn(),
  hasAnyPermission: vi.fn(),
  hasAllPermissions: vi.fn(),
};

vi.mock("@/contexts/PermissionContext", () => ({
  usePermission: () => permissionState,
}));

describe("PermissionGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when the permission is present", () => {
    permissionState.hasPermission.mockReturnValue(true);

    render(
      <MemoryRouter>
        <PermissionGuard permission="users.read">
          <span>allowed</span>
        </PermissionGuard>
      </MemoryRouter>
    );

    expect(screen.getByText("allowed")).toBeInTheDocument();
  });

  it("renders children when any requested permission is present", () => {
    permissionState.hasAnyPermission.mockReturnValue(true);

    render(
      <MemoryRouter>
        <PermissionGuard permissions={["users.read", "roles.read"]}>
          <span>any allowed</span>
        </PermissionGuard>
      </MemoryRouter>
    );

    expect(permissionState.hasAnyPermission).toHaveBeenCalledWith(["users.read", "roles.read"]);
    expect(screen.getByText("any allowed")).toBeInTheDocument();
  });

  it("requires all permissions when requireAll is enabled", () => {
    permissionState.hasAllPermissions.mockReturnValue(false);

    render(
      <MemoryRouter>
        <PermissionGuard
          permissions={["roles.update", "settings.update"]}
          requireAll
          fallback={<span>missing all</span>}
        >
          <span>all allowed</span>
        </PermissionGuard>
      </MemoryRouter>
    );

    expect(permissionState.hasAllPermissions).toHaveBeenCalledWith(["roles.update", "settings.update"]);
    expect(screen.getByText("missing all")).toBeInTheDocument();
  });

  it("redirects when the permission is missing", () => {
    permissionState.hasPermission.mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route
            path="/private"
            element={(
              <PermissionGuard permission="users.read" redirectTo="/403">
                <span>private</span>
              </PermissionGuard>
            )}
          />
          <Route path="/403" element={<span>forbidden</span>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("forbidden")).toBeInTheDocument();
  });
});
