import { ApiResponse, User } from "@/types";
import { apiClient } from "./apiClient";

export interface UserWithRole extends User {
  roleId?: string;
  roleName?: string;
  joinedAt?: string;
  deptId?: string;
  deptName?: string;
}

export interface GetUsersParams {
  tenantId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  roleId?: string;
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

export const getUsers = async (params: GetUsersParams): Promise<ApiResponse<UserWithRole[]>> => {
  try {
    const query = new URLSearchParams();
    query.set("tenantId", params.tenantId);
    query.set("page", String(params.page || 1));
    query.set("size", String(resolvePageSize(params.pageSize, 10)));
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.roleId) query.set("roleId", params.roleId);
    const result = await apiClient.get<{
      list: UserWithRole[];
      total: number;
      page: number;
      size: number;
    }>(`/api/users?${query.toString()}`);
    return {
      success: true,
      data: result.list,
      meta: {
        page: result.page,
        pageSize: result.size,
        total: result.total,
        totalPages: Math.ceil(result.total / result.size),
      },
    };
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载用户失败");
  }
};

export interface CreateUserData {
  email: string;
  name: string;
  phone?: string;
  roleId: string;
  deptId?: string | null;
  tenantId: string;
}

export interface UserProvisioningResponse {
  user: User;
  temporaryPassword?: string | null;
  passwordChangeRequired: boolean;
}

export const createUser = async (data: CreateUserData): Promise<ApiResponse<UserProvisioningResponse>> => {
  try {
    const response = await apiClient.post<UserProvisioningResponse>(`/api/users?tenantId=${data.tenantId}`, {
      email: data.email,
      name: data.name,
      phone: data.phone,
      roleId: data.roleId,
      deptId: data.deptId ?? undefined,
    });
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "创建用户失败");
  }
};

export const resetUserPassword = async (
  userId: string,
  tenantId: string
): Promise<ApiResponse<UserProvisioningResponse>> => {
  try {
    const response = await apiClient.post<UserProvisioningResponse>(
      `/api/users/${userId}/password-reset?tenantId=${tenantId}`
    );
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "重置密码失败");
  }
};

export interface UpdateUserData {
  name?: string;
  phone?: string;
  status?: User["status"];
  roleId?: string;
  deptId?: string | null;
}

export const updateUser = async (
  userId: string,
  tenantId: string,
  data: UpdateUserData
): Promise<ApiResponse<User>> => {
  try {
    const response = await apiClient.put<User>(`/api/users/${userId}?tenantId=${tenantId}`, {
      name: data.name,
      phone: data.phone,
      status: data.status,
      roleId: data.roleId,
      deptId: data.deptId ?? undefined,
    });
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "更新用户失败");
  }
};

export const removeUserFromTenant = async (userId: string, tenantId: string): Promise<ApiResponse<void>> => {
  try {
    await apiClient.delete<void>(`/api/users/${userId}?tenantId=${tenantId}`);
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "移除用户失败");
  }
};

export const batchUpdateUserStatus = async (
  userIds: string[],
  status: User["status"]
): Promise<ApiResponse<void>> => {
  try {
    await Promise.all(
      userIds.map((id) =>
        apiClient.patch<void>(`/api/users/${id}/status`, { status })
      )
    );
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "批量更新失败");
  }
};

export const batchRemoveUsers = async (userIds: string[], tenantId: string): Promise<ApiResponse<void>> => {
  try {
    await Promise.all(userIds.map((id) => apiClient.delete<void>(`/api/users/${id}?tenantId=${tenantId}`)));
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "批量移除失败");
  }
};
