import type React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Login } from "./Login";
import { SelectTenant } from "./SelectTenant";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn(),
    isAuthenticated: false,
  }),
}));

vi.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({
    currentTenant: null,
    userTenants: [
      {
        id: "tenant_demo",
        name: "Demo 公司",
        plan: "pro",
        createdAt: "2026-05-28T00:00:00Z",
        updatedAt: "2026-05-28T00:00:00Z",
      },
    ],
    switchTenant: vi.fn(),
  }),
}));

vi.mock("@/lib/demoMode", () => ({
  isDemoModeEnabled: () => true,
}));

vi.mock("@/services/authService", () => ({
  getCaptchaChallenge: vi.fn(),
  getSsoProviders: vi.fn(),
  startSsoLogin: vi.fn(),
}));

const renderAuthPage = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("auth page smoke tests", () => {
  it("renders login with all demo accounts", () => {
    renderAuthPage(<Login />);

    expect(screen.getByRole("heading", { name: "登录 Admin Studio" })).toBeInTheDocument();
    expect(screen.getByText(/admin@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/manager@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/viewer@example.com/)).toBeInTheDocument();
  });

  it("renders tenant selection choices", () => {
    renderAuthPage(<SelectTenant />);

    expect(screen.getByRole("heading", { name: "选择工作空间" })).toBeInTheDocument();
    expect(screen.getByText("Demo 公司")).toBeInTheDocument();
  });
});
