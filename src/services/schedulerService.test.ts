import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSchedulerExecutions,
  getSchedulerJobs,
  retrySchedulerExecution,
  runSchedulerJobOnce,
} from "./schedulerService";

const jsonResponse = (data: unknown) => new Response(JSON.stringify({
  code: 0,
  message: "OK",
  data,
  traceId: "trace-scheduler",
  timestamp: "2026-06-14T00:00:00Z",
}), { status: 200 });

describe("schedulerService external API contract", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("loads scheduler jobs through the external scheduler endpoint", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({
      list: [
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
      total: 1,
      page: 1,
      size: 20,
    }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await getSchedulerJobs({
      tenantId: "tenant_demo",
      page: 1,
      pageSize: 20,
      status: "enabled",
      search: "billing",
    });

    expect(response.success).toBe(true);
    expect(response.data?.[0]).toMatchObject({ id: "job_billing_sync", status: "enabled" });
    expect(response.meta).toMatchObject({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:9080/api/scheduler/jobs?tenantId=tenant_demo&page=1&size=20&status=enabled&search=billing"
    );
  });

  it("loads executions and exposes run-once and retry operations", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, _init?: RequestInit) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/api/scheduler/executions?")) {
        return jsonResponse({
          list: [
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
          total: 1,
          page: 1,
          size: 10,
        });
      }
      return jsonResponse({ accepted: true, traceId: "trace-command" });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSchedulerExecutions({
      tenantId: "tenant_demo",
      page: 1,
      pageSize: 10,
      status: "failed",
      jobId: "job_billing_sync",
    })).resolves.toMatchObject({
      success: true,
      data: [expect.objectContaining({ id: "exec_1", retryable: true })],
    });

    await runSchedulerJobOnce("job_billing_sync", { tenantId: "tenant_demo", reason: "人工补偿" });
    await retrySchedulerExecution("exec_1", { tenantId: "tenant_demo", reason: "排障后重试" });

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "http://localhost:9080/api/scheduler/executions?tenantId=tenant_demo&page=1&size=10&status=failed&jobId=job_billing_sync",
      "http://localhost:9080/api/scheduler/jobs/job_billing_sync/run-once",
      "http://localhost:9080/api/scheduler/executions/exec_1/retry",
    ]);
    expect(JSON.parse(String((fetchMock.mock.calls[1][1] as RequestInit).body))).toEqual({
      tenantId: "tenant_demo",
      reason: "人工补偿",
    });
    expect(JSON.parse(String((fetchMock.mock.calls[2][1] as RequestInit).body))).toEqual({
      tenantId: "tenant_demo",
      reason: "排障后重试",
    });
  });
});
