import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiClient } from "./apiClient";
import { AUTH_EVENTS } from "@/lib/authEvents";
import { getAccessToken, getRefreshToken, setTokens } from "./tokenStorage";

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

  it("keeps field errors from 422 validation responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      code: 422,
      message: "字段校验失败",
      data: {
        fieldErrors: {
          email: ["邮箱格式不正确"],
          password: ["密码长度不能少于 8 位"],
        },
      },
      traceId: "trace-422",
      timestamp: "2026-06-13T00:00:00Z",
    }), { status: 422 })));

    await expect(apiClient.post("/api/users", {})).rejects.toMatchObject({
      message: "字段校验失败",
      status: 422,
      traceId: "trace-422",
      fieldErrors: {
        email: ["邮箱格式不正确"],
        password: ["密码长度不能少于 8 位"],
      },
    });
  });

  it("refreshes token once and retries the original request after 401", async () => {
    setTokens("old-access", "old-refresh");
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      const requestUrl = String(url);
      if (requestUrl.endsWith("/api/users/me") && fetchMock.mock.calls.length === 1) {
        return new Response(JSON.stringify({
          code: 401,
          message: "Unauthorized",
          traceId: "trace-401",
        }), { status: 401 });
      }
      if (requestUrl.endsWith("/api/auth/refresh")) {
        return new Response(JSON.stringify({
          code: 0,
          message: "OK",
          data: { accessToken: "new-access", refreshToken: "new-refresh" },
        }), { status: 200 });
      }
      return new Response(JSON.stringify({
        code: 0,
        message: "OK",
        data: { id: "u1" },
      }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.get<{ id: string }>("/api/users/me")).resolves.toEqual({ id: "u1" });
    expect(getAccessToken()).toBe("new-access");
    expect(getRefreshToken()).toBe("new-refresh");
  });

  it("clears tokens and emits logout when 401 refresh fails", async () => {
    setTokens("old-access", "old-refresh");
    const logoutEvents: Array<{ reason: string; message?: string }> = [];
    const listener = (event: Event) => {
      logoutEvents.push((event as CustomEvent<{ reason: string; message?: string }>).detail);
    };
    window.addEventListener(AUTH_EVENTS.logout, listener);
    vi.stubGlobal("fetch", vi.fn(async (url: RequestInfo | URL) => {
      const requestUrl = String(url);
      if (requestUrl.endsWith("/api/auth/refresh")) {
        return new Response(JSON.stringify({
          code: 401,
          message: "Refresh token expired",
          traceId: "trace-refresh",
        }), { status: 401 });
      }
      return new Response(JSON.stringify({
        code: 401,
        message: "Unauthorized",
        traceId: "trace-401",
      }), { status: 401 });
    }));

    try {
      await expect(apiClient.get("/api/users/me")).rejects.toMatchObject({ status: 401 });
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(logoutEvents).toEqual([{ reason: "unauthorized", message: "Unauthorized" }]);
    } finally {
      window.removeEventListener(AUTH_EVENTS.logout, listener);
    }
  });

  it("emits access denied for business 403 responses but not permission refresh paths", async () => {
    const accessDeniedEvents: Array<{ message?: string; path?: string }> = [];
    const listener = (event: Event) => {
      accessDeniedEvents.push((event as CustomEvent<{ message?: string; path?: string }>).detail);
    };
    window.addEventListener(AUTH_EVENTS.accessDenied, listener);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      code: 403,
      message: "Forbidden",
      traceId: "trace-403",
    }), { status: 403 })));

    try {
      await expect(apiClient.get("/api/users")).rejects.toMatchObject({ status: 403 });
      await expect(apiClient.get("/api/permissions")).rejects.toMatchObject({ status: 403 });
      expect(accessDeniedEvents).toEqual([{ message: "Forbidden", path: "/api/users" }]);
    } finally {
      window.removeEventListener(AUTH_EVENTS.accessDenied, listener);
    }
  });
});
