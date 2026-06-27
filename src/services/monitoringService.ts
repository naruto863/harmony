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
