import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Role } from '@/types';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';
import { getMyRole } from '@/services/roleService';
import { getMyPermissions } from '@/services/permissionService';
import { AUTH_EVENTS, onAuthEvent } from '@/lib/authEvents';

interface PermissionContextType {
  role: Role | null;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { currentTenant } = useTenant();
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  const refreshPermissions = useCallback(async () => {
    if (!isAuthenticated || !currentTenant) {
      setRole(null);
      setPermissions([]);
      return;
    }
    const roleResponse = await getMyRole();
    if (roleResponse.success) {
      setRole(roleResponse.data || null);
    }
    try {
      const latestPermissions = await getMyPermissions();
      setPermissions(latestPermissions);
    } catch {
      setPermissions([]);
    }
  }, [isAuthenticated, currentTenant]);

  useEffect(() => {
    void refreshPermissions();
  }, [refreshPermissions]);

  useEffect(() => {
    if (!isAuthenticated || !currentTenant) {
      return;
    }
    return onAuthEvent(AUTH_EVENTS.accessDenied, () => {
      void refreshPermissions();
    });
  }, [isAuthenticated, currentTenant, refreshPermissions]);

  const hasPermission = (permission: string): boolean => {
    if (!role) return false;
    // SuperAdmin 拥有所有权限
    if (role.type === 'super_admin') return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    return perms.some(p => hasPermission(p));
  };

  const hasAllPermissions = (perms: string[]): boolean => {
    return perms.every(p => hasPermission(p));
  };

  const isSuperAdmin = role?.type === 'super_admin';
  const isTenantAdmin = role?.type === 'tenant_admin';

  return (
    <PermissionContext.Provider
      value={{
        role,
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        refreshPermissions,
        isSuperAdmin,
        isTenantAdmin,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};
