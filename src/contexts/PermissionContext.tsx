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

  /**
   * 权限刷新以“认证态 + 当前租户”为前置条件。
   * 没有租户时立即清空权限，避免上一个租户的角色/权限短暂泄露到当前页面。
   *
   * role 和 permissions 分开加载，是为了兼容后端把“角色信息”和“前端权限码”
   * 暴露为两个接口的实现；其中权限接口失败时降级为空权限，而不是沿用旧数据。
   */
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

  // 初次进入、登录态变化或租户切换后，都重新计算当前权限边界。
  useEffect(() => {
    void refreshPermissions();
  }, [refreshPermissions]);

  /**
   * API 层收到 403 会广播 accessDenied。
   * 这里监听该事件并刷新权限，处理管理员在后台调整权限后前端缓存仍停留在旧状态的情况。
   */
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
    // SuperAdmin 是前端权限判断的最高优先级，不依赖 permissions 列表是否完整下发。
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
