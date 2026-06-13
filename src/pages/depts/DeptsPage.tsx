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
import { useToast } from "@/hooks/use-toast";
import { DeptNode } from "@/types";
import { createDept, deleteDept, getDeptTree, updateDept } from "@/services/deptService";
import { Plus, MoreHorizontal, RefreshCw, Edit, Trash2 } from "lucide-react";

type DeptFormState = {
  name: string;
  parentId: string | null;
  sortOrder: number;
  status: string;
};

type DeptRow = DeptNode & { depth: number };

const statusOptions = [
  { value: "active", label: "启用" },
  { value: "inactive", label: "停用" },
];

const defaultDeptForm = (): DeptFormState => ({
  name: "",
  parentId: null,
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

export const DeptsPage: React.FC = () => {
  const { toast } = useToast();
  const [depts, setDepts] = useState<DeptNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentDept, setCurrentDept] = useState<DeptNode | null>(null);
  const [formState, setFormState] = useState<DeptFormState>(defaultDeptForm());
  const [formLoading, setFormLoading] = useState(false);

  const loadDepts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getDeptTree();
      if (response.success && response.data) {
        setDepts(response.data);
      } else {
        setDepts([]);
      }
    } catch (error) {
      toast({ title: "加载组织失败", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDepts();
  }, [loadDepts]);

  useEffect(() => {
    if (currentDept && formOpen) {
      setFormState({
        name: currentDept.name,
        parentId: currentDept.parentId ?? null,
        sortOrder: currentDept.sortOrder ?? 0,
        status: currentDept.status || "active",
      });
    } else if (formOpen) {
      setFormState(defaultDeptForm());
    }
  }, [currentDept, formOpen]);

  const flatDepts = useMemo(() => flattenDepts(depts), [depts]);
  const parentOptions = useMemo(() => {
    return flatDepts.filter(dept => dept.id !== currentDept?.id);
  }, [flatDepts, currentDept]);

  const handleSubmit = async () => {
    if (!formState.name.trim()) {
      toast({ title: "请填写组织名称", variant: "destructive" });
      return;
    }
    setFormLoading(true);
    try {
      if (currentDept) {
        const response = await updateDept(currentDept.id, {
          name: formState.name.trim(),
          parentId: formState.parentId,
          sortOrder: formState.sortOrder,
          status: formState.status,
        });
        if (response.success) {
          toast({ title: "组织已更新" });
          setFormOpen(false);
          setCurrentDept(null);
          loadDepts();
        } else {
          toast({ title: response.error?.message || "更新失败", variant: "destructive" });
        }
      } else {
        const response = await createDept({
          name: formState.name.trim(),
          parentId: formState.parentId,
          sortOrder: formState.sortOrder,
          status: formState.status,
        });
        if (response.success) {
          toast({ title: "组织已创建" });
          setFormOpen(false);
          loadDepts();
        } else {
          toast({ title: response.error?.message || "创建失败", variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "操作失败", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentDept) return;
    try {
      const response = await deleteDept(currentDept.id);
      if (response.success) {
        toast({ title: "组织已删除" });
        setDeleteOpen(false);
        setCurrentDept(null);
        loadDepts();
      } else {
        toast({ title: response.error?.message || "删除失败", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "删除失败", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">组织管理</h1>
          <p className="text-muted-foreground">维护部门树与层级关系</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadDepts}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => { setCurrentDept(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            新建部门
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>组织结构</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead className="w-[70px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : flatDepts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      暂无组织数据
                    </TableCell>
                  </TableRow>
                ) : (
                  flatDepts.map(dept => (
                    <TableRow key={dept.id}>
                      <TableCell>
                        <div className="flex items-center" style={{ paddingLeft: dept.depth * 16 }}>
                          <span className="font-medium">{dept.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={dept.status === "inactive" ? "secondary" : "default"}>
                          {dept.status === "inactive" ? "停用" : "启用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dept.sortOrder ?? 0}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setCurrentDept(dept); setFormOpen(true); }}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { setCurrentDept(dept); setDeleteOpen(true); }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
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
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{currentDept ? "编辑部门" : "新建部门"}</DialogTitle>
            <DialogDescription>设置部门名称与层级</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>部门名称 *</Label>
              <Input
                value={formState.name}
                onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入部门名称"
              />
            </div>
            <div className="space-y-2">
              <Label>上级部门</Label>
              <Select
                value={formState.parentId ?? "root"}
                onValueChange={(value) => setFormState(prev => ({
                  ...prev,
                  parentId: value === "root" ? null : value,
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择上级部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">无（根部门）</SelectItem>
                  {parentOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {"-".repeat(option.depth + 1)} {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {formLoading ? "处理中..." : currentDept ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="删除部门"
        description={`确定要删除部门 "${currentDept?.name}" 吗？`}
        confirmLabel="删除"
        variant="destructive"
        onConfirm={handleDelete}
        warnings={["删除后不可恢复", "存在子部门时无法删除"]}
      />
    </div>
  );
};
