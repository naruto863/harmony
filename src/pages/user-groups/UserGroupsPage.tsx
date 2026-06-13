import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { UserGroup } from "@/types";
import { getUsers, UserWithRole } from "@/services/userService";
import {
  createUserGroup,
  deleteUserGroup,
  getUserGroupMembers,
  getUserGroups,
  updateUserGroup,
  updateUserGroupMembers,
} from "@/services/userGroupService";
import { Plus, MoreHorizontal, RefreshCw, Edit, Trash2, Users } from "lucide-react";

type UserGroupFormState = {
  name: string;
  code: string;
  description: string;
  status: string;
};

const statusOptions = [
  { value: "active", label: "启用" },
  { value: "inactive", label: "停用" },
];

const defaultFormState = (): UserGroupFormState => ({
  name: "",
  code: "",
  description: "",
  status: "active",
});

export const UserGroupsPage: React.FC = () => {
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<UserGroup | null>(null);
  const [formState, setFormState] = useState<UserGroupFormState>(defaultFormState());
  const [formLoading, setFormLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithRole[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getUserGroups(currentTenant?.id);
      if (response.success && response.data) {
        setGroups(response.data);
      } else {
        setGroups([]);
      }
    } catch {
      toast({ title: "加载用户组失败", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant, toast]);

  useEffect(() => {
    if (!currentTenant) {
      setGroups([]);
      return;
    }
    loadGroups();
  }, [currentTenant, loadGroups]);

  useEffect(() => {
    if (currentGroup && formOpen) {
      setFormState({
        name: currentGroup.name,
        code: currentGroup.code,
        description: currentGroup.description || "",
        status: currentGroup.status || "active",
      });
    } else if (formOpen) {
      setFormState(defaultFormState());
    }
  }, [currentGroup, formOpen]);

  const filteredUsers = useMemo(() => {
    const keyword = memberSearch.trim().toLowerCase();
    if (!keyword) return allUsers;
    return allUsers.filter(user =>
      user.name.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword)
    );
  }, [allUsers, memberSearch]);

  const handleSubmit = async () => {
    if (!formState.name.trim()) {
      toast({ title: "请填写用户组名称", variant: "destructive" });
      return;
    }
    if (!formState.code.trim()) {
      toast({ title: "请填写用户组编码", variant: "destructive" });
      return;
    }
    setFormLoading(true);
    try {
      if (currentGroup) {
        const response = await updateUserGroup(currentGroup.id, {
          name: formState.name.trim(),
          code: formState.code.trim(),
          description: formState.description.trim() || undefined,
          status: formState.status,
        });
        if (response.success) {
          toast({ title: "用户组已更新" });
          setFormOpen(false);
          setCurrentGroup(null);
          loadGroups();
        } else {
          toast({ title: response.error?.message || "更新失败", variant: "destructive" });
        }
      } else {
        const response = await createUserGroup({
          name: formState.name.trim(),
          code: formState.code.trim(),
          description: formState.description.trim() || undefined,
          status: formState.status,
          tenantId: currentTenant?.id,
        });
        if (response.success) {
          toast({ title: "用户组已创建" });
          setFormOpen(false);
          loadGroups();
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
    if (!currentGroup) return;
    try {
      const response = await deleteUserGroup(currentGroup.id);
      if (response.success) {
        toast({ title: "用户组已删除" });
        setDeleteOpen(false);
        setCurrentGroup(null);
        loadGroups();
      } else {
        toast({ title: response.error?.message || "删除失败", variant: "destructive" });
      }
    } catch {
      toast({ title: "删除失败", variant: "destructive" });
    }
  };

  const openMembers = async (group: UserGroup) => {
    if (!currentTenant) return;
    setCurrentGroup(group);
    setMemberOpen(true);
    setMemberSearch("");
    setMemberLoading(true);
    try {
      const [membersRes, usersRes] = await Promise.all([
        getUserGroupMembers(group.id),
        getUsers({ tenantId: currentTenant.id, pageSize: 200 }),
      ]);
      if (membersRes.success && membersRes.data) {
        setMemberIds(membersRes.data);
      } else {
        setMemberIds([]);
      }
      if (usersRes.success && usersRes.data) {
        setAllUsers(usersRes.data);
      } else {
        setAllUsers([]);
      }
    } catch {
      toast({ title: "加载成员失败", variant: "destructive" });
      setMemberIds([]);
      setAllUsers([]);
    } finally {
      setMemberLoading(false);
    }
  };

  const toggleMember = (userId: string) => {
    setMemberIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleSaveMembers = async () => {
    if (!currentGroup) return;
    setMemberLoading(true);
    try {
      const response = await updateUserGroupMembers(currentGroup.id, memberIds);
      if (response.success) {
        toast({ title: "成员已更新" });
        setMemberOpen(false);
        setMemberSearch("");
        loadGroups();
      } else {
        toast({ title: response.error?.message || "更新失败", variant: "destructive" });
      }
    } catch {
      toast({ title: "更新失败", variant: "destructive" });
    } finally {
      setMemberLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">用户组管理</h1>
          <p className="text-muted-foreground">按业务维度组织成员</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadGroups}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <PermissionGuard permission="user-groups.create">
            <Button onClick={() => { setCurrentGroup(null); setFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              新建用户组
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户组列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>编码</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>成员数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="w-[120px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      暂无用户组数据
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map(group => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="font-mono text-xs">{group.code}</TableCell>
                      <TableCell className="text-muted-foreground">{group.description || "-"}</TableCell>
                      <TableCell>{group.memberCount ?? 0}</TableCell>
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
                            <PermissionGuard permission="user-groups.update">
                              <DropdownMenuItem onClick={() => openMembers(group)}>
                                <Users className="mr-2 h-4 w-4" />
                                成员
                              </DropdownMenuItem>
                            </PermissionGuard>
                            <PermissionGuard permission="user-groups.update">
                              <DropdownMenuItem onClick={() => { setCurrentGroup(group); setFormOpen(true); }}>
                                <Edit className="mr-2 h-4 w-4" />
                                编辑
                              </DropdownMenuItem>
                            </PermissionGuard>
                            <PermissionGuard permission="user-groups.delete">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => { setCurrentGroup(group); setDeleteOpen(true); }}
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
            <DialogTitle>{currentGroup ? "编辑用户组" : "新建用户组"}</DialogTitle>
            <DialogDescription>设置用户组名称与编码</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>用户组名称 *</Label>
                <Input
                  value={formState.name}
                  onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入用户组名称"
                />
              </div>
              <div className="space-y-2">
                <Label>用户组编码 *</Label>
                <Input
                  value={formState.code}
                  onChange={(e) => setFormState(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="例如 ops_team"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Input
                value={formState.description}
                onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入用户组描述"
              />
            </div>
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
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={formLoading}>
              {formLoading ? "处理中..." : currentGroup ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>成员管理</DialogTitle>
            <DialogDescription>
              {currentGroup ? `用户组：${currentGroup.name}` : "请选择用户组"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="搜索用户姓名或邮箱"
            />
            <div className="rounded-md border">
              <ScrollArea className="h-[320px]">
                {memberLoading ? (
                  <div className="py-10 text-center text-muted-foreground">加载中...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">暂无可选用户</div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map(user => (
                      <label
                        key={user.id}
                        className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={memberIds.includes(user.id)}
                            onCheckedChange={() => toggleMember(user.id)}
                          />
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        {user.deptName && (
                          <Badge variant="outline">{user.deptName}</Badge>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setMemberOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveMembers} disabled={memberLoading}>
              {memberLoading ? "处理中..." : "保存成员"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="删除用户组"
        description={`确定要删除用户组 "${currentGroup?.name}" 吗？`}
        confirmLabel="删除"
        variant="destructive"
        onConfirm={handleDelete}
        warnings={["删除后不可恢复", "组内成员将被解除关联"]}
      />
    </div>
  );
};
