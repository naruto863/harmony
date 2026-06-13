import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
  showToolbar?: boolean;
}

export const TableRowSkeleton: React.FC<{ columns: number }> = ({ columns }) => (
  <div className="flex items-center gap-4 py-4 px-4 border-b last:border-b-0">
    <Skeleton className="h-4 w-4 rounded" />
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton 
        key={i} 
        className={`h-4 ${i === 0 ? 'w-[200px]' : i === columns - 1 ? 'w-8' : 'w-24'}`} 
      />
    ))}
  </div>
);

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns = 5,
  rows = 5,
  showHeader = true,
  showToolbar = true,
}) => (
  <div className="space-y-6">
    {/* 页面标题 */}
    {showHeader && (
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    )}

    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-6 w-24" />
          {showToolbar && (
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[120px]" />
              <Skeleton className="h-10 w-[140px]" />
              <Skeleton className="h-10 w-10" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          {/* 表头 */}
          <div className="flex items-center gap-4 py-3 px-4 bg-muted/50 border-b">
            <Skeleton className="h-4 w-4 rounded" />
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton 
                key={i} 
                className={`h-4 ${i === 0 ? 'w-16' : 'w-20'}`} 
              />
            ))}
          </div>
          
          {/* 表格行 */}
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-9" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
