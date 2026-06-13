export type { Session } from "./security/sessionService";
export {
  getDeviceIcon,
  getUserSessions,
  terminateOtherSessions,
  terminateSession,
} from "./security/sessionService";
export type { TwoFactorSettings } from "./security/twoFactorService";
export {
  disableTwoFactor,
  enableTwoFactor,
  generateTwoFactorSecret,
  getTwoFactorSettings,
  regenerateRecoveryCodes,
  verifyTwoFactorCode,
} from "./security/twoFactorService";

// ==================== IP 白名单相关 ====================

export interface IpWhitelistEntry {
  id: string;
  ip: string;
  description: string;
  type: 'single' | 'range' | 'cidr';
  createdAt: string;
  createdBy: string;
}

export interface IpWhitelistSettings {
  enabled: boolean;
  whitelist: IpWhitelistEntry[];
  lastUpdatedAt?: string;
}

// 模拟IP白名单数据
const IP_WHITELIST_SETTINGS: Record<string, IpWhitelistSettings> = {
  default: {
    enabled: false,
    whitelist: [
      {
        id: 'ip_1',
        ip: '203.0.113.0/24',
        description: '办公室内网',
        type: 'cidr',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        createdBy: 'admin',
      },
      {
        id: 'ip_2',
        ip: '203.0.113.1',
        description: 'VPN服务器',
        type: 'single',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        createdBy: 'admin',
      },
    ],
  },
};

// 获取IP白名单设置
export const getIpWhitelistSettings = async (tenantId: string = 'default'): Promise<IpWhitelistSettings> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return IP_WHITELIST_SETTINGS[tenantId] || { enabled: false, whitelist: [] };
};

// 更新IP白名单启用状态
export const updateIpWhitelistEnabled = async (tenantId: string = 'default', enabled: boolean): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (!IP_WHITELIST_SETTINGS[tenantId]) {
    IP_WHITELIST_SETTINGS[tenantId] = { enabled: false, whitelist: [] };
  }
  
  IP_WHITELIST_SETTINGS[tenantId].enabled = enabled;
  IP_WHITELIST_SETTINGS[tenantId].lastUpdatedAt = new Date().toISOString();
};

// 添加IP到白名单
export const addIpToWhitelist = async (
  tenantId: string = 'default',
  data: { ip: string; description: string; type: IpWhitelistEntry['type'] }
): Promise<IpWhitelistEntry> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (!IP_WHITELIST_SETTINGS[tenantId]) {
    IP_WHITELIST_SETTINGS[tenantId] = { enabled: false, whitelist: [] };
  }
  
  const newEntry: IpWhitelistEntry = {
    id: `ip_${Date.now()}`,
    ip: data.ip,
    description: data.description,
    type: data.type,
    createdAt: new Date().toISOString(),
    createdBy: 'current_user',
  };
  
  IP_WHITELIST_SETTINGS[tenantId].whitelist.push(newEntry);
  IP_WHITELIST_SETTINGS[tenantId].lastUpdatedAt = new Date().toISOString();
  
  return newEntry;
};

// 删除白名单IP
export const removeIpFromWhitelist = async (tenantId: string = 'default', ipId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (IP_WHITELIST_SETTINGS[tenantId]) {
    IP_WHITELIST_SETTINGS[tenantId].whitelist = 
      IP_WHITELIST_SETTINGS[tenantId].whitelist.filter(entry => entry.id !== ipId);
    IP_WHITELIST_SETTINGS[tenantId].lastUpdatedAt = new Date().toISOString();
  }
};

// 验证IP是否在白名单中
export const validateIpInWhitelist = async (tenantId: string = 'default', ip: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const settings = IP_WHITELIST_SETTINGS[tenantId];
  
  // 如果未启用白名单，允许所有IP
  if (!settings?.enabled) {
    return true;
  }
  
  // 检查IP是否在白名单中
  return settings.whitelist.some(entry => {
    if (entry.type === 'single') {
      return entry.ip === ip;
    }
    if (entry.type === 'cidr') {
      return isIpInCidr(ip, entry.ip);
    }
    if (entry.type === 'range') {
      const [start, end] = entry.ip.split('-');
      return isIpInRange(ip, start.trim(), end.trim());
    }
    return false;
  });
};

