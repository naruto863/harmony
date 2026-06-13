import { ApiResponse, DictGroup, DictItem } from "@/types";
import { apiClient } from "./apiClient";

const wrapSuccess = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

const wrapError = (message: string): ApiResponse<never> => ({
  success: false,
  error: { code: "REQUEST_FAILED", message },
});

export const getDictGroups = async (includeItems: boolean = false): Promise<ApiResponse<DictGroup[]>> => {
  try {
    const data = await apiClient.get<DictGroup[]>(
      `/api/dicts/groups?includeItems=${includeItems ? "true" : "false"}`
    );
    return wrapSuccess(data);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载字典分组失败");
  }
};

export const getDictItems = async (params: { groupKey?: string; groupId?: string }): Promise<ApiResponse<DictItem[]>> => {
  try {
    const query = new URLSearchParams();
    if (params.groupKey) query.set("groupKey", params.groupKey);
    if (params.groupId) query.set("groupId", params.groupId);
    const data = await apiClient.get<DictItem[]>(`/api/dicts/items?${query.toString()}`);
    return wrapSuccess(data);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载字典项失败");
  }
};

export interface CreateDictGroupData {
  groupKey: string;
  groupName: string;
  status?: string;
}

export const createDictGroup = async (data: CreateDictGroupData): Promise<ApiResponse<DictGroup>> => {
  try {
    const response = await apiClient.post<DictGroup>("/api/dicts/groups", {
      groupKey: data.groupKey,
      groupName: data.groupName,
      status: data.status,
    });
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "创建字典分组失败");
  }
};

export interface UpdateDictGroupData {
  groupName?: string;
  status?: string;
}

export const updateDictGroup = async (
  groupId: string,
  data: UpdateDictGroupData
): Promise<ApiResponse<DictGroup>> => {
  try {
    const response = await apiClient.put<DictGroup>(`/api/dicts/groups/${groupId}`, data);
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "更新字典分组失败");
  }
};

export const deleteDictGroup = async (groupId: string): Promise<ApiResponse<void>> => {
  try {
    await apiClient.delete<void>(`/api/dicts/groups/${groupId}`);
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "删除字典分组失败");
  }
};

export interface CreateDictItemData {
  groupId: string;
  itemKey: string;
  itemValue: string;
  status?: string;
  sortOrder?: number;
}

export const createDictItem = async (data: CreateDictItemData): Promise<ApiResponse<DictItem>> => {
  try {
    const response = await apiClient.post<DictItem>("/api/dicts/items", data);
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "创建字典项失败");
  }
};

export interface UpdateDictItemData {
  itemKey?: string;
  itemValue?: string;
  status?: string;
  sortOrder?: number;
}

export const updateDictItem = async (
  itemId: string,
  data: UpdateDictItemData
): Promise<ApiResponse<DictItem>> => {
  try {
    const response = await apiClient.put<DictItem>(`/api/dicts/items/${itemId}`, data);
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "更新字典项失败");
  }
};

export const deleteDictItem = async (itemId: string): Promise<ApiResponse<void>> => {
  try {
    await apiClient.delete<void>(`/api/dicts/items/${itemId}`);
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "删除字典项失败");
  }
};
