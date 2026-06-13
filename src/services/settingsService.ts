import { User } from '@/types';
import { apiClient } from './apiClient';

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 个人资料服务
export interface ProfileUpdateData {
  name: string;
  phone?: string;
  avatar?: string;
}

export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
}

export const updateProfile = async (userId: string, data: ProfileUpdateData): Promise<User> => {
  const updated = await apiClient.put<User>('/api/users/me', {
    name: data.name,
    phone: data.phone,
    avatar: data.avatar,
  });
  return updated;
};

export const updatePassword = async (userId: string, data: PasswordUpdateData): Promise<void> => {
  await apiClient.post<void>('/api/users/me/password', {
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
  });
};

export const uploadAvatar = async (file: File): Promise<string> => {
  const uploaded = await apiClient.upload<{ url: string }>('/api/files/upload', file);
  return uploaded.url;
};

// 租户设置服务
export interface TenantUpdateData {
  name: string;
  logo?: string;
}

export const updateTenant = async (tenantId: string, data: TenantUpdateData): Promise<void> => {
  await apiClient.put<void>(`/api/tenants/${tenantId}`, {
    name: data.name,
  });
};

export const deleteTenant = async (tenantId: string): Promise<void> => {
  await apiClient.delete<void>(`/api/tenants/${tenantId}`);
};

// 通知偏好服务
export interface NotificationPreferences {
  emailProjects: boolean;
  emailMembers: boolean;
  emailSecurity: boolean;
  pushEnabled: boolean;
  pushSound: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  emailProjects: true,
  emailMembers: true,
  emailSecurity: true,
  pushEnabled: true,
  pushSound: false,
};

export const getNotificationPreferences = async (userId: string): Promise<NotificationPreferences> => {
  await delay(300);
  const prefs = localStorage.getItem(`notification_prefs_${userId}`);
  return prefs ? JSON.parse(prefs) : DEFAULT_NOTIFICATION_PREFS;
};

export const updateNotificationPreferences = async (
  userId: string,
  prefs: NotificationPreferences
): Promise<void> => {
  await delay(500);
  localStorage.setItem(`notification_prefs_${userId}`, JSON.stringify(prefs));
};

// 功能开关服务
export interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  beta: boolean;
  requiresPlan?: string;
}

const DEFAULT_FEATURES: Feature[] = [
  { id: 'dark-mode', name: '深色模式', description: '启用深色主题', enabled: false, beta: false },
  { id: 'ai-assist', name: 'AI 助手', description: '启用 AI 智能辅助功能', enabled: true, beta: true },
  { id: 'advanced-analytics', name: '高级分析', description: '启用详细的数据分析功能', enabled: false, beta: true, requiresPlan: 'pro' },
  { id: 'api-access', name: 'API 访问', description: '允许通过 API 访问数据', enabled: true, beta: false, requiresPlan: 'pro' },
  { id: 'webhooks', name: 'Webhooks', description: '启用 Webhook 通知功能', enabled: false, beta: true, requiresPlan: 'enterprise' },
  { id: 'custom-branding', name: '自定义品牌', description: '自定义应用外观和品牌标识', enabled: false, beta: false, requiresPlan: 'enterprise' },
];

export const getFeatures = async (tenantId: string): Promise<Feature[]> => {
  await delay(300);
  const features = localStorage.getItem(`features_${tenantId}`);
  return features ? JSON.parse(features) : DEFAULT_FEATURES;
};

export const updateFeature = async (
  tenantId: string,
  featureId: string,
  enabled: boolean
): Promise<void> => {
  await delay(300);
  const features = await getFeatures(tenantId);
  const featureIndex = features.findIndex(f => f.id === featureId);
  
  if (featureIndex !== -1) {
    features[featureIndex].enabled = enabled;
    localStorage.setItem(`features_${tenantId}`, JSON.stringify(features));
  }
};
