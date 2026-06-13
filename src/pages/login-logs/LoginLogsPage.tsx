import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { getLoginLogs } from "@/services/loginLogService";
import { LoginLog } from "@/types";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { RefreshCw, Search } from "lucide-react";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  success: { label: "成功", variant: "default" },
  failed: { label: "失败", variant: "destructive" },
};

export const LoginLogsPage: React.FC = () => {
  const { currentTenant } = useTenant();
  const { toast } = useToast();

  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("");

  const loadLogs = useCallback(async () => {
    if (!currentTenant) return;
    setIsLoading(true);
    try {
      const response = await getLoginLogs({
        page,
        pageSize,
        tenantId: currentTenant.id,
        status: statusFilter === "all" ? undefined : statusFilter,
        userId: userFilter.trim() || undefined,
      });
      if (response.success && response.data) {
        setLogs(response.data);
        setTotal(response.meta?.total || 0);
      }
    } catch (error) {
      toast({ title: "加载登录日志失败", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant, page, pageSize, statusFilter, userFilter, toast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">登录日志</h1>
          <p className="text-muted-foreground">追踪用户登录轨迹与异常</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadLogs}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>日志列表</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="用户ID"
                  value={userFilter}
                  onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
                  className="pl-8 w-[180px]"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => { setStatusFilter(value); setPage(1); }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">时间</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>原因</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>设备</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      暂无登录日志
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map(log => {
                    const status = statusMap[log.status] || { label: log.status, variant: "secondary" as const };
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })}
                        </TableCell>
                        <TableCell className="font-medium">{log.userName || log.userId || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{log.reason || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{log.ipAddress || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{log.device || "-"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

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
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (page <= 3) pageNum = i + 1;
                      else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = page - 2 + i;
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
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
