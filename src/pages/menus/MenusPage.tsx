import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/crud";
import { useTenant } from "@/contexts/TenantContext";
import { useMenu } from "@/contexts/MenuContext";
import { useToast } from "@/hooks/use-toast";
import { MenuItem } from "@/types";
import {
  createMenu,
  deleteMenu,
  getMenuTree,
  updateMenu,
} from "@/services/menuService";
import { Plus, MoreHorizontal, RefreshCw, Edit, Trash2 } from "lucide-react";

type MenuFormState = {
  name: string;
  path: string;
  parentId: string | null;
  icon: string;
  type: string;
  sortOrder: number;
  visible: boolean;
  permissionCode: string;
};

type MenuRow = MenuItem & { depth: number };

const MENU_TYPES = [
  { value: "dir", label: "目录" },
  { value: "menu", label: "菜单" },
  { value: "button", label: "按钮" },
  { value: "external", label: "外链" },
];

const typeLabelMap = MENU_TYPES.reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const flattenMenus = (items: MenuItem[], depth: number = 0): MenuRow[] => {
  return items.flatMap(item => {
    const current: MenuRow = { ...item, depth };
    const children = item.children ? flattenMenus(item.children, depth + 1) : [];
    return [current, ...children];
  });
};

const getDefaultFormState = (): MenuFormState => ({
  name: "",
  path: "",
  parentId: null,
  icon: "",
  type: "menu",
  sortOrder: 0,
  visible: true,
  permissionCode: "",
});

