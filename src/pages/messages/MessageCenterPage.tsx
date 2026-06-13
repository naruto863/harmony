import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Inbox, 
  Bell, 
  Mail, 
  Star, 
  Archive, 
  Trash2, 
  Search,
  CheckCheck,
  RefreshCw,
  Send,
  FileText,
  AlertTriangle,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  Paperclip,
  Reply,
  Forward,
  Settings,
  FolderKanban,
  User,
  Shield,
  Info,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  toggleStar,
  archiveNotification,
  deleteNotification,
  getEmailMessages,
  getUnreadEmailCount,
  markEmailAsRead,
  toggleEmailStar,
  moveEmailToFolder,
  deleteEmail,
  getEmailFolderCounts,
  Notification,
  NotificationCategory,
  NotificationType,
  EmailMessage,
} from '@/services/notificationService';
import { cn } from '@/lib/utils';
import { isDemoModeEnabled } from '@/lib/demoMode';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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

export const MessageCenterPage: React.FC = () => {
  const emailDemoEnabled = isDemoModeEnabled();
  const [activeTab, setActiveTab] = useState<'notifications' | 'emails'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadEmailCount, setUnreadEmailCount] = useState(0);
  const [emailFolderCounts, setEmailFolderCounts] = useState<Record<EmailMessage['folder'], number>>({
    inbox: 0, sent: 0, drafts: 0, trash: 0, spam: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');
  const [emailFolder, setEmailFolder] = useState<EmailMessage['folder']>('inbox');
  const [searchQuery, setSearchQuery] = useState('');

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [notifs, notifCount, emailCount, folderCounts] = await Promise.all([
        getNotifications({ 
          unreadOnly: notifFilter === 'unread',
          starred: notifFilter === 'starred' ? true : undefined,
          archived: notifFilter === 'archived' ? true : undefined,
        }),
        getUnreadCount(),
        emailDemoEnabled ? getUnreadEmailCount() : Promise.resolve(0),
        emailDemoEnabled ? getEmailFolderCounts() : Promise.resolve({ inbox: 0, sent: 0, drafts: 0, trash: 0, spam: 0 }),
      ]);
      
      const emailList = emailDemoEnabled ? await getEmailMessages({ folder: emailFolder }) : [];
      
      setNotifications(notifs);
      setEmails(emailList);
      setUnreadNotifCount(notifCount);
      setUnreadEmailCount(emailCount);
      setEmailFolderCounts(folderCounts);
    } catch (error) {
      toast.error('加载消息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [notifFilter, emailFolder, emailDemoEnabled]);

  useEffect(() => {
    if (!emailDemoEnabled && activeTab === 'emails') {
      setActiveTab('notifications');
    }
  }, [activeTab, emailDemoEnabled]);

  // 处理通知点击
  const handleNotificationClick = async (notif: Notification) => {
    setSelectedNotification(notif);
    if (!notif.isRead) {
      await markAsRead(notif.id);
      loadData();
    }
  };

  // 处理邮件点击
  const handleEmailClick = async (email: EmailMessage) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      await markEmailAsRead(email.id);
      loadData();
    }
  };

  // 全部已读
  const handleMarkAllRead = async () => {
    await markAllAsRead();
    toast.success('已标记全部为已读');
    loadData();
  };

  // 切换星标
  const handleToggleStar = async (id: string, isEmail: boolean) => {
    if (isEmail) {
      await toggleEmailStar(id);
    } else {
      await toggleStar(id);
    }
    loadData();
  };

  // 归档
  const handleArchive = async (id: string) => {
    await archiveNotification(id);
    setSelectedNotification(null);
    toast.success('已归档');
    loadData();
  };

  // 删除
  const handleDelete = async (id: string, isEmail: boolean) => {
    if (isEmail) {
      await deleteEmail(id);
      setSelectedEmail(null);
    } else {
      await deleteNotification(id);
      setSelectedNotification(null);
    }
    toast.success('已删除');
    loadData();
  };

  // 过滤消息
  const filteredNotifications = notifications.filter(n =>
    searchQuery === '' || 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEmails = emails.filter(e =>
    searchQuery === '' ||
    e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.from.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 1000 * 60 * 60 * 24) {
      return formatDistanceToNow(date, { locale: zhCN, addSuffix: true });
    }
    return format(date, 'MM-dd HH:mm');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">消息中心</h1>
          <p className="text-muted-foreground">管理您的通知和邮件</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            站内信
            {unreadNotifCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {unreadNotifCount}
              </Badge>
            )}
          </TabsTrigger>
          {emailDemoEnabled && (
            <TabsTrigger value="emails" className="gap-2">
              <Mail className="h-4 w-4" />
              邮件
              {unreadEmailCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {unreadEmailCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="notifications" className="flex-1 mt-4">
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* 左侧筛选栏 */}
            <div className="col-span-2">
              <Card className="h-full">
                <CardContent className="p-4 space-y-2">
                  <Button 
                    variant={notifFilter === 'all' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setNotifFilter('all')}
                  >
                    <Inbox className="h-4 w-4 mr-2" />
                    全部
                  </Button>
                  <Button 
                    variant={notifFilter === 'unread' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setNotifFilter('unread')}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    未读
                    {unreadNotifCount > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {unreadNotifCount}
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    variant={notifFilter === 'starred' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setNotifFilter('starred')}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    星标
                  </Button>
                  <Button 
                    variant={notifFilter === 'archived' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setNotifFilter('archived')}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    已归档
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* 中间消息列表 */}
            <div className="col-span-4">
              <Card className="h-full flex flex-col">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="搜索消息..." 
                        className="pl-9 h-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleMarkAllRead}>
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Bell className="h-8 w-8 mb-2 opacity-50" />
                      <p>暂无消息</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            'p-4 cursor-pointer hover:bg-muted/50 transition-colors border-l-4',
                            typeColors[notif.type],
                            !notif.isRead && 'bg-muted/30',
                            selectedNotification?.id === notif.id && 'bg-muted'
                          )}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {typeIcons[notif.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  'text-sm truncate',
                                  !notif.isRead && 'font-semibold'
                                )}>
                                  {notif.title}
                                </span>
                                {notif.isStarred && (
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {notif.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  {categoryIcons[notif.category]}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(notif.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>

            {/* 右侧详情 */}
            <div className="col-span-6">
              <Card className="h-full">
                {selectedNotification ? (
                  <div className="h-full flex flex-col">
                    <CardHeader className="py-4 px-6 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {typeIcons[selectedNotification.type]}
                          <div>
                            <CardTitle className="text-lg">{selectedNotification.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedNotification.sender?.name} · {formatTime(selectedNotification.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleToggleStar(selectedNotification.id, false)}
                          >
                            <Star className={cn(
                              'h-4 w-4',
                              selectedNotification.isStarred && 'fill-yellow-400 text-yellow-400'
                            )} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleArchive(selectedNotification.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(selectedNotification.id, false)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-6 overflow-auto">
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap">{selectedNotification.message}</p>
                      </div>
                      {selectedNotification.attachments && selectedNotification.attachments.length > 0 && (
                        <div className="mt-6 pt-4 border-t">
                          <p className="text-sm font-medium mb-3">附件</p>
                          <div className="space-y-2">
                            {selectedNotification.attachments.map((att, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                <Paperclip className="h-4 w-4" />
                                <span className="text-sm">{att.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedNotification.link && (
                        <div className="mt-6">
                          <Button variant="outline" asChild>
                            <a href={selectedNotification.link}>查看详情</a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Bell className="h-12 w-12 mb-4 opacity-30" />
                    <p>选择一条消息查看详情</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        {emailDemoEnabled && (
        <TabsContent value="emails" className="flex-1 mt-4">
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* 左侧文件夹 */}
            <div className="col-span-2">
              <Card className="h-full">
                <CardContent className="p-4 space-y-2">
                  <Button 
                    variant={emailFolder === 'inbox' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setEmailFolder('inbox')}
                  >
                    <Inbox className="h-4 w-4 mr-2" />
                    收件箱
                    {emailFolderCounts.inbox > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {emailFolderCounts.inbox}
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    variant={emailFolder === 'sent' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setEmailFolder('sent')}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    已发送
                  </Button>
                  <Button 
                    variant={emailFolder === 'drafts' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setEmailFolder('drafts')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    草稿箱
                  </Button>
                  <Button 
                    variant={emailFolder === 'trash' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setEmailFolder('trash')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    垃圾箱
                  </Button>
                  <Button 
                    variant={emailFolder === 'spam' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setEmailFolder('spam')}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    垃圾邮件
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* 中间邮件列表 */}
            <div className="col-span-4">
              <Card className="h-full flex flex-col">
                <CardHeader className="py-3 px-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="搜索邮件..." 
                      className="pl-9 h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredEmails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Mail className="h-8 w-8 mb-2 opacity-50" />
                      <p>暂无邮件</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredEmails.map((email) => (
                        <div
                          key={email.id}
                          className={cn(
                            'p-4 cursor-pointer hover:bg-muted/50 transition-colors',
                            !email.isRead && 'bg-muted/30',
                            selectedEmail?.id === email.id && 'bg-muted'
                          )}
                          onClick={() => handleEmailClick(email)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  'text-sm truncate',
                                  !email.isRead && 'font-semibold'
                                )}>
                                  {email.from.name}
                                </span>
                                {email.isStarred && (
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                )}
                                {email.attachments && email.attachments.length > 0 && (
                                  <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                )}
                              </div>
                              <p className={cn(
                                'text-sm truncate mt-1',
                                !email.isRead && 'font-medium'
                              )}>
                                {email.subject}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {email.body}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {email.labels.map((label, i) => (
                                  <Badge key={i} variant="outline" className="text-xs h-5">
                                    {label}
                                  </Badge>
                                ))}
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {formatTime(email.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>

            {/* 右侧详情 */}
            <div className="col-span-6">
              <Card className="h-full">
                {selectedEmail ? (
                  <div className="h-full flex flex-col">
                    <CardHeader className="py-4 px-6 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{selectedEmail.subject}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {selectedEmail.from.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{selectedEmail.from.name}</p>
                              <p className="text-xs text-muted-foreground">{selectedEmail.from.email}</p>
                            </div>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(new Date(selectedEmail.createdAt), 'yyyy-MM-dd HH:mm')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <Reply className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Forward className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleToggleStar(selectedEmail.id, true)}
                          >
                            <Star className={cn(
                              'h-4 w-4',
                              selectedEmail.isStarred && 'fill-yellow-400 text-yellow-400'
                            )} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(selectedEmail.id, true)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-6 overflow-auto">
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap">{selectedEmail.body}</p>
                      </div>
                      {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                        <div className="mt-6 pt-4 border-t">
                          <p className="text-sm font-medium mb-3">附件 ({selectedEmail.attachments.length})</p>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedEmail.attachments.map((att, i) => (
                              <div key={i} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <Paperclip className="h-4 w-4" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{att.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(att.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Mail className="h-12 w-12 mb-4 opacity-30" />
                    <p>选择一封邮件查看详情</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
