import { apiClient } from "../apiClient";
import { getRefreshToken } from "../tokenStorage";

export interface Session {
  id: string;
  userId: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  isCurrent: boolean;
  createdAt: string;
  lastActiveAt: string;
}

type ApiSession = {
  id: string;
  userId: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  createdAt?: string;
  lastActiveAt?: string;
  isCurrent: boolean;
};

const buildSessionHeaders = () => {
  const refreshToken = getRefreshToken();
  return refreshToken ? { "X-Refresh-Token": refreshToken } : undefined;
};

const parseUserAgent = (userAgent: string | undefined) => {
  const ua = userAgent || "";
  const isIpad = /iPad/i.test(ua);
  const isIphone = /iPhone/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const deviceType: Session["deviceType"] = isIpad ? "tablet" : isIphone || isAndroid ? "mobile" : "desktop";
  const browser = /Edg/i.test(ua)
    ? "Edge"
    : /Chrome/i.test(ua)
    ? "Chrome"
    : /Firefox/i.test(ua)
    ? "Firefox"
    : /Safari/i.test(ua)
    ? "Safari"
    : "Unknown";
  const os = /Windows/i.test(ua)
    ? "Windows"
    : /Mac OS X/i.test(ua)
    ? "macOS"
    : /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad/i.test(ua)
    ? "iOS"
    : "Unknown";
  return { deviceType, browser, os };
};

const buildDeviceName = (device: string | undefined, os: string, browser: string) => {
  if (device && device.trim().length > 0) return device;
  if (browser === "Unknown" && os === "Unknown") return "Unknown";
  return `${os} · ${browser}`;
};

export const getUserSessions = async (userId: string): Promise<Session[]> => {
  const headers = buildSessionHeaders();
  const sessions = await apiClient.get<ApiSession[]>(`/api/sessions?userId=${userId}`, headers);
  return sessions
    .map(session => {
      const { deviceType, browser, os } = parseUserAgent(session.userAgent);
      return {
        id: session.id,
        userId: session.userId,
        device: buildDeviceName(session.device, os, browser),
        deviceType,
        browser,
        os,
        ipAddress: session.ipAddress || "",
        location: "未知",
        isCurrent: session.isCurrent,
        createdAt: session.createdAt || new Date().toISOString(),
        lastActiveAt: session.lastActiveAt || session.createdAt || new Date().toISOString(),
      };
    })
    .sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
    });
};

export const terminateSession = async (sessionId: string): Promise<void> => {
  const headers = buildSessionHeaders();
  await apiClient.delete<void>(`/api/sessions/${sessionId}`, headers);
};

export const terminateOtherSessions = async (_userId?: string): Promise<number> => {
  const headers = buildSessionHeaders();
  return apiClient.delete<number>(`/api/sessions/others`, headers);
};

export const getDeviceIcon = (deviceType: Session['deviceType']): string => {
  const icons: Record<Session['deviceType'], string> = {
    desktop: 'Monitor',
    mobile: 'Smartphone',
    tablet: 'Tablet',
  };
  return icons[deviceType];
};
