import { render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { MaintenancePage } from "./MaintenancePage";

vi.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({
    currentTenant: {
      id: "tenant_demo",
      name: "Demo 公司",
      plan: "enterprise",
      createdAt: "2026-06-14T00:00:00Z",
      updatedAt: "2026-06-14T00:00:00Z",
    },
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/components/guards", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/services/maintenanceService", () => ({
  getMaintenanceResources: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: "cache_menu_tree",
        name: "菜单树缓存",
        type: "cache",
        status: "healthy",
        scope: "tenant",
        updatedAt: "2026-06-14T08:00:00Z",
        auditRequired: true,
        allowedOperations: ["refresh", "clear"],
      },
      {
        id: "ref_region_cn",
        name: "地区基础数据",
        type: "reference-data",
        status: "stale",
        scope: "global",
        updatedAt: "2026-06-13T08:00:00Z",
        auditRequired: true,
        allowedOperations: ["sync"],
      },
    ],
    meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
  }),
  clearMaintenanceCache: vi.fn(),
  syncMaintenanceReferenceData: vi.fn(),
}));

vi.mock("@/services/saasService", () => ({
  getSaasPlans: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: "enterprise",
        name: "企业版",
        tier: "enterprise",
        priceLabel: "联系销售",
        auditRetentionDays: 365,
        quotas: [],
        moduleCodes: ["workflows", "monitoring"],
      },
    ],
  }),
  getSaasQuotaUsage: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { key: "members", label: "成员数", used: 8, limit: 50, unit: "人", enforcedBy: "external-api" },
    ],
  }),
  updateSaasModuleToggle: vi.fn(),
}));

describe("MaintenancePage", () => {
  it("renders controlled maintenance and SaaS boundary", async () => {
    render(<MaintenancePage />);

    expect(screen.getByRole("heading", { name: "数据维护" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("菜单树缓存")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("地区基础数据")).toBeInTheDocument());
    expect(screen.getByText("套餐与配额")).toBeInTheDocument();
    expect(screen.getByText("企业版")).toBeInTheDocument();
    expect(screen.getByText("审计留存 365 天")).toBeInTheDocument();
    expect(screen.getByText("危险操作需要二次确认、高权限和 external API 审计")).toBeInTheDocument();
    expect(screen.getByText("maintenance.cache.clear")).toBeInTheDocument();
    expect(screen.getByText("saas.plans.read")).toBeInTheDocument();
  });
});
