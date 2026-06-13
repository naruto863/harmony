import React, { useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeptNode, Role, User } from '@/types';
import { UserWithRole } from '@/services/userService';

const userFormSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  name: z.string().min(2, '姓名至少2个字符').max(50, '姓名最多50个字符'),
  phone: z.string().optional(),
  roleId: z.string().min(1, '请选择角色'),
  deptId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormValues) => Promise<void>;
  user?: UserWithRole | null;
  roles: Role[];
  depts: DeptNode[];
  isLoading?: boolean;
}

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  user,
  roles,
  depts,
  isLoading,
}) => {
  const isEdit = !!user;
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: '',
      name: '',
      phone: '',
      roleId: '',
      deptId: '',
      status: 'active',
    },
  });

  const flattenDepts = (items: DeptNode[], depth: number = 0): Array<DeptNode & { depth: number }> => {
    return items.flatMap(item => {
      const current = { ...item, depth };
      const children = item.children ? flattenDepts(item.children, depth + 1) : [];
      return [current, ...children];
    });
  };

  const deptOptions = flattenDepts(depts);

  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        name: user.name,
        phone: user.phone || '',
        roleId: user.roleId || '',
        deptId: user.deptId || '',
        status: user.status,
      });
    } else {
      form.reset({
        email: '',
        name: '',
        phone: '',
        roleId: '',
        deptId: '',
        status: 'active',
      });
    }
  }, [user, form]);

  const handleSubmit = async (data: UserFormValues) => {
    await onSubmit(data);
    form.reset();
  };

  const statusOptions = [
    { value: 'active', label: '正常' },
    { value: 'inactive', label: '禁用' },
    { value: 'pending', label: '待激活' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑用户' : '邀请用户'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改用户信息和角色分配' : '创建后系统会生成临时密码，用户首次登录后需要修改密码'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱 *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="user@example.com" 
                      {...field} 
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>姓名 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入姓名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>手机号</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入手机号" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择角色" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                          {role.isSystem && (
                            <span className="ml-2 text-muted-foreground text-xs">(系统)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deptId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>所属部门</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择部门" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">未设置</SelectItem>
                      {deptOptions.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {"-".repeat(dept.depth + 1)} {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isEdit && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>状态</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择状态" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '处理中...' : isEdit ? '保存' : '邀请'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
