import { AUTH_EVENTS, emitAuthEvent } from "@/lib/authEvents";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./tokenStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:9080";

export type ApiEnvelopeResponse<T> = {
  code: number;
  message: string;
  data?: T;
  traceId?: string | null;
  timestamp?: string | null;
};

export type ApiFieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  code?: number;
  status?: number;
  traceId?: string | null;
  timestamp?: string | null;
  fieldErrors?: ApiFieldErrors;

  constructor(
    message: string,
    options: {
      code?: number;
      status?: number;
      traceId?: string | null;
      timestamp?: string | null;
      fieldErrors?: ApiFieldErrors;
    } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
    this.traceId = options.traceId ?? null;
    this.timestamp = options.timestamp ?? null;
    this.fieldErrors = options.fieldErrors;
  }
}

const AUTH_PATH_PREFIX = "/api/auth";
const REFRESH_PATH = "/api/auth/refresh";
const PERMISSION_REFRESH_PATHS = ["/api/permissions", "/api/menus/tree"];

/**
 * HeadersInit 既可能是普通对象，也可能是 Headers 实例或二维数组。
 * 统一转成 Headers 后再覆盖，可以避免调用方传入同名 header 时出现大小写不一致、
 * 重复字段或覆盖顺序不明确的问题。
 */
const mergeHeaders = (base: HeadersInit, extra?: HeadersInit) => {
  const headers = new Headers(base);
  if (extra) {
    const extraHeaders = new Headers(extra);
    extraHeaders.forEach((value, key) => headers.set(key, value));
  }
  return headers;
};

/**
 * 所有业务请求都从这里补齐默认请求头：
 * - 普通 JSON 请求默认带 Content-Type，FormData 交给浏览器自动生成 multipart boundary。
 * - Access Token 只在 API client 层读取，页面组件不直接接触 token 存储细节。
 * - 调用方自定义 header 放在最后合并，便于覆盖特殊接口需要的字段。
 */
const buildHeaders = (headers?: HeadersInit, isFormData?: boolean) => {
  const token = getAccessToken();
  const baseHeaders: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return mergeHeaders(baseHeaders, headers);
};

/**
 * 后端约定所有业务响应都包在 ApiEnvelopeResponse 中。
 * 这里用窄类型守卫先确认最小契约，避免把非约定响应误当成业务成功数据。
 */
const isApiEnvelopeResponse = (value: unknown): value is ApiEnvelopeResponse<unknown> => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ApiEnvelopeResponse<unknown>>;
  return typeof candidate.code === "number" && typeof candidate.message === "string";
};

/**
 * 响应体可能为空、不是 JSON、或不是后端约定的 envelope。
 * 解析失败不直接抛出，是为了让 request() 能继续基于 HTTP status 构造统一错误。
 */
const safeParseJson = async (response: Response): Promise<ApiEnvelopeResponse<unknown> | null> => {
  try {
    const text = await response.text();
    if (!text) return null;
    const payload = JSON.parse(text);
    return isApiEnvelopeResponse(payload) ? payload : null;
  } catch {
    return null;
  }
};

/**
 * 5xx 错误不把后端原始 message 直接展示给用户。
 * traceId 保留给客服/研发排查，用户侧看到的是稳定、可理解的提示文案。
 */
const safeErrorMessage = (
  status: number,
  rawMessage: string,
  traceId?: string | null
) => {
  if (status >= 500) {
    return traceId ? `系统异常，请稍后重试（TraceId: ${traceId}）` : "系统异常，请稍后重试";
  }
  return rawMessage;
};

const isFieldErrors = (value: unknown): value is ApiFieldErrors => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every((messages) =>
    Array.isArray(messages) && messages.every((message) => typeof message === "string")
  );
};

/**
 * 422 等表单校验错误通常会把字段错误放在 data.fieldErrors。
 * 这里做结构校验后再暴露给表单层，避免 UI 依赖不可控的后端原始对象。
 */
const getFieldErrors = (payload: ApiEnvelopeResponse<unknown> | null): ApiFieldErrors | undefined => {
  const data = payload?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return undefined;
  const candidate = (data as { fieldErrors?: unknown }).fieldErrors;
  return isFieldErrors(candidate) ? candidate : undefined;
};

let refreshPromise: Promise<boolean> | null = null;

