import { ApiResponse, AuditLog, AuditAction } from "@/types";
import { apiClient } from "./apiClient";

export interface GetAuditLogsParams {
  tenantId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  action?: AuditAction;
  resource?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
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

export const getAuditLogs = async (params: GetAuditLogsParams): Promise<ApiResponse<AuditLog[]>> => {
  try {
    const query = new URLSearchParams();
    query.set("tenantId", params.tenantId);
    query.set("page", String(params.page || 1));
    query.set("size", String(resolvePageSize(params.pageSize, 20)));
    if (params.search) query.set("search", params.search);
    if (params.action) query.set("action", params.action);
    if (params.resource) query.set("resource", params.resource);
    if (params.userId) query.set("userId", params.userId);
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    const result = await apiClient.get<{
      list: AuditLog[];
      total: number;
      page: number;
      size: number;
    }>(`/api/audit-logs?${query.toString()}`);
    const normalized = result.list.map((log) => ({
      ...log,
      details:
        typeof log.details === "string" && log.details
          ? JSON.parse(log.details)
          : log.details,
    })) as AuditLog[];
    return {
      success: true,
      data: normalized,
      meta: {
        page: result.page,
        pageSize: result.size,
        total: result.total,
        totalPages: Math.ceil(result.total / result.size),
      },
    };
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载日志失败");
  }
};

export const exportAuditLogs = async (params: Omit<GetAuditLogsParams, "page" | "pageSize">): Promise<string> => {
  const response = await getAuditLogs({ ...params, page: 1, pageSize: MAX_PAGE_SIZE });
  if (!response.success || !response.data) {
    throw new Error("导出失败");
  }
  const logs = response.data;
  const headers = ["时间", "用户", "操作", "资源类型", "资源ID", "IP地址", "详情"];
  const rows = logs.map((log) => [
    new Date(log.createdAt).toLocaleString("zh-CN"),
    log.userName,
    log.action,
    log.resource,
    log.resourceId,
    log.ipAddress,
    JSON.stringify(log.details || {}),
  ]);
  return [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");
};

export const getResourceTypes = (): string[] => {
  return ["projects", "users", "roles", "files", "settings", "auth"];
};

export const getActionTypes = (): AuditAction[] => {
  return ["create", "update", "delete", "login", "logout", "role_change", "permission_change"];
};
