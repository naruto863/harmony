import { ApiResponse, ConfigItem } from "@/types";
import { apiClient } from "./apiClient";

const wrapSuccess = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

const wrapError = (message: string): ApiResponse<never> => ({
  success: false,
  error: { code: "REQUEST_FAILED", message },
});

export const getConfigs = async (env?: string): Promise<ApiResponse<ConfigItem[]>> => {
  try {
    const query = env ? `?env=${env}` : "";
    const data = await apiClient.get<ConfigItem[]>(`/api/configs${query}`);
    return wrapSuccess(data);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载参数失败");
  }
};

export interface CreateConfigData {
  configKey: string;
  configValue: string;
  env?: string;
  type?: string;
  status?: string;
  sensitive?: boolean;
  validationRule?: string;
}

export const createConfig = async (data: CreateConfigData): Promise<ApiResponse<ConfigItem>> => {
  try {
    const response = await apiClient.post<ConfigItem>("/api/configs", data);
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "创建参数失败");
  }
};

export interface UpdateConfigData {
  configValue?: string;
  env?: string;
  type?: string;
  status?: string;
  sensitive?: boolean;
  validationRule?: string;
}

export const updateConfig = async (
  configId: string,
  data: UpdateConfigData
): Promise<ApiResponse<ConfigItem>> => {
  try {
    const response = await apiClient.put<ConfigItem>(`/api/configs/${configId}`, data);
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "更新参数失败");
  }
};

export const deleteConfig = async (configId: string): Promise<ApiResponse<void>> => {
  try {
    await apiClient.delete<void>(`/api/configs/${configId}`);
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "删除参数失败");
  }
};
