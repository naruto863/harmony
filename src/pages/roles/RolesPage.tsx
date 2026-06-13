import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Edit, 
  Trash2, 
  RefreshCw,
  Shield,
  Grid3X3,
  Users,
} from 'lucide-react';
import { PermissionGuard } from '@/components/guards';
import { ConfirmDialog } from '@/components/crud';
import { RoleFormDialog, PermissionMatrix, RoleFormValues } from '@/components/roles';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissionGroups,
} from '@/services/roleService';
import { DataScopeType, DeptNode, Role, PermissionGroup } from '@/types';
import { getDeptTree } from '@/services/deptService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { USER_TENANT_ROLES } from '@/data/mock-data';

const roleTypeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  super_admin: { label: '超级管理员', variant: 'destructive' },
  tenant_admin: { label: '租户管理员', variant: 'default' },
  manager: { label: '经理', variant: 'secondary' },
  viewer: { label: '查看者', variant: 'outline' },
  custom: { label: '自定义', variant: 'outline' },
};

export const RolesPage: React.FC = () => {
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  
  // 状态
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [deptTree, setDeptTree] = useState<DeptNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  
  // 弹窗状态
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // 加载数据
  const loadRoles = useCallback(async () => {
    if (!currentTenant) return;
    
    setIsLoading(true);
    try {
      const response = await getRoles({
        tenantId: currentTenant.id,
        search: search || undefined,
      });
      
      if (response.success && response.data) {
        setRoles(response.data);
      }
    } catch (error) {
      toast({ title: '加载角色失败', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant, search, toast]);
  
  const loadPermissionGroups = useCallback(async () => {
    try {
      const response = await getPermissionGroups();
      if (response.success && response.data) {
        setPermissionGroups(response.data);
      }
    } catch (error) {
      console.error('加载权限分组失败', error);
    }
  }, []);

  const loadDepts = useCallback(async () => {
    try {
      const response = await getDeptTree();
      if (response.success && response.data) {
        setDeptTree(response.data);
      } else {
        setDeptTree([]);
      }
    } catch {
      setDeptTree([]);
    }
  }, []);
  
  useEffect(() => {
    loadRoles();
    loadPermissionGroups();
    loadDepts();
  }, [loadRoles, loadPermissionGroups, loadDepts]);
  
  // 获取角色的用户数
  const getRoleUserCount = (roleId: string) => {
    if (!currentTenant) return 0;
    return USER_TENANT_ROLES.filter(
      utr => utr.roleId === roleId && utr.tenantId === currentTenant.id
    ).length;
  };
  
  // 创建/编辑角色
  const handleSubmit = async (data: RoleFormValues) => {
    if (!currentTenant) return;
    
    setFormLoading(true);
    try {
      if (currentRole) {
        // 编辑
        const response = await updateRole(currentRole.id, {
          name: data.name,
          description: data.description,
          permissions: data.permissions,
          dataScopeType: data.dataScopeType,
          dataScopeDeptIds: data.dataScopeDeptIds,
        });
        
        if (response.success) {
          toast({ title: '角色更新成功' });
          setFormOpen(false);
          setCurrentRole(null);
          loadRoles();
        } else {
          toast({ title: response.error?.message || '更新失败', variant: 'destructive' });
        }
      } else {
        // 新建
        const response = await createRole({
          name: data.name,
          description: data.description || '',
          permissions: data.permissions,
          dataScopeType: data.dataScopeType,
          dataScopeDeptIds: data.dataScopeDeptIds,
          tenantId: currentTenant.id,
        });
        
        if (response.success) {
          toast({ title: '角色创建成功' });
          setFormOpen(false);
          loadRoles();
        } else {
          toast({ title: response.error?.message || '创建失败', variant: 'destructive' });
        }
      }
    } catch (error) {
      toast({ title: '操作失败', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };
  
  // 删除角色
  const handleDelete = async () => {
    if (!currentRole) return;
    
    try {
      const response = await deleteRole(currentRole.id);
      if (response.success) {
        toast({ title: '角色已删除' });
        setDeleteOpen(false);
        setCurrentRole(null);
        loadRoles();
      } else {
        toast({ title: response.error?.message || '删除失败', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '操作失败', variant: 'destructive' });
    }
  };
  
  // 过滤角色
  const filteredRoles = roles.filter(role => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return role.name.toLowerCase().includes(searchLower) ||
           role.description.toLowerCase().includes(searchLower);
  });

  const dataScopeLabels: Record<DataScopeType, string> = {
    ALL: '全部数据',
    DEPT: '本部门',
    DEPT_AND_CHILDREN: '本部门及下级',
    SELF: '仅本人',
    CUSTOM: '自定义部门',
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">角色权限</h1>
          <p className="text-muted-foreground">管理角色和权限分配</p>
        </div>
        <PermissionGuard permission="roles.create">
          <Button onClick={() => { setCurrentRole(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            新建角色
          </Button>
        </PermissionGuard>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">
            <Shield className="mr-2 h-4 w-4" />
            角色列表
          </TabsTrigger>
          <TabsTrigger value="matrix">
            <Grid3X3 className="mr-2 h-4 w-4" />
            权限矩阵
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>角色列表</CardTitle>
                <div className="flex items-center gap-2">
                  {/* 搜索 */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索角色..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 w-[200px]"
                    />
                  </div>
                  
                  {/* 刷新 */}
                  <Button variant="outline" size="icon" onClick={loadRoles}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>角色名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>数据范围</TableHead>
                      <TableHead>权限数</TableHead>
                      <TableHead>用户数</TableHead>
                      <TableHead>更新时间</TableHead>
                      <TableHead className="w-[80px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          加载中...
                        </TableCell>
                      </TableRow>
                    ) : filteredRoles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          暂无角色数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRoles.map(role => {
                        const typeConfig = roleTypeConfig[role.type] || roleTypeConfig.custom;
                        const userCount = getRoleUserCount(role.id);
                        return (
                          <TableRow key={role.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{role.name}</span>
                                {role.isSystem && (
                                  <Badge variant="outline" className="text-xs">系统</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">
                              {role.description}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {dataScopeLabels[role.dataScopeType || 'ALL']}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{role.permissions.length}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{userCount}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(role.updatedAt), 'yyyy-MM-dd', { locale: zhCN })}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <PermissionGuard permission="roles.update">
                                    <DropdownMenuItem onClick={() => { setCurrentRole(role); setFormOpen(true); }}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      编辑
                                    </DropdownMenuItem>
                                  </PermissionGuard>
                                  {!role.isSystem && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <PermissionGuard permission="roles.delete">
                                        <DropdownMenuItem 
                                          className="text-destructive"
                                          onClick={() => { setCurrentRole(role); setDeleteOpen(true); }}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          删除
                                        </DropdownMenuItem>
                                      </PermissionGuard>
                                    </>
                                  )}
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
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="matrix" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>权限矩阵</CardTitle>
              <CardDescription>查看所有角色的权限分配情况</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  加载中...
                </div>
              ) : (
                <PermissionMatrix 
                  roles={roles} 
                  permissionGroups={permissionGroups} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 弹窗 */}
      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        role={currentRole}
        permissionGroups={permissionGroups}
        deptTree={deptTree}
        isLoading={formLoading}
      />
      
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="删除角色"
        description={`确定要删除角色 "${currentRole?.name}" 吗？`}
        confirmLabel="删除"
        onConfirm={handleDelete}
        variant="destructive"
        confirmationType="input"
        confirmText={currentRole?.name}
        confirmPlaceholder="请输入角色名称"
        warnings={[
          '删除后，使用该角色的用户将失去相关权限',
          '此操作无法撤销',
        ]}
      />
    </div>
  );
};