/**
 * 刷新 token 使用进程内互斥：
 * 多个请求同时收到 401 时，只发起一次 refresh，其他请求复用同一个 Promise。
 * 这样可以减少刷新接口的并发压力，也避免后到的旧 refresh 结果覆盖新 token。
 */
const refreshTokens = async (): Promise<boolean> => {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const payload = await safeParseJson(response);
      if (!response.ok || !payload || payload.code !== 0 || !payload.data) {
        return false;
      }
      const data = payload.data as { accessToken: string; refreshToken: string };
      if (!data.accessToken || !data.refreshToken) return false;
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
};

type RequestOptions = {
  headers?: HeadersInit;
  body?: unknown;
  isFormData?: boolean;
  /** 内部重试标记：401 刷新 token 后最多重放一次原请求，防止无限递归。 */
  retry?: boolean;
};

/**
 * 统一请求入口，负责把 fetch 的底层差异收敛为项目内一致的调用语义：
 * - 成功时只返回 envelope.data，业务服务不需要重复拆包。
 * - 网络错误、业务错误和 HTTP 错误统一抛 ApiError。
 * - 401 尝试刷新 token 并重放原请求，刷新失败后广播登出事件。
 * - 403 广播权限失效事件，让菜单和权限上下文自行刷新。
 */
const request = async <T>(method: string, path: string, options: RequestOptions = {}): Promise<T> => {
  const doFetch = () => {
    const init: RequestInit = {
      method,
      headers: buildHeaders(options.headers, options.isFormData),
    };
    if (options.body !== undefined) {
      init.body = options.isFormData ? (options.body as BodyInit) : JSON.stringify(options.body);
    }
    return fetch(`${API_BASE_URL}${path}`, init);
  };

  let response: Response;
  try {
    response = await doFetch();
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "网络异常");
  }

  const payload = await safeParseJson(response);
  if (response.ok) {
    if (!payload) {
      return undefined as T;
    }
    if (payload.code === 0) {
      return payload.data as T;
    }
  }

  const status = response.status;
  const code = payload?.code;
  const traceId = payload?.traceId ?? response.headers.get("X-Trace-Id");
  const message = safeErrorMessage(status, payload?.message || response.statusText || "请求失败", traceId);
  const error = new ApiError(message, {
    code,
    status,
    traceId,
    timestamp: payload?.timestamp ?? null,
    fieldErrors: getFieldErrors(payload),
  });
  const isUnauthorized = status === 401 || code === 401;
  const isForbidden = status === 403 || code === 403;

  // 登录、注册、刷新等认证接口本身不能触发 refresh 重试，否则会形成认证链路自调用。
  if (
    isUnauthorized &&
    !options.retry &&
    !path.startsWith(AUTH_PATH_PREFIX)
  ) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return request<T>(method, path, { ...options, retry: true });
    }
    clearTokens();
    emitAuthEvent(AUTH_EVENTS.logout, { reason: "unauthorized", message });
  }

  // 权限和菜单刷新接口自己的 403 不再继续广播，避免刷新失败时造成事件循环。
  if (
    isForbidden &&
    !path.startsWith(AUTH_PATH_PREFIX) &&
    !PERMISSION_REFRESH_PATHS.some((refreshPath) => path.startsWith(refreshPath))
  ) {
    emitAuthEvent(AUTH_EVENTS.accessDenied, { message, path });
  }

  throw error;
};

export const apiClient = {
  get: async <T>(path: string, headers?: HeadersInit): Promise<T> => {
    return request<T>("GET", path, { headers });
  },
  post: async <T>(path: string, body?: unknown, headers?: HeadersInit): Promise<T> => {
    return request<T>("POST", path, { body, headers });
  },
  put: async <T>(path: string, body?: unknown, headers?: HeadersInit): Promise<T> => {
    return request<T>("PUT", path, { body, headers });
  },
  patch: async <T>(path: string, body?: unknown, headers?: HeadersInit): Promise<T> => {
    return request<T>("PATCH", path, { body, headers });
  },
  delete: async <T>(path: string, headers?: HeadersInit): Promise<T> => {
    return request<T>("DELETE", path, { headers });
  },
  upload: async <T>(path: string, file: File, extra?: Record<string, string>): Promise<T> => {
    const formData = new FormData();
    formData.append("file", file);
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => formData.append(key, value));
    }
    return request<T>("POST", path, { body: formData, isFormData: true });
  },
};
