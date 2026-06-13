import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelImportExportTask,
  downloadImportExportErrorReport,
  getImportExportTasks,
  retryImportExportTask,
} from "./importExportService";

const taskPayload = {
  id: "task_1",
  taskType: "import",
  entityType: "users",
  status: "failed",
  phase: "failed",
  totalCount: 10,
  successCount: 7,
  failedCount: 3,
  errorDetails: JSON.stringify([{ row: 3, field: "email", message: "邮箱已存在" }]),
  createdAt: "2026-06-13T00:00:00Z",
  updatedAt: "2026-06-13T00:00:00Z",
};

const jsonResponse = (data: unknown) => new Response(JSON.stringify({
  code: 0,
  message: "OK",
  data,
  traceId: "trace-import-export",
  timestamp: "2026-06-13T00:00:00Z",
}), { status: 200 });

describe("importExportService task operations", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("loads filtered import/export tasks and normalizes error details", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse([taskPayload]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getImportExportTasks({
      taskType: "import",
      entityType: "users",
      status: "failed",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:9080/api/import-export/tasks?taskType=import&entityType=users&status=failed",
      expect.any(Object),
    );
    expect(result.success).toBe(true);
    expect(result.data?.[0].errors).toEqual([
      { row: 3, field: "email", message: "邮箱已存在" },
    ]);
  });

  it("retries and cancels tasks through task action endpoints", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse(taskPayload));
    vi.stubGlobal("fetch", fetchMock);

    await retryImportExportTask("task_1");
    await cancelImportExportTask("task_1");

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "http://localhost:9080/api/import-export/tasks/task_1/retry",
      "http://localhost:9080/api/import-export/tasks/task_1/cancel",
    ]);
  });

  it("loads an authenticated error report download URL", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({
      downloadUrl: "https://files.example.test/error-report.csv",
      expiresAt: "2026-06-13T00:10:00Z",
    })));

    const result = await downloadImportExportErrorReport("task_1");

    expect(result).toEqual({
      success: true,
      data: "https://files.example.test/error-report.csv",
    });
  });
});
