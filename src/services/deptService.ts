import { ApiResponse, DeptNode } from "@/types";
import { apiClient } from "./apiClient";
import { demoGetDeptTree, isDemoApiEnabled } from "./demoApi";

const wrapSuccess = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

const wrapError = (message: string): ApiResponse<never> => ({
  success: false,
  error: { code: "REQUEST_FAILED", message },
});

export const getDeptTree = async (): Promise<ApiResponse<DeptNode[]>> => {
  if (isDemoApiEnabled()) {
    return wrapSuccess(await demoGetDeptTree());
  }
  try {
    const data = await apiClient.get<DeptNode[]>("/api/depts/tree");
    return wrapSuccess(data);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载组织失败");
  }
};

export interface CreateDeptData {
  name: string;
  parentId?: string | null;
  sortOrder?: number;
  status?: string;
}

export const createDept = async (data: CreateDeptData): Promise<ApiResponse<DeptNode>> => {
  try {
    const response = await apiClient.post<DeptNode>("/api/depts", data);
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "创建组织失败");
  }
};

export interface UpdateDeptData {
  name?: string;
  parentId?: string | null;
  sortOrder?: number;
  status?: string;
}

export const updateDept = async (
  deptId: string,
  data: UpdateDeptData
): Promise<ApiResponse<DeptNode>> => {
  try {
    const response = await apiClient.put<DeptNode>(`/api/depts/${deptId}`, data);
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "更新组织失败");
  }
};

export const deleteDept = async (deptId: string): Promise<ApiResponse<void>> => {
  try {
    await apiClient.delete<void>(`/api/depts/${deptId}`);
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "删除组织失败");
  }
};
