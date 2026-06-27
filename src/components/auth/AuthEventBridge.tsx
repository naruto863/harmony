import { useEffect, useRef, type FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AUTH_EVENTS, onAuthEvent } from "@/lib/authEvents";
import { useToast } from "@/hooks/use-toast";

export const AuthEventBridge: FC = () => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const handlingRef = useRef(false);

  /**
   * 把 apiClient 广播的 auth:logout 事件转换成真实 UI 行为：
   * 清理登录态、提示用户、并带上 from 位置跳回登录页。
   *
   * handlingRef 用来吞掉同一轮事件循环里的重复 401；
   * 多个并发请求同时失败时，用户只需要看到一次过期提示和一次跳转。
   */
  useEffect(() => {
    return onAuthEvent(AUTH_EVENTS.logout, (event) => {
      if (handlingRef.current) return;
      handlingRef.current = true;
      const title = "登录已过期，请重新登录";
      const description = event.detail?.message && event.detail.message !== title ? event.detail.message : undefined;
      if (isAuthenticated) {
        logout();
      }
      toast({ title, description, variant: "destructive" });
      if (location.pathname !== "/login") {
        navigate("/login", { replace: true, state: { from: location } });
      }
      setTimeout(() => {
        handlingRef.current = false;
      }, 0);
    });
  }, [logout, isAuthenticated, navigate, location, toast]);

  return null;
};
