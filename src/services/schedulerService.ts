import { SCHEDULER_EXECUTIONS, SCHEDULER_JOBS } from "@/data/mock-data";
import type { ApiResponse } from "@/types";
import type { SchedulerCommandResult, SchedulerExecution, SchedulerJob } from "@/types/scheduler";
import { apiClient } from "./apiClient";
import { isDemoApiEnabled } from "./demoApi";

interface SchedulerListPayload<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

export interface GetSchedulerJobsParams {
  tenantId?: string;
  page?: number;
  pageSize?: number;
  status?: SchedulerJob["status"];
  search?: string;
}

export interface GetSchedulerExecutionsParams {
  tenantId?: string;
  page?: number;
  pageSize?: number;
  status?: SchedulerExecution["status"];
  jobId?: string;
}

export interface SchedulerCommandOptions {
  tenantId?: string;
  reason?: string;
}

const MAX_PAGE_SIZE = 100;

/**
 * 调度服务负责把“列表查询”和“执行命令”两类接口统一包装为 ApiResponse。
 * 页面层只处理成功/失败和分页 meta，不直接依赖后端 envelope，也不关心 Demo/真实 API 分支。
 */
const wrapSuccess = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

const wrapError = (message: string): ApiResponse<never> => ({
  success: false,
  error: { code: "REQUEST_FAILED", message },
});

const resolvePage = (page?: number) => Math.max(page ?? 1, 1);

// 限制前端传入的 pageSize，避免一次性请求或渲染过大的执行日志列表。
const resolvePageSize = (pageSize?: number, fallback = 20) => {
  return Math.min(Math.max(pageSize ?? fallback, 1), MAX_PAGE_SIZE);
};

/**
 * 后端分页字段使用 size，页面通用组件使用 pageSize。
 * service 层在这里完成转换，避免每个页面重复做兼容判断。
 */
const toPagedResponse = <T>(payload: SchedulerListPayload<T>): ApiResponse<T[]> => ({
  success: true,
  data: payload.list,
  meta: {
    page: payload.page,
    pageSize: payload.size,
    total: payload.total,
    totalPages: Math.max(Math.ceil(payload.total / payload.size), 1),
  },
});

const paginate = <T>(items: T[], page: number, size: number): SchedulerListPayload<T> => {
  const start = (page - 1) * size;
  return {
    list: items.slice(start, start + size),
    total: items.length,
    page,
    size,
  };
};

const buildJobQuery = (params: GetSchedulerJobsParams) => {
  const query = new URLSearchParams();
  if (params.tenantId) query.set("tenantId", params.tenantId);
  query.set("page", String(resolvePage(params.page)));
  query.set("size", String(resolvePageSize(params.pageSize)));
  if (params.status) query.set("status", params.status);
  if (params.search?.trim()) query.set("search", params.search.trim());
  return query.toString();
};

const buildExecutionQuery = (params: GetSchedulerExecutionsParams) => {
  const query = new URLSearchParams();
  if (params.tenantId) query.set("tenantId", params.tenantId);
  query.set("page", String(resolvePage(params.page)));
  query.set("size", String(resolvePageSize(params.pageSize)));
  if (params.status) query.set("status", params.status);
  if (params.jobId) query.set("jobId", params.jobId);
  return query.toString();
};

export const getSchedulerJobs = async (
  params: GetSchedulerJobsParams = {}
): Promise<ApiResponse<SchedulerJob[]>> => {
  try {
    const page = resolvePage(params.page);
    const size = resolvePageSize(params.pageSize);
    if (isDemoApiEnabled()) {
      const search = params.search?.trim().toLowerCase();
      // Demo 只做前端过滤，便于无后端预览任务定义；真实执行能力仍由外部调度 API 提供。
      const filtered = SCHEDULER_JOBS.filter((job) => {
        if (params.status && job.status !== params.status) return false;
        if (!search) return true;
        return job.name.toLowerCase().includes(search) || job.id.toLowerCase().includes(search);
      });
      return toPagedResponse(paginate(filtered, page, size));
    }

    const result = await apiClient.get<SchedulerListPayload<SchedulerJob>>(
      `/api/scheduler/jobs?${buildJobQuery(params)}`
    );
    return toPagedResponse(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载任务定义失败");
  }
};

export const getSchedulerExecutions = async (
  params: GetSchedulerExecutionsParams = {}
): Promise<ApiResponse<SchedulerExecution[]>> => {
  try {
    const page = resolvePage(params.page);
    const size = resolvePageSize(params.pageSize);
    if (isDemoApiEnabled()) {
      // 执行日志 Demo 是静态样例分页，不代表后台任务真的运行过。
      const filtered = SCHEDULER_EXECUTIONS.filter((execution) => {
        if (params.status && execution.status !== params.status) return false;
        if (params.jobId && execution.jobId !== params.jobId) return false;
        return true;
      });
      return toPagedResponse(paginate(filtered, page, size));
    }

    const result = await apiClient.get<SchedulerListPayload<SchedulerExecution>>(
      `/api/scheduler/executions?${buildExecutionQuery(params)}`
    );
    return toPagedResponse(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载执行日志失败");
  }
};

export const runSchedulerJobOnce = async (
  jobId: string,
  options: SchedulerCommandOptions = {}
): Promise<ApiResponse<SchedulerCommandResult>> => {
  try {
    if (isDemoApiEnabled()) {
      // run-once 会触发真实副作用，Demo 下只返回可审计的拒绝结果供页面展示。
      return wrapSuccess({ accepted: false, traceId: "demo-scheduler-run-once-disabled" });
    }
    const result = await apiClient.post<SchedulerCommandResult>(
      `/api/scheduler/jobs/${encodeURIComponent(jobId)}/run-once`,
      options
    );
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "发起任务执行失败");
  }
};

export const retrySchedulerExecution = async (
  executionId: string,
  options: SchedulerCommandOptions = {}
): Promise<ApiResponse<SchedulerCommandResult>> => {
  try {
    if (isDemoApiEnabled()) {
      // 重试执行同样需要后端幂等和任务锁，本地不模拟执行状态迁移。
      return wrapSuccess({ accepted: false, traceId: "demo-scheduler-retry-disabled" });
    }
    const result = await apiClient.post<SchedulerCommandResult>(
      `/api/scheduler/executions/${encodeURIComponent(executionId)}/retry`,
      options
    );
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "发起执行重试失败");
  }
};
