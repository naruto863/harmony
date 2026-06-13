import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getUsers } from "./userService";

describe("userService demo mode", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns demo tenant users without calling the external API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("external API should not be called"));

    const response = await getUsers({ tenantId: "tenant_demo", pageSize: 200 });

    expect(response.success).toBe(true);
    expect(response.data?.map((user) => user.id)).toEqual(
      expect.arrayContaining(["user_admin", "user_manager", "user_viewer"])
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
