import { apiClient } from "./apiClient";
import { demoLogin, demoLogout, demoRefreshToken, demoRegister, isDemoApiEnabled } from "./demoApi";
import type { User } from "@/types";

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
  tenants: Array<{ id: string; name: string; plan: "free" | "pro" | "enterprise"; code?: string; status?: string }>;
  passwordChangeRequired: boolean;
};

export type LoginOptions = {
  tenantId?: string;
  captchaId?: string;
  captchaCode?: string;
  rememberMe?: boolean;
};

export type CaptchaChallenge = {
  captchaId: string;
  imageUrl?: string;
  imageBase64?: string;
  expiresAt?: string;
};

export type PasswordResetConfirmRequest = {
  token: string;
  newPassword: string;
};

export type SsoProvider = {
  id: string;
  name: string;
  type: "oauth2" | "oidc" | "saml" | string;
  enabled: boolean;
  iconUrl?: string;
};

export type SsoStartRequest = {
  providerId: string;
  redirectUri?: string;
};

export type SsoStartResponse = {
  redirectUrl: string;
  state: string;
};

export type SsoCallbackRequest = {
  providerId?: string;
  code: string;
  state?: string;
  redirectUri?: string;
};

const normalizeLoginOptions = (options?: string | LoginOptions): LoginOptions => {
  if (typeof options === "string") {
    return { tenantId: options };
  }
  return options ?? {};
};

/**
 * authService 是页面和 API 实现之间的适配层。
 * 页面只调用这里的登录能力，不需要知道当前环境走 Demo Mock 还是真实后端接口。
 */
export const login = (email: string, password: string, options?: string | LoginOptions) => {
  const loginOptions = normalizeLoginOptions(options);
  if (isDemoApiEnabled()) {
    return demoLogin(email, password, loginOptions.tenantId);
  }
  return apiClient.post<LoginResponse>("/api/auth/login", {
    email,
    password,
    ...loginOptions,
  });
};

// Demo 模式明确禁止注册，避免用户误以为本地 mock 会创建真实账号。
export const register = (email: string, password: string, name: string) => {
  if (isDemoApiEnabled()) {
    return demoRegister();
  }
  return apiClient.post<void>("/api/auth/register", { email, password, name });
};

/**
 * refreshToken 保留与真实 API 一致的函数形状。
 * 当前 apiClient 自己实现了 401 刷新流程，此函数主要供显式刷新场景或后续扩展复用。
 */
export const refreshToken = (refreshTokenValue: string) => {
  if (isDemoApiEnabled()) {
    return demoRefreshToken();
  }
  return apiClient.post<{ accessToken: string; refreshToken: string }>("/api/auth/refresh", {
    refreshToken: refreshTokenValue,
  });
};

export const logout = (refreshTokenValue: string) => {
  if (isDemoApiEnabled()) {
    return demoLogout();
  }
  return apiClient.post<void>("/api/auth/logout", { refreshToken: refreshTokenValue });
};

// 验证码、密码重置和 SSO 都属于外部身份能力，Demo 环境只给出安全的空结果或明确拒绝。
export const getCaptchaChallenge = () => {
  if (isDemoApiEnabled()) {
    return Promise.resolve(null);
  }
  return apiClient.get<CaptchaChallenge>("/api/auth/captcha");
};

export const requestPasswordReset = (email: string) => {
  if (isDemoApiEnabled()) {
    return Promise.resolve();
  }
  return apiClient.post<void>("/api/auth/password-reset/request", { email });
};

export const confirmPasswordReset = (request: PasswordResetConfirmRequest) => {
  if (isDemoApiEnabled()) {
    return Promise.resolve();
  }
  return apiClient.post<void>("/api/auth/password-reset/confirm", request);
};

export const getSsoProviders = () => {
  if (isDemoApiEnabled()) {
    return Promise.resolve<SsoProvider[]>([]);
  }
  return apiClient.get<SsoProvider[]>("/api/auth/sso/providers");
};

export const startSsoLogin = (request: SsoStartRequest) => {
  if (isDemoApiEnabled()) {
    return Promise.reject(new Error("SSO 登录需要外部身份源，请关闭 Demo Mock 后接入真实 API。"));
  }
  return apiClient.post<SsoStartResponse>("/api/auth/sso/start", request);
};

export const completeSsoLogin = (request: SsoCallbackRequest) => {
  if (isDemoApiEnabled()) {
    return Promise.reject(new Error("SSO 回调需要外部身份源，请关闭 Demo Mock 后接入真实 API。"));
  }
  return apiClient.post<LoginResponse>("/api/auth/sso/callback", request);
};
