import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireTenant?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireTenant = false }) => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { currentTenant, userTenants, isLoading: tenantLoading } = useTenant();
  const location = useLocation();

  // 显示加载状态
  if (authLoading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 需要选择租户但用户有多个租户且未选择
  if (requireTenant && !currentTenant && userTenants.length > 1) {
    return <Navigate to="/select-tenant" state={{ from: location }} replace />;
  }

  // 需要租户但用户没有任何租户
  if (requireTenant && userTenants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">无可用租户</h2>
          <p className="text-muted-foreground">您尚未加入任何租户，请联系管理员。</p>
        </div>
      </div>
    );
  }

  if (requireTenant && user?.status === 'pending' && location.pathname !== '/settings/profile') {
    return <Navigate to="/settings/profile" replace />;
  }

  return <>{children}</>;
};
