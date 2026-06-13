import { apiClient } from "./apiClient";
import { isDemoModeEnabled, requireDemoMode } from "@/lib/demoMode";

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 'system' | 'project' | 'user' | 'security';
export type NotificationChannel = 'inapp' | 'email' | 'both';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  channel: NotificationChannel;
  priority: NotificationPriority;
  title: string;
  message: string;
  isRead: boolean;
  isArchived: boolean;
  isStarred: boolean;
  createdAt: string;
  readAt?: string;
  link?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
}

export interface EmailMessage {
  id: string;
  from: {
    name: string;
    email: string;
  };
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam';
  labels: string[];
  attachments?: {
    name: string;
    size: number;
    type: string;
  }[];
  createdAt: string;
  readAt?: string;
}

type NoticeDto = {
  id: string;
  title: string;
  content: string;
  recipientUserId?: string | null;
  senderUserId?: string | null;
  category?: string | null;
  type?: string | null;
  channel?: string | null;
  priority?: string | null;
  link?: string | null;
  status: string;
  publishAt?: string;
  createdAt: string;
  updatedAt?: string | null;
  isRead?: boolean;
  isArchived?: boolean;
  isStarred?: boolean;
  readAt?: string | null;
};

// Mock 邮件数据
let EMAIL_MESSAGES: EmailMessage[] = [
  {
    id: 'email_1',
    from: { name: '系统管理员', email: 'admin@example.com' },
    to: 'user@example.com',
    subject: '欢迎加入 Admin Studio',
    body: '欢迎您加入 Admin Studio 平台！您的账户已成功创建，现在可以开始使用所有功能了。\n\n如果您有任何问题，请随时联系我们的客服团队。',
    bodyHtml: '<h1>欢迎您加入 Admin Studio 平台！</h1><p>您的账户已成功创建，现在可以开始使用所有功能了。</p><p>如果您有任何问题，请随时联系我们的客服团队。</p>',
    isRead: true,
    isStarred: false,
    isArchived: false,
    folder: 'inbox',
    labels: ['重要'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 'email_2',
    from: { name: '项目经理', email: 'manager@example.com' },
    to: 'user@example.com',
    subject: '关于本周项目进度汇报',
    body: '您好，\n\n请在本周五下班前提交您负责模块的进度汇报。\n\n项目当前整体进度良好，希望继续保持。\n\n谢谢！',
    isRead: false,
    isStarred: true,
    isArchived: false,
    folder: 'inbox',
    labels: ['工作'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'email_3',
    from: { name: '安全中心', email: 'security@example.com' },
    to: 'user@example.com',
    subject: '账户安全提醒',
    body: '我们检测到您的账户在新设备上登录。\n\n设备信息：Chrome on Windows\nIP地址：203.0.113.10\n时间：今天 14:30\n\n如果这不是您的操作，请立即修改密码。',
    isRead: false,
    isStarred: false,
    isArchived: false,
    folder: 'inbox',
    labels: ['安全'],
    attachments: [{ name: '登录详情.pdf', size: 128000, type: 'application/pdf' }],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'email_4',
    from: { name: '我', email: 'user@example.com' },
    to: 'admin@example.com',
    subject: 'Re: 项目资源申请',
    body: '您好，\n\n附件是本月的资源使用申请表，请审批。\n\n谢谢！',
    isRead: true,
    isStarred: false,
    isArchived: false,
    folder: 'sent',
    labels: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'email_5',
    from: { name: '运维团队', email: 'ops@example.com' },
    to: 'user@example.com',
    subject: '系统维护通知',
    body: '尊敬的用户，\n\n系统将于本周六凌晨2:00-4:00进行例行维护，届时服务可能短暂中断。\n\n给您带来的不便敬请谅解。',
    isRead: true,
    isStarred: false,
    isArchived: true,
    folder: 'inbox',
    labels: ['系统'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
];

const toNotificationType = (value?: string | null): NotificationType => {
  return value === 'success' || value === 'warning' || value === 'error' ? value : 'info';
};

const toNotificationCategory = (value?: string | null): NotificationCategory => {
  return value === 'project' || value === 'user' || value === 'security' ? value : 'system';
};

const toNotificationChannel = (value?: string | null): NotificationChannel => {
  return value === 'email' || value === 'both' ? value : 'inapp';
};

const toNotificationPriority = (value?: string | null): NotificationPriority => {
  return value === 'low' || value === 'high' || value === 'urgent' ? value : 'normal';
};

const mapNoticeToNotification = (notice: NoticeDto): Notification => {
  return {
    id: notice.id,
    type: toNotificationType(notice.type),
    category: toNotificationCategory(notice.category),
    channel: toNotificationChannel(notice.channel),
    priority: toNotificationPriority(notice.priority),
    title: notice.title,
    message: notice.content,
    isRead: notice.isRead ?? false,
    isArchived: notice.isArchived ?? false,
    isStarred: notice.isStarred ?? false,
    createdAt: notice.createdAt,
    readAt: notice.readAt || undefined,
    link: notice.link || undefined,
    sender: { id: notice.senderUserId || 'system', name: notice.senderUserId ? '发送人' : '系统' },
  };
};

// 获取通知列表
export const getNotifications = async (options?: {
  unreadOnly?: boolean;
  category?: NotificationCategory;
  channel?: NotificationChannel;
  starred?: boolean;
  archived?: boolean;
  limit?: number;
}): Promise<Notification[]> => {
  const notices = await apiClient.get<NoticeDto[]>('/api/notices');
  let result = notices.map(notice => mapNoticeToNotification(notice));

  if (options?.unreadOnly) {
    result = result.filter(n => !n.isRead);
  }

  if (options?.category) {
    result = result.filter(n => n.category === options.category);
  }

  if (options?.channel) {
    result = result.filter(n => n.channel === options.channel);
  }

  if (options?.starred !== undefined) {
    result = result.filter(n => n.isStarred === options.starred);
  }

  if (options?.archived !== undefined) {
    result = result.filter(n => n.isArchived === options.archived);
  } else {
    result = result.filter(n => !n.isArchived);
  }

  if (options?.limit) {
    result = result.slice(0, options.limit);
  }

  return result.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

// 获取未读通知数量
export const getUnreadCount = async (): Promise<number> => {
  const notifications = await getNotifications();
  return notifications.filter(n => !n.isRead && !n.isArchived).length;
};

// 标记为已读
export const markAsRead = async (notificationId: string): Promise<void> => {
  await apiClient.post<void>(`/api/notices/${notificationId}/read`);
};

// 标记全部已读
export const markAllAsRead = async (): Promise<void> => {
  const notifications = await getNotifications();
  await Promise.all(
    notifications.filter(n => !n.isRead).map(n => apiClient.post<void>(`/api/notices/${n.id}/read`))
  );
};

// 切换星标
export const toggleStar = async (notificationId: string): Promise<void> => {
  await apiClient.post<void>(`/api/notices/${notificationId}/star`);
};

// 归档通知
export const archiveNotification = async (notificationId: string): Promise<void> => {
  await apiClient.post<void>(`/api/notices/${notificationId}/archive`);
};

// 批量归档
export const archiveMultiple = async (ids: string[]): Promise<void> => {
  await Promise.all(ids.map(id => archiveNotification(id)));
};

// 删除通知（由外部 API 记录当前用户删除状态）
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await apiClient.delete<void>(`/api/notices/${notificationId}`);
};

// 批量删除
export const deleteMultiple = async (ids: string[]): Promise<void> => {
  await Promise.all(ids.map(id => deleteNotification(id)));
};

// 添加新通知
export const addNotification = async (
  notification: Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isArchived' | 'isStarred'>
): Promise<Notification> => {
  const created = await apiClient.post<NoticeDto>('/api/notices', {
    title: notification.title,
    content: notification.message,
    category: notification.category,
    type: notification.type,
    channel: notification.channel,
    priority: notification.priority,
    link: notification.link,
  });
  return mapNoticeToNotification(created);
};

// ==================== 邮件相关 ====================

// 获取邮件列表
export const getEmailMessages = async (options?: {
  folder?: EmailMessage['folder'];
  unreadOnly?: boolean;
  starred?: boolean;
  label?: string;
  limit?: number;
}): Promise<EmailMessage[]> => {
  requireDemoMode('notificationService.emailMessages');
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let result = [...EMAIL_MESSAGES];
  
  if (options?.folder) {
    result = result.filter(e => e.folder === options.folder);
    if (options.folder !== 'inbox' || !options?.unreadOnly) {
      result = result.filter(e => !e.isArchived || options.folder === 'inbox');
    }
  }
  
  if (options?.unreadOnly) {
    result = result.filter(e => !e.isRead);
  }
  
  if (options?.starred) {
    result = result.filter(e => e.isStarred);
  }
  
  if (options?.label) {
    result = result.filter(e => e.labels.includes(options.label));
  }
  
  if (options?.limit) {
    result = result.slice(0, options.limit);
  }
  
  return result.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

// 获取未读邮件数量
export const getUnreadEmailCount = async (): Promise<number> => {
  if (!isDemoModeEnabled()) return 0;
  await new Promise(resolve => setTimeout(resolve, 50));
  return EMAIL_MESSAGES.filter(e => !e.isRead && e.folder === 'inbox').length;
};

// 获取邮件详情
export const getEmailById = async (id: string): Promise<EmailMessage | null> => {
  requireDemoMode('notificationService.emailMessages');
  await new Promise(resolve => setTimeout(resolve, 100));
  return EMAIL_MESSAGES.find(e => e.id === id) || null;
};

// 标记邮件已读
export const markEmailAsRead = async (emailId: string): Promise<void> => {
  requireDemoMode('notificationService.emailMessages');
  await new Promise(resolve => setTimeout(resolve, 100));
  
  EMAIL_MESSAGES = EMAIL_MESSAGES.map(e =>
    e.id === emailId ? { ...e, isRead: true, readAt: new Date().toISOString() } : e
  );
};

// 切换邮件星标
export const toggleEmailStar = async (emailId: string): Promise<void> => {
  requireDemoMode('notificationService.emailMessages');
  await new Promise(resolve => setTimeout(resolve, 100));
  
  EMAIL_MESSAGES = EMAIL_MESSAGES.map(e =>
    e.id === emailId ? { ...e, isStarred: !e.isStarred } : e
  );
};

// 移动邮件到文件夹
export const moveEmailToFolder = async (emailId: string, folder: EmailMessage['folder']): Promise<void> => {
  requireDemoMode('notificationService.emailMessages');
  await new Promise(resolve => setTimeout(resolve, 100));
  
  EMAIL_MESSAGES = EMAIL_MESSAGES.map(e =>
    e.id === emailId ? { ...e, folder } : e
  );
};

// 删除邮件（移至垃圾箱）
export const deleteEmail = async (emailId: string): Promise<void> => {
  requireDemoMode('notificationService.emailMessages');
  await new Promise(resolve => setTimeout(resolve, 100));
  
  EMAIL_MESSAGES = EMAIL_MESSAGES.map(e =>
    e.id === emailId ? { ...e, folder: 'trash' as const } : e
  );
};

// 永久删除邮件
export const permanentlyDeleteEmail = async (emailId: string): Promise<void> => {
  requireDemoMode('notificationService.emailMessages');
  await new Promise(resolve => setTimeout(resolve, 100));
  
  EMAIL_MESSAGES = EMAIL_MESSAGES.filter(e => e.id !== emailId);
};

// 发送邮件
export const sendEmail = async (email: Omit<EmailMessage, 'id' | 'createdAt' | 'isRead' | 'isStarred' | 'isArchived' | 'folder'>): Promise<EmailMessage> => {
  requireDemoMode('notificationService.emailMessages');
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const newEmail: EmailMessage = {
    ...email,
    id: `email_${Date.now()}`,
    isRead: true,
    isStarred: false,
    isArchived: false,
    folder: 'sent',
    createdAt: new Date().toISOString(),
  };
  
  EMAIL_MESSAGES = [newEmail, ...EMAIL_MESSAGES];
  
  return newEmail;
};

// 获取邮件文件夹统计
export const getEmailFolderCounts = async (): Promise<Record<EmailMessage['folder'], number>> => {
  if (!isDemoModeEnabled()) {
    return { inbox: 0, sent: 0, drafts: 0, trash: 0, spam: 0 };
  }
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const counts: Record<EmailMessage['folder'], number> = {
    inbox: 0,
    sent: 0,
    drafts: 0,
    trash: 0,
    spam: 0,
  };
  
  EMAIL_MESSAGES.forEach(e => {
    if (!e.isArchived) {
      counts[e.folder]++;
    }
  });
  
  return counts;
};

// 获取所有标签
export const getEmailLabels = async (): Promise<string[]> => {
  requireDemoMode('notificationService.emailMessages');
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const labels = new Set<string>();
  EMAIL_MESSAGES.forEach(e => e.labels.forEach(l => labels.add(l)));
  
  return Array.from(labels);
};

// ==================== 辅助函数 ====================

// 获取分类图标
export const getCategoryIcon = (category: NotificationCategory): string => {
  const icons: Record<NotificationCategory, string> = {
    system: 'Settings',
    project: 'FolderKanban',
    user: 'User',
    security: 'Shield',
  };
  return icons[category];
};

// 获取分类标签
export const getCategoryLabel = (category: NotificationCategory): string => {
  const labels: Record<NotificationCategory, string> = {
    system: '系统',
    project: '项目',
    user: '用户',
    security: '安全',
  };
  return labels[category];
};
