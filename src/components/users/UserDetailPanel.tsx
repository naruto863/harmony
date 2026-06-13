import React, { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { UserWithRole } from '@/services/userService';
import { Mail, Phone, Calendar, Shield, Clock, Eye, EyeOff, Building2 } from 'lucide-react';
import { MaskedText } from '@/components/masking';

interface UserDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRole | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: '正常', variant: 'default' },
  inactive: { label: '禁用', variant: 'destructive' },
  pending: { label: '待激活', variant: 'secondary' },
};

export const UserDetailPanel: React.FC<UserDetailPanelProps> = ({
  open,
  onOpenChange,
  user,
}) => {
  const [maskingEnabled, setMaskingEnabled] = useState(true);
  
  if (!user) return null;

  const status = statusConfig[user.status] || statusConfig.active;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>用户详情</SheetTitle>
            <Button
              variant={maskingEnabled ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => setMaskingEnabled(!maskingEnabled)}
              className="gap-1"
            >
              {maskingEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {maskingEnabled ? '显示完整' : '隐藏敏感'}
            </Button>
          </div>
          <SheetDescription>查看用户的详细信息</SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* 用户头像和基本信息 */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-lg">
                {user.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <MaskedText 
                value={user.email} 
                type="email" 
                toggleable={!maskingEnabled}
                defaultVisible={!maskingEnabled}
                className="text-sm text-muted-foreground"
              />
              <Badge variant={status.variant} className="mt-1">
                {status.label}
              </Badge>
            </div>
          </div>
          
          <Separator />
          
          {/* 详细信息 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">基本信息</h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <MaskedText 
                  value={user.email} 
                  type="email" 
                  toggleable={!maskingEnabled}
                  defaultVisible={!maskingEnabled}
                />
              </div>
              
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <MaskedText 
                    value={user.phone} 
                    type="phone" 
                    toggleable={!maskingEnabled}
                    defaultVisible={!maskingEnabled}
                  />
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.roleName || '未分配角色'}</span>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.deptName || '未设置部门'}</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* 时间信息 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">时间信息</h4>
            
            <div className="space-y-3">
              {user.joinedAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="text-muted-foreground">加入时间：</span>
                    {format(new Date(user.joinedAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">创建时间：</span>
                  {format(new Date(user.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">更新时间：</span>
                  {format(new Date(user.updatedAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
