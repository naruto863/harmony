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

export const emitAuthEvent = <T extends AuthEventType>(type: T, detail: AuthEventDetailMap[T]) => {
  window.dispatchEvent(new CustomEvent<AuthEventDetailMap[T]>(type, { detail }));
};

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
