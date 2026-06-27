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

export const DECLARED_MODULE_ROUTES = new Set([
  "/scheduler/jobs",
  "/scheduler/executions",
  "/monitoring/health",
  "/monitoring/alerts",
  "/developer/openapi",
  "/modules",
]);

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

  if (manifest.remoteRuntime || manifest.remoteEntry) {
    issues.push("不支持运行时远程插件或远程 JS 加载");
  }

  manifest.routes.forEach((route) => {
    if (!options.declaredRoutes.has(route.path)) {
      issues.push(`route ${route.path} 未在 ROUTE_COMPONENTS 白名单中声明`);
    }
  });

  manifest.menuItems.forEach((menuItem) => {
    if (!manifest.permissions.includes(menuItem.permission)) {
      issues.push(`menu ${menuItem.id} 使用的权限 ${menuItem.permission} 未在 manifest.permissions 中声明`);
    }
  });

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
