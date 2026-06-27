import { SAAS_PLANS, SAAS_QUOTA_USAGE } from "@/data/mock-data";
import type { ApiResponse } from "@/types";
import type { SaasCommandOptions, SaasCommandResult, SaasPlan, SaasQuotaUsage } from "@/types/saas";
import { apiClient } from "./apiClient";
import { isDemoApiEnabled } from "./demoApi";

export interface GetSaasParams {
  tenantId?: string;
}

/**
 * SaaS 服务只负责前端展示套餐、配额和模块开关入口。
 * 真实计费、授权和租户权益变更不能在前端完成，所以写命令在 Demo 下必须拒绝。
 */
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
      // 套餐 Demo 数据用于说明 UI 和字段，不代表真实可购买或可授权的计划。
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
      // 配额使用量是静态展示样例，真实环境应由后端按租户实时计算。
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
      // 模块开关会改变租户权益，Demo 下不写 localStorage，避免形成假的授权状态。
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
