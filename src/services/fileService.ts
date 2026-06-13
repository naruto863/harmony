import { ApiResponse } from "@/types";
import { apiClient } from "./apiClient";

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  tenantId: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  isFolder: boolean;
  parentId: string | null;
}

export interface GetFilesParams {
  tenantId: string;
  parentId?: string | null;
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
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

export const getFiles = async (params: GetFilesParams): Promise<ApiResponse<FileItem[]>> => {
  try {
    const query = new URLSearchParams();
    query.set("tenantId", params.tenantId);
    if (params.parentId !== undefined) query.set("parentId", params.parentId ?? "");
    query.set("page", String(params.page || 1));
    query.set("size", String(resolvePageSize(params.pageSize, 20)));
    if (params.search) query.set("search", params.search);
    if (params.type) query.set("type", params.type);
    const result = await apiClient.get<{
      list: FileItem[];
      total: number;
      page: number;
      size: number;
    }>(`/api/files?${query.toString()}`);
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
    return wrapError(error instanceof Error ? error.message : "加载文件失败");
  }
};

export const getFolderPath = async (_folderId?: string | null): Promise<ApiResponse<FileItem[]>> => {
  return wrapSuccess([]);
};

export const createFolder = async (data: { name: string; parentId: string | null; tenantId: string; userId: string; userName: string }): Promise<ApiResponse<FileItem>> => {
  try {
    const response = await apiClient.post<FileItem>(`/api/files/folders?tenantId=${data.tenantId}`, {
      name: data.name,
      parentId: data.parentId,
    });
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "创建文件夹失败");
  }
};

export const uploadFile = async (data: { file: File; parentId: string | null; tenantId: string; userId: string; userName: string }): Promise<ApiResponse<FileItem>> => {
  try {
    const response = await apiClient.upload<FileItem>(
      `/api/files/upload?tenantId=${data.tenantId}&parentId=${data.parentId ?? ""}`,
      data.file
    );
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "上传失败");
  }
};

export const renameFile = async (): Promise<ApiResponse<FileItem>> => {
  return wrapError("未实现");
};

export const moveFile = async (): Promise<ApiResponse<FileItem>> => {
  return wrapError("未实现");
};

export const deleteFile = async (fileId: string): Promise<ApiResponse<void>> => {
  try {
    await apiClient.delete<void>(`/api/files/${fileId}`);
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "删除失败");
  }
};

export const batchDeleteFiles = async (fileIds: string[]): Promise<ApiResponse<void>> => {
  try {
    await Promise.all(fileIds.map((id) => apiClient.delete<void>(`/api/files/${id}`)));
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "批量删除失败");
  }
};

export const getFileById = async (): Promise<ApiResponse<FileItem>> => {
  return wrapError("未实现");
};

export const getStorageStats = async (tenantId: string): Promise<ApiResponse<{ used: number; total: number; fileCount: number; folderCount: number }>> => {
  try {
    const result = await getFiles({ tenantId, page: 1, pageSize: MAX_PAGE_SIZE });
    if (!result.success || !result.data) {
      return wrapError("加载统计失败");
    }
    const files = result.data;
    const used = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const fileCount = files.filter((f) => !f.isFolder).length;
    const folderCount = files.filter((f) => f.isFolder).length;
    return wrapSuccess({ used, total: 10 * 1024 * 1024 * 1024, fileCount, folderCount });
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载统计失败");
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileIconType = (file: FileItem): string => {
  if (file.isFolder) return "folder";
  const type = file.type.toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.includes("pdf")) return "pdf";
  if (type.includes("word") || type.includes("document")) return "word";
  if (type.includes("excel") || type.includes("spreadsheet")) return "excel";
  if (type.includes("powerpoint") || type.includes("presentation")) return "ppt";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type.includes("zip") || type.includes("rar") || type.includes("7z")) return "archive";
  return "file";
};
