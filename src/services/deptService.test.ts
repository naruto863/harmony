import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDeptTree } from "./deptService";

describe("deptService demo mode", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns a read-only demo department tree without calling the external API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("external API should not be called"));

    const response = await getDeptTree();

    expect(response.success).toBe(true);
    expect(response.data?.[0]?.children?.map((dept) => dept.id)).toEqual(
      expect.arrayContaining(["dept_product", "dept_operations"])
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
