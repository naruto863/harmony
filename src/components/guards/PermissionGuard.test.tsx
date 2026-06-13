import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
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
