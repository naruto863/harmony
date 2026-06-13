import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createUserGroup,
  deleteUserGroup,
  getUserGroupMembers,
  getUserGroups,
  updateUserGroup,
  updateUserGroupMembers,
} from "./userGroupService";

describe("userGroupService demo mode", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "true");
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns demo user groups without calling the external API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("external API should not be called"));

    const response = await getUserGroups("tenant_demo");

    expect(response.success).toBe(true);
    expect(response.data?.map((group) => group.code)).toEqual(expect.arrayContaining(["OPS", "PRODUCT"]));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("persists demo user group CRUD and member updates", async () => {
    const created = await createUserGroup({
      tenantId: "tenant_demo",
      name: "交付小组",
      code: "DELIVERY",
      description: "负责客户交付",
      status: "active",
    });

    expect(created.success).toBe(true);
    expect(created.data?.memberCount).toBe(0);

    const memberUpdate = await updateUserGroupMembers(created.data!.id, ["user_admin", "user_manager"]);
    expect(memberUpdate.success).toBe(true);

    const members = await getUserGroupMembers(created.data!.id);
    expect(members.data).toEqual(["user_admin", "user_manager"]);

    const updated = await updateUserGroup(created.data!.id, { name: "客户交付小组" });
    expect(updated.data?.name).toBe("客户交付小组");
    expect(updated.data?.memberCount).toBe(2);

    const deleted = await deleteUserGroup(created.data!.id);
    expect(deleted.success).toBe(true);

    const groups = await getUserGroups("tenant_demo");
    expect(groups.data?.some((group) => group.id === created.data!.id)).toBe(false);
  });
});
