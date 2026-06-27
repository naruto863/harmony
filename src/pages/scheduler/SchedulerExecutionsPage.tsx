import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PermissionGuard } from "@/components/guards";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { getSchedulerExecutions, retrySchedulerExecution } from "@/services/schedulerService";
import type { SchedulerExecution } from "@/types/scheduler";
import { RefreshCcw, RefreshCw } from "lucide-react";

const statusMap: Record<SchedulerExecution["status"], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "等待中", variant: "secondary" },
  running: { label: "运行中", variant: "secondary" },
  success: { label: "成功", variant: "default" },
  failed: { label: "失败", variant: "destructive" },
  cancelled: { label: "已取消", variant: "secondary" },
};

const formatDuration = (durationMs?: number | null) => {
  if (durationMs == null) return "-";
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${Math.round(durationMs / 1000)}s`;
};

export const SchedulerExecutionsPage = () => {
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  const [executions, setExecutions] = useState<SchedulerExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadExecutions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getSchedulerExecutions({
        tenantId: currentTenant?.id,
        page: 1,
        pageSize: 20,
      });
      if (response.success && response.data) {
        setExecutions(response.data);
      } else {
        toast({ title: response.error?.message || "加载执行日志失败", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant?.id, toast]);

  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);

  const handleRetry = async (execution: SchedulerExecution) => {
    if (!window.confirm(`确认重试执行记录「${execution.id}」？`)) return;
    const response = await retrySchedulerExecution(execution.id, {
      tenantId: currentTenant?.id,
      reason: "manual-retry",
    });
    if (response.success) {
      toast({ title: "已提交重试请求" });
      await loadExecutions();
      return;
    }
    toast({ title: response.error?.message || "提交重试失败", variant: "destructive" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">执行日志</h1>
          <p className="text-muted-foreground">失败重试由外部 API 审计并执行，前端只发起受控请求</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadExecutions} aria-label="刷新执行日志">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">scheduler.executions.read</Badge>
        <Badge variant="secondary">scheduler.executions.retry</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>执行记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>耗时</TableHead>
                  <TableHead>TraceId</TableHead>
                  <TableHead>错误摘要</TableHead>
                  <TableHead className="w-[120px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : executions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      暂无执行日志
                    </TableCell>
                  </TableRow>
                ) : (
                  executions.map((execution) => {
                    const status = statusMap[execution.status];
                    return (
                      <TableRow key={execution.id}>
                        <TableCell>
                          <div className="font-medium">{execution.jobName}</div>
                          <div className="text-xs text-muted-foreground">{execution.id}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>{formatDuration(execution.durationMs)}</TableCell>
                        <TableCell className="text-muted-foreground">{execution.traceId || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{execution.errorSummary || "-"}</TableCell>
                        <TableCell className="text-right">
                          <PermissionGuard permission="scheduler.executions.retry">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetry(execution)}
                              disabled={!execution.retryable}
                            >
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              重试
                            </Button>
                          </PermissionGuard>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulerExecutionsPage;
