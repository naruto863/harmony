import { MONITORING_ALERTS, MONITORING_HEALTH } from "@/data/mock-data";
import type { ApiResponse } from "@/types";
import type {
  MonitoringAlert,
  MonitoringAlertSeverity,
  MonitoringAlertStatus,
  MonitoringCommandResult,
  MonitoringHealthSummary,
} from "@/types/monitoring";
import { apiClient } from "./apiClient";
import { isDemoApiEnabled } from "./demoApi";

interface MonitoringListPayload<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

export interface GetMonitoringHealthParams {
  tenantId?: string;
}

export interface GetMonitoringAlertsParams {
  tenantId?: string;
  page?: number;
  pageSize?: number;
  status?: MonitoringAlertStatus;
  severity?: MonitoringAlertSeverity;
}

export interface MonitoringAlertCommandOptions {
  tenantId?: string;
  note?: string;
}

const MAX_PAGE_SIZE = 100;

/**
 * 监控服务只做前端适配：读接口返回健康/告警数据，写接口返回命令受理结果。
 * 真实指标采集、告警状态机和审计落点都应在外部监控 API 中完成。
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

// 告警历史可能增长很快，前端先限制 pageSize，避免误把全量日志拉到浏览器。
const resolvePageSize = (pageSize?: number, fallback = 20) => {
  return Math.min(Math.max(pageSize ?? fallback, 1), MAX_PAGE_SIZE);
};

/**
 * 统一把后端 list/total/page/size 转为页面使用的 data/meta。
 * 这样监控页和其他列表页可以共享同一套分页展示逻辑。
 */
const toPagedResponse = <T>(payload: MonitoringListPayload<T>): ApiResponse<T[]> => ({
  success: true,
  data: payload.list,
  meta: {
    page: payload.page,
    pageSize: payload.size,
    total: payload.total,
    totalPages: Math.max(Math.ceil(payload.total / payload.size), 1),
  },
});

const paginate = <T>(items: T[], page: number, size: number): MonitoringListPayload<T> => {
  const start = (page - 1) * size;
  return {
    list: items.slice(start, start + size),
    total: items.length,
    page,
    size,
  };
};

const buildHealthQuery = (params: GetMonitoringHealthParams) => {
  const query = new URLSearchParams();
  if (params.tenantId) query.set("tenantId", params.tenantId);
  return query.toString();
};

const buildAlertsQuery = (params: GetMonitoringAlertsParams) => {
  const query = new URLSearchParams();
  if (params.tenantId) query.set("tenantId", params.tenantId);
  query.set("page", String(resolvePage(params.page)));
  query.set("size", String(resolvePageSize(params.pageSize)));
  if (params.status) query.set("status", params.status);
  if (params.severity) query.set("severity", params.severity);
  return query.toString();
};

export const getMonitoringHealth = async (
  params: GetMonitoringHealthParams = {}
): Promise<ApiResponse<MonitoringHealthSummary>> => {
  try {
    if (isDemoApiEnabled()) {
      // Demo 健康状态是固定样例，不连接任何真实探针或指标采集端。
      return wrapSuccess(MONITORING_HEALTH);
    }
    const query = buildHealthQuery(params);
    const path = query ? `/api/monitoring/health?${query}` : "/api/monitoring/health";
    const result = await apiClient.get<MonitoringHealthSummary>(path);
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载监控健康状态失败");
  }
};

export const getMonitoringAlerts = async (
  params: GetMonitoringAlertsParams = {}
): Promise<ApiResponse<MonitoringAlert[]>> => {
  try {
    const page = resolvePage(params.page);
    const size = resolvePageSize(params.pageSize);
    if (isDemoApiEnabled()) {
      // Demo 告警只支持本地筛选分页，便于验证 UI 空间和状态标签。
      const filtered = MONITORING_ALERTS.filter((alert) => {
        if (params.status && alert.status !== params.status) return false;
        if (params.severity && alert.severity !== params.severity) return false;
        return true;
      });
      return toPagedResponse(paginate(filtered, page, size));
    }
    const result = await apiClient.get<MonitoringListPayload<MonitoringAlert>>(
      `/api/monitoring/alerts?${buildAlertsQuery(params)}`
    );
    return toPagedResponse(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载告警历史失败");
  }
};

export const acknowledgeMonitoringAlert = async (
  alertId: string,
  options: MonitoringAlertCommandOptions = {}
): Promise<ApiResponse<MonitoringCommandResult>> => {
  try {
    if (isDemoApiEnabled()) {
      // 告警确认会改变真实告警状态并需要审计，Demo 下只返回未受理结果。
      return wrapSuccess({ accepted: false, traceId: "demo-monitoring-ack-disabled" });
    }
    const result = await apiClient.post<MonitoringCommandResult>(
      `/api/monitoring/alerts/${encodeURIComponent(alertId)}/ack`,
      options
    );
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "确认告警失败");
  }
};

export const resolveMonitoringAlert = async (
  alertId: string,
  options: MonitoringAlertCommandOptions = {}
): Promise<ApiResponse<MonitoringCommandResult>> => {
  try {
    if (isDemoApiEnabled()) {
      // 解决告警需要后端校验当前状态，不能用本地数组假装完成。
      return wrapSuccess({ accepted: false, traceId: "demo-monitoring-resolve-disabled" });
    }
    const result = await apiClient.post<MonitoringCommandResult>(
      `/api/monitoring/alerts/${encodeURIComponent(alertId)}/resolve`,
      options
    );
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "解决告警失败");
  }
};

export const silenceMonitoringAlert = async (
  alertId: string,
  options: MonitoringAlertCommandOptions = {}
): Promise<ApiResponse<MonitoringCommandResult>> => {
  try {
    if (isDemoApiEnabled()) {
      // 静默策略会影响后续告警通知范围，Demo 不持久化这类运维动作。
      return wrapSuccess({ accepted: false, traceId: "demo-monitoring-silence-disabled" });
    }
    const result = await apiClient.post<MonitoringCommandResult>(
      `/api/monitoring/alerts/${encodeURIComponent(alertId)}/silence`,
      options
    );
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "静默告警失败");
  }
};
