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
import {
  acknowledgeMonitoringAlert,
  getMonitoringAlerts,
  resolveMonitoringAlert,
} from "@/services/monitoringService";
import type { MonitoringAlert, MonitoringAlertSeverity, MonitoringAlertStatus } from "@/types/monitoring";
import { CheckCircle2, RefreshCw } from "lucide-react";

const severityMap: Record<MonitoringAlertSeverity, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  info: { label: "提示", variant: "secondary" },
  warning: { label: "警告", variant: "secondary" },
  critical: { label: "严重", variant: "destructive" },
};

const statusMap: Record<MonitoringAlertStatus, string> = {
  open: "待处理",
  acknowledged: "已确认",
  resolved: "已解决",
  silenced: "已静默",
};

export const MonitoringAlertsPage = () => {
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getMonitoringAlerts({
        tenantId: currentTenant?.id,
        page: 1,
        pageSize: 20,
      });
      if (response.success && response.data) {
        setAlerts(response.data);
      } else {
        toast({ title: response.error?.message || "加载告警历史失败", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant?.id, toast]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleAck = async (alert: MonitoringAlert) => {
    if (!window.confirm(`确认告警「${alert.title}」？`)) return;
    const response = await acknowledgeMonitoringAlert(alert.id, {
      tenantId: currentTenant?.id,
      note: "manual-ack",
    });
    if (response.success) {
      toast({ title: "已提交告警确认请求" });
      await loadAlerts();
      return;
    }
    toast({ title: response.error?.message || "告警确认失败", variant: "destructive" });
  };

  const handleResolve = async (alert: MonitoringAlert) => {
    if (!window.confirm(`确认解决告警「${alert.title}」？`)) return;
    const response = await resolveMonitoringAlert(alert.id, {
      tenantId: currentTenant?.id,
      note: "manual-resolve",
    });
    if (response.success) {
      toast({ title: "已提交告警解决请求" });
      await loadAlerts();
      return;
    }
    toast({ title: response.error?.message || "告警解决失败", variant: "destructive" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">监控告警</h1>
          <p className="text-muted-foreground">告警规则和告警历史来自 external API，前端不内置告警引擎</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadAlerts} aria-label="刷新监控告警">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">monitoring.alerts.read</Badge>
        <Badge variant="secondary">monitoring.alerts.manage</Badge>
        <Badge variant="secondary">monitoring.alert-rules.manage</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>告警历史</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>告警</TableHead>
                  <TableHead>级别</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead>TraceId</TableHead>
                  <TableHead className="w-[180px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      暂无告警历史
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((alert) => {
                    const severity = severityMap[alert.severity];
                    return (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-xs text-muted-foreground">{alert.triggeredAt}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={severity.variant}>{severity.label}</Badge>
                        </TableCell>
                        <TableCell>{statusMap[alert.status]}</TableCell>
                        <TableCell>{alert.source}</TableCell>
                        <TableCell className="text-muted-foreground">{alert.traceId || "-"}</TableCell>
                        <TableCell className="text-right">
                          <PermissionGuard permission="monitoring.alerts.manage">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleAck(alert)} disabled={alert.status !== "open"}>
                                确认
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleResolve(alert)} disabled={alert.status === "resolved"}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                解决
                              </Button>
                            </div>
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

export default MonitoringAlertsPage;
