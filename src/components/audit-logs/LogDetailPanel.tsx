import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AuditLog } from '@/types';
import { 
  User, 
  Globe, 
  Monitor, 
  Calendar, 
  FileText,
  Activity,
} from 'lucide-react';

interface LogDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: AuditLog | null;
}

const actionConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  create: { label: '创建', variant: 'default' },
  update: { label: '更新', variant: 'secondary' },
  delete: { label: '删除', variant: 'destructive' },
  login: { label: '登录', variant: 'outline' },
  logout: { label: '登出', variant: 'outline' },
  role_change: { label: '角色变更', variant: 'secondary' },
  permission_change: { label: '权限变更', variant: 'secondary' },
};

const resourceLabels: Record<string, string> = {
  projects: '项目',
  users: '用户',
  roles: '角色',
  files: '文件',
  settings: '设置',
  auth: '认证',
};

export const LogDetailPanel: React.FC<LogDetailPanelProps> = ({
  open,
  onOpenChange,
  log,
}) => {
  if (!log) return null;

  const action = actionConfig[log.action] || { label: log.action, variant: 'outline' as const };
  const resourceLabel = resourceLabels[log.resource] || log.resource;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>日志详情</SheetTitle>
          <SheetDescription>查看操作日志的详细信息</SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-6 pr-4">
            {/* 操作概要 */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Activity className="h-10 w-10 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={action.variant}>{action.label}</Badge>
                  <span className="text-sm text-muted-foreground">{resourceLabel}</span>
                </div>
                <p className="text-sm mt-1">
                  {log.userName} 对 {resourceLabel} 执行了 {action.label} 操作
                </p>
              </div>
            </div>
            
            <Separator />
            
            {/* 操作信息 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">操作信息</h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground">操作用户</span>
                    <p className="text-sm font-medium">{log.userName}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground">资源类型</span>
                    <p className="text-sm font-medium">{resourceLabel}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground">资源ID</span>
                    <p className="text-sm font-medium font-mono">{log.resourceId}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground">操作时间</span>
                    <p className="text-sm font-medium">
                      {format(new Date(log.createdAt), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* 客户端信息 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">客户端信息</h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground">IP 地址</span>
                    <p className="text-sm font-medium font-mono">{log.ipAddress}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground">User Agent</span>
                    <p className="text-sm font-medium break-all">{log.userAgent}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* 详细数据 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">详细数据</h4>
              
              <div className="rounded-lg bg-muted p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
