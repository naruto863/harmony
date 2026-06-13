import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile, updatePassword, uploadAvatar } from '@/services/settingsService';
import { User } from '@/types';
import { toast } from 'sonner';
import { Loader2, Camera, AlertCircle } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const passwordChangeRequired = user?.status === 'pending';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过 2MB');
      return;
    }
    
    setUploadingAvatar(true);
    try {
      const avatarUrl = await uploadAvatar(file);
      setAvatar(avatarUrl);
      toast.success('头像上传成功');
    } catch (error) {
      toast.error('头像上传失败');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    if (!name.trim()) {
      toast.error('姓名不能为空');
      return;
    }
    
    setSavingProfile(true);
    try {
      const updatedUser = await updateProfile(user.id, { name, phone, avatar });
      setUser(updatedUser);
      toast.success('个人资料已更新');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;
    
    if (!currentPassword) {
      toast.error('请输入当前密码');
      return;
    }
    
    if (!newPassword) {
      toast.error('请输入新密码');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('新密码长度至少为6位');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }
    
    setSavingPassword(true);
    try {
      await updatePassword(user.id, { currentPassword, newPassword });
      if (passwordChangeRequired) {
        const updatedUser: User = {
          ...user,
          status: 'active',
          updatedAt: new Date().toISOString(),
        };
        setUser(updatedUser);
        localStorage.setItem('admin_studio_user', JSON.stringify(updatedUser));
        const storedSession = localStorage.getItem('admin_studio_session');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          localStorage.setItem(
            'admin_studio_session',
            JSON.stringify({ ...parsedSession, user: updatedUser, passwordChangeRequired: false })
          );
        }
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('密码已更新');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '密码更新失败');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">个人资料</h1>
        <p className="text-muted-foreground">管理您的个人信息</p>
      </div>

      {passwordChangeRequired && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>需要修改临时密码</AlertTitle>
          <AlertDescription>
            当前账号使用管理员生成的临时密码登录。请先完成密码更新，再继续使用系统。
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>头像</CardTitle>
          <CardDescription>点击上传新头像（最大 2MB）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {avatar && <AvatarImage src={avatar} alt={user?.name} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {user ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              <Camera className="h-4 w-4 mr-2" />
              更换头像
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>更新您的个人资料</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input 
              id="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" type="email" value={user?.email || ''} disabled />
            <p className="text-xs text-muted-foreground">邮箱地址不可更改</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <Input 
              id="phone" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            保存更改
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
          <CardDescription>定期更新密码以保障账户安全</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">当前密码</Label>
            <Input 
              id="currentPassword" 
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">新密码</Label>
            <Input 
              id="newPassword" 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认新密码</Label>
            <Input 
              id="confirmPassword" 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleUpdatePassword} disabled={savingPassword}>
            {savingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            更新密码
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