export const MenusPage: React.FC = () => {
  const { currentTenant } = useTenant();
  const { refreshMenu } = useMenu();
  const { toast } = useToast();

  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<MenuItem | null>(null);
  const [formState, setFormState] = useState<MenuFormState>(getDefaultFormState());
  const [formLoading, setFormLoading] = useState(false);

  const loadMenus = useCallback(async () => {
    if (!currentTenant) return;
    setIsLoading(true);
    try {
      const response = await getMenuTree(currentTenant.id);
      if (response.success && response.data) {
        setMenus(response.data);
      } else {
        setMenus([]);
      }
    } catch (error) {
      toast({ title: "加载菜单失败", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant, toast]);

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  useEffect(() => {
    if (currentMenu) {
      setFormState({
        name: currentMenu.label || "",
        path: currentMenu.path || "",
        parentId: currentMenu.parentId ?? null,
        icon: currentMenu.icon || "",
        type: currentMenu.type || (currentMenu.path ? "menu" : "dir"),
        sortOrder: currentMenu.sortOrder ?? 0,
        visible: currentMenu.visible ?? true,
        permissionCode: currentMenu.permission || "",
      });
    } else {
      setFormState(getDefaultFormState());
    }
  }, [currentMenu]);

  const flatMenus = useMemo(() => flattenMenus(menus), [menus]);

  const parentOptions = useMemo(() => {
    return flatMenus.filter(menu => menu.id !== currentMenu?.id);
  }, [flatMenus, currentMenu]);

  const handleSubmit = async () => {
    if (!formState.name.trim()) {
      toast({ title: "请填写菜单名称", variant: "destructive" });
      return;
    }
    setFormLoading(true);
    try {
      if (currentMenu) {
        const response = await updateMenu(currentMenu.id, {
          name: formState.name.trim(),
          path: formState.path.trim() ? formState.path.trim() : undefined,
          parentId: formState.parentId,
          icon: formState.icon || undefined,
          type: formState.type,
          sortOrder: formState.sortOrder,
          visible: formState.visible,
          permissionCode: formState.permissionCode || undefined,
        });
        if (response.success) {
          toast({ title: "菜单已更新" });
          setFormOpen(false);
          setCurrentMenu(null);
          loadMenus();
          refreshMenu();
        } else {
          toast({ title: response.error?.message || "更新失败", variant: "destructive" });
        }
      } else {
        const response = await createMenu({
          name: formState.name.trim(),
          path: formState.path.trim() ? formState.path.trim() : undefined,
          parentId: formState.parentId,
          icon: formState.icon || undefined,
          type: formState.type,
          sortOrder: formState.sortOrder,
          visible: formState.visible,
          permissionCode: formState.permissionCode || undefined,
        });
        if (response.success) {
          toast({ title: "菜单已创建" });
          setFormOpen(false);
          setCurrentMenu(null);
          loadMenus();
          refreshMenu();
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
    if (!currentMenu) return;
    try {
      const response = await deleteMenu(currentMenu.id);
      if (response.success) {
        toast({ title: "菜单已删除" });
        setDeleteOpen(false);
        setCurrentMenu(null);
        loadMenus();
        refreshMenu();
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
          <h1 className="text-2xl font-bold">菜单管理</h1>
          <p className="text-muted-foreground">管理系统导航与权限入口</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadMenus}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => { setCurrentMenu(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            新建菜单
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>菜单列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>路径</TableHead>
                  <TableHead>权限码</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>可见</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : flatMenus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      暂无菜单数据
                    </TableCell>
                  </TableRow>
                ) : (
                  flatMenus.map(menu => (
                    <TableRow key={menu.id}>
                      <TableCell>
                        <div className="flex items-center" style={{ paddingLeft: menu.depth * 16 }}>
                          <span className="font-medium">{menu.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {menu.path || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {menu.permission || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabelMap[menu.type || "menu"] || "菜单"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={menu.visible === false ? "secondary" : "default"}>
                          {menu.visible === false ? "隐藏" : "显示"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {menu.sortOrder ?? 0}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setCurrentMenu(menu); setFormOpen(true); }}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { setCurrentMenu(menu); setDeleteOpen(true); }}
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
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{currentMenu ? "编辑菜单" : "新建菜单"}</DialogTitle>
            <DialogDescription>配置菜单名称、路径与权限</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>名称 *</Label>
              <Input
                value={formState.name}
                onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入菜单名称"
              />
            </div>
            <div className="space-y-2">
              <Label>路径</Label>
              <Input
                value={formState.path}
                onChange={(e) => setFormState(prev => ({ ...prev, path: e.target.value }))}
                placeholder="例如 /users"
              />
            </div>
            <div className="space-y-2">
              <Label>上级菜单</Label>
              <Select
                value={formState.parentId ?? "root"}
                onValueChange={(value) => setFormState(prev => ({
                  ...prev,
                  parentId: value === "root" ? null : value,
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择上级菜单" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">无（根节点）</SelectItem>
                  {parentOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {"-".repeat(option.depth + 1)} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>类型</Label>
                <Select
                  value={formState.type}
                  onValueChange={(value) => setFormState(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MENU_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>排序</Label>
                <Input
                  type="number"
                  value={formState.sortOrder}
                  onChange={(e) => setFormState(prev => ({
                    ...prev,
                    sortOrder: Number(e.target.value),
                  }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>图标</Label>
              <Input
                value={formState.icon}
                onChange={(e) => setFormState(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="例如 Settings"
              />
            </div>
            <div className="space-y-2">
              <Label>权限码</Label>
              <Input
                value={formState.permissionCode}
                onChange={(e) => setFormState(prev => ({ ...prev, permissionCode: e.target.value }))}
                placeholder="例如 users.read"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">菜单可见</p>
                <p className="text-xs text-muted-foreground">关闭后在侧边栏隐藏</p>
              </div>
              <Switch
                checked={formState.visible}
                onCheckedChange={(checked) => setFormState(prev => ({ ...prev, visible: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={formLoading}>
              {formLoading ? "处理中..." : currentMenu ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="删除菜单"
        description={`确定要删除菜单 "${currentMenu?.label}" 吗？`}
        confirmLabel="删除"
        variant="destructive"
        onConfirm={handleDelete}
        warnings={["删除后不可恢复", "存在子菜单时无法删除"]}
      />
    </div>
  );
};
