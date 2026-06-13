import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  completeSsoLogin,
  getCaptchaChallenge,
  getSsoProviders,
  login,
  requestPasswordReset,
  confirmPasswordReset,
  startSsoLogin,
} from "./authService";

const jsonResponse = (data: unknown) => new Response(JSON.stringify({
  code: 0,
  message: "OK",
  data,
  traceId: "trace-auth",
  timestamp: "2026-06-13T00:00:00Z",
}), { status: 200 });

describe("authService real API mode", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("posts login with captcha and remember me fields", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({
      accessToken: "access",
      refreshToken: "refresh",
      user: {
        id: "user_1",
        email: "admin@example.com",
        name: "Admin",
        status: "active",
        createdAt: "2026-06-13T00:00:00Z",
        updatedAt: "2026-06-13T00:00:00Z",
      },
      tenants: [],
      passwordChangeRequired: false,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await login("admin@example.com", "secret", {
      tenantId: "tenant_demo",
      captchaId: "captcha_1",
      captchaCode: "2468",
      rememberMe: true,
    });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:9080/api/auth/login");
    expect(JSON.parse(String(init.body))).toEqual({
      email: "admin@example.com",
      password: "secret",
      tenantId: "tenant_demo",
      captchaId: "captcha_1",
      captchaCode: "2468",
      rememberMe: true,
    });
  });

  it("loads captcha challenge from the external API", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      captchaId: "captcha_1",
      imageUrl: "data:image/png;base64,abc",
      expiresAt: "2026-06-13T00:05:00Z",
    })));

    await expect(getCaptchaChallenge()).resolves.toEqual({
      captchaId: "captcha_1",
      imageUrl: "data:image/png;base64,abc",
      expiresAt: "2026-06-13T00:05:00Z",
    });
  });

  it("requests and confirms password reset through external API", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse(undefined));
    vi.stubGlobal("fetch", fetchMock);

    await requestPasswordReset("admin@example.com");
    await confirmPasswordReset({ token: "reset-token", newPassword: "new-password" });

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "http://localhost:9080/api/auth/password-reset/request",
      "http://localhost:9080/api/auth/password-reset/confirm",
    ]);
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toEqual({
      email: "admin@example.com",
    });
    expect(JSON.parse(String((fetchMock.mock.calls[1][1] as RequestInit).body))).toEqual({
      token: "reset-token",
      newPassword: "new-password",
    });
  });

  it("loads SSO providers, starts SSO, and completes callback exchange", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      const requestUrl = String(url);
      if (requestUrl.endsWith("/api/auth/sso/providers")) {
        return jsonResponse([
          { id: "github", name: "GitHub", type: "oauth2", enabled: true },
        ]);
      }
      if (requestUrl.endsWith("/api/auth/sso/start")) {
        return jsonResponse({ redirectUrl: "https://idp.example.com/oauth", state: "state_1" });
      }
      return jsonResponse({
        accessToken: "access",
        refreshToken: "refresh",
        user: {
          id: "user_1",
          email: "admin@example.com",
          name: "Admin",
          status: "active",
          createdAt: "2026-06-13T00:00:00Z",
          updatedAt: "2026-06-13T00:00:00Z",
        },
        tenants: [],
        passwordChangeRequired: false,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSsoProviders()).resolves.toEqual([
      { id: "github", name: "GitHub", type: "oauth2", enabled: true },
    ]);
    await expect(startSsoLogin({ providerId: "github", redirectUri: "http://localhost:5173/auth/sso/callback" }))
      .resolves.toEqual({ redirectUrl: "https://idp.example.com/oauth", state: "state_1" });
    await expect(completeSsoLogin({
      providerId: "github",
      code: "code_1",
      state: "state_1",
      redirectUri: "http://localhost:5173/auth/sso/callback",
    })).resolves.toMatchObject({ accessToken: "access", refreshToken: "refresh" });
  });
});
