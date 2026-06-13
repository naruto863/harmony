import React, { Suspense, lazy, ComponentType } from 'react';
import { DashboardSkeleton } from '@/components/skeleton';
import { TableSkeleton } from '@/components/skeleton';

// 通用加载指示器
const PageLoader = () => (
  <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// 懒加载包装器
function lazyLoad(
  factory: () => Promise<{ default: ComponentType }>,
  fallback: React.ReactNode = <PageLoader />
) {
  const LazyComponent = lazy(factory);
  
  return function LazyWrapper() {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent />
      </Suspense>
    );
  };
}

// 仪表盘 - 使用骨架屏
export const LazyDashboard = lazyLoad(
  () => import('@/pages/Dashboard'),
  <DashboardSkeleton />
);

// 项目页面 - 使用表格骨架屏
export const LazyProjectsPage = lazyLoad(
  () => import('@/pages/projects/ProjectsPage').then(m => ({ default: m.ProjectsPage })),
  <TableSkeleton />
);

// 用户页面
export const LazyUsersPage = lazyLoad(
  () => import('@/pages/users/UsersPage').then(m => ({ default: m.UsersPage })),
  <TableSkeleton />
);

// 角色页面
export const LazyRolesPage = lazyLoad(
  () => import('@/pages/roles/RolesPage').then(m => ({ default: m.RolesPage })),
  <TableSkeleton />
);

// 审计日志页面
export const LazyAuditLogsPage = lazyLoad(
  () => import('@/pages/audit-logs/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })),
  <TableSkeleton />
);

// 文件页面
export const LazyFilesPage = lazyLoad(
  () => import('@/pages/files/FilesPage').then(m => ({ default: m.FilesPage })),
  <TableSkeleton />
);

// 数据大屏
export const LazyDataScreenPage = lazyLoad(
  () => import('@/pages/data-screen/DataScreenPage').then(m => ({ default: m.DataScreenPage })),
  <DashboardSkeleton />
);

// 消息中心
export const LazyMessageCenterPage = lazyLoad(
  () => import('@/pages/messages/MessageCenterPage').then(m => ({ default: m.MessageCenterPage })),
  <TableSkeleton />
);

// 菜单管理
export const LazyMenusPage = lazyLoad(
  () => import('@/pages/menus/MenusPage').then(m => ({ default: m.MenusPage })),
  <TableSkeleton />
);

// 字典管理
export const LazyDictsPage = lazyLoad(
  () => import('@/pages/dicts/DictsPage').then(m => ({ default: m.DictsPage })),
  <TableSkeleton />
);

// 参数配置
export const LazyConfigsPage = lazyLoad(
  () => import('@/pages/configs/ConfigsPage').then(m => ({ default: m.ConfigsPage })),
  <TableSkeleton />
);

// 组织管理
export const LazyDeptsPage = lazyLoad(
  () => import('@/pages/depts/DeptsPage').then(m => ({ default: m.DeptsPage })),
  <TableSkeleton />
);

// 岗位管理
export const LazyPositionsPage = lazyLoad(
  () => import('@/pages/positions/PositionsPage').then(m => ({ default: m.PositionsPage })),
  <TableSkeleton />
);

// 用户组管理
export const LazyUserGroupsPage = lazyLoad(
  () => import('@/pages/user-groups/UserGroupsPage').then(m => ({ default: m.UserGroupsPage })),
  <TableSkeleton />
);

// 登录日志
export const LazyLoginLogsPage = lazyLoad(
  () => import('@/pages/login-logs/LoginLogsPage').then(m => ({ default: m.LoginLogsPage })),
  <TableSkeleton />
);

// 设置页面
export const LazyProfileSettings = lazyLoad(
  () => import('@/pages/settings/ProfileSettings').then(m => ({ default: m.ProfileSettings })),
  <PageLoader />
);

export const LazyTenantSettings = lazyLoad(
  () => import('@/pages/settings/TenantSettings').then(m => ({ default: m.TenantSettings })),
  <PageLoader />
);

export const LazyNotificationSettings = lazyLoad(
  () => import('@/pages/settings/NotificationSettings').then(m => ({ default: m.NotificationSettings })),
  <PageLoader />
);

export const LazyFeatureSettings = lazyLoad(
  () => import('@/pages/settings/FeatureSettings').then(m => ({ default: m.FeatureSettings })),
  <PageLoader />
);

export const LazySecuritySettings = lazyLoad(
  () => import('@/pages/settings/SecuritySettings').then(m => ({ default: m.SecuritySettings })),
  <PageLoader />
);

export const LazySessionsSettings = lazyLoad(
  () => import('@/pages/settings/SessionsSettings').then(m => ({ default: m.SessionsSettings })),
  <PageLoader />
);

// 认证页面
export const LazyLogin = lazyLoad(
  () => import('@/pages/auth/Login').then(m => ({ default: m.Login })),
  <PageLoader />
);

export const LazyRegister = lazyLoad(
  () => import('@/pages/auth/Register').then(m => ({ default: m.Register })),
  <PageLoader />
);

export const LazySelectTenant = lazyLoad(
  () => import('@/pages/auth/SelectTenant').then(m => ({ default: m.SelectTenant })),
  <PageLoader />
);

// 错误页面
export const LazyForbidden = lazyLoad(
  () => import('@/pages/Forbidden'),
  <PageLoader />
);

export const LazyInternalServerError = lazyLoad(
  () => import('@/pages/InternalServerError'),
  <PageLoader />
);

export const LazyNotFound = lazyLoad(
  () => import('@/pages/NotFound'),
  <PageLoader />
);
