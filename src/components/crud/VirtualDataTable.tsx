import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Column, RowAction } from './DataTable';

export interface VirtualDataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  rowActions?: RowAction<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  batchActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedIds: string[]) => void;
    variant?: 'default' | 'destructive';
  }[];
  emptyMessage?: string;
  rowHeight?: number;
  maxHeight?: number;
}

export function VirtualDataTable<T extends { id: string }>({
  data,
  columns,
  rowActions,
  searchPlaceholder,
  searchKeys = [],
  isLoading = false,
  onRowClick,
  batchActions,
  emptyMessage,
  rowHeight = 48,
  maxHeight = 600,
}: VirtualDataTableProps<T>) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const parentRef = useRef<HTMLDivElement>(null);

  // 搜索过滤
  const filteredData = useMemo(() => {
    if (!search || searchKeys.length === 0) return data;
    
    const lowerSearch = search.toLowerCase();
    return data.filter(row =>
      searchKeys.some(key => {
        const value = row[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerSearch);
        }
        if (Array.isArray(value)) {
          return value.some(v => 
            typeof v === 'string' && v.toLowerCase().includes(lowerSearch)
          );
        }
        return false;
      })
    );
  }, [data, search, searchKeys]);

  // 排序
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortKey];
      const bValue = (b as Record<string, unknown>)[sortKey];
      
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortOrder]);

  // 虚拟化
  const rowVirtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  // 处理排序
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedData.map(row => row.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // 处理单选
  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected = sortedData.length > 0 && 
    sortedData.every(row => selectedIds.has(row.id));
  const isSomeSelected = sortedData.some(row => selectedIds.has(row.id));

  // 渲染排序图标
  const renderSortIcon = (key: string) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
      : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
  };

  // 渲染操作菜单
  const renderActions = useCallback((row: T) => {
    if (!rowActions || rowActions.length === 0) return null;
    
    const visibleActions = rowActions.filter(action => 
      !action.show || action.show(row)
    );
    
    if (visibleActions.length === 0) return null;
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {visibleActions.map((action, index) => (
            <React.Fragment key={index}>
              {index > 0 && action.variant === 'destructive' && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(row);
                }}
                className={action.variant === 'destructive' ? 'text-destructive' : ''}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }, [rowActions]);

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder || t('table.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && batchActions && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {t('table.selected', { count: selectedIds.size })}
              </Badge>
              {batchActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => action.onClick(Array.from(selectedIds))}
                >
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </Button>
              ))}
            </div>
          )}
          
          <Badge variant="outline" className="text-muted-foreground">
            {t('table.totalRecords', { count: sortedData.length })}
          </Badge>
        </div>
      </div>

      {/* 虚拟滚动表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              {batchActions && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label={t('table.selectAll')}
                    className={cn(isSomeSelected && !isAllSelected && 'data-[state=checked]:bg-muted')}
                  />
                </TableHead>
              )}
              {columns.filter(col => !col.hidden).map((column) => (
                <TableHead
                  key={column.key}
                  style={{ width: column.width }}
                  className={cn(column.sortable && 'cursor-pointer select-none')}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
              {rowActions && <TableHead className="w-16" />}
            </TableRow>
          </TableHeader>
        </Table>
        
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ maxHeight }}
        >
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sortedData.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              {emptyMessage || t('table.noData')}
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              <Table>
                <TableBody>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = sortedData[virtualRow.index];
                    return (
                      <TableRow
                        key={row.id}
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        className={cn(
                          onRowClick && 'cursor-pointer',
                          selectedIds.has(row.id) && 'bg-muted/50'
                        )}
                        onClick={() => onRowClick?.(row)}
                      >
                        {batchActions && (
                          <TableCell className="w-12 flex-shrink-0">
                            <Checkbox
                              checked={selectedIds.has(row.id)}
                              onCheckedChange={(checked) => handleSelectRow(row.id, !!checked)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                        )}
                        {columns.filter(col => !col.hidden).map((column) => (
                          <TableCell
                            key={column.key}
                            style={{ width: column.width, flex: column.width ? 'none' : 1 }}
                          >
                            {column.render
                              ? column.render((row as Record<string, unknown>)[column.key], row)
                              : String((row as Record<string, unknown>)[column.key] ?? '')}
                          </TableCell>
                        ))}
                        {rowActions && (
                          <TableCell className="w-16 flex-shrink-0">
                            {renderActions(row)}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {t('table.virtualScrollInfo', { 
            visible: Math.min(rowVirtualizer.getVirtualItems().length, sortedData.length),
            total: sortedData.length 
          })}
        </span>
      </div>
    </div>
  );
}
