import { ApiResponse, DataScopeType, Permission, PermissionGroup, Role } from "@/types";
import { apiClient } from "./apiClient";
import {
  demoGetAllPermissions,
  demoGetMyRole,
  demoGetPermissionGroups,
  demoGetRoles,
  isDemoApiEnabled,
} from "./demoApi";

export interface GetRolesParams {
  tenantId?: string;
  search?: string;
}

const wrapSuccess = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

const wrapError = (message: string): ApiResponse<never> => ({
  success: false,
  error: { code: "REQUEST_FAILED", message },
});

export const getRoles = async (params: GetRolesParams = {}): Promise<ApiResponse<Role[]>> => {
  if (isDemoApiEnabled()) {
    const roles = await demoGetRoles();
    const filteredRoles = roles.filter((role) => {
      const matchesTenant = !params.tenantId || !role.tenantId || role.tenantId === params.tenantId;
      const matchesSearch = !params.search || role.name.toLowerCase().includes(params.search.toLowerCase());
      return matchesTenant && matchesSearch;
    });
    return wrapSuccess(filteredRoles);
  }
  try {
    const query = new URLSearchParams();
    if (params.tenantId) query.set("tenantId", params.tenantId);
    if (params.search) query.set("search", params.search);
    const data = await apiClient.get<Role[]>(`/api/roles?${query.toString()}`);
    return wrapSuccess(data);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载角色失败");
  }
};

export const getMyRole = async (): Promise<ApiResponse<Role | null>> => {
  if (isDemoApiEnabled()) {
    return wrapSuccess(await demoGetMyRole());
  }
  try {
    const data = await apiClient.get<Role | null>("/api/roles/mine");
    return wrapSuccess(data);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载当前角色失败");
  }
};

export interface CreateRoleData {
  name: string;
  description: string;
  permissions: string[];
  dataScopeType?: DataScopeType;
  dataScopeDeptIds?: string[];
  tenantId: string;
}

export const createRole = async (data: CreateRoleData): Promise<ApiResponse<Role>> => {
  try {
    const body = {
      name: data.name,
      code: `role_${Date.now()}`,
      description: data.description,
      permissionIds: data.permissions,
      dataScopeType: data.dataScopeType,
      dataScopeDeptIds: data.dataScopeDeptIds,
    };
    const response = await apiClient.post<Role>(`/api/roles?tenantId=${data.tenantId}`, body);
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "创建角色失败");
  }
};

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
  dataScopeType?: DataScopeType;
  dataScopeDeptIds?: string[];
}

export const updateRole = async (roleId: string, data: UpdateRoleData): Promise<ApiResponse<Role>> => {
  try {
    const body = {
      name: data.name,
      description: data.description,
      permissionIds: data.permissions,
      dataScopeType: data.dataScopeType,
      dataScopeDeptIds: data.dataScopeDeptIds,
    };
    const response = await apiClient.put<Role>(`/api/roles/${roleId}`, body);
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "更新角色失败");
  }
};

export const deleteRole = async (roleId: string): Promise<ApiResponse<void>> => {
  try {
    await apiClient.delete<void>(`/api/roles/${roleId}`);
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "删除角色失败");
  }
};

export const getAllPermissions = async (): Promise<ApiResponse<Permission[]>> => {
  if (isDemoApiEnabled()) {
    return wrapSuccess(await demoGetAllPermissions());
  }
  try {
    const data = await apiClient.get<Permission[]>("/api/permissions");
    return wrapSuccess(data);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载权限失败");
  }
};

export const getPermissionGroups = async (): Promise<ApiResponse<PermissionGroup[]>> => {
  if (isDemoApiEnabled()) {
    return wrapSuccess(await demoGetPermissionGroups());
  }
  try {
    const data = await apiClient.get<PermissionGroup[]>("/api/permissions/groups");
    return wrapSuccess(data);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载权限分组失败");
  }
};
