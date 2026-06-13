import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  UserX,
  UserCheck,
  KeyRound,
  Copy,
  RefreshCw,
  Download,
  Upload,
  EyeOff,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PermissionGuard } from '@/components/guards';
import { ConfirmDialog } from '@/components/crud';
import { UserFormDialog, UserDetailPanel, UserFormValues } from '@/components/users';
import { ImportDialog, ExportDialog } from '@/components/import-export';
import {
  AdvancedFilterPanel,
  QuickFilterBar,
  FilterFieldDefinition,
  FilterGroup,
  applyFilters,
} from '@/components/filters';
import { MaskedText } from '@/components/masking';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
  removeUserFromTenant,
  batchUpdateUserStatus,
  batchRemoveUsers,
  UserWithRole,
} from '@/services/userService';
import { getRoles } from '@/services/roleService';
import { getDeptTree } from '@/services/deptService';
import { createExportTask, createImportTaskFromFile } from '@/services/importExportService';
import { DeptNode, Role } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { TableSkeletonRows } from '@/components/skeleton';

// 用户筛选字段定义
const USER_FILTER_FIELDS: FilterFieldDefinition[] = [
  { key: 'name', label: '姓名', type: 'text' },
  { key: 'email', label: '邮箱', type: 'text' },
  { key: 'phone', label: '手机号', type: 'text' },
  { 
    key: 'status', 
    label: '状态', 
    type: 'select',
    options: [
      { value: 'active', label: '正常' },
      { value: 'inactive', label: '禁用' },
      { value: 'pending', label: '待激活' },
    ],
  },
  { key: 'roleName', label: '角色', type: 'text' },
  { key: 'joinedAt', label: '加入时间', type: 'date' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: '正常', variant: 'default' },
  inactive: { label: '禁用', variant: 'destructive' },
  pending: { label: '待激活', variant: 'secondary' },
};

