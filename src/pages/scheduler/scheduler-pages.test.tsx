import { render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { SchedulerExecutionsPage } from "./SchedulerExecutionsPage";
import { SchedulerJobsPage } from "./SchedulerJobsPage";

vi.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({
    currentTenant: {
      id: "tenant_demo",
      name: "Demo 公司",
      plan: "pro",
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

vi.mock("@/services/schedulerService", () => ({
  getSchedulerJobs: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: "job_billing_sync",
        name: "账单同步",
        status: "enabled",
        triggerType: "cron",
        triggerExpression: "0 */15 * * * ?",
        ownerName: "运营团队",
        lastResult: "success",
        lastRunAt: "2026-06-14T08:00:00Z",
        nextRunAt: "2026-06-14T08:15:00Z",
        alertEnabled: true,
      },
    ],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  }),
  getSchedulerExecutions: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: "exec_1",
        jobId: "job_billing_sync",
        jobName: "账单同步",
        status: "failed",
        startedAt: "2026-06-14T08:00:00Z",
        finishedAt: "2026-06-14T08:01:00Z",
        durationMs: 60000,
        traceId: "trace-exec-1",
        errorSummary: "外部 API 超时",
        retryable: true,
      },
    ],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  }),
  runSchedulerJobOnce: vi.fn(),
  retrySchedulerExecution: vi.fn(),
}));

describe("scheduler pages", () => {
  it("renders scheduler jobs with external execution boundary", async () => {
    render(<SchedulerJobsPage />);

    expect(screen.getByRole("heading", { name: "任务调度" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("账单同步")).toBeInTheDocument());
    expect(screen.getByText("真实调度、并发控制和执行日志由外部 API 提供")).toBeInTheDocument();
    expect(screen.getByText("scheduler.jobs.execute")).toBeInTheDocument();
  });

  it("renders scheduler executions with retry boundary and trace id", async () => {
    render(<SchedulerExecutionsPage />);

    expect(screen.getByRole("heading", { name: "执行日志" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("trace-exec-1")).toBeInTheDocument());
    expect(screen.getByText("失败重试由外部 API 审计并执行，前端只发起受控请求")).toBeInTheDocument();
    expect(screen.getByText("scheduler.executions.retry")).toBeInTheDocument();
  });
});
