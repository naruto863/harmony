import { ApiResponse, UserGroup } from "@/types";
import { apiClient } from "./apiClient";

const wrapSuccess = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

const wrapError = (message: string): ApiResponse<never> => ({
  success: false,
  error: { code: "REQUEST_FAILED", message },
});

export const getUserGroups = async (tenantId?: string): Promise<ApiResponse<UserGroup[]>> => {
  try {
    const query = tenantId ? `?tenantId=${tenantId}` : "";
    const data = await apiClient.get<UserGroup[]>(`/api/user-groups${query}`);
    return wrapSuccess(data);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载用户组失败");
  }
};

export interface CreateUserGroupData {
  name: string;
  code: string;
  description?: string;
  status?: string;
  tenantId?: string;
}

export const createUserGroup = async (data: CreateUserGroupData): Promise<ApiResponse<UserGroup>> => {
  try {
    const query = data.tenantId ? `?tenantId=${data.tenantId}` : "";
    const response = await apiClient.post<UserGroup>(`/api/user-groups${query}`, {
      name: data.name,
      code: data.code,
      description: data.description,
      status: data.status,
    });
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "创建用户组失败");
  }
};

export interface UpdateUserGroupData {
  name?: string;
  code?: string;
  description?: string;
  status?: string;
}

export const updateUserGroup = async (
  groupId: string,
  data: UpdateUserGroupData
): Promise<ApiResponse<UserGroup>> => {
  try {
    const response = await apiClient.put<UserGroup>(`/api/user-groups/${groupId}`, {
      name: data.name,
      code: data.code,
      description: data.description,
      status: data.status,
    });
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "更新用户组失败");
  }
};

export const deleteUserGroup = async (groupId: string): Promise<ApiResponse<void>> => {
  try {
    await apiClient.delete<void>(`/api/user-groups/${groupId}`);
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "删除用户组失败");
  }
};

export const getUserGroupMembers = async (groupId: string): Promise<ApiResponse<string[]>> => {
  try {
    const data = await apiClient.get<string[]>(`/api/user-groups/${groupId}/members`);
    return wrapSuccess(data);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载成员失败");
  }
};

export const updateUserGroupMembers = async (
  groupId: string,
  userIds: string[]
): Promise<ApiResponse<void>> => {
  try {
    await apiClient.put<void>(`/api/user-groups/${groupId}/members`, { userIds });
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "更新成员失败");
  }
};
