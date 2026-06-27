import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { DYNAMIC_FORM_FIELD_TYPES } from "@/services/dynamicFormService";
import { getWorkflowDefinitions, getWorkflowInstances } from "@/services/workflowService";
import type { WorkflowDefinition, WorkflowInstance } from "@/types/workflow";

export const WorkflowsPage = () => {
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);

  const loadData = useCallback(async () => {
    const [definitionResponse, instanceResponse] = await Promise.all([
      getWorkflowDefinitions({ tenantId: currentTenant?.id }),
      getWorkflowInstances({ tenantId: currentTenant?.id, page: 1, pageSize: 20 }),
    ]);
    if (definitionResponse.success && definitionResponse.data) {
      setDefinitions(definitionResponse.data);
    } else {
      toast({ title: definitionResponse.error?.message || "加载流程定义失败", variant: "destructive" });
    }
    if (instanceResponse.success && instanceResponse.data) {
      setInstances(instanceResponse.data);
    } else {
      toast({ title: instanceResponse.error?.message || "加载流程实例失败", variant: "destructive" });
    }
  }, [currentTenant?.id, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">工作流模板</h1>
        <p className="text-muted-foreground">流程执行、节点权限和历史真实性由 external API 负责</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">workflows.definitions.read</Badge>
        <Badge variant="secondary">workflows.instances.start</Badge>
        <Badge variant="secondary">forms.schemas.preview</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>流程定义</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>版本</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {definitions.map((definition) => (
                    <TableRow key={definition.id}>
                      <TableCell>{definition.name}</TableCell>
                      <TableCell>{definition.status}</TableCell>
                      <TableCell>v{definition.version}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>流程实例</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标题</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>当前节点</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.map((instance) => (
                    <TableRow key={instance.id}>
                      <TableCell>{instance.title}</TableCell>
                      <TableCell>{instance.status}</TableCell>
                      <TableCell>{instance.currentNodeName || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>动态表单字段白名单</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {DYNAMIC_FORM_FIELD_TYPES.map((type) => (
            <Badge key={type} variant="outline">{type}</Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowsPage;
