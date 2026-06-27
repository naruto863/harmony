import { MAINTENANCE_RESOURCES } from "@/data/mock-data";
import type { ApiResponse } from "@/types";
import type {
  MaintenanceCommandOptions,
  MaintenanceCommandResult,
  MaintenanceResource,
} from "@/types/maintenance";
import { apiClient } from "./apiClient";
import { isDemoApiEnabled } from "./demoApi";

interface MaintenanceListPayload<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

export interface GetMaintenanceResourcesParams {
  tenantId?: string;
  page?: number;
  pageSize?: number;
  type?: MaintenanceResource["type"];
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

const resolvePageSize = (pageSize?: number, fallback = 20) =>
  Math.min(Math.max(pageSize ?? fallback, 1), MAX_PAGE_SIZE);

const paginate = <T>(items: T[], page: number, size: number): MaintenanceListPayload<T> => {
  const start = (page - 1) * size;
  return {
    list: items.slice(start, start + size),
    total: items.length,
    page,
    size,
  };
};

const toPagedResponse = <T>(payload: MaintenanceListPayload<T>): ApiResponse<T[]> => ({
  success: true,
  data: payload.list,
  meta: {
    page: payload.page,
    pageSize: payload.size,
    total: payload.total,
    totalPages: Math.max(Math.ceil(payload.total / payload.size), 1),
  },
});

const buildResourcesQuery = (params: GetMaintenanceResourcesParams) => {
  const query = new URLSearchParams();
  if (params.tenantId) query.set("tenantId", params.tenantId);
  query.set("page", String(resolvePage(params.page)));
  query.set("size", String(resolvePageSize(params.pageSize)));
  if (params.type) query.set("type", params.type);
  return query.toString();
};

export const getMaintenanceResources = async (
  params: GetMaintenanceResourcesParams = {}
): Promise<ApiResponse<MaintenanceResource[]>> => {
  try {
    const page = resolvePage(params.page);
    const size = resolvePageSize(params.pageSize);
    if (isDemoApiEnabled()) {
      const filtered = MAINTENANCE_RESOURCES.filter((resource) =>
        params.type ? resource.type === params.type : true
      );
      return toPagedResponse(paginate(filtered, page, size));
    }

    const result = await apiClient.get<MaintenanceListPayload<MaintenanceResource>>(
      `/api/maintenance/resources?${buildResourcesQuery(params)}`
    );
    return toPagedResponse(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载维护资源失败");
  }
};

export const refreshMaintenanceResource = async (
  resourceId: string,
  options: MaintenanceCommandOptions
): Promise<ApiResponse<MaintenanceCommandResult>> => {
  try {
    if (isDemoApiEnabled()) {
      return wrapSuccess({ accepted: false, traceId: "demo-maintenance-refresh-disabled" });
    }
    const result = await apiClient.post<MaintenanceCommandResult>(
      `/api/maintenance/resources/${encodeURIComponent(resourceId)}/refresh`,
      options
    );
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "提交资源刷新失败");
  }
};

export const clearMaintenanceCache = async (
  resourceId: string,
  options: MaintenanceCommandOptions
): Promise<ApiResponse<MaintenanceCommandResult>> => {
  try {
    if (isDemoApiEnabled()) {
      return wrapSuccess({ accepted: false, traceId: "demo-maintenance-cache-clear-disabled" });
    }
    const result = await apiClient.post<MaintenanceCommandResult>(
      `/api/maintenance/cache/${encodeURIComponent(resourceId)}/clear`,
      options
    );
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "提交缓存清理失败");
  }
};

export const syncMaintenanceReferenceData = async (
  resourceId: string,
  options: MaintenanceCommandOptions
): Promise<ApiResponse<MaintenanceCommandResult>> => {
  try {
    if (isDemoApiEnabled()) {
      return wrapSuccess({ accepted: false, traceId: "demo-maintenance-reference-sync-disabled" });
    }
    const result = await apiClient.post<MaintenanceCommandResult>(
      `/api/maintenance/reference-data/${encodeURIComponent(resourceId)}/sync`,
      options
    );
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "提交基础数据同步失败");
  }
};
