import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  FolderKanban,
  User,
  Shield,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
  NotificationType,
  NotificationCategory,
} from '@/services/notificationService';
import { cn } from '@/lib/utils';

const categoryIcons: Record<NotificationCategory, React.ReactNode> = {
  system: <Settings className="h-4 w-4" />,
  project: <FolderKanban className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
};

const typeIcons: Record<NotificationType, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
};

const typeColors: Record<NotificationType, string> = {
  info: 'border-l-blue-500',
  success: 'border-l-green-500',
  warning: 'border-l-yellow-500',
  error: 'border-l-red-500',
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
};

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // 加载通知
  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // 定时刷新（模拟实时推送）
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // 标记已读
  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markAsRead(notificationId);
    await loadNotifications();
  };

  // 标记全部已读
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    await loadNotifications();
  };

  // 删除通知
  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
    await loadNotifications();
  };

  // 点击通知
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
      await loadNotifications();
    }
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  // 过滤通知
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.isRead;
    return n.category === activeTab;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">通知中心</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              全部已读
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              全部
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              未读 {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              系统
            </TabsTrigger>
            <TabsTrigger
              value="project"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              项目
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0">
            <ScrollArea className="h-[350px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  加载中...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">暂无通知</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-l-4',
                        typeColors[notification.type],
                        !notification.isRead && 'bg-muted/30'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {typeIcons[notification.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            'text-sm',
                            !notification.isRead && 'font-medium'
                          )}>
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => handleDelete(notification.id, e)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {categoryIcons[notification.category]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className="w-full justify-center text-sm"
            onClick={() => {
              navigate('/settings/notifications');
              setOpen(false);
            }}
          >
            通知设置
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
