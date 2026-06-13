import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTenant } from '@/contexts/TenantContext';
import { updateTenant, deleteTenant } from '@/services/settingsService';
import {
  addTenantMember,
  getTenantMembers,
  getTenants,
  removeTenantMember,
  updateTenantMember,
  type TenantDto,
} from '@/services/tenantService';
import { getRoles } from '@/services/roleService';
import type { Role, TenantMember } from '@/types';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Building, Crown, ShieldCheck, Trash2, Users } from 'lucide-react';

export const TenantSettings: React.FC = () => {
  const { currentTenant, setCurrentTenant } = useTenant();
  
  const [name, setName] = useState(currentTenant?.name || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRoleId, setMemberRoleId] = useState('');
  const [governanceLoading, setGovernanceLoading] = useState(false);
  const [memberSaving, setMemberSaving] = useState(false);
  const [governanceError, setGovernanceError] = useState('');

  const planLabels: { [key: string]: string } = {
    free: '免费版',
    pro: '专业版',
    enterprise: '企业版',
  };

  const planColors: { [key: string]: string } = {
    free: 'bg-muted text-muted-foreground',
    pro: 'bg-primary text-primary-foreground',
    enterprise: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
  };

  const loadGovernance = React.useCallback(async () => {
    if (!currentTenant) return;
    setGovernanceLoading(true);
    setGovernanceError('');
    try {
      const [tenantList, memberList, roleResult] = await Promise.all([
        getTenants(),
        getTenantMembers(currentTenant.id),
        getRoles({ tenantId: currentTenant.id }),
      ]);
      setTenants(tenantList);
      setMembers(memberList);
      if (roleResult.success && roleResult.data) {
        setRoles(roleResult.data);
        setMemberRoleId((current) => current || roleResult.data[0]?.id || '');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载租户治理数据失败';
      setGovernanceError(message);
      toast.error(message);
    } finally {
      setGovernanceLoading(false);
    }
  }, [currentTenant, toast]);

  React.useEffect(() => {
    loadGovernance();
  }, [loadGovernance]);

  const handleSave = async () => {
    if (!currentTenant) return;
    
    if (!name.trim()) {
      toast.error('工作空间名称不能为空');
      return;
    }
    
    setSaving(true);
    try {
      await updateTenant(currentTenant.id, { name });
      setCurrentTenant({ ...currentTenant, name });
      toast.success('工作空间设置已更新');
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentTenant || confirmName !== currentTenant.name) {
      toast.error('请输入正确的工作空间名称以确认删除');
      return;
    }
    
    setDeleting(true);
    try {
      await deleteTenant(currentTenant.id);
      toast.success('工作空间已删除');
      // 实际应用中应该跳转到选择租户页面
      window.location.href = '/select-tenant';
    } catch (error) {
      toast.error('删除失败');
      setDeleting(false);
    }
  };

  const handleAddMember = async () => {
    if (!currentTenant || !memberEmail.trim() || !memberRoleId) {
      toast.error('请输入成员邮箱并选择角色');
      return;
    }
    setMemberSaving(true);
    try {
      const member = await addTenantMember(currentTenant.id, {
        email: memberEmail.trim(),
        roleId: memberRoleId,
      });
      setMembers((prev) => [member, ...prev.filter((item) => item.userId !== member.userId)]);
      setMemberEmail('');
      toast.success('成员邀请已提交');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '添加成员失败');
    } finally {
      setMemberSaving(false);
    }
  };

  const handleRoleChange = async (member: TenantMember, roleId: string) => {
    if (!currentTenant) return;
    try {
      const updated = await updateTenantMember(currentTenant.id, member.userId, { roleId });
      setMembers((prev) => prev.map((item) => item.userId === updated.userId ? updated : item));
      toast.success('成员角色已更新');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新成员角色失败');
    }
  };

  const handleAdminToggle = async (member: TenantMember, isAdmin: boolean) => {
    if (!currentTenant) return;
    try {
      const updated = await updateTenantMember(currentTenant.id, member.userId, { isAdmin });
      setMembers((prev) => prev.map((item) => item.userId === updated.userId ? updated : item));
      toast.success(isAdmin ? '已设为租户管理员' : '已取消租户管理员');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新管理员状态失败');
    }
  };

  const handleRemoveMember = async (member: TenantMember) => {
    if (!currentTenant) return;
    try {
      await removeTenantMember(currentTenant.id, member.userId);
      setMembers((prev) => prev.filter((item) => item.userId !== member.userId));
      toast.success('成员已移除');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '移除成员失败');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">租户设置</h1>
        <p className="text-muted-foreground">管理工作空间信息</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            基本信息
          </CardTitle>
          <CardDescription>工作空间的基本设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenantName">工作空间名称</Label>
            <Input 
              id="tenantName" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>租户 ID</Label>
            <Input value={currentTenant?.id || ''} disabled />
            <p className="text-xs text-muted-foreground">租户 ID 不可更改</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            保存更改
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            订阅套餐
          </CardTitle>
          <CardDescription>查看和管理您的订阅</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Badge className={planColors[currentTenant?.plan || 'free']}>
                {planLabels[currentTenant?.plan || 'free']}
              </Badge>
              <span className="text-sm text-muted-foreground">
                当前套餐
              </span>
            </div>
            <Button variant="outline">升级套餐</Button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg text-center">
              <p className="text-2xl font-bold">10</p>
              <p className="text-sm text-muted-foreground">成员上限</p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <p className="text-2xl font-bold">5GB</p>
              <p className="text-sm text-muted-foreground">存储空间</p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <p className="text-2xl font-bold">∞</p>
              <p className="text-sm text-muted-foreground">项目数量</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            租户治理
          </CardTitle>
          <CardDescription>查看租户列表、成员角色和管理员设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {governanceError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {governanceError}
            </div>
          )}

          <div className="space-y-2">
            <Label>可管理租户</Label>
            <div className="grid gap-2">
              {governanceLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在加载租户
                </div>
              ) : tenants.length > 0 ? (
                tenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">{tenant.code || tenant.id}</p>
                    </div>
                    <Badge className={planColors[tenant.plan || 'free']}>
                      {planLabels[tenant.plan || 'free']}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">暂无可管理租户。</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="memberEmail">成员邮箱</Label>
                <Input
                  id="memberEmail"
                  type="email"
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                  placeholder="member@example.com"
                />
              </div>
              <div className="w-44 space-y-2">
                <Label htmlFor="memberRole">角色</Label>
                <select
                  id="memberRole"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={memberRoleId}
                  onChange={(event) => setMemberRoleId(event.target.value)}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <Button type="button" onClick={handleAddMember} disabled={memberSaving || roles.length === 0}>
                {memberSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                添加
              </Button>
            </div>

            <div className="rounded-lg border">
              {members.length > 0 ? (
                members.map((member) => (
                  <div key={member.userId} className="flex flex-wrap items-center gap-3 border-b p-3 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{member.userName}</p>
                        {member.isAdmin && (
                          <Badge variant="secondary" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            管理员
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={member.roleId || ''}
                      onChange={(event) => handleRoleChange(member, event.target.value)}
                    >
                      <option value="">未分配角色</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={member.isAdmin}
                        onChange={(event) => handleAdminToggle(member, event.target.checked)}
                      />
                      租户管理员
                    </label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveMember(member)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      移除
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-sm text-muted-foreground">暂无租户成员。</div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              成员权限、租户隔离和越权拒绝必须由外部 API 兜底；前端只提交角色和管理员设置。
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            危险操作
          </CardTitle>
          <CardDescription>以下操作不可逆，请谨慎操作</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <p className="text-sm mb-3">
              删除工作空间将永久删除所有相关数据，包括项目、文件、用户权限等。此操作无法撤销。
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">删除工作空间</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确定要删除工作空间吗？</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>此操作将永久删除工作空间 <strong>{currentTenant?.name}</strong> 及其所有数据。</p>
                    <p>请输入工作空间名称以确认删除：</p>
                    <Input
                      placeholder={currentTenant?.name}
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                    />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmName('')}>
                    取消
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={confirmName !== currentTenant?.name || deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    确认删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
