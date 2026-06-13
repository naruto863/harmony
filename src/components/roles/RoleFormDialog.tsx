import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DataScopeType, DeptNode, Role, PermissionGroup } from '@/types';
import { PermissionTree } from './PermissionTree';

const roleFormSchema = z.object({
  name: z.string().min(2, '角色名称至少2个字符').max(50, '角色名称最多50个字符'),
  description: z.string().max(200, '描述最多200个字符').optional(),
  dataScopeType: z.enum(['ALL', 'DEPT', 'DEPT_AND_CHILDREN', 'SELF', 'CUSTOM']),
});

export type RoleFormValues = z.infer<typeof roleFormSchema> & {
  permissions: string[];
  dataScopeDeptIds?: string[];
};

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RoleFormValues) => Promise<void>;
  role?: Role | null;
  permissionGroups: PermissionGroup[];
  deptTree: DeptNode[];
  isLoading?: boolean;
}

export const RoleFormDialog: React.FC<RoleFormDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  role,
  permissionGroups,
  deptTree,
  isLoading,
}) => {
  const isEdit = !!role;
  const isSystemRole = role?.isSystem;
  
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  
  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      dataScopeType: 'ALL',
    },
  });

  const flattenDepts = (items: DeptNode[], depth: number = 0): Array<DeptNode & { depth: number }> => {
    return items.flatMap(item => {
      const current = { ...item, depth };
      const children = item.children ? flattenDepts(item.children, depth + 1) : [];
      return [current, ...children];
    });
  };

  const deptOptions = flattenDepts(deptTree);

  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        description: role.description,
        dataScopeType: role.dataScopeType || 'ALL',
      });
      setSelectedPermissions(role.permissions);
      setSelectedDeptIds(role.dataScopeDeptIds || []);
    } else {
      form.reset({
        name: '',
        description: '',
        dataScopeType: 'ALL',
      });
      setSelectedPermissions([]);
      setSelectedDeptIds([]);
    }
  }, [role, form]);

  const handleSubmit = async (data: z.infer<typeof roleFormSchema>) => {
    const scopeType = data.dataScopeType;
    await onSubmit({
      ...data,
      permissions: selectedPermissions,
      dataScopeType: scopeType,
      dataScopeDeptIds: scopeType === 'CUSTOM' ? selectedDeptIds : [],
    });
    form.reset();
    setSelectedPermissions([]);
    setSelectedDeptIds([]);
  };

  const dataScopeLabels: Record<DataScopeType, string> = {
    ALL: '全部数据',
    DEPT: '本部门',
    DEPT_AND_CHILDREN: '本部门及下级',
    SELF: '仅本人',
    CUSTOM: '自定义部门',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑角色' : '新建角色'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? isSystemRole 
                ? '系统角色只能修改权限配置' 
                : '修改角色信息和权限配置'
              : '创建新的自定义角色并配置权限'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色名称 *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="请输入角色名称" 
                      {...field} 
                      disabled={isSystemRole}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="请输入角色描述" 
                      {...field} 
                      disabled={isSystemRole}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataScopeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>数据范围</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSystemRole}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择数据范围" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(dataScopeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('dataScopeType') === 'CUSTOM' && (
              <div className="space-y-2">
                <FormLabel>自定义部门</FormLabel>
                <ScrollArea className="h-[200px] rounded-md border p-3">
                  <div className="space-y-2">
                    {deptOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">暂无部门数据</p>
                    ) : (
                      deptOptions.map(option => {
                        const checked = selectedDeptIds.includes(option.id);
                        return (
                          <label
                            key={option.id}
                            className="flex items-center gap-2 text-sm"
                            style={{ paddingLeft: option.depth * 12 }}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                const next = value === true
                                  ? Array.from(new Set([...selectedDeptIds, option.id]))
                                  : selectedDeptIds.filter(id => id !== option.id);
                                setSelectedDeptIds(next);
                              }}
                            />
                            <span>{option.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            <div className="space-y-2">
              <FormLabel>权限配置</FormLabel>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <PermissionTree
                  groups={permissionGroups}
                  selectedPermissions={selectedPermissions}
                  onPermissionChange={setSelectedPermissions}
                />
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                已选择 {selectedPermissions.length} 项权限
              </p>
            </div>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '处理中...' : isEdit ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
