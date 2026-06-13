import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { PermissionGroup } from '@/types';
import { cn } from '@/lib/utils';

interface PermissionTreeProps {
  groups: PermissionGroup[];
  selectedPermissions: string[];
  onPermissionChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export const PermissionTree: React.FC<PermissionTreeProps> = ({
  groups,
  selectedPermissions,
  onPermissionChange,
  disabled = false,
}) => {
  const handleGroupChange = (group: PermissionGroup, checked: boolean) => {
    const groupPermissionIds = group.permissions.map(p => p.id);
    
    if (checked) {
      // 添加该组所有权限
      const newPermissions = [...new Set([...selectedPermissions, ...groupPermissionIds])];
      onPermissionChange(newPermissions);
    } else {
      // 移除该组所有权限
      const newPermissions = selectedPermissions.filter(p => !groupPermissionIds.includes(p));
      onPermissionChange(newPermissions);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      onPermissionChange([...selectedPermissions, permissionId]);
    } else {
      onPermissionChange(selectedPermissions.filter(p => p !== permissionId));
    }
  };

  const isGroupChecked = (group: PermissionGroup) => {
    return group.permissions.every(p => selectedPermissions.includes(p.id));
  };

  const isGroupIndeterminate = (group: PermissionGroup) => {
    const hasChecked = group.permissions.some(p => selectedPermissions.includes(p.id));
    const allChecked = group.permissions.every(p => selectedPermissions.includes(p.id));
    return hasChecked && !allChecked;
  };

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <div key={group.resource} className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Checkbox
              id={`group-${group.resource}`}
              checked={isGroupChecked(group)}
              ref={(el) => {
                if (el) {
                  (el as HTMLButtonElement).dataset.state = isGroupIndeterminate(group) 
                    ? 'indeterminate' 
                    : isGroupChecked(group) ? 'checked' : 'unchecked';
                }
              }}
              onCheckedChange={(checked) => handleGroupChange(group, checked === true)}
              disabled={disabled}
              className={cn(
                isGroupIndeterminate(group) && "data-[state=indeterminate]:bg-primary/50"
              )}
            />
            <label 
              htmlFor={`group-${group.resource}`}
              className="text-sm font-medium cursor-pointer"
            >
              {group.label}
            </label>
            <span className="text-xs text-muted-foreground">
              ({group.permissions.filter(p => selectedPermissions.includes(p.id)).length}/{group.permissions.length})
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 ml-6">
            {group.permissions.map(permission => (
              <div key={permission.id} className="flex items-center gap-2">
                <Checkbox
                  id={permission.id}
                  checked={selectedPermissions.includes(permission.id)}
                  onCheckedChange={(checked) => handlePermissionChange(permission.id, checked === true)}
                  disabled={disabled}
                />
                <label 
                  htmlFor={permission.id}
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  {permission.description}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
