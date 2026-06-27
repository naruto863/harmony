export type AuthLogoutDetail = {
  reason: "unauthorized" | "refresh_failed" | "manual";
  message?: string;
};

export type AuthAccessDeniedDetail = {
  message?: string;
  path?: string;
};

export const AUTH_EVENTS = {
  logout: "auth:logout",
  accessDenied: "auth:access-denied",
} as const;

type AuthEventDetailMap = {
  [AUTH_EVENTS.logout]: AuthLogoutDetail;
  [AUTH_EVENTS.accessDenied]: AuthAccessDeniedDetail;
};

type AuthEventType = keyof AuthEventDetailMap;

/**
 * 认证相关事件使用 window 级 CustomEvent 做轻量解耦。
 * apiClient 不需要直接依赖 router、toast 或各个 Context，只负责把“发生了什么”广播出去。
 */
export const emitAuthEvent = <T extends AuthEventType>(type: T, detail: AuthEventDetailMap[T]) => {
  window.dispatchEvent(new CustomEvent<AuthEventDetailMap[T]>(type, { detail }));
};

/**
 * 封装 addEventListener/removeEventListener，调用方在 useEffect 中直接 return 即可完成清理。
 * 泛型映射保证不同事件拿到对应的 detail 类型，减少事件名和 payload 不匹配的风险。
 */
export const onAuthEvent = <T extends AuthEventType>(
  type: T,
  handler: (event: CustomEvent<AuthEventDetailMap[T]>) => void
) => {
  const listener = (event: Event) => {
    handler(event as CustomEvent<AuthEventDetailMap[T]>);
  };
  window.addEventListener(type, listener);
  return () => window.removeEventListener(type, listener);
};
