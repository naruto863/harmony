import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import * as authService from "@/services/authService";
import { getAccessToken, getRefreshToken } from "@/services/tokenStorage";

vi.mock("@/services/authService", () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

const Probe = () => {
  const auth = useAuth();
  return (
    <button onClick={() => auth.login("admin@example.com", "password")}>
      {auth.isAuthenticated ? "authenticated" : "anonymous"}
    </button>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(authService.login).mockReset();
  });

  it("stores tokens and exposes authenticated state after login", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      passwordChangeRequired: false,
      tenants: [],
      user: {
        id: "user-1",
        email: "admin@example.com",
        name: "Admin",
        status: "active",
        createdAt: "2026-05-28T00:00:00Z",
        updatedAt: "2026-05-28T00:00:00Z",
      },
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
});
