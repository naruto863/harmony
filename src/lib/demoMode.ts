import type { MenuItem } from "@/types";

const DEMO_STORAGE_PREFIX = "ha_demo:";

export const DEMO_ROUTE_PATHS = new Set([
  "/projects",
  "/data-screen",
  "/settings/notifications",
  "/settings/security",
  "/settings/features",
]);

export const isDemoModeEnabled = (): boolean => {
  const value = import.meta.env.VITE_ENABLE_DEMO_MOCKS;
  if (value === "true") return true;
  if (value === "false") return false;
  return Boolean(import.meta.env.DEV);
};

export const demoStorageKey = (key: string): string => `${DEMO_STORAGE_PREFIX}${key}`;

export const requireDemoMode = (feature: string): void => {
  if (!isDemoModeEnabled()) {
    throw new Error(`${feature} is a demo-only module. Set VITE_ENABLE_DEMO_MOCKS=true to enable it outside production.`);
  }
};

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
