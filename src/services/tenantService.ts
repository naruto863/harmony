import { apiClient } from "./apiClient";
import type { TenantMember } from "@/types";
import { demoGetMyTenants, demoGetUsers, demoSwitchTenant, isDemoApiEnabled } from "./demoApi";

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

export type AddTenantMemberData = {
  email?: string;
  userId?: string;
  roleId: string;
  isAdmin?: boolean;
};

export type UpdateTenantMemberData = {
  roleId?: string;
  isAdmin?: boolean;
  status?: TenantMember["status"];
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

export const getTenants = () => {
  if (isDemoApiEnabled()) {
    return demoGetMyTenants();
  }
  return apiClient.get<TenantDto[]>("/api/tenants");
};

export const getTenantMembers = async (tenantId: string): Promise<TenantMember[]> => {
  if (isDemoApiEnabled()) {
    const users = await demoGetUsers({ tenantId });
    return users.map((user) => ({
      userId: user.id,
      userName: user.name,
      email: user.email,
      status: user.status,
      roleId: user.roleId,
      roleName: user.roleName,
      isAdmin: user.roleId === "role_tenant_admin",
      joinedAt: user.joinedAt ?? new Date().toISOString(),
    }));
  }
  return apiClient.get<TenantMember[]>(`/api/tenants/${tenantId}/members`);
};

export const addTenantMember = (tenantId: string, data: AddTenantMemberData) => {
  if (isDemoApiEnabled()) {
    const now = new Date().toISOString();
    return Promise.resolve<TenantMember>({
      userId: data.userId ?? `demo_member_${Date.now()}`,
      userName: data.email ?? "演示成员",
      email: data.email ?? "demo-member@example.com",
      status: "pending",
      roleId: data.roleId,
      isAdmin: data.isAdmin ?? false,
      joinedAt: now,
    });
  }
  return apiClient.post<TenantMember>(`/api/tenants/${tenantId}/members`, data);
};

export const updateTenantMember = (
  tenantId: string,
  userId: string,
  data: UpdateTenantMemberData
) => {
  if (isDemoApiEnabled()) {
    return getTenantMembers(tenantId).then((members) => {
      const member = members.find((item) => item.userId === userId);
      return {
        userId,
        userName: member?.userName ?? "演示成员",
        email: member?.email ?? "demo-member@example.com",
        status: data.status ?? member?.status ?? "active",
        roleId: data.roleId ?? member?.roleId,
        roleName: member?.roleName,
        isAdmin: data.isAdmin ?? member?.isAdmin ?? false,
        joinedAt: member?.joinedAt ?? new Date().toISOString(),
      } satisfies TenantMember;
    });
  }
  return apiClient.put<TenantMember>(`/api/tenants/${tenantId}/members/${userId}`, data);
};

export const removeTenantMember = (tenantId: string, userId: string) => {
  if (isDemoApiEnabled()) {
    return Promise.resolve();
  }
  return apiClient.delete<void>(`/api/tenants/${tenantId}/members/${userId}`);
};
