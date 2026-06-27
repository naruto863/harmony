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

const wrapSuccess = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

const wrapError = (message: string): ApiResponse<never> => ({
  success: false,
  error: { code: "REQUEST_FAILED", message },
});

const resolvePage = (page?: number) => Math.max(page ?? 1, 1);

const resolvePageSize = (pageSize?: number, fallback = 20) => {
  return Math.min(Math.max(pageSize ?? fallback, 1), MAX_PAGE_SIZE);
};

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
