import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ComponentType, ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AlertTriangle, Loader2, RefreshCw, ShieldX } from "lucide-react";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { MenuProvider, useMenu } from "@/contexts/MenuContext";
import { AuthGuard, PermissionGuard } from "@/components/guards";
import { AuthEventBridge } from "@/components/auth/AuthEventBridge";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { MenuItem } from "@/types";
import {
  LazyDashboard,
  LazyProjectsPage,
  LazyUsersPage,
  LazyRolesPage,
  LazyAuditLogsPage,
  LazyFilesPage,
  LazyDataScreenPage,
  LazyMessageCenterPage,
  LazyMenusPage,
  LazyDictsPage,
  LazyConfigsPage,
  LazyDeptsPage,
  LazyPositionsPage,
  LazyUserGroupsPage,
  LazyLoginLogsPage,
  LazySchedulerJobsPage,
  LazySchedulerExecutionsPage,
  LazyMonitoringHealthPage,
  LazyMonitoringAlertsPage,
  LazyOpenApiDraftPage,
  LazyModulesPage,
  LazyWorkflowsPage,
  LazyDynamicFormsPage,
  LazyMaintenancePage,
  LazyProfileSettings,
  LazyTenantSettings,
  LazyNotificationSettings,
  LazyFeatureSettings,
  LazySecuritySettings,
  LazySessionsSettings,
  LazyLogin,
  LazyForgotPassword,
  LazyResetPassword,
  LazySsoCallback,
  LazyRegister,
  LazySelectTenant,
  LazyForbidden,
  LazyInternalServerError,
  LazyNotFound,
} from "@/pages/lazy";

const ROUTE_COMPONENTS: Record<string, ComponentType> = {
  "/projects": LazyProjectsPage,
  "/users": LazyUsersPage,
  "/roles": LazyRolesPage,
  "/audit-logs": LazyAuditLogsPage,
  "/files": LazyFilesPage,
  "/data-screen": LazyDataScreenPage,
  "/messages": LazyMessageCenterPage,
  "/settings/profile": LazyProfileSettings,
  "/settings/tenant": LazyTenantSettings,
  "/settings/notifications": LazyNotificationSettings,
  "/settings/features": LazyFeatureSettings,
  "/settings/security": LazySecuritySettings,
  "/settings/sessions": LazySessionsSettings,
  "/menus": LazyMenusPage,
  "/dicts": LazyDictsPage,
  "/configs": LazyConfigsPage,
  "/depts": LazyDeptsPage,
  "/positions": LazyPositionsPage,
  "/user-groups": LazyUserGroupsPage,
  "/login-logs": LazyLoginLogsPage,
  "/scheduler/jobs": LazySchedulerJobsPage,
  "/scheduler/executions": LazySchedulerExecutionsPage,
  "/monitoring/health": LazyMonitoringHealthPage,
  "/monitoring/alerts": LazyMonitoringAlertsPage,
  "/developer/openapi": LazyOpenApiDraftPage,
  "/modules": LazyModulesPage,
  "/workflows": LazyWorkflowsPage,
  "/dynamic-forms": LazyDynamicFormsPage,
  "/maintenance/cache": LazyMaintenancePage,
  "/saas/plans": LazyMaintenancePage,
};

const buildMenuRoutes = (items: MenuItem[]) => {
  const routes: ReactNode[] = [];
  const visited = new Set<string>();

  const normalizePath = (path: string) => (path.startsWith("/") ? path.slice(1) : path);

  const walk = (menu: MenuItem) => {
    if (menu.path && menu.path !== "/" && menu.type !== "external" && menu.type !== "button") {
      const Component = ROUTE_COMPONENTS[menu.path];
      if (Component && !visited.has(menu.path)) {
        const element = (
          <PermissionGuard permission={menu.permission} redirectTo="/403">
            <Component />
          </PermissionGuard>
        );
        routes.push(
          <Route key={menu.path} path={normalizePath(menu.path)} element={element} />
        );
        visited.add(menu.path);
      }
    }
    menu.children?.forEach(walk);
  };

  items.forEach(walk);
  return routes;
};

interface MenuRouteFallbackProps {
  state: "loading" | "empty" | "error";
  message?: string | null;
  onRetry?: () => void;
}

const MenuRouteFallback = ({ state, message, onRetry }: MenuRouteFallbackProps) => {
  if (state === "loading") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isError = state === "error";
  const Icon = isError ? AlertTriangle : ShieldX;

  return (
    <div className="flex h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className={isError ? "h-8 w-8 text-destructive" : "h-8 w-8 text-muted-foreground"} />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          {isError ? "菜单加载失败" : "暂无可访问菜单"}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {isError ? message || "请稍后重试，或联系管理员检查菜单服务。" : "当前租户未分配可访问菜单，请联系管理员确认权限。"}
        </p>
        {isError && onRetry && (
          <Button type="button" variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        )}
      </div>
    </div>
  );
};

const buildUnavailableMenuRoutes = (element: ReactNode) => [
  <Route key="__menu_state_index__" index element={element} />,
  <Route key="__menu_state_wildcard__" path="*" element={element} />,
];

/**
 * AppRoutes: 使用 useMenu 直接构建动态路由，
 * 确保所有 Route 元素都是 <Routes> / <Route> 的直接子元素，
 * 满足 React Router v6 的要求。
 */
const AppRoutes = () => {
  const { menuItems, isLoading, loadStatus, errorMessage, refreshMenu } = useMenu();

  const menuRoutes = (() => {
    if (isLoading || loadStatus === "idle" || loadStatus === "loading") {
      return buildUnavailableMenuRoutes(<MenuRouteFallback state="loading" />);
    }
    if (loadStatus === "error") {
      return buildUnavailableMenuRoutes(
        <MenuRouteFallback state="error" message={errorMessage} onRetry={refreshMenu} />
      );
    }
    if (loadStatus === "empty") {
      return buildUnavailableMenuRoutes(<MenuRouteFallback state="empty" />);
    }
    return [
      <Route key="__dashboard__" index element={<LazyDashboard />} />,
      ...buildMenuRoutes(menuItems),
    ];
  })();

  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<LazyLogin />} />
      <Route path="/forgot-password" element={<LazyForgotPassword />} />
      <Route path="/reset-password" element={<LazyResetPassword />} />
      <Route path="/auth/sso/callback" element={<LazySsoCallback />} />
      <Route path="/register" element={<LazyRegister />} />

      {/* 需要认证但不需要租户的路由 */}
      <Route path="/select-tenant" element={
        <AuthGuard>
          <LazySelectTenant />
        </AuthGuard>
      } />

      {/* 需要认证和租户的路由 */}
      <Route path="/" element={
        <AuthGuard requireTenant>
          <MainLayout />
        </AuthGuard>
      }>
        {menuRoutes}
      </Route>

      {/* 错误页面 */}
      <Route path="/403" element={<LazyForbidden />} />
      <Route path="/500" element={<LazyInternalServerError />} />
      <Route path="*" element={<LazyNotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AuthEventBridge />
            <TenantProvider>
              <PermissionProvider>
                <MenuProvider>
                  <AppRoutes />
                </MenuProvider>
              </PermissionProvider>
            </TenantProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
