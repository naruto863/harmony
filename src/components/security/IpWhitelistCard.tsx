import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Globe, 
  Plus, 
  Trash2, 
  Shield, 
  AlertTriangle,
  Loader2,
  Info,
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/crud';
import {
  getIpWhitelistSettings,
  updateIpWhitelistEnabled,
  addIpToWhitelist,
  removeIpFromWhitelist,
  validateIpFormat,
  getCurrentClientIp,
  IpWhitelistSettings,
  IpWhitelistEntry,
} from '@/services/securityService';

export const IpWhitelistCard: React.FC = () => {
  const { t } = useTranslation();
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<IpWhitelistSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<IpWhitelistEntry | null>(null);
  const [currentIp, setCurrentIp] = useState<string>('');
  
  // 表单状态
  const [formData, setFormData] = useState({
    ip: '',
    description: '',
    type: 'single' as IpWhitelistEntry['type'],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
    loadCurrentIp();
  }, [currentTenant]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getIpWhitelistSettings(currentTenant?.id);
      setSettings(data);
    } catch (error) {
      console.error('Failed to load IP whitelist settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentIp = async () => {
    try {
      const ip = await getCurrentClientIp();
      setCurrentIp(ip);
    } catch (error) {
      console.error('Failed to get current IP:', error);
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      await updateIpWhitelistEnabled(currentTenant?.id, enabled);
      setSettings(prev => prev ? { ...prev, enabled } : null);
      toast({
        title: enabled ? '已启用IP白名单' : '已禁用IP白名单',
      });
    } catch (error) {
      toast({
        title: '操作失败',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.ip.trim()) {
      errors.ip = 'IP地址不能为空';
    } else if (!validateIpFormat(formData.ip.trim(), formData.type)) {
      errors.ip = '请输入正确的IP格式';
    }
    
    if (!formData.description.trim()) {
      errors.description = '请输入描述';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddIp = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const newEntry = await addIpToWhitelist(currentTenant?.id, {
        ip: formData.ip.trim(),
        description: formData.description.trim(),
        type: formData.type,
      });
      
      setSettings(prev => prev ? {
        ...prev,
        whitelist: [...prev.whitelist, newEntry],
      } : null);
      
      setAddDialogOpen(false);
      setFormData({ ip: '', description: '', type: 'single' });
      setFormErrors({});
      
      toast({ title: 'IP已添加到白名单' });
    } catch (error) {
      toast({
        title: '添加失败',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIp = async () => {
    if (!selectedEntry) return;
    
    try {
      await removeIpFromWhitelist(currentTenant?.id, selectedEntry.id);
      
      setSettings(prev => prev ? {
        ...prev,
        whitelist: prev.whitelist.filter(e => e.id !== selectedEntry.id),
      } : null);
      
      setDeleteDialogOpen(false);
      setSelectedEntry(null);
      
      toast({ title: 'IP已从白名单移除' });
    } catch (error) {
      toast({
        title: '删除失败',
        variant: 'destructive',
      });
    }
  };

  const getTypeLabel = (type: IpWhitelistEntry['type']) => {
    const labels = {
      single: '单个IP',
      range: 'IP范围',
      cidr: 'CIDR',
    };
    return labels[type];
  };

  const getTypePlaceholder = (type: IpWhitelistEntry['type']) => {
    const placeholders = {
      single: '例如: 203.0.113.10',
      range: '例如: 203.0.113.10 - 203.0.113.20',
      cidr: '例如: 203.0.113.0/24',
    };
    return placeholders[type];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${settings?.enabled ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'}`}>
                <Globe className={`h-5 w-5 ${settings?.enabled ? 'text-blue-600' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <CardTitle className="text-lg">IP白名单</CardTitle>
                <CardDescription>限制只允许特定IP地址登录系统</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={settings?.enabled || false}
                onCheckedChange={handleToggleEnabled}
                disabled={isSaving}
              />
              <Badge variant={settings?.enabled ? 'default' : 'secondary'}>
                {settings?.enabled ? '已启用' : '未启用'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 当前IP提示 */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              您当前的IP地址：<code className="font-mono bg-background px-1.5 py-0.5 rounded">{currentIp}</code>
            </span>
          </div>
          
          {settings?.enabled && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                启用IP白名单后，只有白名单中的IP才能登录。请确保已添加您的IP地址。
              </span>
            </div>
          )}
          
          {/* 白名单列表 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">白名单列表</h4>
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                添加IP
              </Button>
            </div>
            
            {settings?.whitelist && settings.whitelist.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP地址</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>添加时间</TableHead>
                      <TableHead className="w-[60px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.whitelist.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">
                            {entry.ip}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTypeLabel(entry.type)}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.description}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(entry.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setSelectedEntry(entry);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>删除</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border rounded-lg border-dashed">
                <Shield className="h-8 w-8 mb-2" />
                <p className="text-sm">暂无白名单IP</p>
                <p className="text-xs">点击"添加IP"开始配置</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 添加IP对话框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加IP到白名单</DialogTitle>
            <DialogDescription>
              添加允许登录的IP地址、IP范围或CIDR
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>IP类型</Label>
              <Select
                value={formData.type}
                onValueChange={(value: IpWhitelistEntry['type']) => 
                  setFormData(prev => ({ ...prev, type: value, ip: '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">单个IP</SelectItem>
                  <SelectItem value="range">IP范围</SelectItem>
                  <SelectItem value="cidr">CIDR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>IP地址</Label>
              <Input
                value={formData.ip}
                onChange={(e) => setFormData(prev => ({ ...prev, ip: e.target.value }))}
                placeholder={getTypePlaceholder(formData.type)}
                className={formErrors.ip ? 'border-destructive' : ''}
              />
              {formErrors.ip && (
                <p className="text-xs text-destructive">{formErrors.ip}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>描述</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="例如：办公室网络、VPN服务器"
                className={formErrors.description ? 'border-destructive' : ''}
              />
              {formErrors.description && (
                <p className="text-xs text-destructive">{formErrors.description}</p>
              )}
            </div>
            
            {/* 快捷添加当前IP */}
            {currentIp && formData.type === 'single' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  ip: currentIp,
                  description: prev.description || '当前设备'
                }))}
              >
                添加当前IP ({currentIp})
              </Button>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddIp} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="删除IP"
        description={`确定要从白名单中移除 ${selectedEntry?.ip} 吗？`}
        confirmLabel="删除"
        variant="destructive"
        onConfirm={handleDeleteIp}
        warnings={settings?.enabled ? ['如果这是您当前的IP，删除后可能无法登录'] : undefined}
      />
    </>
  );
};
