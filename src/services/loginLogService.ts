import { ApiResponse, LoginLog } from "@/types";
import { apiClient } from "./apiClient";

export interface GetLoginLogsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: string;
  tenantId?: string;
}

const wrapSuccess = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

const wrapError = (message: string): ApiResponse<never> => ({
  success: false,
  error: { code: "REQUEST_FAILED", message },
});

const MAX_PAGE_SIZE = 100;

const resolvePageSize = (pageSize: number | undefined, fallback: number) => {
  return Math.min(Math.max(pageSize ?? fallback, 1), MAX_PAGE_SIZE);
};

export const getLoginLogs = async (
  params: GetLoginLogsParams
): Promise<ApiResponse<LoginLog[]>> => {
  try {
    const query = new URLSearchParams();
    query.set("page", String(params.page || 1));
    query.set("size", String(resolvePageSize(params.pageSize, 20)));
    if (params.status) query.set("status", params.status);
    if (params.userId) query.set("userId", params.userId);
    if (params.tenantId) query.set("tenantId", params.tenantId);
    const result = await apiClient.get<{
      list: LoginLog[];
      total: number;
      page: number;
      size: number;
    }>(`/api/login-logs?${query.toString()}`);
    return {
      success: true,
      data: result.list,
      meta: {
        page: result.page,
        pageSize: result.size,
        total: result.total,
        totalPages: Math.ceil(result.total / result.size),
      },
    };
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载登录日志失败");
  }
};
