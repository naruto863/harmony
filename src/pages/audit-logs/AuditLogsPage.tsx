import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  Search, 
  RefreshCw,
  Download,
  Eye,
} from 'lucide-react';
import { LogDetailPanel, AdvancedFilter, FilterValues } from '@/components/audit-logs';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  getAuditLogs,
  exportAuditLogs,
  getResourceTypes,
  getActionTypes,
} from '@/services/auditLogService';
import { AuditLog, AuditAction } from '@/types';
import { USERS } from '@/data/mock-data';

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

export const AuditLogsPage: React.FC = () => {
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  
  // 状态
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  
  // 弹窗状态
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState<AuditLog | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // 筛选选项
  const resourceTypes = getResourceTypes();
  const actionTypes = getActionTypes();
  const users = USERS.map(u => ({ id: u.id, name: u.name }));
  
  // 加载数据
  const loadLogs = useCallback(async () => {
    if (!currentTenant) return;
    
    setIsLoading(true);
    try {
      const response = await getAuditLogs({
        tenantId: currentTenant.id,
        page,
        pageSize,
        search: search || undefined,
        action: filterValues.action,
        resource: filterValues.resource,
        userId: filterValues.userId,
        startDate: filterValues.startDate?.toISOString(),
        endDate: filterValues.endDate?.toISOString(),
      });
      
      if (response.success && response.data) {
        setLogs(response.data);
        setTotal(response.meta?.total || 0);
      }
    } catch (error) {
      toast({ title: '加载日志失败', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant, page, pageSize, search, filterValues, toast]);
  
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);
  
  // 导出
  const handleExport = async () => {
    if (!currentTenant) return;
    
    setIsExporting(true);
    try {
      const csvContent = await exportAuditLogs({
        tenantId: currentTenant.id,
        search: search || undefined,
        action: filterValues.action,
        resource: filterValues.resource,
        userId: filterValues.userId,
        startDate: filterValues.startDate?.toISOString(),
        endDate: filterValues.endDate?.toISOString(),
      });
      
      // 下载 CSV
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: '导出成功' });
    } catch (error) {
      toast({ title: '导出失败', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };
  
  const totalPages = Math.ceil(total / pageSize);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">审计日志</h1>
          <p className="text-muted-foreground">查看系统操作记录</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? '导出中...' : '导出 CSV'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>日志列表</CardTitle>
              <div className="flex items-center gap-2">
                {/* 搜索 */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索日志..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-8 w-[200px]"
                  />
                </div>
                
                {/* 刷新 */}
                <Button variant="outline" size="icon" onClick={loadLogs}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* 高级筛选 */}
            <AdvancedFilter
              values={filterValues}
              onChange={(v) => { setFilterValues(v); setPage(1); }}
              users={users}
              resources={resourceTypes}
              actions={actionTypes}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">时间</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>操作</TableHead>
                  <TableHead>资源类型</TableHead>
                  <TableHead>资源ID</TableHead>
                  <TableHead>IP地址</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      暂无日志数据
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map(log => {
                    const action = actionConfig[log.action] || { label: log.action, variant: 'outline' as const };
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                        </TableCell>
                        <TableCell className="font-medium">{log.userName}</TableCell>
                        <TableCell>
                          <Badge variant={action.variant}>{action.label}</Badge>
                        </TableCell>
                        <TableCell>{resourceLabels[log.resource] || log.resource}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground max-w-[150px] truncate">
                          {log.resourceId}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {log.ipAddress}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setCurrentLog(log); setDetailOpen(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                共 {total} 条记录，第 {page}/{totalPages} 页
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 详情弹窗 */}
      <LogDetailPanel
        open={detailOpen}
        onOpenChange={setDetailOpen}
        log={currentLog}
      />
    </div>
  );
};
