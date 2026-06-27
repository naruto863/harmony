import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/contexts/PermissionContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  redirectTo,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  let hasAccess = true;

  /**
   * 单权限和多权限二选一：
   * - permission 适合菜单路由这类“一页一个权限码”的场景。
   * - permissions + requireAll 适合按钮组或复合操作，需要任一/全部权限时使用。
   * 默认 hasAccess=true 是为了让未声明权限的纯展示组件保持可渲染。
   */
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);
  }

  if (!hasAccess) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
