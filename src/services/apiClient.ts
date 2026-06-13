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

const mergeHeaders = (base: HeadersInit, extra?: HeadersInit) => {
  const headers = new Headers(base);
  if (extra) {
    const extraHeaders = new Headers(extra);
    extraHeaders.forEach((value, key) => headers.set(key, value));
  }
  return headers;
};

const buildHeaders = (headers?: HeadersInit, isFormData?: boolean) => {
  const token = getAccessToken();
  const baseHeaders: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return mergeHeaders(baseHeaders, headers);
};

const isApiEnvelopeResponse = (value: unknown): value is ApiEnvelopeResponse<unknown> => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ApiEnvelopeResponse<unknown>>;
  return typeof candidate.code === "number" && typeof candidate.message === "string";
};

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

const getFieldErrors = (payload: ApiEnvelopeResponse<unknown> | null): ApiFieldErrors | undefined => {
  const data = payload?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return undefined;
  const candidate = (data as { fieldErrors?: unknown }).fieldErrors;
  return isFieldErrors(candidate) ? candidate : undefined;
};

let refreshPromise: Promise<boolean> | null = null;

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
  retry?: boolean;
};

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
