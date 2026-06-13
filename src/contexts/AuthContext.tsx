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

  // 初始化时检查本地存储的 session
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

  const completeSsoLogin = useCallback(async (
    request: authService.SsoCallbackRequest
  ): Promise<{ success: boolean; error?: string; passwordChangeRequired?: boolean }> => {
    try {
      const result = await authService.completeSsoLogin(request);
      return persistLogin(result);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'SSO 登录失败' };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await authService.register(email, password, name);
      return await login(email, password);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '注册失败' };
    }
  }, [login]);

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
