import { WORKFLOW_DEFINITIONS, WORKFLOW_INSTANCES } from "@/data/mock-data";
import type { ApiResponse } from "@/types";
import type { WorkflowCommandResult, WorkflowDefinition, WorkflowInstance } from "@/types/workflow";
import { apiClient } from "./apiClient";
import { isDemoApiEnabled } from "./demoApi";

interface WorkflowListPayload<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

export interface WorkflowQueryParams {
  tenantId?: string;
}

export interface WorkflowInstanceQueryParams extends WorkflowQueryParams {
  page?: number;
  pageSize?: number;
  status?: WorkflowInstance["status"];
}

export interface StartWorkflowInstancePayload extends WorkflowQueryParams {
  title: string;
  formData: Record<string, unknown>;
}

export interface WorkflowTaskCommandPayload extends WorkflowQueryParams {
  comment?: string;
}

const MAX_PAGE_SIZE = 100;

const wrapSuccess = <T>(data: T): ApiResponse<T> => ({ success: true, data });
const wrapError = (message: string): ApiResponse<never> => ({
  success: false,
  error: { code: "REQUEST_FAILED", message },
});

const resolvePage = (page?: number) => Math.max(page ?? 1, 1);
const resolvePageSize = (pageSize?: number, fallback = 20) => Math.min(Math.max(pageSize ?? fallback, 1), MAX_PAGE_SIZE);

const toPagedResponse = <T>(payload: WorkflowListPayload<T>): ApiResponse<T[]> => ({
  success: true,
  data: payload.list,
  meta: {
    page: payload.page,
    pageSize: payload.size,
    total: payload.total,
    totalPages: Math.max(Math.ceil(payload.total / payload.size), 1),
  },
});

const paginate = <T>(items: T[], page: number, size: number): WorkflowListPayload<T> => ({
  list: items.slice((page - 1) * size, page * size),
  total: items.length,
  page,
  size,
});

const definitionQuery = (params: WorkflowQueryParams) => {
  const query = new URLSearchParams();
  if (params.tenantId) query.set("tenantId", params.tenantId);
  return query.toString();
};

const instanceQuery = (params: WorkflowInstanceQueryParams) => {
  const query = new URLSearchParams();
  if (params.tenantId) query.set("tenantId", params.tenantId);
  query.set("page", String(resolvePage(params.page)));
  query.set("size", String(resolvePageSize(params.pageSize)));
  if (params.status) query.set("status", params.status);
  return query.toString();
};

export const getWorkflowDefinitions = async (
  params: WorkflowQueryParams = {}
): Promise<ApiResponse<WorkflowDefinition[]>> => {
  try {
    if (isDemoApiEnabled()) return wrapSuccess(WORKFLOW_DEFINITIONS);
    const query = definitionQuery(params);
    const path = query ? `/api/workflows/definitions?${query}` : "/api/workflows/definitions";
    return wrapSuccess(await apiClient.get<WorkflowDefinition[]>(path));
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载流程定义失败");
  }
};

export const getWorkflowInstances = async (
  params: WorkflowInstanceQueryParams = {}
): Promise<ApiResponse<WorkflowInstance[]>> => {
  try {
    const page = resolvePage(params.page);
    const size = resolvePageSize(params.pageSize);
    if (isDemoApiEnabled()) {
      const filtered = WORKFLOW_INSTANCES.filter((instance) => !params.status || instance.status === params.status);
      return toPagedResponse(paginate(filtered, page, size));
    }
    const result = await apiClient.get<WorkflowListPayload<WorkflowInstance>>(
      `/api/workflows/instances?${instanceQuery(params)}`
    );
    return toPagedResponse(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载流程实例失败");
  }
};

export const startWorkflowInstance = async (
  definitionId: string,
  payload: StartWorkflowInstancePayload
): Promise<ApiResponse<WorkflowCommandResult>> => {
  try {
    if (isDemoApiEnabled()) return wrapSuccess({ accepted: false, traceId: "demo-workflow-start-disabled" });
    const result = await apiClient.post<WorkflowCommandResult>("/api/workflows/instances", {
      definitionId,
      ...payload,
    });
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "发起流程失败");
  }
};

export const approveWorkflowTask = async (
  taskId: string,
  payload: WorkflowTaskCommandPayload
): Promise<ApiResponse<WorkflowCommandResult>> => {
  try {
    if (isDemoApiEnabled()) return wrapSuccess({ accepted: false, traceId: "demo-workflow-approve-disabled" });
    return wrapSuccess(await apiClient.post<WorkflowCommandResult>(
      `/api/workflows/tasks/${encodeURIComponent(taskId)}/approve`,
      payload
    ));
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "审批流程任务失败");
  }
};

export const rejectWorkflowTask = async (
  taskId: string,
  payload: WorkflowTaskCommandPayload
): Promise<ApiResponse<WorkflowCommandResult>> => {
  try {
    if (isDemoApiEnabled()) return wrapSuccess({ accepted: false, traceId: "demo-workflow-reject-disabled" });
    return wrapSuccess(await apiClient.post<WorkflowCommandResult>(
      `/api/workflows/tasks/${encodeURIComponent(taskId)}/reject`,
      payload
    ));
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "驳回流程任务失败");
  }
};
