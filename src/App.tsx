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

/**
 * 后端菜单只决定“哪些入口可见”，前端仍用 ROUTE_COMPONENTS 作为可渲染路由白名单。
 * 这样即使菜单接口返回了未知 path，也不会动态加载未声明组件或形成任意路由注入。
 */
const buildMenuRoutes = (items: MenuItem[]) => {
  const routes: ReactNode[] = [];
  const visited = new Set<string>();

  const normalizePath = (path: string) => (path.startsWith("/") ? path.slice(1) : path);

  const walk = (menu: MenuItem) => {
    if (menu.path && menu.path !== "/" && menu.type !== "external" && menu.type !== "button") {
      const Component = ROUTE_COMPONENTS[menu.path];
      if (Component && !visited.has(menu.path)) {
        // 每个菜单路由在渲染页面前再过一次 PermissionGuard，防止“菜单可见”和“页面可访问”口径漂移。
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

  // 菜单树可能是多级目录，路由需要扁平化后直接挂到 React Router 的嵌套路由下。
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
 * AppRoutes 使用 useMenu 直接构建动态路由。
 *
 * React Router v6 要求 <Routes> 的直接子节点必须是 <Route>，
 * 因此这里返回 Route 数组，而不是把动态路由封装成普通组件再渲染。
 * 菜单处于 loading/error/empty 时也挂载 index 和 wildcard 两条兜底路由，
 * 避免用户刷新深层地址后看到 NotFound，而是看到真实的菜单状态。
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
    // Dashboard 是认证后的默认首页；其他页面由菜单服务决定是否挂载。
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
          {/* Provider 顺序体现状态依赖：认证 -> 租户 -> 权限 -> 菜单 -> 路由。 */}
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
