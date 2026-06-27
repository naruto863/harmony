export interface ModuleRouteManifest {
  path: string;
  label: string;
}

export interface ModuleMenuManifest {
  id: string;
  label: string;
  path: string;
  permission: string;
}

export interface ModuleManifest {
  key: string;
  name: string;
  version: string;
  routes: ModuleRouteManifest[];
  menuItems: ModuleMenuManifest[];
  permissions: string[];
  dictGroups: string[];
  auditEvents: string[];
  featureFlag?: string;
  apiPrefixes: string[];
  demoBoundary: string;
  remoteRuntime?: boolean;
  remoteEntry?: string;
}

export interface ModuleManifestValidationOptions {
  declaredRoutes: Set<string>;
}

export interface ModuleManifestValidationResult {
  valid: boolean;
  issues: string[];
}

/**
 * 模块清单允许声明的前端路由白名单。
 * 这里只列已经在懒加载路由表中有真实页面组件的路径，防止 manifest 先于页面实现暴露入口。
 */
export const DECLARED_MODULE_ROUTES = new Set([
  "/scheduler/jobs",
  "/scheduler/executions",
  "/monitoring/health",
  "/monitoring/alerts",
  "/developer/openapi",
  "/modules",
]);

/**
 * 核心模块清单是 v1.5 扩展能力的契约索引。
 * 它不负责运行时加载插件，而是把模块的路由、菜单、权限、审计事件和 Demo 边界集中声明，
 * 供模块清单页、文档和后续接入真实 API 时做一致性校验。
 */
export const CORE_MODULE_MANIFESTS: ModuleManifest[] = [
  {
    key: "scheduler",
    name: "任务调度",
    version: "1.5.0",
    routes: [
      { path: "/scheduler/jobs", label: "任务定义" },
      { path: "/scheduler/executions", label: "执行日志" },
    ],
    menuItems: [
      { id: "scheduler-jobs", label: "任务定义", path: "/scheduler/jobs", permission: "scheduler.jobs.read" },
      { id: "scheduler-executions", label: "执行日志", path: "/scheduler/executions", permission: "scheduler.executions.read" },
    ],
    permissions: [
      "scheduler.jobs.read",
      "scheduler.jobs.execute",
      "scheduler.executions.read",
      "scheduler.executions.retry",
    ],
    dictGroups: [],
    auditEvents: ["scheduler.jobs.run-once", "scheduler.executions.retry"],
    featureFlag: "scheduler.enabled",
    apiPrefixes: ["/api/scheduler"],
    demoBoundary: "Demo 只展示任务定义和执行日志样例，不执行真实任务。",
    remoteRuntime: false,
  },
  {
    key: "monitoring",
    name: "监控告警",
    version: "1.5.0",
    routes: [
      { path: "/monitoring/health", label: "健康状态" },
      { path: "/monitoring/alerts", label: "告警历史" },
    ],
    menuItems: [
      { id: "monitoring-health", label: "健康状态", path: "/monitoring/health", permission: "monitoring.health.read" },
      { id: "monitoring-alerts", label: "告警历史", path: "/monitoring/alerts", permission: "monitoring.alerts.read" },
    ],
    permissions: [
      "monitoring.health.read",
      "monitoring.metrics.read",
      "monitoring.alerts.read",
      "monitoring.alerts.manage",
      "monitoring.alert-rules.manage",
    ],
    dictGroups: [],
    auditEvents: ["monitoring.alerts.ack", "monitoring.alerts.resolve", "monitoring.alerts.silence"],
    featureFlag: "monitoring.enabled",
    apiPrefixes: ["/api/monitoring"],
    demoBoundary: "Demo 只展示健康状态和告警历史样例，不采集真实指标。",
    remoteRuntime: false,
  },
  {
    key: "developer-openapi",
    name: "OpenAPI 辅助",
    version: "1.5.0",
    routes: [
      { path: "/developer/openapi", label: "OpenAPI 辅助" },
    ],
    menuItems: [
      { id: "developer-openapi", label: "OpenAPI 辅助", path: "/developer/openapi", permission: "developer.openapi.read" },
    ],
    permissions: ["developer.openapi.read", "developer.openapi.manage"],
    dictGroups: [],
    auditEvents: ["developer.openapi.preview"],
    featureFlag: "developer.openapi.enabled",
    apiPrefixes: [],
    demoBoundary: "Demo 只展示本地 schema 草稿预览，不写入文件。",
    remoteRuntime: false,
  },
];

export const validateModuleManifest = (
  manifest: ModuleManifest,
  options: ModuleManifestValidationOptions
): ModuleManifestValidationResult => {
  const issues: string[] = [];

  // 当前仓库保持纯前端静态构建，不允许通过 manifest 引入远程 JS 或运行时插件入口。
  if (manifest.remoteRuntime || manifest.remoteEntry) {
    issues.push("不支持运行时远程插件或远程 JS 加载");
  }

  // manifest 中的路由必须先在前端白名单中声明，菜单才能安全指向该页面。
  manifest.routes.forEach((route) => {
    if (!options.declaredRoutes.has(route.path)) {
      issues.push(`route ${route.path} 未在 ROUTE_COMPONENTS 白名单中声明`);
    }
  });

  // 菜单引用的权限必须是模块自己声明过的权限，避免出现菜单可见但权限码无法治理的情况。
  manifest.menuItems.forEach((menuItem) => {
    if (!manifest.permissions.includes(menuItem.permission)) {
      issues.push(`menu ${menuItem.id} 使用的权限 ${menuItem.permission} 未在 manifest.permissions 中声明`);
    }
  });

  // API 前缀统一收敛在 /api/ 下，便于网关、Mock 和文档按同一命名空间治理。
  manifest.apiPrefixes.forEach((prefix) => {
    if (!prefix.startsWith("/api/")) {
      issues.push(`apiPrefix ${prefix} 必须以 /api/ 开头`);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
};