export const UsersPage: React.FC = () => {
  const { currentTenant } = useTenant();
  const { user: currentAuthUser } = useAuth();
  const { toast } = useToast();
  // 状态
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [depts, setDepts] = useState<DeptNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 弹窗状态
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [credentialOpen, setCredentialOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserWithRole | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [temporaryCredential, setTemporaryCredential] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  
  // 高级筛选
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  
  // 数据脱敏状态
  const [maskingEnabled, setMaskingEnabled] = useState(true);
  
  // 应用高级筛选后的数据
  const filteredUsers = useMemo(() => {
    if (filterGroups.length === 0) return users;
    return applyFilters(users, filterGroups);
  }, [users, filterGroups]);
  // 加载数据
  const loadUsers = useCallback(async () => {
    if (!currentTenant) return;
    
    setIsLoading(true);
    try {
      const response = await getUsers({
        tenantId: currentTenant.id,
        page,
        pageSize,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        roleId: roleFilter !== 'all' ? roleFilter : undefined,
      });
      
      if (response.success && response.data) {
        setUsers(response.data);
        setTotal(response.meta?.total || 0);
      }
    } catch (error) {
      toast({ title: '加载用户失败', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant, page, pageSize, search, statusFilter, roleFilter, toast]);
  
  const loadRoles = useCallback(async () => {
    if (!currentTenant) return;
    
    try {
      const response = await getRoles({ tenantId: currentTenant.id });
      if (response.success && response.data) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('加载角色失败', error);
    }
  }, [currentTenant]);

  const loadDepts = useCallback(async () => {
    if (!currentTenant) return;
    try {
      const response = await getDeptTree();
      if (response.success && response.data) {
        setDepts(response.data);
      } else {
        setDepts([]);
      }
    } catch (error) {
      setDepts([]);
    }
  }, [currentTenant]);
  
  useEffect(() => {
    loadUsers();
    loadRoles();
    loadDepts();
  }, [loadUsers, loadRoles, loadDepts]);
  
  // 创建/编辑用户
  const handleSubmit = async (data: UserFormValues) => {
    if (!currentTenant) return;
    
    setFormLoading(true);
    try {
      if (currentUser) {
        // 编辑
        const response = await updateUser(currentUser.id, currentTenant.id, {
          name: data.name,
          phone: data.phone,
          status: data.status,
          roleId: data.roleId,
          deptId: data.deptId || null,
        });
        
        if (response.success) {
          toast({ title: '用户更新成功' });
          setFormOpen(false);
          setCurrentUser(null);
          loadUsers();
        } else {
          toast({ title: response.error?.message || '更新失败', variant: 'destructive' });
        }
      } else {
        // 新建
        const response = await createUser({
          email: data.email,
          name: data.name,
          phone: data.phone,
          roleId: data.roleId,
          deptId: data.deptId || null,
          tenantId: currentTenant.id,
        });
        
        if (response.success) {
          if (response.data?.temporaryPassword) {
            setTemporaryCredential({
              name: response.data.user.name,
              email: response.data.user.email,
              password: response.data.temporaryPassword,
            });
            setCredentialOpen(true);
          }
          toast({ title: response.data?.temporaryPassword ? '用户邀请成功，请复制临时密码' : '用户已加入当前租户' });
          setFormOpen(false);
          loadUsers();
        } else {
          toast({ title: response.error?.message || '邀请失败', variant: 'destructive' });
        }
      }
    } catch (error) {
      toast({ title: '操作失败', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!currentUser || !currentTenant) return;

    setResetPasswordLoading(true);
    try {
      const response = await resetUserPassword(currentUser.id, currentTenant.id);
      if (response.success && response.data?.temporaryPassword) {
        setTemporaryCredential({
          name: response.data.user.name,
          email: response.data.user.email,
          password: response.data.temporaryPassword,
        });
        setResetPasswordOpen(false);
        setCredentialOpen(true);
        toast({ title: '临时密码已生成' });
        loadUsers();
      } else {
        toast({ title: response.error?.message || '重置密码失败', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '操作失败', variant: 'destructive' });
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const copyTemporaryPassword = async () => {
    if (!temporaryCredential) return;
    try {
      await navigator.clipboard.writeText(temporaryCredential.password);
      toast({ title: '临时密码已复制' });
    } catch {
      toast({ title: '复制失败，请手动复制', variant: 'destructive' });
    }
  };
  
  // 删除用户
  const handleDelete = async () => {
    if (!currentUser || !currentTenant) return;
    
    try {
      const response = await removeUserFromTenant(currentUser.id, currentTenant.id);
      if (response.success) {
        toast({ title: '用户已移除' });
        setDeleteOpen(false);
        setCurrentUser(null);
        loadUsers();
      } else {
        toast({ title: response.error?.message || '移除失败', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '操作失败', variant: 'destructive' });
    }
  };
  
  // 批量操作 - 需要二次确认
  const [batchActionOpen, setBatchActionOpen] = useState(false);
  const [batchAction, setBatchAction] = useState<'enable' | 'disable' | 'remove' | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const handleBatchStatusChange = async (status: 'active' | 'inactive') => {
    if (selectedIds.length === 0) return;
    
    setBatchLoading(true);
    try {
      const response = await batchUpdateUserStatus(selectedIds, status);
      if (response.success) {
        toast({ title: `已${status === 'active' ? '启用' : '禁用'} ${selectedIds.length} 个用户` });
        setSelectedIds([]);
        loadUsers();
      }
    } catch (error) {
      toast({ title: '操作失败', variant: 'destructive' });
    } finally {
      setBatchLoading(false);
      setBatchActionOpen(false);
      setBatchAction(null);
    }
  };
  
  const handleBatchRemove = async () => {
    if (selectedIds.length === 0 || !currentTenant) return;
    
    setBatchLoading(true);
    try {
      const response = await batchRemoveUsers(selectedIds, currentTenant.id);
      if (response.success) {
        toast({ title: `已移除 ${selectedIds.length} 个用户` });
        setSelectedIds([]);
        loadUsers();
      }
    } catch (error) {
      toast({ title: '操作失败', variant: 'destructive' });
    } finally {
      setBatchLoading(false);
      setBatchActionOpen(false);
      setBatchAction(null);
    }
  };

  const openBatchConfirm = (action: 'enable' | 'disable' | 'remove') => {
    setBatchAction(action);
    setBatchActionOpen(true);
  };

  const handleBatchConfirm = () => {
    switch (batchAction) {
      case 'enable':
        handleBatchStatusChange('active');
        break;
      case 'disable':
        handleBatchStatusChange('inactive');
        break;
      case 'remove':
        handleBatchRemove();
        break;
    }
  };

  const getBatchConfirmConfig = () => {
    switch (batchAction) {
      case 'enable':
        return {
          title: '批量启用用户',
          description: `确定要启用选中的 ${selectedIds.length} 个用户吗？`,
          confirmLabel: '启用',
          variant: 'default' as const,
        };
      case 'disable':
        return {
          title: '批量禁用用户',
          description: `确定要禁用选中的 ${selectedIds.length} 个用户吗？禁用后用户将无法登录系统。`,
          confirmLabel: '禁用',
          variant: 'warning' as const,
          warnings: ['禁用后用户将无法访问系统', '用户的所有会话将被终止'],
        };
      case 'remove':
        return {
          title: '批量移除用户',
          description: `确定要将选中的 ${selectedIds.length} 个用户从当前租户移除吗？`,
          confirmLabel: '移除',
          variant: 'destructive' as const,
          confirmationType: 'checkbox' as const,
          checkboxLabel: '我确认要移除这些用户',
          warnings: ['用户将失去在此租户的所有权限', '此操作不会删除用户账号'],
        };
      default:
        return {
          title: '',
          description: '',
          confirmLabel: '确认',
          variant: 'default' as const,
        };
    }
  };
  
  // 选择处理
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(users.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };
  
  const handleSelectOne = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, userId]);
    } else {
      setSelectedIds(selectedIds.filter(id => id !== userId));
    }
  };
  
  const totalPages = Math.ceil(total / pageSize);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">用户管理</h1>
          <p className="text-muted-foreground">管理租户内的所有用户</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
          <PermissionGuard permission="users.create">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              导入
            </Button>
            <Button onClick={() => { setCurrentUser(null); setFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              邀请用户
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>用户列表</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {/* 搜索 */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-8 w-[200px]"
                />
              </div>
              
              {/* 状态筛选 */}
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                  <SelectItem value="pending">待激活</SelectItem>
                </SelectContent>
              </Select>
              
              {/* 角色筛选 */}
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部角色</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* 高级筛选 */}
              <QuickFilterBar
                entityType="users"
                tenantId={currentTenant?.id || ''}
                userId={currentAuthUser?.id || ''}
                activeGroups={filterGroups}
                onApplyFilter={setFilterGroups}
                onOpenAdvanced={() => setFilterPanelOpen(true)}
                onClear={() => setFilterGroups([])}
              />
              
              {/* 刷新 */}
              <Button variant="outline" size="icon" onClick={loadUsers}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {/* 脱敏切换 */}
              <Button
                variant={maskingEnabled ? 'outline' : 'secondary'}
                size="icon"
                onClick={() => setMaskingEnabled(!maskingEnabled)}
                title={maskingEnabled ? '显示完整信息' : '隐藏敏感信息'}
              >
                {maskingEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 批量操作栏 */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm">已选择 {selectedIds.length} 项</span>
              <div className="flex-1" />
              <PermissionGuard permission="users.update">
                <Button variant="outline" size="sm" onClick={() => openBatchConfirm('enable')}>
                  <UserCheck className="mr-1 h-4 w-4" />
                  批量启用
                </Button>
                <Button variant="outline" size="sm" onClick={() => openBatchConfirm('disable')}>
                  <UserX className="mr-1 h-4 w-4" />
                  批量禁用
                </Button>
              </PermissionGuard>
              <PermissionGuard permission="users.delete">
                <Button variant="destructive" size="sm" onClick={() => openBatchConfirm('remove')}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  批量移除
                </Button>
              </PermissionGuard>
            </div>
          )}
          
          {/* 表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>加入时间</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeletonRows columns={5} rows={5} showCheckbox showActions />
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      暂无用户数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => {
                    const status = statusConfig[user.status] || statusConfig.active;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(user.id)}
                            onCheckedChange={(checked) => handleSelectOne(user.id, checked === true)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <MaskedText 
                                value={user.email} 
                                type="email" 
                                toggleable={!maskingEnabled}
                                defaultVisible={!maskingEnabled}
                                className="text-sm text-muted-foreground"
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.roleName || '未分配'}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.deptName || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.joinedAt 
                            ? format(new Date(user.joinedAt), 'yyyy-MM-dd', { locale: zhCN })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setCurrentUser(user); setDetailOpen(true); }}>
                                <Eye className="mr-2 h-4 w-4" />
                                查看详情
                              </DropdownMenuItem>
                              <PermissionGuard permission="users.update">
                                <DropdownMenuItem onClick={() => { setCurrentUser(user); setFormOpen(true); }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  编辑
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setCurrentUser(user); setResetPasswordOpen(true); }}>
                                  <KeyRound className="mr-2 h-4 w-4" />
                                  重置密码
                                </DropdownMenuItem>
                              </PermissionGuard>
                              <DropdownMenuSeparator />
                              <PermissionGuard permission="users.delete">
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => { setCurrentUser(user); setDeleteOpen(true); }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  移除
                                </DropdownMenuItem>
                              </PermissionGuard>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                共 {total} 条记录，第 {page}/{totalPages} 页
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 弹窗 */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        user={currentUser}
        roles={roles}
        depts={depts}
        isLoading={formLoading}
      />
      
      <UserDetailPanel
        open={detailOpen}
        onOpenChange={setDetailOpen}
        user={currentUser}
      />
      
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="移除用户"
        description={`确定要将用户 "${currentUser?.name}" 从当前租户移除吗？`}
        confirmLabel="移除"
        onConfirm={handleDelete}
        variant="destructive"
        confirmationType="checkbox"
        checkboxLabel="我确认要移除此用户"
        warnings={['此操作不会删除用户账号', '用户将失去在此租户的所有权限']}
      />

      <ConfirmDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        title="重置用户密码"
        description={`确定要为用户 "${currentUser?.name}" 生成新的临时密码吗？`}
        confirmLabel="生成临时密码"
        onConfirm={handleResetPassword}
        variant="warning"
        isLoading={resetPasswordLoading}
        confirmationType="checkbox"
        checkboxLabel="我确认要重置此用户密码"
        warnings={['用户现有会话将被终止', '用户下次登录后需要立即修改临时密码']}
      />

      <Dialog
        open={credentialOpen}
        onOpenChange={(open) => {
          setCredentialOpen(open);
          if (!open) {
            setTemporaryCredential(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>临时密码</DialogTitle>
            <DialogDescription>
              仅在本次操作后展示一次。请通过安全渠道发送给用户，并提醒其首次登录后修改密码。
            </DialogDescription>
          </DialogHeader>
          {temporaryCredential && (
            <div className="space-y-4">
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">{temporaryCredential.name}</div>
                <div className="text-muted-foreground">{temporaryCredential.email}</div>
              </div>
              <div className="flex gap-2">
                <Input value={temporaryCredential.password} readOnly className="font-mono" />
                <Button type="button" variant="outline" size="icon" onClick={copyTemporaryPassword}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCredentialOpen(false)}>我已保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量操作确认 */}
      <ConfirmDialog
        open={batchActionOpen}
        onOpenChange={setBatchActionOpen}
        isLoading={batchLoading}
        onConfirm={handleBatchConfirm}
        {...getBatchConfirmConfig()}
      />
      
      {/* 导入导出 */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entityType="users"
        entityLabel="用户"
        onImport={async (file) => {
          if (!currentTenant?.id) {
            throw new Error('缺少当前租户，无法创建导入任务');
          }
          const result = await createImportTaskFromFile('users', file, currentTenant.id);
          if (!result.success || !result.data) {
            throw new Error(result.error?.message || '创建导入任务失败');
          }
          return result.data;
        }}
        onSuccess={loadUsers}
      />
      
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        entityLabel="用户"
        totalCount={filteredUsers.length}
        selectedCount={selectedIds.length}
        onExport={async (format, exportSelected) => {
          if (exportSelected) {
            throw new Error('当前导出任务暂不支持仅导出选中数据');
          }
          const result = await createExportTask('users', format);
          if (!result.success || !result.data) {
            throw new Error(result.error?.message || '创建导出任务失败');
          }
          return result.data;
        }}
      />
      
      {/* 高级筛选面板 */}
      <AdvancedFilterPanel
        open={filterPanelOpen}
        onOpenChange={setFilterPanelOpen}
        entityType="users"
        tenantId={currentTenant?.id || ''}
        userId={currentAuthUser?.id || ''}
        fields={USER_FILTER_FIELDS}
        groups={filterGroups}
        onGroupsChange={setFilterGroups}
        onApply={() => {}}
        onReset={() => setFilterGroups([])}
      />
    </div>
  );
};
