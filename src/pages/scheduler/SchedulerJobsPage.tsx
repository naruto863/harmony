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
import { getSchedulerJobs, runSchedulerJobOnce } from "@/services/schedulerService";
import type { SchedulerJob } from "@/types/scheduler";
import { Play, RefreshCw } from "lucide-react";

const statusMap: Record<SchedulerJob["status"], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  enabled: { label: "启用", variant: "default" },
  disabled: { label: "停用", variant: "secondary" },
  paused: { label: "暂停", variant: "destructive" },
};

const resultLabel: Record<NonNullable<SchedulerJob["lastResult"]>, string> = {
  success: "成功",
  failed: "失败",
  none: "暂无",
};

export const SchedulerJobsPage = () => {
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<SchedulerJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getSchedulerJobs({
        tenantId: currentTenant?.id,
        page: 1,
        pageSize: 20,
      });
      if (response.success && response.data) {
        setJobs(response.data);
      } else {
        toast({ title: response.error?.message || "加载任务定义失败", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant?.id, toast]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleRunOnce = async (job: SchedulerJob) => {
    if (!window.confirm(`确认立即执行任务「${job.name}」？`)) return;
    const response = await runSchedulerJobOnce(job.id, {
      tenantId: currentTenant?.id,
      reason: "manual-run-once",
    });
    if (response.success) {
      toast({ title: "已提交立即执行请求" });
      await loadJobs();
      return;
    }
    toast({ title: response.error?.message || "提交立即执行失败", variant: "destructive" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">任务调度</h1>
          <p className="text-muted-foreground">真实调度、并发控制和执行日志由外部 API 提供</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadJobs} aria-label="刷新任务定义">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">scheduler.jobs.read</Badge>
        <Badge variant="secondary">scheduler.jobs.execute</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>任务定义</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>触发器</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>最近结果</TableHead>
                  <TableHead>下次执行</TableHead>
                  <TableHead className="w-[120px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      暂无任务定义
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => {
                    const status = statusMap[job.status];
                    return (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="font-medium">{job.name}</div>
                          <div className="text-xs text-muted-foreground">{job.id}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>{job.triggerType}</div>
                          <div className="text-xs text-muted-foreground">{job.triggerExpression}</div>
                        </TableCell>
                        <TableCell>{job.ownerName || "-"}</TableCell>
                        <TableCell>{resultLabel[job.lastResult || "none"]}</TableCell>
                        <TableCell className="text-muted-foreground">{job.nextRunAt || "-"}</TableCell>
                        <TableCell className="text-right">
                          <PermissionGuard permission="scheduler.jobs.execute">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRunOnce(job)}
                              disabled={job.status !== "enabled"}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              立即执行
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

export default SchedulerJobsPage;
