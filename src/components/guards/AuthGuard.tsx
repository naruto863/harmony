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

  // 等待认证和租户状态都恢复后再判断跳转，避免刷新页面时误判为未登录或未选租户。
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

  // 未登录时保留来源位置，登录成功后页面可以按需回跳。
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 多租户账号必须显式选择工作空间，避免默认进入错误租户造成权限和数据口径混乱。
  if (requireTenant && !currentTenant && userTenants.length > 1) {
    return <Navigate to="/select-tenant" state={{ from: location }} replace />;
  }

  // 后端返回空租户列表时不再继续渲染受保护页面，直接给出可操作的业务提示。
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

  // 待完善资料的用户只能先进入个人设置页，防止未完成账号继续访问核心业务入口。
  if (requireTenant && user?.status === 'pending' && location.pathname !== '/settings/profile') {
    return <Navigate to="/settings/profile" replace />;
  }

  return <>{children}</>;
};
