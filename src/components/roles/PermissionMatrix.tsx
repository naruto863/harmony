import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Role, PermissionGroup } from '@/types';
import { Check, X } from 'lucide-react';

interface PermissionMatrixProps {
  roles: Role[];
  permissionGroups: PermissionGroup[];
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  roles,
  permissionGroups,
}) => {
  const allPermissions = permissionGroups.flatMap(g => g.permissions);

  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] sticky left-0 bg-background z-10">权限</TableHead>
            {roles.map(role => (
              <TableHead key={role.id} className="text-center min-w-[120px]">
                <div className="flex flex-col items-center gap-1">
                  <span>{role.name}</span>
                  {role.isSystem && (
                    <Badge variant="outline" className="text-xs">系统</Badge>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissionGroups.map(group => (
            <React.Fragment key={group.resource}>
              {/* 分组标题 */}
              <TableRow className="bg-muted/50">
                <TableCell 
                  colSpan={roles.length + 1} 
                  className="font-medium sticky left-0 bg-muted/50"
                >
                  {group.label}
                </TableCell>
              </TableRow>
              {/* 权限行 */}
              {group.permissions.map(permission => (
                <TableRow key={permission.id}>
                  <TableCell className="sticky left-0 bg-background">
                    <div className="flex flex-col">
                      <span className="text-sm">{permission.description}</span>
                      <span className="text-xs text-muted-foreground">{permission.id}</span>
                    </div>
                  </TableCell>
                  {roles.map(role => {
                    const hasPermission = role.permissions.includes(permission.id);
                    return (
                      <TableCell key={`${role.id}-${permission.id}`} className="text-center">
                        {hasPermission ? (
                          <Check className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
