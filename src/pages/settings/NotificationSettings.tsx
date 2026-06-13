import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getNotificationPreferences, 
  updateNotificationPreferences,
  NotificationPreferences 
} from '@/services/settingsService';
import { toast } from 'sonner';
import { Loader2, Mail, Bell, Volume2 } from 'lucide-react';

export const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailProjects: true,
    emailMembers: true,
    emailSecurity: true,
    pushEnabled: true,
    pushSound: false,
  });

  useEffect(() => {
    const loadPrefs = async () => {
      if (!user) return;
      try {
        const data = await getNotificationPreferences(user.id);
        setPrefs(data);
      } catch (error) {
        toast.error('加载通知设置失败');
      } finally {
        setLoading(false);
      }
    };
    loadPrefs();
  }, [user]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await updateNotificationPreferences(user.id, prefs);
      toast.success('通知设置已保存');
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">通知偏好</h1>
        <p className="text-muted-foreground">设置您的通知接收方式</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            邮件通知
          </CardTitle>
          <CardDescription>通过邮件接收重要更新</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="email-projects" className="font-medium">项目更新</Label>
              <p className="text-sm text-muted-foreground">项目状态变更、任务分配等</p>
            </div>
            <Switch 
              id="email-projects" 
              checked={prefs.emailProjects}
              onCheckedChange={() => handleToggle('emailProjects')}
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="email-members" className="font-medium">成员变动</Label>
              <p className="text-sm text-muted-foreground">新成员加入、权限变更等</p>
            </div>
            <Switch 
              id="email-members" 
              checked={prefs.emailMembers}
              onCheckedChange={() => handleToggle('emailMembers')}
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="email-security" className="font-medium">安全警告</Label>
              <p className="text-sm text-muted-foreground">异常登录、密码修改等</p>
            </div>
            <Switch 
              id="email-security" 
              checked={prefs.emailSecurity}
              onCheckedChange={() => handleToggle('emailSecurity')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            系统通知
          </CardTitle>
          <CardDescription>在应用内接收通知</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="push-all" className="font-medium">启用推送通知</Label>
              <p className="text-sm text-muted-foreground">在应用内接收实时通知</p>
            </div>
            <Switch 
              id="push-all" 
              checked={prefs.pushEnabled}
              onCheckedChange={() => handleToggle('pushEnabled')}
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="push-sound" className="font-medium">通知声音</Label>
                <p className="text-sm text-muted-foreground">收到通知时播放提示音</p>
              </div>
            </div>
            <Switch 
              id="push-sound" 
              checked={prefs.pushSound}
              onCheckedChange={() => handleToggle('pushSound')}
              disabled={!prefs.pushEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          保存设置
        </Button>
      </div>
    </div>
  );
};
