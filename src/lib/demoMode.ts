import type { MenuItem } from "@/types";

const DEMO_STORAGE_PREFIX = "ha_demo:";

/**
 * 这些路由当前依赖演示数据或本地预览能力。
 * 生产关闭 Demo Mock 时会从菜单树中移除，避免用户进入没有真实后端支撑的功能页。
 */
export const DEMO_ROUTE_PATHS = new Set([
  "/projects",
  "/data-screen",
  "/settings/notifications",
  "/settings/security",
  "/settings/features",
]);

/**
 * Demo Mock 的默认策略：
 * - 显式配置 true/false 时完全尊重环境变量。
 * - 未配置时仅在开发环境默认开启，方便本地无后端预览。
 * - 生产构建默认关闭，避免误把演示数据能力暴露给真实用户。
 */
export const isDemoModeEnabled = (): boolean => {
  const value = import.meta.env.VITE_ENABLE_DEMO_MOCKS;
  if (value === "true") return true;
  if (value === "false") return false;
  return Boolean(import.meta.env.DEV);
};

export const demoStorageKey = (key: string): string => `${DEMO_STORAGE_PREFIX}${key}`;

/**
 * 对“只能在 Demo 中运行”的写操作做显式防线。
 * 如果后续接入真实后端但忘记替换实现，这里会快速失败，而不是静默写入 localStorage。
 */
export const requireDemoMode = (feature: string): void => {
  if (!isDemoModeEnabled()) {
    throw new Error(`${feature} is a demo-only module. Set VITE_ENABLE_DEMO_MOCKS=true to enable it outside production.`);
  }
};

/**
 * 过滤菜单时保留目录节点，但只保留仍有可见子菜单或自身有非 Demo 路由的项。
 * 这样生产环境不会出现空目录，也不会因为父级目录被过滤而丢失可用的非 Demo 子项。
 */
export const filterDemoMenuItems = (items: MenuItem[]): MenuItem[] => {
  if (isDemoModeEnabled()) {
    return items;
  }
  return items
    .map((item) => ({
      ...item,
      children: item.children ? filterDemoMenuItems(item.children) : undefined,
    }))
    .filter((item) => {
      const hasDemoPath = item.path ? DEMO_ROUTE_PATHS.has(item.path) : false;
      const hasChildren = (item.children?.length ?? 0) > 0;
      return !hasDemoPath && (item.path || hasChildren || item.type === "dir");
    });
};
