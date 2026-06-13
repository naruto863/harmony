import { apiClient } from "./apiClient";
import { demoGetMyTenants, demoSwitchTenant, isDemoApiEnabled } from "./demoApi";

export type TenantDto = {
  id: string;
  code?: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  status?: string;
  createdAt: string;
  updatedAt: string;
};

export type SwitchTenantResponse = {
  accessToken: string;
  refreshToken: string;
  tenant: TenantDto | null;
};

export const getMyTenants = () => {
  if (isDemoApiEnabled()) {
    return demoGetMyTenants();
  }
  return apiClient.get<TenantDto[]>("/api/tenants/mine");
};

export const switchTenant = (tenantId: string) => {
  if (isDemoApiEnabled()) {
    return demoSwitchTenant(tenantId);
  }
  return apiClient.post<SwitchTenantResponse>("/api/tenants/switch", { tenantId });
};
