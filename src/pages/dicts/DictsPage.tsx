import React, { useCallback, useEffect, useState } from "react";
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
import { DictGroup, DictItem } from "@/types";
import {
  createDictGroup,
  createDictItem,
  deleteDictGroup,
  deleteDictItem,
  getDictGroups,
  getDictItems,
  updateDictGroup,
  updateDictItem,
} from "@/services/dictService";
import { Plus, MoreHorizontal, RefreshCw, Edit, Trash2 } from "lucide-react";

type DictGroupFormState = {
  groupKey: string;
  groupName: string;
  status: string;
};

type DictItemFormState = {
  itemKey: string;
  itemValue: string;
  status: string;
  sortOrder: number;
};

const statusOptions = [
  { value: "active", label: "启用" },
  { value: "inactive", label: "停用" },
];

const defaultGroupForm = (): DictGroupFormState => ({
  groupKey: "",
  groupName: "",
  status: "active",
});

const defaultItemForm = (): DictItemFormState => ({
  itemKey: "",
  itemValue: "",
  status: "active",
  sortOrder: 0,
});

export const DictsPage: React.FC = () => {
  const { toast } = useToast();
  const [groups, setGroups] = useState<DictGroup[]>([]);
  const [items, setItems] = useState<DictItem[]>([]);
  const [currentGroup, setCurrentGroup] = useState<DictGroup | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [deleteItemOpen, setDeleteItemOpen] = useState(false);

  const [currentItem, setCurrentItem] = useState<DictItem | null>(null);
  const [groupForm, setGroupForm] = useState<DictGroupFormState>(defaultGroupForm());
  const [itemForm, setItemForm] = useState<DictItemFormState>(defaultItemForm());
  const [formLoading, setFormLoading] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const response = await getDictGroups();
      if (response.success && response.data) {
        setGroups(response.data);
        if (!currentGroup && response.data.length > 0) {
          setCurrentGroup(response.data[0]);
        }
      }
    } catch (error) {
      toast({ title: "加载字典分组失败", variant: "destructive" });
    } finally {
      setLoadingGroups(false);
    }
  }, [currentGroup, toast]);

  const loadItems = useCallback(async (groupId: string) => {
    setLoadingItems(true);
    try {
      const response = await getDictItems({ groupId });
      if (response.success && response.data) {
        setItems(response.data);
      } else {
        setItems([]);
      }
    } catch (error) {
      toast({ title: "加载字典项失败", variant: "destructive" });
    } finally {
      setLoadingItems(false);
    }
  }, [toast]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (currentGroup) {
      loadItems(currentGroup.id);
    } else {
      setItems([]);
    }
  }, [currentGroup, loadItems]);

  useEffect(() => {
    if (currentGroup && groupDialogOpen) {
      setGroupForm({
        groupKey: currentGroup.groupKey,
        groupName: currentGroup.groupName,
        status: currentGroup.status || "active",
      });
    } else if (groupDialogOpen) {
      setGroupForm(defaultGroupForm());
    }
  }, [currentGroup, groupDialogOpen]);

  useEffect(() => {
    if (currentItem && itemDialogOpen) {
      setItemForm({
        itemKey: currentItem.itemKey,
        itemValue: currentItem.itemValue,
        status: currentItem.status || "active",
        sortOrder: currentItem.sortOrder ?? 0,
      });
    } else if (itemDialogOpen) {
      setItemForm(defaultItemForm());
    }
  }, [currentItem, itemDialogOpen]);

  const handleSubmitGroup = async () => {
    if (!groupForm.groupKey.trim() || !groupForm.groupName.trim()) {
      toast({ title: "请填写分组Key和名称", variant: "destructive" });
      return;
    }
    setFormLoading(true);
    try {
      if (currentGroup && groupDialogOpen && currentGroup.id) {
        const response = await updateDictGroup(currentGroup.id, {
          groupName: groupForm.groupName.trim(),
          status: groupForm.status,
        });
        if (response.success) {
          toast({ title: "分组已更新" });
          setGroupDialogOpen(false);
          await loadGroups();
        } else {
          toast({ title: response.error?.message || "更新失败", variant: "destructive" });
        }
      } else {
        const response = await createDictGroup({
          groupKey: groupForm.groupKey.trim(),
          groupName: groupForm.groupName.trim(),
          status: groupForm.status,
        });
        if (response.success) {
          toast({ title: "分组已创建" });
          setGroupDialogOpen(false);
          await loadGroups();
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

  const handleSubmitItem = async () => {
    if (!currentGroup) {
      toast({ title: "请先选择字典分组", variant: "destructive" });
      return;
    }
    if (!itemForm.itemKey.trim() || !itemForm.itemValue.trim()) {
      toast({ title: "请填写字典项Key和值", variant: "destructive" });
      return;
    }
    setFormLoading(true);
    try {
      if (currentItem) {
        const response = await updateDictItem(currentItem.id, {
          itemKey: itemForm.itemKey.trim(),
          itemValue: itemForm.itemValue.trim(),
          status: itemForm.status,
          sortOrder: itemForm.sortOrder,
        });
        if (response.success) {
          toast({ title: "字典项已更新" });
          setItemDialogOpen(false);
          setCurrentItem(null);
          loadItems(currentGroup.id);
        } else {
          toast({ title: response.error?.message || "更新失败", variant: "destructive" });
        }
      } else {
        const response = await createDictItem({
          groupId: currentGroup.id,
          itemKey: itemForm.itemKey.trim(),
          itemValue: itemForm.itemValue.trim(),
          status: itemForm.status,
          sortOrder: itemForm.sortOrder,
        });
        if (response.success) {
          toast({ title: "字典项已创建" });
          setItemDialogOpen(false);
          loadItems(currentGroup.id);
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

  const handleDeleteGroup = async () => {
    if (!currentGroup) return;
    try {
      const response = await deleteDictGroup(currentGroup.id);
      if (response.success) {
        toast({ title: "分组已删除" });
        setDeleteGroupOpen(false);
        setCurrentGroup(null);
        await loadGroups();
      } else {
        toast({ title: response.error?.message || "删除失败", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "删除失败", variant: "destructive" });
    }
  };

  const handleDeleteItem = async () => {
    if (!currentItem || !currentGroup) return;
    try {
      const response = await deleteDictItem(currentItem.id);
      if (response.success) {
        toast({ title: "字典项已删除" });
        setDeleteItemOpen(false);
        setCurrentItem(null);
        loadItems(currentGroup.id);
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
          <h1 className="text-2xl font-bold">字典管理</h1>
          <p className="text-muted-foreground">维护系统枚举与数据字典</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadGroups}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>字典分组</CardTitle>
            <Button size="sm" onClick={() => { setCurrentGroup(null); setGroupDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              新建
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="w-[70px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingGroups ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : groups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        暂无分组
                      </TableCell>
                    </TableRow>
                  ) : (
                    groups.map(group => (
                      <TableRow
                        key={group.id}
                        className={currentGroup?.id === group.id ? "bg-muted/50" : ""}
                        onClick={() => setCurrentGroup(group)}
                      >
                        <TableCell className="font-mono text-xs">{group.groupKey}</TableCell>
                        <TableCell>{group.groupName}</TableCell>
                        <TableCell>
                          <Badge variant={group.status === "inactive" ? "secondary" : "default"}>
                            {group.status === "inactive" ? "停用" : "启用"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => { setCurrentGroup(group); setGroupDialogOpen(true); }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => { setCurrentGroup(group); setDeleteGroupOpen(true); }}
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

        <Card className="col-span-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>字典项</CardTitle>
              <p className="text-sm text-muted-foreground">
                {currentGroup ? `当前分组：${currentGroup.groupName}` : "请选择分组"}
              </p>
            </div>
            <Button
              size="sm"
              disabled={!currentGroup}
              onClick={() => { setCurrentItem(null); setItemDialogOpen(true); }}
            >
              <Plus className="mr-2 h-4 w-4" />
              新建
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>值</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>排序</TableHead>
                    <TableHead className="w-[70px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingItems ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : !currentGroup ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        请选择分组
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        暂无字典项
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.itemKey}</TableCell>
                        <TableCell>{item.itemValue}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "inactive" ? "secondary" : "default"}>
                            {item.status === "inactive" ? "停用" : "启用"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.sortOrder ?? 0}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => { setCurrentItem(item); setItemDialogOpen(true); }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => { setCurrentItem(item); setDeleteItemOpen(true); }}
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
      </div>

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{currentGroup ? "编辑分组" : "新建分组"}</DialogTitle>
            <DialogDescription>维护字典分组基本信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>分组Key *</Label>
              <Input
                value={groupForm.groupKey}
                onChange={(e) => setGroupForm(prev => ({ ...prev, groupKey: e.target.value }))}
                disabled={!!currentGroup}
                placeholder="例如 user_status"
              />
            </div>
            <div className="space-y-2">
              <Label>分组名称 *</Label>
              <Input
                value={groupForm.groupName}
                onChange={(e) => setGroupForm(prev => ({ ...prev, groupName: e.target.value }))}
                placeholder="例如 用户状态"
              />
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={groupForm.status}
                onValueChange={(value) => setGroupForm(prev => ({ ...prev, status: value }))}
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
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitGroup} disabled={formLoading}>
              {formLoading ? "处理中..." : currentGroup ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{currentItem ? "编辑字典项" : "新建字典项"}</DialogTitle>
            <DialogDescription>维护字典项的Key和值</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Key *</Label>
              <Input
                value={itemForm.itemKey}
                onChange={(e) => setItemForm(prev => ({ ...prev, itemKey: e.target.value }))}
                placeholder="例如 active"
              />
            </div>
            <div className="space-y-2">
              <Label>值 *</Label>
              <Input
                value={itemForm.itemValue}
                onChange={(e) => setItemForm(prev => ({ ...prev, itemValue: e.target.value }))}
                placeholder="例如 启用"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={itemForm.status}
                  onValueChange={(value) => setItemForm(prev => ({ ...prev, status: value }))}
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
                  value={itemForm.sortOrder}
                  onChange={(e) => setItemForm(prev => ({ ...prev, sortOrder: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitItem} disabled={formLoading}>
              {formLoading ? "处理中..." : currentItem ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteGroupOpen}
        onOpenChange={setDeleteGroupOpen}
        title="删除分组"
        description={`确定要删除分组 "${currentGroup?.groupName}" 吗？`}
        confirmLabel="删除"
        variant="destructive"
        onConfirm={handleDeleteGroup}
        warnings={["删除后不可恢复"]}
      />

      <ConfirmDialog
        open={deleteItemOpen}
        onOpenChange={setDeleteItemOpen}
        title="删除字典项"
        description={`确定要删除字典项 "${currentItem?.itemKey}" 吗？`}
        confirmLabel="删除"
        variant="destructive"
        onConfirm={handleDeleteItem}
        warnings={["删除后不可恢复"]}
      />
    </div>
  );
};
