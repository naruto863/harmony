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
