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

  // 获取用户所属的租户列表
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

  const selectTenant = useCallback((tenantId: string) => {
    const tenant = userTenants.find(t => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      localStorage.setItem(TENANT_KEY, tenantId);
    }
  }, [userTenants]);

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
