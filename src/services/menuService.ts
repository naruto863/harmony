import { ApiResponse, MenuItem } from "@/types";
import { apiClient } from "./apiClient";
import { demoGetMenuTree, isDemoApiEnabled } from "./demoApi";

export interface CreateMenuData {
  name: string;
  path?: string;
  parentId?: string | null;
  icon?: string;
  type?: string;
  sortOrder?: number;
  visible?: boolean;
  permissionCode?: string;
}

export interface UpdateMenuData {
  name?: string;
  path?: string;
  parentId?: string | null;
  icon?: string;
  type?: string;
  sortOrder?: number;
  visible?: boolean;
  permissionCode?: string;
}

const wrapSuccess = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

const wrapError = (message: string): ApiResponse<never> => ({
  success: false,
  error: { code: "REQUEST_FAILED", message },
});

export const getMenuTree = async (tenantId?: string): Promise<ApiResponse<MenuItem[]>> => {
  if (isDemoApiEnabled()) {
    return wrapSuccess(await demoGetMenuTree());
  }
  try {
    const query = tenantId ? `?tenantId=${tenantId}` : "";
    const data = await apiClient.get<MenuItem[]>(`/api/menus/tree${query}`);
    return wrapSuccess(data);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载菜单失败");
  }
};

export const createMenu = async (data: CreateMenuData): Promise<ApiResponse<MenuItem>> => {
  try {
    const response = await apiClient.post<MenuItem>("/api/menus", {
      name: data.name,
      path: data.path,
      parentId: data.parentId,
      icon: data.icon,
      type: data.type,
      sortOrder: data.sortOrder,
      visible: data.visible,
      permissionCode: data.permissionCode,
    });
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "创建菜单失败");
  }
};

export const updateMenu = async (menuId: string, data: UpdateMenuData): Promise<ApiResponse<MenuItem>> => {
  try {
    const response = await apiClient.put<MenuItem>(`/api/menus/${menuId}`, {
      name: data.name,
      path: data.path,
      parentId: data.parentId,
      icon: data.icon,
      type: data.type,
      sortOrder: data.sortOrder,
      visible: data.visible,
      permissionCode: data.permissionCode,
    });
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "更新菜单失败");
  }
};

export const deleteMenu = async (menuId: string): Promise<ApiResponse<void>> => {
  try {
    await apiClient.delete<void>(`/api/menus/${menuId}`);
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "删除菜单失败");
  }
};
