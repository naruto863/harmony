import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./apiClient";

describe("apiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns business data from API envelope", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      code: 0,
      message: "OK",
      data: { id: "u1" },
      traceId: "trace-1",
      timestamp: "2026-05-28T00:00:00Z",
    }), { status: 200 })));

    await expect(apiClient.get<{ id: string }>("/api/users/me")).resolves.toEqual({ id: "u1" });
  });

  it("sanitizes server errors and keeps trace id", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      code: 500,
      message: "database password leaked",
      traceId: "trace-500",
      timestamp: "2026-05-28T00:00:00Z",
    }), { status: 500 })));

    await expect(apiClient.get("/api/users")).rejects.toMatchObject({
      message: "系统异常，请稍后重试（TraceId: trace-500）",
      traceId: "trace-500",
      status: 500,
    });
  });
});
