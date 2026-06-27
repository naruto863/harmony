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
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { getMonitoringHealth } from "@/services/monitoringService";
import type { MonitoringHealthSummary, MonitoringOverallStatus, MonitoringServiceStatus } from "@/types/monitoring";
import { RefreshCw } from "lucide-react";

const statusMap: Record<MonitoringServiceStatus | MonitoringOverallStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  healthy: { label: "健康", variant: "default" },
  degraded: { label: "降级", variant: "secondary" },
  down: { label: "不可用", variant: "destructive" },
  unknown: { label: "未知", variant: "secondary" },
};

const formatRate = (rate?: number | null) => {
  if (rate == null) return "-";
  return `${(rate * 100).toFixed(2)}%`;
};

export const MonitoringHealthPage = () => {
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  const [summary, setSummary] = useState<MonitoringHealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getMonitoringHealth({ tenantId: currentTenant?.id });
      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        toast({ title: response.error?.message || "加载监控健康状态失败", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant?.id, toast]);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const overall = summary ? statusMap[summary.overallStatus] : statusMap.unknown;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">监控健康</h1>
          <p className="text-muted-foreground">指标采集、健康判定和告警触发由外部监控平台或 API 提供</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadHealth} aria-label="刷新监控健康">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={overall.variant}>整体状态：{overall.label}</Badge>
        <Badge variant="secondary">monitoring.health.read</Badge>
        <Badge variant="secondary">monitoring.metrics.read</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>服务健康</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>服务</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>延迟</TableHead>
                  <TableHead>错误率</TableHead>
                  <TableHead>TraceId</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : !summary || summary.services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      暂无健康数据
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.services.map((service) => {
                    const status = statusMap[service.status];
                    return (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-xs text-muted-foreground">{service.id}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>{service.latencyMs ?? "-"}ms</TableCell>
                        <TableCell>{formatRate(service.errorRate)}</TableCell>
                        <TableCell className="text-muted-foreground">{service.traceId || "-"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>接口耗时</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary?.latency.map((item) => (
              <div key={item.path} className="flex items-center justify-between rounded-md border p-3">
                <span className="font-medium">{item.path}</span>
                <span className="text-sm text-muted-foreground">P95 {item.p95Ms}ms / AVG {item.avgMs}ms</span>
              </div>
            )) || <p className="text-sm text-muted-foreground">暂无耗时数据</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>错误率</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary?.errorRates.map((item) => (
              <div key={item.path} className="flex items-center justify-between rounded-md border p-3">
                <span className="font-medium">{item.path}</span>
                <span className="text-sm text-muted-foreground">{formatRate(item.rate)} / {item.count} 次 / {item.window}</span>
              </div>
            )) || <p className="text-sm text-muted-foreground">暂无错误率数据</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonitoringHealthPage;