// 辅助函数：检查IP是否在CIDR范围内
const isIpInCidr = (ip: string, cidr: string): boolean => {
  const [cidrIp, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr, 10);
  
  const ipNum = ipToNumber(ip);
  const cidrIpNum = ipToNumber(cidrIp);
  const mask = ~(2 ** (32 - prefix) - 1);
  
  return (ipNum & mask) === (cidrIpNum & mask);
};

// 辅助函数：检查IP是否在范围内
const isIpInRange = (ip: string, start: string, end: string): boolean => {
  const ipNum = ipToNumber(ip);
  const startNum = ipToNumber(start);
  const endNum = ipToNumber(end);
  
  return ipNum >= startNum && ipNum <= endNum;
};

// 辅助函数：IP转数字
const ipToNumber = (ip: string): number => {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
};

// 验证IP格式
export const validateIpFormat = (ip: string, type: IpWhitelistEntry['type']): boolean => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  const rangeRegex = /^(\d{1,3}\.){3}\d{1,3}\s*-\s*(\d{1,3}\.){3}\d{1,3}$/;
  
  switch (type) {
    case 'single':
      return ipv4Regex.test(ip);
    case 'cidr':
      return cidrRegex.test(ip);
    case 'range':
      return rangeRegex.test(ip);
    default:
      return false;
  }
};

// 获取当前客户端IP（模拟）
export const getCurrentClientIp = async (): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  // 模拟返回当前IP
  return '203.0.113.10';
};

// ==================== 登录失败锁定相关 ====================

export interface LoginAttempt {
  email: string;
  timestamp: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
}

export interface AccountLockStatus {
  isLocked: boolean;
  lockedUntil?: string;
  failedAttempts: number;
  lastFailedAttempt?: string;
  remainingAttempts: number;
}

export interface LoginLockSettings {
  enabled: boolean;
  maxFailedAttempts: number; // 最大失败次数
  lockDurationMinutes: number; // 锁定时长（分钟）
  resetWindowMinutes: number; // 重置窗口（分钟内失败次数计算）
}

// 模拟登录失败记录
const LOGIN_ATTEMPTS: Record<string, LoginAttempt[]> = {};

// 模拟账户锁定状态
const ACCOUNT_LOCKS: Record<string, { lockedUntil: string; failedAttempts: number }> = {};

// 登录锁定设置
let LOGIN_LOCK_SETTINGS: LoginLockSettings = {
  enabled: true,
  maxFailedAttempts: 5,
  lockDurationMinutes: 15,
  resetWindowMinutes: 30,
};

// 获取登录锁定设置
export const getLoginLockSettings = async (): Promise<LoginLockSettings> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return { ...LOGIN_LOCK_SETTINGS };
};

// 更新登录锁定设置
export const updateLoginLockSettings = async (settings: Partial<LoginLockSettings>): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  LOGIN_LOCK_SETTINGS = { ...LOGIN_LOCK_SETTINGS, ...settings };
};

// 获取账户锁定状态
export const getAccountLockStatus = async (email: string): Promise<AccountLockStatus> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const lock = ACCOUNT_LOCKS[email];
  const now = new Date();
  
  // 如果锁定已过期，清除锁定
  if (lock && new Date(lock.lockedUntil) <= now) {
    delete ACCOUNT_LOCKS[email];
    LOGIN_ATTEMPTS[email] = [];
    return {
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: LOGIN_LOCK_SETTINGS.maxFailedAttempts,
    };
  }
  
  // 获取时间窗口内的失败次数
  const attempts = LOGIN_ATTEMPTS[email] || [];
  const windowStart = new Date(now.getTime() - LOGIN_LOCK_SETTINGS.resetWindowMinutes * 60 * 1000);
  const recentFailedAttempts = attempts.filter(
    a => !a.success && new Date(a.timestamp) > windowStart
  );
  
  if (lock) {
    return {
      isLocked: true,
      lockedUntil: lock.lockedUntil,
      failedAttempts: lock.failedAttempts,
      lastFailedAttempt: recentFailedAttempts[recentFailedAttempts.length - 1]?.timestamp,
      remainingAttempts: 0,
    };
  }
  
  return {
    isLocked: false,
    failedAttempts: recentFailedAttempts.length,
    lastFailedAttempt: recentFailedAttempts[recentFailedAttempts.length - 1]?.timestamp,
    remainingAttempts: Math.max(0, LOGIN_LOCK_SETTINGS.maxFailedAttempts - recentFailedAttempts.length),
  };
};

