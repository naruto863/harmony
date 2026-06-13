import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/crud";
import { PermissionGuard } from "@/components/guards";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { DeptNode, Position } from "@/types";
import { createPosition, deletePosition, getPositions, updatePosition } from "@/services/positionService";
import { getDeptTree } from "@/services/deptService";
import { Plus, MoreHorizontal, RefreshCw, Edit, Trash2 } from "lucide-react";

type PositionFormState = {
  name: string;
  code: string;
  deptId: string | null;
  description: string;
  sortOrder: number;
  status: string;
};

type DeptRow = DeptNode & { depth: number };

const statusOptions = [
  { value: "active", label: "启用" },
  { value: "inactive", label: "停用" },
];

const defaultPositionForm = (): PositionFormState => ({
  name: "",
  code: "",
  deptId: null,
  description: "",
  sortOrder: 0,
  status: "active",
});

const flattenDepts = (items: DeptNode[], depth: number = 0): DeptRow[] => {
  return items.flatMap(item => {
    const current: DeptRow = { ...item, depth };
    const children = item.children ? flattenDepts(item.children, depth + 1) : [];
    return [current, ...children];
  });
};

export const PositionsPage: React.FC = () => {
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const [positions, setPositions] = useState<Position[]>([]);
  const [depts, setDepts] = useState<DeptNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [formState, setFormState] = useState<PositionFormState>(defaultPositionForm());
  const [formLoading, setFormLoading] = useState(false);

  const loadPositions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPositions(currentTenant?.id);
      if (response.success && response.data) {
        setPositions(response.data);
      } else {
        setPositions([]);
      }
    } catch {
      toast({ title: "加载岗位失败", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant, toast]);

  const loadDepts = useCallback(async () => {
    if (!currentTenant) {
      setDepts([]);
      return;
    }
    try {
      const response = await getDeptTree();
      if (response.success && response.data) {
        setDepts(response.data);
      } else {
        setDepts([]);
      }
    } catch {
      setDepts([]);
    }
  }, [currentTenant]);

  useEffect(() => {
    if (!currentTenant) {
      setPositions([]);
      setDepts([]);
      return;
    }
    loadPositions();
    loadDepts();
  }, [currentTenant, loadPositions, loadDepts]);

  useEffect(() => {
    if (currentPosition && formOpen) {
      setFormState({
        name: currentPosition.name,
        code: currentPosition.code,
        deptId: currentPosition.deptId ?? null,
        description: currentPosition.description || "",
        sortOrder: currentPosition.sortOrder ?? 0,
        status: currentPosition.status || "active",
      });
    } else if (formOpen) {
      setFormState(defaultPositionForm());
    }
  }, [currentPosition, formOpen]);

  const flatDepts = useMemo(() => flattenDepts(depts), [depts]);

  const handleSubmit = async () => {
    if (!formState.name.trim()) {
      toast({ title: "请填写岗位名称", variant: "destructive" });
      return;
    }
    if (!formState.code.trim()) {
      toast({ title: "请填写岗位编码", variant: "destructive" });
      return;
    }
    setFormLoading(true);
    try {
      if (currentPosition) {
        const response = await updatePosition(currentPosition.id, {
          name: formState.name.trim(),
          code: formState.code.trim(),
          deptId: formState.deptId,
          description: formState.description.trim() || undefined,
          sortOrder: formState.sortOrder,
          status: formState.status,
        });
        if (response.success) {
          toast({ title: "岗位已更新" });
          setFormOpen(false);
          setCurrentPosition(null);
          loadPositions();
        } else {
          toast({ title: response.error?.message || "更新失败", variant: "destructive" });
        }
      } else {
        const response = await createPosition({
          name: formState.name.trim(),
          code: formState.code.trim(),
          deptId: formState.deptId,
          description: formState.description.trim() || undefined,
          sortOrder: formState.sortOrder,
          status: formState.status,
          tenantId: currentTenant?.id,
        });
        if (response.success) {
          toast({ title: "岗位已创建" });
          setFormOpen(false);
          loadPositions();
        } else {
          toast({ title: response.error?.message || "创建失败", variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "操作失败", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentPosition) return;
    try {
      const response = await deletePosition(currentPosition.id);
      if (response.success) {
        toast({ title: "岗位已删除" });
        setDeleteOpen(false);
        setCurrentPosition(null);
        loadPositions();
      } else {
        toast({ title: response.error?.message || "删除失败", variant: "destructive" });
      }
    } catch {
      toast({ title: "删除失败", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">岗位管理</h1>
          <p className="text-muted-foreground">维护岗位编码与所属部门</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadPositions}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <PermissionGuard permission="positions.create">
            <Button onClick={() => { setCurrentPosition(null); setFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              新建岗位
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>岗位列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>编码</TableHead>
                  <TableHead>所属部门</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : positions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      暂无岗位数据
                    </TableCell>
                  </TableRow>
                ) : (
                  positions.map(position => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">{position.name}</TableCell>
                      <TableCell className="font-mono text-xs">{position.code}</TableCell>
                      <TableCell>{position.deptName || "未分配"}</TableCell>
                      <TableCell>
                        <Badge variant={position.status === "inactive" ? "secondary" : "default"}>
                          {position.status === "inactive" ? "停用" : "启用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{position.sortOrder ?? 0}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <PermissionGuard permission="positions.update">
                              <DropdownMenuItem onClick={() => { setCurrentPosition(position); setFormOpen(true); }}>
                                <Edit className="mr-2 h-4 w-4" />
                                编辑
                              </DropdownMenuItem>
                            </PermissionGuard>
                            <PermissionGuard permission="positions.delete">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => { setCurrentPosition(position); setDeleteOpen(true); }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                              </DropdownMenuItem>
                            </PermissionGuard>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{currentPosition ? "编辑岗位" : "新建岗位"}</DialogTitle>
            <DialogDescription>设置岗位名称、编码与所属部门</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>岗位名称 *</Label>
                <Input
                  value={formState.name}
                  onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入岗位名称"
                />
              </div>
              <div className="space-y-2">
                <Label>岗位编码 *</Label>
                <Input
                  value={formState.code}
                  onChange={(e) => setFormState(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="例如 dev_lead"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>所属部门</Label>
              <Select
                value={formState.deptId ?? "none"}
                onValueChange={(value) => setFormState(prev => ({
                  ...prev,
                  deptId: value === "none" ? null : value,
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择所属部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不关联部门</SelectItem>
                  {flatDepts.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {"-".repeat(option.depth + 1)} {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>岗位描述</Label>
              <Input
                value={formState.description}
                onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入岗位描述"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={formState.status}
                  onValueChange={(value) => setFormState(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>排序</Label>
                <Input
                  type="number"
                  value={formState.sortOrder}
                  onChange={(e) => setFormState(prev => ({ ...prev, sortOrder: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={formLoading}>
              {formLoading ? "处理中..." : currentPosition ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="删除岗位"
        description={`确定要删除岗位 "${currentPosition?.name}" 吗？`}
        confirmLabel="删除"
        variant="destructive"
        onConfirm={handleDelete}
        warnings={["删除后不可恢复"]}
      />
    </div>
  );
};
