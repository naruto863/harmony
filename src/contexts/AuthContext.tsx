import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, Session } from '@/types';
import * as authService from '@/services/authService';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/services/tokenStorage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, options?: authService.LoginOptions) => Promise<{ success: boolean; error?: string; passwordChangeRequired?: boolean }>;
  completeSsoLogin: (request: authService.SsoCallbackRequest) => Promise<{ success: boolean; error?: string; passwordChangeRequired?: boolean }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'admin_studio_session';
const USER_KEY = 'admin_studio_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 应用启动时只做本地会话恢复，不主动调用远端校验接口。
   * 原因是 App 首屏还需要等待租户、权限和菜单上下文继续完成各自加载；
   * 如果这里阻塞到远端探活，会放大登录态恢复失败对整个应用的影响。
   *
   * 存储内容必须同时满足 session、user 和 access token 都存在。
   * 任一数据损坏时清空整组登录态，避免 UI 进入“有用户但没有 token”的半登录状态。
   */
  useEffect(() => {
    const storedSession = localStorage.getItem(SESSION_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    const accessToken = getAccessToken();
    if (storedSession && storedUser && accessToken) {
      try {
        const parsedSession = JSON.parse(storedSession) as Session;
        const parsedUser = JSON.parse(storedUser) as User;
        setSession(parsedSession);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(USER_KEY);
        clearTokens();
      }
    }
    setIsLoading(false);
  }, []);

  /**
   * 登录成功后的唯一持久化入口。
   * 这里同时写入 tokenStorage、React state 和 localStorage 快照，保证刷新页面后
   * AuthProvider 可以恢复最小登录态，而后续租户/权限/菜单再按当前租户重新拉取。
   */
  const persistLogin = useCallback((result: authService.LoginResponse) => {
    setTokens(result.accessToken, result.refreshToken);
    const newSession: Session = {
      user: result.user,
      accessToken: result.accessToken,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      passwordChangeRequired: result.passwordChangeRequired,
    };
    setUser(result.user);
    setSession(newSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    return { success: true, passwordChangeRequired: result.passwordChangeRequired };
  }, []);

  /**
   * 账号密码登录只负责调用 authService 并归一化结果。
   * 错误不会继续向外抛给页面，页面只需要处理 success/error 两种结果即可。
   */
  const login = useCallback(async (
    email: string,
    password: string,
    options?: authService.LoginOptions
  ): Promise<{ success: boolean; error?: string; passwordChangeRequired?: boolean }> => {
    try {
      const result = await authService.login(email, password, options);
      return persistLogin(result);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '登录失败' };
    }
  }, [persistLogin]);

  /**
   * SSO 回调和普通登录复用同一套持久化逻辑。
   * 这样不管登录来源是什么，后续的租户选择、权限加载和菜单生成都走同一条状态链路。
   */
  const completeSsoLogin = useCallback(async (
    request: authService.SsoCallbackRequest
  ): Promise<{ success: boolean; error?: string; passwordChangeRequired?: boolean }> => {
    try {
      const result = await authService.completeSsoLogin(request);
      return persistLogin(result);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'SSO 登录失败' };
    }
  }, [persistLogin]);

  /**
   * 注册成功后直接尝试登录，避免页面层重复拼装“注册 -> 登录”的流程。
   * Demo 模式下 register 会由 service 层明确拒绝，保持这里的控制流不变。
   */
  const register = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await authService.register(email, password, name);
      return await login(email, password);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '注册失败' };
    }
  }, [login]);

  /**
   * 登出优先清本地状态，远端 logout 失败不阻塞用户退出。
   * 同时移除租户选择，防止下一次登录其他账号时复用旧账号的 tenantId。
   */
  const logout = useCallback(() => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      authService.logout(refreshToken).catch(() => {});
    }
    setUser(null);
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('admin_studio_tenant');
    clearTokens();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!session,
        login,
        completeSsoLogin,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
