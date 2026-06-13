import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Filter, X, CalendarIcon } from 'lucide-react';
import { AuditAction } from '@/types';
import { cn } from '@/lib/utils';

export interface FilterValues {
  action?: AuditAction;
  resource?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface AdvancedFilterProps {
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  users: { id: string; name: string }[];
  resources: string[];
  actions: AuditAction[];
}

const actionLabels: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  login: '登录',
  logout: '登出',
  role_change: '角色变更',
  permission_change: '权限变更',
};

const resourceLabels: Record<string, string> = {
  projects: '项目',
  users: '用户',
  roles: '角色',
  files: '文件',
  settings: '设置',
  auth: '认证',
};

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  values,
  onChange,
  users,
  resources,
  actions,
}) => {
  const [open, setOpen] = React.useState(false);
  
  const activeFiltersCount = Object.values(values).filter(v => v !== undefined).length;
  
  const handleClear = () => {
    onChange({});
  };
  
  const handleRemoveFilter = (key: keyof FilterValues) => {
    const newValues = { ...values };
    delete newValues[key];
    onChange(newValues);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              高级筛选
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">筛选条件</h4>
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  清空
                </Button>
              </div>
              
              {/* 操作类型 */}
              <div className="space-y-2">
                <Label>操作类型</Label>
                <Select 
                  value={values.action || ''} 
                  onValueChange={(v) => onChange({ ...values, action: v as AuditAction || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择操作类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部</SelectItem>
                    {actions.map(action => (
                      <SelectItem key={action} value={action}>
                        {actionLabels[action] || action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 资源类型 */}
              <div className="space-y-2">
                <Label>资源类型</Label>
                <Select 
                  value={values.resource || ''} 
                  onValueChange={(v) => onChange({ ...values, resource: v || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择资源类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部</SelectItem>
                    {resources.map(resource => (
                      <SelectItem key={resource} value={resource}>
                        {resourceLabels[resource] || resource}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 操作用户 */}
              <div className="space-y-2">
                <Label>操作用户</Label>
                <Select 
                  value={values.userId || ''} 
                  onValueChange={(v) => onChange({ ...values, userId: v || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择用户" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 日期范围 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>开始日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !values.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {values.startDate ? format(values.startDate, 'yyyy-MM-dd') : '选择日期'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={values.startDate}
                        onSelect={(date) => onChange({ ...values, startDate: date })}
                        locale={zhCN}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>结束日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !values.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {values.endDate ? format(values.endDate, 'yyyy-MM-dd') : '选择日期'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={values.endDate}
                        onSelect={(date) => onChange({ ...values, endDate: date })}
                        locale={zhCN}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* 已选择的筛选标签 */}
        {values.action && (
          <Badge variant="secondary" className="gap-1">
            操作: {actionLabels[values.action]}
            <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveFilter('action')} />
          </Badge>
        )}
        {values.resource && (
          <Badge variant="secondary" className="gap-1">
            资源: {resourceLabels[values.resource]}
            <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveFilter('resource')} />
          </Badge>
        )}
        {values.userId && (
          <Badge variant="secondary" className="gap-1">
            用户: {users.find(u => u.id === values.userId)?.name}
            <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveFilter('userId')} />
          </Badge>
        )}
        {values.startDate && (
          <Badge variant="secondary" className="gap-1">
            开始: {format(values.startDate, 'MM-dd')}
            <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveFilter('startDate')} />
          </Badge>
        )}
        {values.endDate && (
          <Badge variant="secondary" className="gap-1">
            结束: {format(values.endDate, 'MM-dd')}
            <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveFilter('endDate')} />
          </Badge>
        )}
      </div>
    </div>
  );
};
