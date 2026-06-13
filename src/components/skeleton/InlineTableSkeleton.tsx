import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableSkeletonRowsProps {
  columns: number;
  rows?: number;
  showCheckbox?: boolean;
  showActions?: boolean;
}

export const TableSkeletonRows: React.FC<TableSkeletonRowsProps> = ({
  columns,
  rows = 5,
  showCheckbox = true,
  showActions = true,
}) => {
  const totalCols = columns + (showCheckbox ? 1 : 0) + (showActions ? 1 : 0);
  
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {showCheckbox && (
            <TableCell className="w-[50px]">
              <Skeleton className="h-4 w-4 rounded" />
            </TableCell>
          )}
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              {colIndex === 0 ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ) : (
                <Skeleton className="h-4 w-16" />
              )}
            </TableCell>
          ))}
          {showActions && (
            <TableCell className="w-[80px]">
              <Skeleton className="h-8 w-8 rounded" />
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );
};

export const InlineTableSkeleton: React.FC<TableSkeletonRowsProps> = (props) => (
  <TableSkeletonRows {...props} />
);
