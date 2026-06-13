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

export const login = (email: string, password: string, tenantId?: string) => {
  if (isDemoApiEnabled()) {
    return demoLogin(email, password, tenantId);
  }
  return apiClient.post<LoginResponse>("/api/auth/login", { email, password, tenantId });
};

export const register = (email: string, password: string, name: string) => {
  if (isDemoApiEnabled()) {
    return demoRegister();
  }
  return apiClient.post<void>("/api/auth/register", { email, password, name });
};

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
