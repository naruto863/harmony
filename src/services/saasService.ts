import { SAAS_PLANS, SAAS_QUOTA_USAGE } from "@/data/mock-data";
import type { ApiResponse } from "@/types";
import type { SaasCommandOptions, SaasCommandResult, SaasPlan, SaasQuotaUsage } from "@/types/saas";
import { apiClient } from "./apiClient";
import { isDemoApiEnabled } from "./demoApi";

export interface GetSaasParams {
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

const buildTenantQuery = (params: GetSaasParams) => {
  const query = new URLSearchParams();
  if (params.tenantId) query.set("tenantId", params.tenantId);
  return query.toString();
};

const pathWithQuery = (path: string, query: string) => (query ? `${path}?${query}` : path);

export const getSaasPlans = async (
  params: GetSaasParams = {}
): Promise<ApiResponse<SaasPlan[]>> => {
  try {
    if (isDemoApiEnabled()) {
      return wrapSuccess(SAAS_PLANS);
    }
    const result = await apiClient.get<SaasPlan[]>(
      pathWithQuery("/api/saas/plans", buildTenantQuery(params))
    );
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载 SaaS 套餐失败");
  }
};

export const getSaasQuotaUsage = async (
  params: GetSaasParams = {}
): Promise<ApiResponse<SaasQuotaUsage[]>> => {
  try {
    if (isDemoApiEnabled()) {
      return wrapSuccess(SAAS_QUOTA_USAGE);
    }
    const result = await apiClient.get<SaasQuotaUsage[]>(
      pathWithQuery("/api/saas/quotas", buildTenantQuery(params))
    );
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载 SaaS 配额失败");
  }
};

export const updateSaasModuleToggle = async (
  moduleCode: string,
  options: SaasCommandOptions
): Promise<ApiResponse<SaasCommandResult>> => {
  try {
    if (isDemoApiEnabled()) {
      return wrapSuccess({ accepted: false, traceId: "demo-saas-module-toggle-disabled" });
    }
    const result = await apiClient.post<SaasCommandResult>(
      `/api/saas/modules/${encodeURIComponent(moduleCode)}/toggle`,
      options
    );
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "更新 SaaS 模块开关失败");
  }
};