// 记录登录尝试
export const recordLoginAttempt = async (
  email: string,
  success: boolean,
  ipAddress: string = '203.0.113.10',
  userAgent: string = 'Unknown'
): Promise<AccountLockStatus> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (!LOGIN_LOCK_SETTINGS.enabled) {
    return {
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: LOGIN_LOCK_SETTINGS.maxFailedAttempts,
    };
  }
  
  const now = new Date();
  const attempt: LoginAttempt = {
    email,
    timestamp: now.toISOString(),
    success,
    ipAddress,
    userAgent,
  };
  
  if (!LOGIN_ATTEMPTS[email]) {
    LOGIN_ATTEMPTS[email] = [];
  }
  LOGIN_ATTEMPTS[email].push(attempt);
  
  // 只保留最近100条记录
  if (LOGIN_ATTEMPTS[email].length > 100) {
    LOGIN_ATTEMPTS[email] = LOGIN_ATTEMPTS[email].slice(-100);
  }
  
  // 如果登录成功，清除失败记录和锁定
  if (success) {
    delete ACCOUNT_LOCKS[email];
    return {
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: LOGIN_LOCK_SETTINGS.maxFailedAttempts,
    };
  }
  
  // 计算时间窗口内的失败次数
  const windowStart = new Date(now.getTime() - LOGIN_LOCK_SETTINGS.resetWindowMinutes * 60 * 1000);
  const recentFailedAttempts = LOGIN_ATTEMPTS[email].filter(
    a => !a.success && new Date(a.timestamp) > windowStart
  );
  
  // 如果失败次数达到阈值，锁定账户
  if (recentFailedAttempts.length >= LOGIN_LOCK_SETTINGS.maxFailedAttempts) {
    const lockedUntil = new Date(now.getTime() + LOGIN_LOCK_SETTINGS.lockDurationMinutes * 60 * 1000);
    ACCOUNT_LOCKS[email] = {
      lockedUntil: lockedUntil.toISOString(),
      failedAttempts: recentFailedAttempts.length,
    };
    
    return {
      isLocked: true,
      lockedUntil: lockedUntil.toISOString(),
      failedAttempts: recentFailedAttempts.length,
      lastFailedAttempt: now.toISOString(),
      remainingAttempts: 0,
    };
  }
  
  return {
    isLocked: false,
    failedAttempts: recentFailedAttempts.length,
    lastFailedAttempt: now.toISOString(),
    remainingAttempts: LOGIN_LOCK_SETTINGS.maxFailedAttempts - recentFailedAttempts.length,
  };
};

// 解锁账户
export const unlockAccount = async (email: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  delete ACCOUNT_LOCKS[email];
  LOGIN_ATTEMPTS[email] = [];
};

// 获取登录历史
export const getLoginHistory = async (email: string, limit: number = 10): Promise<LoginAttempt[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const attempts = LOGIN_ATTEMPTS[email] || [];
  return attempts.slice(-limit).reverse();
};

// ==================== 异常登录检测相关 ====================

export interface DeviceInfo {
  id: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  userAgent: string;
  firstSeen: string;
  lastSeen: string;
  isTrusted: boolean;
}

