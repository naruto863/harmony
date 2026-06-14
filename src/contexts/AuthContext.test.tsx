import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import * as authService from "@/services/authService";
import { getAccessToken, getRefreshToken, setTokens } from "@/services/tokenStorage";

vi.mock("@/services/authService", () => ({
  completeSsoLogin: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

const user = {
  id: "user-1",
  email: "admin@example.com",
  name: "Admin",
  status: "active" as const,
  createdAt: "2026-05-28T00:00:00Z",
  updatedAt: "2026-05-28T00:00:00Z",
};

const Probe = () => {
  const auth = useAuth();
  return (
    <button onClick={() => auth.login("admin@example.com", "password")}>
      {auth.isAuthenticated ? "authenticated" : "anonymous"}
    </button>
  );
};

const LogoutProbe = () => {
  const auth = useAuth();
  return (
    <button type="button" onClick={auth.logout}>
      {auth.isAuthenticated ? "logout" : "anonymous"}
    </button>
  );
};

const LoginResultProbe = () => {
  const auth = useAuth();
  const [message, setMessage] = React.useState("idle");
  return (
    <>
      <button
        type="button"
        onClick={() => {
          auth.login("admin@example.com", "bad-password").then((result) => {
            setMessage(result.success ? "success" : result.error ?? "failed");
          });
        }}
      >
        login
      </button>
      <span>{message}</span>
    </>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(authService.login).mockReset();
    vi.mocked(authService.logout).mockReset();
    vi.mocked(authService.logout).mockResolvedValue(undefined);
  });

  it("stores tokens and exposes authenticated state after login", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      passwordChangeRequired: false,
      tenants: [],
      user,
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await userEvent.click(await screen.findByRole("button", { name: "anonymous" }));

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("authenticated"));
    expect(getAccessToken()).toBe("access-token");
    expect(getRefreshToken()).toBe("refresh-token");
  });

  it("restores authenticated state from a valid stored session", async () => {
    setTokens("stored-access", "stored-refresh");
    localStorage.setItem("admin_studio_user", JSON.stringify(user));
    localStorage.setItem("admin_studio_session", JSON.stringify({
      user,
      accessToken: "stored-access",
      expiresAt: "2026-05-28T00:30:00Z",
    }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("authenticated"));
  });

  it("clears malformed stored session and tokens during initialization", async () => {
    setTokens("stale-access", "stale-refresh");
    localStorage.setItem("admin_studio_user", JSON.stringify(user));
    localStorage.setItem("admin_studio_session", "{bad-json");

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("anonymous"));
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(localStorage.getItem("admin_studio_session")).toBeNull();
    expect(localStorage.getItem("admin_studio_user")).toBeNull();
  });

  it("returns a readable login error without storing tokens", async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error("账号或密码错误"));

    render(
      <AuthProvider>
        <LoginResultProbe />
      </AuthProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "login" }));

    expect(await screen.findByText("账号或密码错误")).toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("clears tokens, session, and tenant selection on logout", async () => {
    setTokens("stored-access", "stored-refresh");
    localStorage.setItem("admin_studio_tenant", "tenant_demo");
    localStorage.setItem("admin_studio_user", JSON.stringify(user));
    localStorage.setItem("admin_studio_session", JSON.stringify({
      user,
      accessToken: "stored-access",
      expiresAt: "2026-05-28T00:30:00Z",
    }));

    render(
      <AuthProvider>
        <LogoutProbe />
      </AuthProvider>
    );

    await userEvent.click(await screen.findByRole("button", { name: "logout" }));

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("anonymous"));
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(localStorage.getItem("admin_studio_session")).toBeNull();
    expect(localStorage.getItem("admin_studio_user")).toBeNull();
    expect(localStorage.getItem("admin_studio_tenant")).toBeNull();
    expect(authService.logout).toHaveBeenCalledWith("stored-refresh");
  });
});
