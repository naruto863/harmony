import { ApiResponse, Position } from "@/types";
import { apiClient } from "./apiClient";

const wrapSuccess = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

const wrapError = (message: string): ApiResponse<never> => ({
  success: false,
  error: { code: "REQUEST_FAILED", message },
});

export const getPositions = async (tenantId?: string): Promise<ApiResponse<Position[]>> => {
  try {
    const query = tenantId ? `?tenantId=${tenantId}` : "";
    const data = await apiClient.get<Position[]>(`/api/positions${query}`);
    return wrapSuccess(data);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载岗位失败");
  }
};

export interface CreatePositionData {
  name: string;
  code: string;
  deptId?: string | null;
  description?: string;
  sortOrder?: number;
  status?: string;
  tenantId?: string;
}

export const createPosition = async (data: CreatePositionData): Promise<ApiResponse<Position>> => {
  try {
    const query = data.tenantId ? `?tenantId=${data.tenantId}` : "";
    const response = await apiClient.post<Position>(`/api/positions${query}`, {
      name: data.name,
      code: data.code,
      deptId: data.deptId ?? undefined,
      description: data.description,
      sortOrder: data.sortOrder,
      status: data.status,
    });
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "创建岗位失败");
  }
};

export interface UpdatePositionData {
  name?: string;
  code?: string;
  deptId?: string | null;
  description?: string;
  sortOrder?: number;
  status?: string;
}

export const updatePosition = async (
  positionId: string,
  data: UpdatePositionData
): Promise<ApiResponse<Position>> => {
  try {
    const response = await apiClient.put<Position>(`/api/positions/${positionId}`, {
      name: data.name,
      code: data.code,
      deptId: data.deptId ?? undefined,
      description: data.description,
      sortOrder: data.sortOrder,
      status: data.status,
    });
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "更新岗位失败");
  }
};

export const deletePosition = async (positionId: string): Promise<ApiResponse<void>> => {
  try {
    await apiClient.delete<void>(`/api/positions/${positionId}`);
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "删除岗位失败");
  }
};
