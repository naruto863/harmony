import { describe, expect, it } from "vitest";
import {
  DEPT_TREE,
  MENU_ITEMS,
  PERMISSION_GROUPS,
  PERMISSIONS,
  ROLES,
  USERS,
  USER_TENANT_ROLES,
} from "./mock-data";
import type { MenuItem } from "@/types";

const flattenMenuItems = (items: MenuItem[]): MenuItem[] =>
  items.flatMap((item) => [item, ...(item.children ? flattenMenuItems(item.children) : [])]);

const flattenDeptIds = (items: typeof DEPT_TREE): string[] =>
  items.flatMap((item) => [item.id, ...(item.children ? flattenDeptIds(item.children) : [])]);

const getDemoPermissions = (email: string, tenantId: string): string[] => {
  const user = USERS.find((item) => item.email === email);
  const relation = USER_TENANT_ROLES.find((item) => item.userId === user?.id && item.tenantId === tenantId);
  const role = ROLES.find((item) => item.id === relation?.roleId);
  return role?.permissions ?? [];
};

describe("mock-data v0.5 system management coverage", () => {
  it("exposes position and user group permissions in grouped permission data", () => {
    const permissionIds = PERMISSIONS.map((permission) => permission.id);

    expect(permissionIds).toEqual(
      expect.arrayContaining([
        "positions.create",
        "positions.read",
        "positions.update",
        "positions.delete",
        "user-groups.create",
        "user-groups.read",
        "user-groups.update",
        "user-groups.delete",
      ])
    );
    expect(PERMISSION_GROUPS.find((group) => group.resource === "positions")?.permissions).toHaveLength(4);
    expect(PERMISSION_GROUPS.find((group) => group.resource === "user-groups")?.permissions).toHaveLength(4);
  });

  it("includes demo menu entries for positions and user groups", () => {
    const menuItems = flattenMenuItems(MENU_ITEMS);

    expect(menuItems.find((item) => item.path === "/positions")?.permission).toBe("positions.read");
    expect(menuItems.find((item) => item.path === "/user-groups")?.permission).toBe("user-groups.read");
  });
});

describe("mock-data v1.0 baseline coverage", () => {
  it("keeps default v1.0 demo menu routes discoverable", () => {
    const menuItems = flattenMenuItems(MENU_ITEMS);
    const menuPaths = menuItems.map((item) => item.path).filter(Boolean);

    expect(menuPaths).toEqual(
      expect.arrayContaining([
        "/",
        "/users",
        "/roles",
        "/menus",
        "/dicts",
        "/configs",
        "/depts",
        "/positions",
        "/user-groups",
        "/audit-logs",
        "/login-logs",
        "/files",
        "/messages",
        "/settings/tenant",
      ])
    );
  });

  it("uses declared permission ids on permission-protected demo menu entries", () => {
    const permissionIds = new Set(PERMISSIONS.map((permission) => permission.id));
    const menuItems = flattenMenuItems(MENU_ITEMS);

    const missingPermissions = menuItems
      .filter((item) => item.permission && !permissionIds.has(item.permission))
      .map((item) => ({ path: item.path, permission: item.permission }));

    expect(missingPermissions).toEqual([]);
  });

  it("keeps role permissions and custom data scopes backed by declared demo data", () => {
    const permissionIds = new Set(PERMISSIONS.map((permission) => permission.id));
    const deptIds = new Set(flattenDeptIds(DEPT_TREE));

    const missingRolePermissions = ROLES.flatMap((role) =>
      role.permissions
        .filter((permission) => !permissionIds.has(permission))
        .map((permission) => ({ roleId: role.id, permission }))
    );
    const invalidCustomScopeDeptIds = ROLES.flatMap((role) =>
      (role.dataScopeType === "CUSTOM" ? role.dataScopeDeptIds ?? [] : [])
        .filter((deptId) => !deptIds.has(deptId))
        .map((deptId) => ({ roleId: role.id, deptId }))
    );
    const customRolesWithoutDeptIds = ROLES
      .filter((role) => role.dataScopeType === "CUSTOM" && (role.dataScopeDeptIds ?? []).length === 0)
      .map((role) => role.id);

    expect(missingRolePermissions).toEqual([]);
    expect(invalidCustomScopeDeptIds).toEqual([]);
    expect(customRolesWithoutDeptIds).toEqual([]);
  });

  it("keeps admin, manager, and viewer demo account permissions distinct", () => {
    const adminPermissions = getDemoPermissions("admin@example.com", "tenant_demo");
    const managerPermissions = getDemoPermissions("manager@example.com", "tenant_demo");
    const viewerPermissions = getDemoPermissions("viewer@example.com", "tenant_demo");

    expect(adminPermissions).toEqual(
      expect.arrayContaining(["users.create", "roles.update", "settings.update", "tenant.manage"])
    );
    expect(managerPermissions).toEqual(
      expect.arrayContaining(["projects.create", "files.delete", "users.read", "positions.read"])
    );
    expect(viewerPermissions).toEqual(
      expect.arrayContaining(["projects.read", "files.read", "users.read"])
    );
    expect(managerPermissions).not.toContain("roles.update");
    expect(managerPermissions).not.toContain("tenant.manage");
    expect(viewerPermissions).not.toContain("projects.create");
    expect(viewerPermissions).not.toContain("files.delete");
  });
});
