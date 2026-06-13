import { isDemoModeEnabled } from "@/lib/demoMode";
import { MENU_ITEMS, PERMISSION_GROUPS, PERMISSIONS, ROLES, TENANTS, USERS, USER_PASSWORDS, USER_TENANT_ROLES } from "@/data/mock-data";
import type { LoginResponse } from "./authService";
import type { SwitchTenantResponse, TenantDto } from "./tenantService";
import type { MenuItem, Permission, PermissionGroup, Role, User } from "@/types";

const DEMO_USER_ID_KEY = "ha_demo:auth_user_id";
const DEMO_TENANT_ID_KEY = "ha_demo:tenant_id";
const TENANT_KEY = "admin_studio_tenant";

const getStorage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const buildDemoTokens = (userId: string, tenantId?: string) => {
  const issuedAt = Date.now();
  const tenantPart = tenantId ?? "none";
  return {
    accessToken: `demo-access-${userId}-${tenantPart}-${issuedAt}`,
    refreshToken: `demo-refresh-${userId}-${tenantPart}-${issuedAt}`,
  };
};

const toTenantDto = (tenant: (typeof TENANTS)[number]): TenantDto => ({
  id: tenant.id,
  name: tenant.name,
  plan: tenant.plan,
  status: "active",
  createdAt: tenant.createdAt,
  updatedAt: tenant.updatedAt,
});

const setDemoSession = (userId: string, tenantId?: string) => {
  const storage = getStorage();
  storage?.setItem(DEMO_USER_ID_KEY, userId);
  if (tenantId) {
    storage?.setItem(DEMO_TENANT_ID_KEY, tenantId);
    storage?.setItem(TENANT_KEY, tenantId);
  }
};

const getStoredUserId = (): string | null => {
  const storage = getStorage();
  if (!storage) return null;
  const demoUserId = storage.getItem(DEMO_USER_ID_KEY);
  if (demoUserId) return demoUserId;
  const storedUser = storage.getItem("admin_studio_user");
  if (!storedUser) return null;
  try {
    return (JSON.parse(storedUser) as Partial<User>).id ?? null;
  } catch {
    return null;
  }
};

const getStoredTenantId = (): string | null => {
  const storage = getStorage();
  if (!storage) return null;
  return storage.getItem(DEMO_TENANT_ID_KEY) ?? storage.getItem(TENANT_KEY);
};

const getCurrentUser = (): User => {
  const userId = getStoredUserId();
  const user = USERS.find((item) => item.id === userId);
  if (!user) {
    throw new Error("演示登录已过期，请重新登录");
  }
  return user;
};

const getTenantsForUser = (userId: string): TenantDto[] => {
  const tenantIds = new Set(USER_TENANT_ROLES.filter((item) => item.userId === userId).map((item) => item.tenantId));
  return TENANTS.filter((tenant) => tenantIds.has(tenant.id)).map(toTenantDto);
};

const getCurrentTenant = (userId: string, requestedTenantId?: string): TenantDto => {
  const tenants = getTenantsForUser(userId);
  const tenantId = requestedTenantId ?? getStoredTenantId() ?? tenants[0]?.id;
  const tenant = tenants.find((item) => item.id === tenantId);
  if (!tenant) {
    throw new Error("当前演示账号无权访问该工作空间");
  }
  return tenant;
};

const getRoleForUser = (userId: string, tenantId: string): Role | null => {
  const relation = USER_TENANT_ROLES.find((item) => item.userId === userId && item.tenantId === tenantId);
  if (!relation) return null;
  return ROLES.find((role) => role.id === relation.roleId) ?? null;
};

export const isDemoApiEnabled = (): boolean => isDemoModeEnabled();

export const demoLogin = async (email: string, password: string, tenantId?: string): Promise<LoginResponse> => {
  const user = USERS.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user || USER_PASSWORDS[user.email] !== password) {
    throw new Error("邮箱或密码错误");
  }
  if (user.status !== "active") {
    throw new Error("账号不可用，请切换其他演示账号");
  }

  const tenants = getTenantsForUser(user.id);
  if (tenants.length === 0) {
    throw new Error("当前演示账号未分配工作空间");
  }
  const currentTenant = getCurrentTenant(user.id, tenantId);
  setDemoSession(user.id, currentTenant.id);
  const tokens = buildDemoTokens(user.id, currentTenant.id);

  return {
    ...tokens,
    user,
    tenants,
    passwordChangeRequired: false,
  };
};

export const demoRegister = async (): Promise<void> => {
  throw new Error("演示模式不开放注册，请使用页面中的演示账号登录");
};

export const demoRefreshToken = async (): Promise<{ accessToken: string; refreshToken: string }> => {
  const user = getCurrentUser();
  const tenant = getCurrentTenant(user.id);
  const tokens = buildDemoTokens(user.id, tenant.id);
  setDemoSession(user.id, tenant.id);
  return tokens;
};

export const demoLogout = async (): Promise<void> => {
  const storage = getStorage();
  storage?.removeItem(DEMO_USER_ID_KEY);
  storage?.removeItem(DEMO_TENANT_ID_KEY);
};

export const demoGetMyTenants = async (): Promise<TenantDto[]> => {
  const user = getCurrentUser();
  return getTenantsForUser(user.id);
};

export const demoSwitchTenant = async (tenantId: string): Promise<SwitchTenantResponse> => {
  const user = getCurrentUser();
  const tenant = getCurrentTenant(user.id, tenantId);
  setDemoSession(user.id, tenant.id);
  return {
    ...buildDemoTokens(user.id, tenant.id),
    tenant,
  };
};

export const demoGetMyRole = async (): Promise<Role | null> => {
  const user = getCurrentUser();
  const tenant = getCurrentTenant(user.id);
  return getRoleForUser(user.id, tenant.id);
};

export const demoGetMyPermissions = async (): Promise<string[]> => {
  const role = await demoGetMyRole();
  return role?.permissions ?? [];
};

export const demoGetRoles = async (): Promise<Role[]> => ROLES;

export const demoGetAllPermissions = async (): Promise<Permission[]> => PERMISSIONS;

export const demoGetPermissionGroups = async (): Promise<PermissionGroup[]> => PERMISSION_GROUPS;

export const demoGetMenuTree = async (): Promise<MenuItem[]> => MENU_ITEMS;
