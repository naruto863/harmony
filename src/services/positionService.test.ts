import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPosition, deletePosition, getPositions, updatePosition } from "./positionService";

describe("positionService demo mode", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "true");
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns demo positions without calling the external API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("external API should not be called"));

    const response = await getPositions("tenant_demo");

    expect(response.success).toBe(true);
    expect(response.data?.map((position) => position.code)).toEqual(expect.arrayContaining(["CEO", "PM"]));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("persists create, update and delete operations in demo storage", async () => {
    const created = await createPosition({
      tenantId: "tenant_demo",
      name: "体验设计师",
      code: "UXD",
      deptId: "dept_product",
      description: "负责产品体验",
      sortOrder: 30,
      status: "active",
    });

    expect(created.success).toBe(true);
    expect(created.data?.deptName).toBe("产品部");

    const updated = await updatePosition(created.data!.id, {
      name: "高级体验设计师",
      status: "inactive",
    });
    expect(updated.data?.name).toBe("高级体验设计师");
    expect(updated.data?.status).toBe("inactive");

    const deleted = await deletePosition(created.data!.id);
    expect(deleted.success).toBe(true);

    const positions = await getPositions("tenant_demo");
    expect(positions.data?.some((position) => position.id === created.data!.id)).toBe(false);
  });
});