export interface LoginLocation {
  ip: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface LoginAlert {
  id: string;
  userId: string;
  type: 'new_device' | 'new_location' | 'suspicious_time' | 'multiple_failures' | 'ip_change';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  deviceInfo?: DeviceInfo;
  locationInfo?: LoginLocation;
  timestamp: string;
  isRead: boolean;
  isResolved: boolean;
}

export interface AnomalyDetectionSettings {
  enabled: boolean;
  detectNewDevice: boolean;
  detectNewLocation: boolean;
  detectSuspiciousTime: boolean;
  detectMultipleFailures: boolean;
  detectIpChange: boolean;
  suspiciousTimeStart: number; // 24小时制，如 0 表示午夜
  suspiciousTimeEnd: number; // 24小时制，如 6 表示早上6点
  notifyByEmail: boolean;
  notifyInApp: boolean;
}

// 模拟已知设备
const KNOWN_DEVICES: Record<string, DeviceInfo[]> = {
  'admin@example.com': [
    {
      id: 'device_1',
      browser: 'Chrome 120',
      os: 'Windows 11',
      deviceType: 'desktop',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      lastSeen: new Date().toISOString(),
      isTrusted: true,
    },
    {
      id: 'device_2',
      browser: 'Safari 17',
      os: 'iOS 17.2',
      deviceType: 'mobile',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X)',
      firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      isTrusted: true,
    },
  ],
};

// 模拟已知位置
const KNOWN_LOCATIONS: Record<string, LoginLocation[]> = {
  'admin@example.com': [
    { ip: '203.0.113.10', city: '上海市', country: '中国' },
    { ip: '203.0.113.11', city: '上海市', country: '中国' },
  ],
};

// 模拟登录提醒
let LOGIN_ALERTS: LoginAlert[] = [
  {
    id: 'alert_1',
    userId: 'admin@example.com',
    type: 'new_location',
    severity: 'medium',
    title: '检测到新位置登录',
    description: '您的账户从新的位置（北京市, 中国）登录。如果这不是您本人操作，请立即修改密码。',
    locationInfo: { ip: '203.0.113.55', city: '北京市', country: '中国' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    isRead: false,
    isResolved: false,
  },
];

// 异常检测设置
let ANOMALY_DETECTION_SETTINGS: AnomalyDetectionSettings = {
  enabled: true,
  detectNewDevice: true,
  detectNewLocation: true,
  detectSuspiciousTime: true,
  detectMultipleFailures: true,
  detectIpChange: true,
  suspiciousTimeStart: 0,
  suspiciousTimeEnd: 6,
  notifyByEmail: true,
  notifyInApp: true,
};

// 获取异常检测设置
export const getAnomalyDetectionSettings = async (): Promise<AnomalyDetectionSettings> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return { ...ANOMALY_DETECTION_SETTINGS };
};

// 更新异常检测设置
export const updateAnomalyDetectionSettings = async (settings: Partial<AnomalyDetectionSettings>): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  ANOMALY_DETECTION_SETTINGS = { ...ANOMALY_DETECTION_SETTINGS, ...settings };
};

// 获取已知设备列表
export const getKnownDevices = async (email: string): Promise<DeviceInfo[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return KNOWN_DEVICES[email] || [];
};

// 添加信任设备
export const trustDevice = async (email: string, deviceId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const devices = KNOWN_DEVICES[email] || [];
  const device = devices.find(d => d.id === deviceId);
  if (device) {
    device.isTrusted = true;
  }
};

// 移除设备
export const removeDevice = async (email: string, deviceId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  if (KNOWN_DEVICES[email]) {
    KNOWN_DEVICES[email] = KNOWN_DEVICES[email].filter(d => d.id !== deviceId);
  }
};

