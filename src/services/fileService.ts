import { ApiResponse } from "@/types";
import { ApiError, apiClient } from "./apiClient";

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

export interface UploadPolicy {
  maxFileSize: number;
  allowedMimeTypes: string[];
  maxFilesPerUpload: number;
  remainingQuota: number;
  storageStrategy?: string;
  note?: string;
}

export interface FileAccessUrl {
  url: string;
  expiresAt?: string;
}

export interface FilePreviewUrl {
  previewable: boolean;
  previewUrl?: string;
  expiresAt?: string;
  reason?: string;
}

/**
 * 文件服务当前完全走外部 API，不做本地 Demo 文件系统。
 * 这样可以避免浏览器 object URL 或 localStorage 被误当成可持久化文件存储。
 */
const wrapSuccess = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

const wrapError = (message: string, error?: unknown): ApiResponse<never> => ({
  success: false,
  error: {
    code: error instanceof ApiError && error.code ? String(error.code) : "REQUEST_FAILED",
    message,
    status: error instanceof ApiError ? error.status : undefined,
    traceId: error instanceof ApiError ? error.traceId : undefined,
    fieldErrors: error instanceof ApiError ? error.fieldErrors : undefined,
  },
});

const MAX_PAGE_SIZE = 100;

// 文件列表和统计都限制单次 pageSize，防止大目录一次性拉取过多元数据。
const resolvePageSize = (pageSize: number | undefined, fallback: number) => {
  return Math.min(Math.max(pageSize ?? fallback, 1), MAX_PAGE_SIZE);
};

export const getFiles = async (params: GetFilesParams): Promise<ApiResponse<FileItem[]>> => {
  try {
    const query = new URLSearchParams();
    query.set("tenantId", params.tenantId);
    // parentId=null 表示根目录；undefined 表示调用方没有声明目录过滤意图。
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
    return wrapError(error instanceof Error ? error.message : "加载文件失败", error);
  }
};

export const getUploadPolicy = async (params: {
  tenantId: string;
  parentId?: string | null;
}): Promise<ApiResponse<UploadPolicy>> => {
  try {
    // 上传策略由后端返回，前端只展示和预校验，不在浏览器硬编码租户配额。
    const query = new URLSearchParams();
    query.set("tenantId", params.tenantId);
    if (params.parentId !== undefined) query.set("parentId", params.parentId ?? "");
    const policy = await apiClient.get<UploadPolicy>(`/api/files/upload-policy?${query.toString()}`);
    return wrapSuccess(policy);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载上传限制失败", error);
  }
};

export const getFileDownloadUrl = async (fileId: string): Promise<ApiResponse<FileAccessUrl>> => {
  try {
    // 下载链接通常是短期签名 URL，页面只消费结果，不拼接真实存储地址。
    const result = await apiClient.get<FileAccessUrl>(`/api/files/${fileId}/download-url`);
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "获取下载链接失败", error);
  }
};

export const getFilePreviewUrl = async (fileId: string): Promise<ApiResponse<FilePreviewUrl>> => {
  try {
    // 预览能力由后端按 MIME 类型、权限和转码状态决定，前端不猜测可预览性。
    const result = await apiClient.get<FilePreviewUrl>(`/api/files/${fileId}/preview-url`);
    return wrapSuccess(result);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "获取预览链接失败", error);
  }
};

export const getFolderPath = async (_folderId?: string | null): Promise<ApiResponse<FileItem[]>> => {
  // 面包屑路径暂未接入外部 API，返回空数组让页面降级展示当前目录。
  return wrapSuccess([]);
};

export const createFolder = async (data: { name: string; parentId: string | null; tenantId: string; userId: string; userName: string }): Promise<ApiResponse<FileItem>> => {
  try {
    // userId/userName 保留在入参中兼容旧页面形态，真实创建者以后端 token 解析为准。
    const response = await apiClient.post<FileItem>(`/api/files/folders?tenantId=${data.tenantId}`, {
      name: data.name,
      parentId: data.parentId,
    });
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "创建文件夹失败", error);
  }
};

export const uploadFile = async (data: { file: File; parentId: string | null; tenantId: string; userId: string; userName: string }): Promise<ApiResponse<FileItem>> => {
  try {
    // 文件内容必须通过 multipart 上传；不要把 File 转成 base64 放入 JSON 请求体。
    const response = await apiClient.upload<FileItem>(
      `/api/files/upload?tenantId=${data.tenantId}&parentId=${data.parentId ?? ""}`,
      data.file
    );
    return wrapSuccess(response);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "上传失败", error);
  }
};

export const renameFile = async (): Promise<ApiResponse<FileItem>> => {
  // 占位接口用于页面能力矩阵；真实重命名 API 未约定前保持显式未实现。
  return wrapError("未实现");
};

export const moveFile = async (): Promise<ApiResponse<FileItem>> => {
  // 移动文件涉及目标目录权限和冲突处理，不能在前端用列表重排模拟。
  return wrapError("未实现");
};

export const deleteFile = async (fileId: string): Promise<ApiResponse<void>> => {
  try {
    await apiClient.delete<void>(`/api/files/${fileId}`);
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "删除失败", error);
  }
};

export const batchDeleteFiles = async (fileIds: string[]): Promise<ApiResponse<void>> => {
  try {
    // 当前后端契约没有批量删除接口时逐个删除；任何一个失败都让页面按失败处理。
    await Promise.all(fileIds.map((id) => apiClient.delete<void>(`/api/files/${id}`)));
    return wrapSuccess(undefined);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "批量删除失败", error);
  }
};

export const getFileById = async (): Promise<ApiResponse<FileItem>> => {
  // 详情读取暂未纳入当前页面流程，避免提供一个半真半假的本地查找实现。
  return wrapError("未实现");
};

export const getStorageStats = async (tenantId: string): Promise<ApiResponse<{ used: number; total: number; fileCount: number; folderCount: number }>> => {
  try {
    // 这是轻量概览：基于第一页最多 100 条文件元数据估算，不替代后端真实容量统计。
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
    return wrapError(error instanceof Error ? error.message : "加载统计失败", error);
  }
};

export const formatFileSize = (bytes: number): string => {
  // 只负责展示单位换算，不做配额或二进制/十进制口径决策。
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileIconType = (file: FileItem): string => {
  // 图标类型是 UI 提示，不作为文件安全判断；下载/预览权限仍以后端结果为准。
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
