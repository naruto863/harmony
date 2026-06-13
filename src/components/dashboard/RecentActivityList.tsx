import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Plus, 
  Pencil, 
  Trash2,
  FileUp,
  UserPlus,
} from 'lucide-react';
import { AUDIT_LOGS } from '@/data/mock-data';
import { useTenant } from '@/contexts/TenantContext';

const actionIcons: Record<string, React.ReactNode> = {
  login: <LogIn className="h-4 w-4" />,
  logout: <LogOut className="h-4 w-4" />,
  create: <Plus className="h-4 w-4" />,
  update: <Pencil className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  upload: <FileUp className="h-4 w-4" />,
  invite: <UserPlus className="h-4 w-4" />,
};

const actionLabels: Record<string, string> = {
  login: '登录',
  logout: '退出',
  create: '创建',
  update: '更新',
  delete: '删除',
  upload: '上传',
  invite: '邀请',
};

const resourceLabels: Record<string, string> = {
  auth: '系统',
  projects: '项目',
  users: '用户',
  files: '文件',
  roles: '角色',
};

const actionColors: Record<string, string> = {
  login: 'bg-primary/10 text-primary',
  logout: 'bg-muted text-muted-foreground',
  create: 'bg-success/10 text-success',
  update: 'bg-warning/10 text-warning',
  delete: 'bg-destructive/10 text-destructive',
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

export const RecentActivityList: React.FC = () => {
  const { currentTenant } = useTenant();
  
  const activities = AUDIT_LOGS
    .filter(log => log.tenantId === currentTenant?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-warning to-warning/70 flex items-center justify-center">
            <Clock className="h-4 w-4 text-white" />
          </div>
          最近活动
        </CardTitle>
        <CardDescription className="mt-1">系统中的最新操作记录</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          {activities.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              暂无活动记录
            </div>
          ) : (
            <div className="divide-y">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 p-4 hover:bg-accent/30 transition-colors">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${actionColors[activity.action] || 'bg-muted'}`}>
                    {actionIcons[activity.action] || <Plus className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.userName}</span>
                      {' '}
                      <Badge variant="outline" className="text-xs mx-1">
                        {actionLabels[activity.action] || activity.action}
                      </Badge>
                      {' '}
                      {resourceLabels[activity.resource] || activity.resource}
                    </p>
                    {activity.details && typeof activity.details === 'object' && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {(activity.details as Record<string, unknown>).name as string || 
                         (activity.details as Record<string, unknown>).field as string || 
                         JSON.stringify(activity.details)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