// 获取登录提醒
export const getLoginAlerts = async (userId: string): Promise<LoginAlert[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return LOGIN_ALERTS.filter(a => a.userId === userId).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

// 标记提醒为已读
export const markAlertAsRead = async (alertId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const alert = LOGIN_ALERTS.find(a => a.id === alertId);
  if (alert) {
    alert.isRead = true;
  }
};

// 标记提醒为已处理
export const resolveAlert = async (alertId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const alert = LOGIN_ALERTS.find(a => a.id === alertId);
  if (alert) {
    alert.isResolved = true;
  }
};

// 删除提醒
export const deleteAlert = async (alertId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  LOGIN_ALERTS = LOGIN_ALERTS.filter(a => a.id !== alertId);
};

// 检测异常登录并生成提醒
export const detectAnomalyLogin = async (
  email: string,
  deviceInfo: Partial<DeviceInfo>,
  locationInfo: LoginLocation
): Promise<LoginAlert | null> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (!ANOMALY_DETECTION_SETTINGS.enabled) {
    return null;
  }
  
  const knownDevices = KNOWN_DEVICES[email] || [];
  const knownLocations = KNOWN_LOCATIONS[email] || [];
  
  // 检测新设备
  if (ANOMALY_DETECTION_SETTINGS.detectNewDevice) {
    const isKnownDevice = knownDevices.some(
      d => d.browser === deviceInfo.browser && d.os === deviceInfo.os
    );
    
    if (!isKnownDevice) {
      const newDevice: DeviceInfo = {
        id: `device_${Date.now()}`,
        browser: deviceInfo.browser || 'Unknown',
        os: deviceInfo.os || 'Unknown',
        deviceType: deviceInfo.deviceType || 'desktop',
        userAgent: deviceInfo.userAgent || '',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        isTrusted: false,
      };
      
      if (!KNOWN_DEVICES[email]) {
        KNOWN_DEVICES[email] = [];
      }
      KNOWN_DEVICES[email].push(newDevice);
      
      const alert: LoginAlert = {
        id: `alert_${Date.now()}`,
        userId: email,
        type: 'new_device',
        severity: 'medium',
        title: '检测到新设备登录',
        description: `您的账户从新设备（${deviceInfo.browser} on ${deviceInfo.os}）登录。如果这不是您本人操作，请立即修改密码。`,
        deviceInfo: newDevice,
        timestamp: new Date().toISOString(),
        isRead: false,
        isResolved: false,
      };
      
      LOGIN_ALERTS.push(alert);
      return alert;
    }
  }
  
  // 检测新位置
  if (ANOMALY_DETECTION_SETTINGS.detectNewLocation) {
    const isKnownLocation = knownLocations.some(
      l => l.city === locationInfo.city && l.country === locationInfo.country
    );
    
    if (!isKnownLocation) {
      if (!KNOWN_LOCATIONS[email]) {
        KNOWN_LOCATIONS[email] = [];
      }
      KNOWN_LOCATIONS[email].push(locationInfo);
      
      const alert: LoginAlert = {
        id: `alert_${Date.now()}`,
        userId: email,
        type: 'new_location',
        severity: 'high',
        title: '检测到新位置登录',
        description: `您的账户从新的位置（${locationInfo.city}, ${locationInfo.country}）登录。如果这不是您本人操作，请立即修改密码。`,
        locationInfo,
        timestamp: new Date().toISOString(),
        isRead: false,
        isResolved: false,
      };
      
      LOGIN_ALERTS.push(alert);
      return alert;
    }
  }
  
  // 检测可疑时间登录
  if (ANOMALY_DETECTION_SETTINGS.detectSuspiciousTime) {
    const hour = new Date().getHours();
    const { suspiciousTimeStart, suspiciousTimeEnd } = ANOMALY_DETECTION_SETTINGS;
    
    const isSuspiciousTime = suspiciousTimeStart < suspiciousTimeEnd
      ? hour >= suspiciousTimeStart && hour < suspiciousTimeEnd
      : hour >= suspiciousTimeStart || hour < suspiciousTimeEnd;
    
    if (isSuspiciousTime) {
      const alert: LoginAlert = {
        id: `alert_${Date.now()}`,
        userId: email,
        type: 'suspicious_time',
        severity: 'low',
        title: '非常规时间登录',
        description: `您的账户在非常规时间（${hour}:00）登录。如果这不是您本人操作，请立即修改密码。`,
        timestamp: new Date().toISOString(),
        isRead: false,
        isResolved: false,
      };
      
      LOGIN_ALERTS.push(alert);
      return alert;
    }
  }
  
  return null;
};

// 获取未读提醒数量
export const getUnreadAlertCount = async (userId: string): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  return LOGIN_ALERTS.filter(a => a.userId === userId && !a.isRead).length;
};
