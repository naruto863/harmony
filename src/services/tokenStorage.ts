const ACCESS_TOKEN_KEY = "ha_access_token";
const REFRESH_TOKEN_KEY = "ha_refresh_token";

export const TOKEN_STORAGE_POLICY = Object.freeze({
  current: "localStorage",
  acceptedRisk: "MVP 阶段短期保留 localStorage，所有 token 读写必须集中在 tokenStorage.ts。",
  mitigation: "禁止把 token 暴露给页面组件；配合 CSP、依赖治理和 XSS 审查降低脚本读取风险。",
  migrationTarget: "中期迁移到 httpOnly Cookie，或内存 Access Token + Refresh Token 轮换。",
});

const getStorage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const getAccessToken = (): string | null => getStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
export const getRefreshToken = (): string | null => getStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;

export const setTokens = (accessToken: string, refreshToken: string) => {
  const storage = getStorage();
  if (!storage || !accessToken || !refreshToken) return;
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = () => {
  const storage = getStorage();
  storage?.removeItem(ACCESS_TOKEN_KEY);
  storage?.removeItem(REFRESH_TOKEN_KEY);
};
