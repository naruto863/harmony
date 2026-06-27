import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  approveWorkflowTask,
  getWorkflowDefinitions,
  getWorkflowInstances,
  startWorkflowInstance,
} from "./workflowService";

const jsonResponse = (data: unknown) => new Response(JSON.stringify({
  code: 0,
  message: "OK",
  data,
  traceId: "trace-workflow",
  timestamp: "2026-06-14T00:00:00Z",
}), { status: 200 });

describe("workflowService external API contract", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("loads workflow definitions and instances through external API", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, _init?: RequestInit) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/api/workflows/definitions")) {
        return jsonResponse([{ id: "wf_leave", name: "请假审批", status: "active", version: 1 }]);
      }
      return jsonResponse({
        list: [{ id: "inst_1", definitionId: "wf_leave", title: "年假申请", status: "running", currentNodeName: "部门审批" }],
        total: 1,
        page: 1,
        size: 20,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getWorkflowDefinitions({ tenantId: "tenant_demo" })).resolves.toMatchObject({
      success: true,
      data: [expect.objectContaining({ id: "wf_leave" })],
    });
    await expect(getWorkflowInstances({ tenantId: "tenant_demo", page: 1, pageSize: 20, status: "running" })).resolves.toMatchObject({
      success: true,
      data: [expect.objectContaining({ id: "inst_1", currentNodeName: "部门审批" })],
    });

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "http://localhost:9080/api/workflows/definitions?tenantId=tenant_demo",
      "http://localhost:9080/api/workflows/instances?tenantId=tenant_demo&page=1&size=20&status=running",
    ]);
  });

  it("starts workflow instances and approves tasks with controlled payloads", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({ accepted: true, traceId: "trace-workflow-command" }));
    vi.stubGlobal("fetch", fetchMock);

    await startWorkflowInstance("wf_leave", {
      tenantId: "tenant_demo",
      title: "年假申请",
      formData: { days: 2 },
    });
    await approveWorkflowTask("task_1", {
      tenantId: "tenant_demo",
      comment: "同意",
    });

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "http://localhost:9080/api/workflows/instances",
      "http://localhost:9080/api/workflows/tasks/task_1/approve",
    ]);
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toEqual({
      definitionId: "wf_leave",
      tenantId: "tenant_demo",
      title: "年假申请",
      formData: { days: 2 },
    });
  });
});
