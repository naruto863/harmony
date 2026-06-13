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
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Building, Crown } from 'lucide-react';

export const TenantSettings: React.FC = () => {
  const { currentTenant, setCurrentTenant } = useTenant();
  
  const [name, setName] = useState(currentTenant?.name || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmName, setConfirmName] = useState('');

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
