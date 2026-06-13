import { describe, expect, it } from "vitest";
import { MENU_ITEMS, PERMISSION_GROUPS, PERMISSIONS } from "./mock-data";
import type { MenuItem } from "@/types";

const flattenMenuItems = (items: MenuItem[]): MenuItem[] =>
  items.flatMap((item) => [item, ...(item.children ? flattenMenuItems(item.children) : [])]);

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
