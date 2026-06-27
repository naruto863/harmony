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
  clearMaintenanceCache,
  getMaintenanceResources,
  syncMaintenanceReferenceData,
} from "@/services/maintenanceService";
import { getSaasPlans, getSaasQuotaUsage } from "@/services/saasService";
import type { MaintenanceResource } from "@/types/maintenance";
import type { SaasPlan, SaasQuotaUsage } from "@/types/saas";
import { Database, RefreshCw, ShieldAlert } from "lucide-react";

const typeLabel: Record<MaintenanceResource["type"], string> = {
  cache: "缓存管理",
  "reference-data": "基础数据同步",
  region: "地区分类",
  industry: "行业分类",
};

const statusMap: Record<MaintenanceResource["status"], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  healthy: { label: "正常", variant: "default" },
  stale: { label: "待同步", variant: "secondary" },
  locked: { label: "锁定", variant: "destructive" },
};

const formatQuotaLimit = (quota: SaasQuotaUsage) => {
  if (quota.limit === null) return "不限";
  return `${quota.used}/${quota.limit}${quota.unit}`;
};

export const MaintenancePage = () => {
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  const [resources, setResources] = useState<MaintenanceResource[]>([]);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [quotas, setQuotas] = useState<SaasQuotaUsage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resourcesResponse, plansResponse, quotasResponse] = await Promise.all([
        getMaintenanceResources({ tenantId: currentTenant?.id, page: 1, pageSize: 20 }),
        getSaasPlans({ tenantId: currentTenant?.id }),
        getSaasQuotaUsage({ tenantId: currentTenant?.id }),
      ]);

      if (resourcesResponse.success && resourcesResponse.data) {
        setResources(resourcesResponse.data);
      } else {
        toast({ title: resourcesResponse.error?.message || "加载维护资源失败", variant: "destructive" });
      }

      if (plansResponse.success && plansResponse.data) {
        setPlans(plansResponse.data);
      } else {
        toast({ title: plansResponse.error?.message || "加载套餐失败", variant: "destructive" });
      }

      if (quotasResponse.success && quotasResponse.data) {
        setQuotas(quotasResponse.data);
      } else {
        toast({ title: quotasResponse.error?.message || "加载配额失败", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant?.id, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const commandOptions = (resource: MaintenanceResource, operation: "CLEAR" | "SYNC") => ({
    tenantId: currentTenant?.id,
    reason: `${operation.toLowerCase()}-${resource.id}`,
    confirmationText: `${operation} ${resource.id}`,
  });

  const handleClearCache = async (resource: MaintenanceResource) => {
    if (!window.confirm(`确认清理受控缓存「${resource.name}」？`)) return;
    const response = await clearMaintenanceCache(resource.id, commandOptions(resource, "CLEAR"));
    if (response.success) {
      toast({ title: "已提交缓存清理请求" });
      await loadData();
      return;
    }
    toast({ title: response.error?.message || "提交缓存清理失败", variant: "destructive" });
  };

  const handleSyncReferenceData = async (resource: MaintenanceResource) => {
    if (!window.confirm(`确认同步基础数据「${resource.name}」？`)) return;
    const response = await syncMaintenanceReferenceData(resource.id, commandOptions(resource, "SYNC"));
    if (response.success) {
      toast({ title: "已提交基础数据同步请求" });
      await loadData();
      return;
    }
    toast({ title: response.error?.message || "提交基础数据同步失败", variant: "destructive" });
  };

  const currentPlan = plans.find((plan) => plan.tier === currentTenant?.plan) ?? plans[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">数据维护</h1>
          <p className="text-muted-foreground">
            危险操作需要二次确认、高权限和 external API 审计
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={loadData} aria-label="刷新维护数据">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">maintenance.resources.read</Badge>
        <Badge variant="secondary">maintenance.cache.clear</Badge>
        <Badge variant="secondary">maintenance.reference-data.sync</Badge>
        <Badge variant="secondary">saas.plans.read</Badge>
        <Badge variant="secondary">saas.modules.toggle</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              缓存管理
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            仅允许清理预注册资源，不提供任意缓存 key 删除。
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基础数据同步</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            地区、行业分类等基础数据由 external API 校验来源和版本。
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4" />
              审计留存
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            套餐只展示留存周期，真实审计保留和删除策略由后端强制执行。
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>受控维护资源</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>资源</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>范围</TableHead>
                  <TableHead>更新时间</TableHead>
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
                ) : resources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      暂无维护资源
                    </TableCell>
                  </TableRow>
                ) : (
                  resources.map((resource) => {
                    const status = statusMap[resource.status];
                    return (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <div className="font-medium">{resource.name}</div>
                          <div className="text-xs text-muted-foreground">{resource.id}</div>
                        </TableCell>
                        <TableCell>{typeLabel[resource.type]}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>{resource.scope === "tenant" ? "租户" : "全局"}</TableCell>
                        <TableCell className="text-muted-foreground">{resource.updatedAt}</TableCell>
                        <TableCell className="space-x-2 text-right">
                          {resource.allowedOperations.includes("clear") && (
                            <PermissionGuard permission="maintenance.cache.clear">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={resource.status === "locked"}
                                onClick={() => handleClearCache(resource)}
                              >
                                清理
                              </Button>
                            </PermissionGuard>
                          )}
                          {resource.allowedOperations.includes("sync") && (
                            <PermissionGuard permission="maintenance.reference-data.sync">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={resource.status === "locked"}
                                onClick={() => handleSyncReferenceData(resource)}
                              >
                                同步
                              </Button>
                            </PermissionGuard>
                          )}
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

      <Card>
        <CardHeader>
          <CardTitle>套餐与配额</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-md border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">{currentPlan?.name || "未配置套餐"}</span>
              {currentPlan && <Badge>{currentPlan.priceLabel}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              审计留存 {currentPlan?.auditRetentionDays ?? 0} 天
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              套餐、配额和模块启停只展示 external API 返回结果，真实强制执行不在前端完成。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {quotas.map((quota) => (
              <div key={quota.key} className="rounded-md border p-3">
                <p className="text-sm text-muted-foreground">{quota.label}</p>
                <p className="mt-1 text-xl font-semibold">{formatQuotaLimit(quota)}</p>
                <p className="mt-1 text-xs text-muted-foreground">由 external API 强制执行</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenancePage;
