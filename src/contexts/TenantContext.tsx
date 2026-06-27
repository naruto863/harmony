import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Tenant } from '@/types';
import { useAuth } from './AuthContext';
import * as tenantService from '@/services/tenantService';
import { setTokens } from '@/services/tokenStorage';

interface TenantContextType {
  currentTenant: Tenant | null;
  userTenants: Tenant[];
  isLoading: boolean;
  selectTenant: (tenantId: string) => void;
  switchTenant: (tenantId: string) => Promise<void>;
  setCurrentTenant: React.Dispatch<React.SetStateAction<Tenant | null>>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const TENANT_KEY = 'admin_studio_tenant';

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userTenants, setUserTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 登录态变化后加载当前用户可访问的租户。
   *
   * 这里的恢复顺序很重要：
   * 1. 优先使用上次选择的 tenantId，让刷新页面后仍停留在原工作空间。
   * 2. 如果用户只有一个租户，自动选择它，减少首次登录后的额外交互。
   * 3. 如果用户有多个租户且没有历史选择，则保持 currentTenant 为空，让 AuthGuard 引导选择。
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      tenantService.getMyTenants()
        .then(tenants => {
          setUserTenants(tenants);
          const storedTenantId = localStorage.getItem(TENANT_KEY);
          if (storedTenantId) {
            const tenant = tenants.find(t => t.id === storedTenantId);
            if (tenant) {
              setCurrentTenant(tenant);
            }
          }
          if (tenants.length === 1 && !storedTenantId) {
            setCurrentTenant(tenants[0]);
            localStorage.setItem(TENANT_KEY, tenants[0].id);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setUserTenants([]);
      setCurrentTenant(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  /**
   * 本地选择租户，仅在已有 userTenants 列表中查找。
   * 适用于后端没有返回新 token 的场景；真正的跨租户切换优先走 switchTenant。
   */
  const selectTenant = useCallback((tenantId: string) => {
    const tenant = userTenants.find(t => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      localStorage.setItem(TENANT_KEY, tenantId);
    }
  }, [userTenants]);

  /**
   * 租户切换可能会改变权限范围，因此后端如果返回新的 token 必须立即覆盖本地 token。
   * 若外部 API 只返回成功而不回传 tenant 对象，则回退到本地租户列表选择，兼容轻量后端实现。
   */
  const switchTenant = useCallback((tenantId: string) => {
    return tenantService.switchTenant(tenantId)
      .then(response => {
        if (response.accessToken && response.refreshToken) {
          setTokens(response.accessToken, response.refreshToken);
        }
        if (response.tenant) {
          setCurrentTenant(response.tenant);
          localStorage.setItem(TENANT_KEY, response.tenant.id);
          return;
        }
        selectTenant(tenantId);
      })
      .catch(() => {});
  }, [selectTenant]);

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        userTenants,
        isLoading,
        selectTenant,
        switchTenant,
        setCurrentTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
