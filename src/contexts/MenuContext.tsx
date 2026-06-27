import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { MenuItem } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { getMenuTree } from "@/services/menuService";
import { AUTH_EVENTS, onAuthEvent } from "@/lib/authEvents";
import { filterDemoMenuItems } from "@/lib/demoMode";

export type MenuLoadStatus = "idle" | "loading" | "ready" | "empty" | "error";

interface MenuContextType {
  menuItems: MenuItem[];
  isLoading: boolean;
  loadStatus: MenuLoadStatus;
  errorMessage: string | null;
  refreshMenu: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { currentTenant } = useTenant();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState<MenuLoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 菜单是“当前租户 + 当前权限”的组合结果，所以没有租户时不能继续复用旧菜单。
   * 加载成功后再按 Demo 边界过滤一次，确保生产关闭 Demo Mock 时不会暴露演示专用入口。
   */
  const loadMenu = useCallback(async () => {
    if (!currentTenant) {
      setMenuItems([]);
      setLoadStatus("idle");
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadStatus("loading");
    setErrorMessage(null);
    try {
      const response = await getMenuTree(currentTenant.id);
      if (response.success && response.data) {
        const filteredMenuItems = filterDemoMenuItems(response.data);
        setMenuItems(filteredMenuItems);
        setLoadStatus(filteredMenuItems.length > 0 ? "ready" : "empty");
      } else {
        setMenuItems([]);
        setLoadStatus("error");
        setErrorMessage(response.error?.message ?? "加载菜单失败");
      }
    } catch (error) {
      setMenuItems([]);
      setLoadStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "加载菜单失败");
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant]);

  /**
   * 认证态或租户切换会重置菜单加载状态。
   * 这里不把菜单缓存成全局常量，是为了支持不同租户拥有不同菜单树和权限码。
   */
  useEffect(() => {
    if (!isAuthenticated || !currentTenant) {
      setMenuItems([]);
      setIsLoading(false);
      setLoadStatus("idle");
      setErrorMessage(null);
      return;
    }
    loadMenu();
  }, [isAuthenticated, currentTenant, loadMenu]);

  /**
   * 403 往往意味着权限或菜单配置已发生变化。
   * 收到 accessDenied 后重新拉菜单，配合 PermissionContext 刷新权限，尽快让 UI 与后端授权一致。
   */
  useEffect(() => {
    if (!isAuthenticated || !currentTenant) {
      return;
    }
    return onAuthEvent(AUTH_EVENTS.accessDenied, () => {
      void loadMenu();
    });
  }, [isAuthenticated, currentTenant, loadMenu]);

  return (
    <MenuContext.Provider value={{ menuItems, isLoading, loadStatus, errorMessage, refreshMenu: loadMenu }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
};
