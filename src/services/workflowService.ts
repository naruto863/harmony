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

/**
 * 工作流服务保持“页面友好的 ApiResponse”返回形态。
 * 这里不直接向页面抛 ApiError，是为了让流程定义、实例列表和审批动作都能复用同一套
 * success/data/meta/error 判断；真正的 HTTP envelope 拆包仍集中在 apiClient。
 */
const wrapSuccess = <T>(data: T): ApiResponse<T> => ({ success: true, data });
const wrapError = (message: string): ApiResponse<never> => ({
  success: false,
  error: { code: "REQUEST_FAILED", message },
});

// page/pageSize 在前端先做保守归一化，避免 Demo 分页和真实 API 分页出现边界差异。
const resolvePage = (page?: number) => Math.max(page ?? 1, 1);
const resolvePageSize = (pageSize?: number, fallback = 20) => Math.min(Math.max(pageSize ?? fallback, 1), MAX_PAGE_SIZE);

/**
 * 后端列表响应和前端通用表格 meta 字段不完全同名。
 * 统一在 service 层转换，页面就不需要知道后端使用 size 还是 pageSize。
 */
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
    // Demo 下定义列表是静态样例，只用于让页面展示流程入口，不代表可真实发起。
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
      // Demo 只在前端按状态过滤和分页，避免让维护者误以为这里有真实流程引擎状态。
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
    // 写命令在 Demo 中必须显式拒绝；accepted=false 是给页面展示“不可执行”的安全状态。
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
    // 审批/驳回需要真实任务锁、审计和权限校验，Demo 不做本地状态伪造。
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
    // 与 approve 保持同一策略：页面可验证交互反馈，但不会修改本地流程实例。
    if (isDemoApiEnabled()) return wrapSuccess({ accepted: false, traceId: "demo-workflow-reject-disabled" });
    return wrapSuccess(await apiClient.post<WorkflowCommandResult>(
      `/api/workflows/tasks/${encodeURIComponent(taskId)}/reject`,
      payload
    ));
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "驳回流程任务失败");
  }
};
