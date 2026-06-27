import { User } from '@/types';
import { apiClient } from './apiClient';

// 本地偏好类设置用延迟模拟交互反馈；账号/租户等真实敏感操作仍走 apiClient。
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 个人资料服务：这些接口修改真实用户资料，应由后端做鉴权、审计和字段校验。
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
  // userId 保留给调用方上下文，真实更新目标以后端当前登录用户为准，避免前端越权指定用户。
  const updated = await apiClient.put<User>('/api/users/me', {
    name: data.name,
    phone: data.phone,
    avatar: data.avatar,
  });
  return updated;
};

export const updatePassword = async (userId: string, data: PasswordUpdateData): Promise<void> => {
  // 密码更新不在前端做复杂策略判断，策略和历史密码校验都应由后端返回明确错误。
  await apiClient.post<void>('/api/users/me/password', {
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
  });
};

export const uploadAvatar = async (file: File): Promise<string> => {
  // 头像仍走统一文件上传入口，避免页面绕过上传策略或直接持久化 data URL。
  const uploaded = await apiClient.upload<{ url: string }>('/api/files/upload', file);
  return uploaded.url;
};

// 租户设置服务：这里是高风险租户级变更，只提供 API 适配，不做本地 mock 持久化。
export interface TenantUpdateData {
  name: string;
  logo?: string;
}

export const updateTenant = async (tenantId: string, data: TenantUpdateData): Promise<void> => {
  // logo 字段当前不提交，避免在后端契约未确认时把头像/租户 Logo 上传路径混用。
  await apiClient.put<void>(`/api/tenants/${tenantId}`, {
    name: data.name,
  });
};

export const deleteTenant = async (tenantId: string): Promise<void> => {
  // 删除租户属于破坏性操作，前端只调用契约接口，确认和权限控制应在页面/后端共同完成。
  await apiClient.delete<void>(`/api/tenants/${tenantId}`);
};

// 通知偏好服务：当前仍是用户浏览器本地偏好，不代表真实通知订阅已写入后端。
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
  // 用 userId 分桶，避免同一浏览器切换账号时复用上一位用户的偏好。
  const prefs = localStorage.getItem(`notification_prefs_${userId}`);
  return prefs ? JSON.parse(prefs) : DEFAULT_NOTIFICATION_PREFS;
};

export const updateNotificationPreferences = async (
  userId: string,
  prefs: NotificationPreferences
): Promise<void> => {
  await delay(500);
  // 这里只保存前端体验偏好；真实邮件/站内信开关需要后端订阅接口承接。
  localStorage.setItem(`notification_prefs_${userId}`, JSON.stringify(prefs));
};

// 功能开关服务：当前用于 Demo/设置页展示，不作为生产权限或套餐授权来源。
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
  // 按 tenantId 隔离本地开关，模拟不同租户看到不同实验功能状态。
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
    // 未知 featureId 直接忽略，避免页面旧配置把本地存储写出未登记开关。
    features[featureIndex].enabled = enabled;
    localStorage.setItem(`features_${tenantId}`, JSON.stringify(features));
  }
};
