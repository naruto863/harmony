import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Filter,
  X,
  Columns3,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnFilter {
  type: 'text' | 'select' | 'multiSelect' | 'number' | 'date';
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filter?: ColumnFilter;
  width?: number; // Changed to number for resizable
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  hidden?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface RowAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive';
  permission?: string;
  show?: (row: T) => boolean;
}

export interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  rowActions?: RowAction<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  isLoading?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: T) => void;
  batchActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedIds: string[]) => void;
    variant?: 'default' | 'destructive';
  }[];
  emptyMessage?: string;
  enableColumnToggle?: boolean;
  enableColumnResize?: boolean;
  enableRowDrag?: boolean;
  onRowReorder?: (newData: T[]) => void;
}

// Sortable Row Component
interface SortableRowProps<T extends { id: string }> {
  row: T;
  children: React.ReactNode;
  isDragEnabled: boolean;
}

function SortableRow<T extends { id: string }>({ row, children, isDragEnabled }: SortableRowProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, disabled: !isDragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragEnabled ? 'grab' : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && 'bg-muted/80',
      )}
    >
      {isDragEnabled && (
        <TableCell className="w-8 px-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:text-primary"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </TableCell>
      )}
      {children}
    </TableRow>
  );
}

interface ColumnFilterValue {
  [key: string]: string | string[] | { min?: string; max?: string };
}

export function DataTable<T extends { id: string }>({
  data,
  columns: initialColumns,
  rowActions,
  searchPlaceholder,
  searchKeys = [],
  isLoading = false,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onRowClick,
  batchActions,
  emptyMessage,
  enableColumnToggle = true,
  enableColumnResize = true,
  enableRowDrag = false,
  onRowReorder,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnFilters, setColumnFilters] = useState<ColumnFilterValue>({});
  const [localData, setLocalData] = useState<T[]>(data);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    initialColumns.forEach(col => {
      widths[col.key] = col.width || 150;
    });
    return widths;
  });
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    return new Set(initialColumns.filter(col => col.hidden).map(col => col.key));
  });
  
  const tableRef = useRef<HTMLDivElement>(null);
  const resizingColumn = useRef<string | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  // Sync local data with prop data
  React.useEffect(() => {
    setLocalData(data);
  }, [data]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = localData.findIndex(item => item.id === active.id);
      const newIndex = localData.findIndex(item => item.id === over.id);
      
      const newData = arrayMove(localData, oldIndex, newIndex);
      setLocalData(newData);
      onRowReorder?.(newData);
    }
  }, [localData, onRowReorder]);

  // Visible columns
  const visibleColumns = useMemo(() => 
    initialColumns.filter(col => !hiddenColumns.has(col.key)),
    [initialColumns, hiddenColumns]
  );

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return Object.values(columnFilters).filter(v => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return v.min || v.max;
      return v && v.length > 0;
    }).length;
  }, [columnFilters]);

  // Column resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizingColumn.current = columnKey;
    startX.current = e.clientX;
    startWidth.current = columnWidths[columnKey] || 150;
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [columnWidths]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn.current) return;
    
    const column = initialColumns.find(col => col.key === resizingColumn.current);
    const minWidth = column?.minWidth || 80;
    const maxWidth = column?.maxWidth || 500;
    
    const diff = e.clientX - startX.current;
    const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + diff));
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn.current!]: newWidth,
    }));
  }, [initialColumns]);

  const handleResizeEnd = useCallback(() => {
    resizingColumn.current = null;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

  // 搜索过滤 - use localData when drag is enabled
  const filteredData = useMemo(() => {
    let result = enableRowDrag ? localData : data;
    
    // Global search
    if (search && searchKeys.length > 0) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(row =>
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
    }
    
    // Column filters
    Object.entries(columnFilters).forEach(([key, filterValue]) => {
      if (!filterValue) return;
      
      const column = initialColumns.find(c => c.key === key);
      if (!column) return;
      
      result = result.filter(row => {
        const value = (row as Record<string, unknown>)[key];
        
        if (Array.isArray(filterValue)) {
          // Multi-select filter
          if (filterValue.length === 0) return true;
          return filterValue.includes(String(value));
        } else if (typeof filterValue === 'object') {
          // Range filter (number/date)
          const numValue = Number(value);
          if (filterValue.min && numValue < Number(filterValue.min)) return false;
          if (filterValue.max && numValue > Number(filterValue.max)) return false;
          return true;
        } else {
          // Text/select filter
          if (!filterValue) return true;
          if (column.filter?.type === 'select') {
            return String(value) === filterValue;
          }
          return String(value).toLowerCase().includes(filterValue.toLowerCase());
        }
      });
    });
    
    return result;
  }, [data, localData, enableRowDrag, search, searchKeys, columnFilters, initialColumns]);

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

  // 分页
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

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
      setSelectedIds(new Set(paginatedData.map(row => row.id)));
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

  // Update column filter
  const updateColumnFilter = (key: string, value: ColumnFilterValue[string]) => {
    setColumnFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  // Clear column filter
  const clearColumnFilter = (key: string) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setColumnFilters({});
    setSearch('');
    setCurrentPage(1);
  };

  // Toggle column visibility
  const toggleColumnVisibility = (key: string) => {
    setHiddenColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isAllSelected = paginatedData.length > 0 && 
    paginatedData.every(row => selectedIds.has(row.id));
  const isSomeSelected = paginatedData.some(row => selectedIds.has(row.id));

  // 渲染排序图标
  const renderSortIcon = (key: string) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
      : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
  };

  // Render column filter
  const renderColumnFilter = (column: Column<T>) => {
    const filterValue = columnFilters[column.key];
    const hasFilter = filterValue && (
      (typeof filterValue === 'string' && filterValue.length > 0) ||
      (Array.isArray(filterValue) && filterValue.length > 0) ||
      (typeof filterValue === 'object' && !Array.isArray(filterValue) && ((filterValue as { min?: string; max?: string }).min || (filterValue as { min?: string; max?: string }).max))
    );

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6",
              hasFilter && "text-primary"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Filter className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('table.filterColumn', { column: column.label })}</span>
              {hasFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => clearColumnFilter(column.key)}
                >
                  {t('common.clearFilter')}
                </Button>
              )}
            </div>
            
            {column.filter?.type === 'select' && column.filter.options && (
              <Select
                value={filterValue as string || ''}
                onValueChange={(value) => updateColumnFilter(column.key, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={column.filter.placeholder || t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  {column.filter.options.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {column.filter?.type === 'multiSelect' && column.filter.options && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {column.filter.options.map(opt => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`filter-${column.key}-${opt.value}`}
                      checked={(filterValue as string[] || []).includes(opt.value)}
                      onCheckedChange={(checked) => {
                        const current = (filterValue as string[]) || [];
                        if (checked) {
                          updateColumnFilter(column.key, [...current, opt.value]);
                        } else {
                          updateColumnFilter(column.key, current.filter(v => v !== opt.value));
                        }
                      }}
                    />
                    <label
                      htmlFor={`filter-${column.key}-${opt.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {opt.label}
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            {column.filter?.type === 'number' && (
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder={t('table.min')}
                  value={(filterValue as { min?: string; max?: string })?.min || ''}
                  onChange={(e) => updateColumnFilter(column.key, {
                    ...(filterValue as { min?: string; max?: string } || {}),
                    min: e.target.value,
                  })}
                />
                <Input
                  type="number"
                  placeholder={t('table.max')}
                  value={(filterValue as { min?: string; max?: string })?.max || ''}
                  onChange={(e) => updateColumnFilter(column.key, {
                    ...(filterValue as { min?: string; max?: string } || {}),
                    max: e.target.value,
                  })}
                />
              </div>
            )}
            
            {(!column.filter?.type || column.filter?.type === 'text') && (
              <Input
                placeholder={column.filter?.placeholder || t('table.filterPlaceholder')}
                value={filterValue as string || ''}
                onChange={(e) => updateColumnFilter(column.key, e.target.value)}
              />
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder || t('common.search') + '...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="gap-1"
            >
              <X className="h-3.5 w-3.5" />
              {t('table.clearFilters')} ({activeFiltersCount})
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Column visibility toggle */}
          {enableColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Columns3 className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('table.columns')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{t('table.toggleColumns')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {initialColumns.map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={!hiddenColumns.has(column.key)}
                    onCheckedChange={() => toggleColumnVisibility(column.key)}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {batchActions && selectedIds.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {t('common.selected')} {selectedIds.size} {t('common.items')}
              </span>
              {batchActions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                  onClick={() => action.onClick(Array.from(selectedIds))}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* 表格 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div ref={tableRef} className="border rounded-lg overflow-x-auto">
          <Table style={{ minWidth: 'max-content' }}>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {enableRowDrag && (
                <TableHead className="w-8 px-2" />
              )}
              {batchActions && (
                <TableHead className="w-12 sticky left-0 bg-muted/50 z-10">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="全选"
                    className={isSomeSelected && !isAllSelected ? 'opacity-50' : ''}
                  />
                </TableHead>
              )}
              {visibleColumns.map((column) => (
                <TableHead
                  key={column.key}
                  style={{ 
                    width: columnWidths[column.key],
                    minWidth: column.minWidth || 80,
                    maxWidth: column.maxWidth,
                  }}
                  className="relative group select-none"
                >
                  <div 
                    className={cn(
                      "flex items-center gap-1 pr-4",
                      column.sortable && "cursor-pointer"
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <span className="truncate">{column.label}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {column.sortable && renderSortIcon(column.key)}
                      {column.filterable && renderColumnFilter(column)}
                    </div>
                  </div>
                  
                  {/* Resize handle */}
                  {enableColumnResize && column.resizable !== false && (
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover:opacity-100 bg-primary/30 hover:bg-primary/50 transition-opacity"
                      onMouseDown={(e) => handleResizeStart(e, column.key)}
                    />
                  )}
                </TableHead>
              ))}
              {rowActions && rowActions.length > 0 && (
                <TableHead className="w-12 sticky right-0 bg-muted/50 z-10" />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell 
                  colSpan={visibleColumns.length + (batchActions ? 1 : 0) + (rowActions ? 1 : 0) + (enableRowDrag ? 1 : 0)} 
                  className="h-32"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={visibleColumns.length + (batchActions ? 1 : 0) + (rowActions ? 1 : 0) + (enableRowDrag ? 1 : 0)} 
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyMessage || t('common.noData')}
                </TableCell>
              </TableRow>
            ) : enableRowDrag ? (
              <SortableContext
                items={paginatedData.map(row => row.id)}
                strategy={verticalListSortingStrategy}
              >
                {paginatedData.map((row) => (
                  <SortableRow key={row.id} row={row} isDragEnabled={enableRowDrag}>
                    {batchActions && (
                      <TableCell 
                        className="sticky left-0 bg-card z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={(checked) => handleSelectRow(row.id, !!checked)}
                          aria-label={`选择行 ${row.id}`}
                        />
                      </TableCell>
                    )}
                    {visibleColumns.map((column) => {
                      const value = (row as Record<string, unknown>)[column.key];
                      return (
                        <TableCell 
                          key={column.key}
                          style={{ 
                            width: columnWidths[column.key],
                            minWidth: column.minWidth || 80,
                            maxWidth: column.maxWidth,
                          }}
                          onClick={() => onRowClick?.(row)}
                          className={onRowClick ? 'cursor-pointer' : ''}
                        >
                          <div className="truncate">
                            {column.render ? column.render(value, row) : String(value ?? '')}
                          </div>
                        </TableCell>
                      );
                    })}
                    {rowActions && rowActions.length > 0 && (
                      <TableCell 
                        className="sticky right-0 bg-card z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {rowActions.map((action, index) => {
                              if (action.show && !action.show(row)) return null;
                              return (
                                <React.Fragment key={index}>
                                  {action.variant === 'destructive' && index > 0 && (
                                    <DropdownMenuSeparator />
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => action.onClick(row)}
                                    className={action.variant === 'destructive' ? 'text-destructive' : ''}
                                  >
                                    {action.icon}
                                    <span className="ml-2">{action.label}</span>
                                  </DropdownMenuItem>
                                </React.Fragment>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </SortableRow>
                ))}
              </SortableContext>
            ) : (
              paginatedData.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {batchActions && (
                    <TableCell 
                      className="sticky left-0 bg-card z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedIds.has(row.id)}
                        onCheckedChange={(checked) => handleSelectRow(row.id, !!checked)}
                        aria-label={`选择行 ${row.id}`}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.map((column) => {
                    const value = (row as Record<string, unknown>)[column.key];
                    return (
                      <TableCell 
                        key={column.key}
                        style={{ 
                          width: columnWidths[column.key],
                          minWidth: column.minWidth || 80,
                          maxWidth: column.maxWidth,
                        }}
                      >
                        <div className="truncate">
                          {column.render ? column.render(value, row) : String(value ?? '')}
                        </div>
                      </TableCell>
                    );
                  })}
                  {rowActions && rowActions.length > 0 && (
                    <TableCell 
                      className="sticky right-0 bg-card z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {rowActions.map((action, index) => {
                            if (action.show && !action.show(row)) return null;
                            return (
                              <React.Fragment key={index}>
                                {action.variant === 'destructive' && index > 0 && (
                                  <DropdownMenuSeparator />
                                )}
                                <DropdownMenuItem
                                  onClick={() => action.onClick(row)}
                                  className={action.variant === 'destructive' ? 'text-destructive' : ''}
                                >
                                  {action.icon}
                                  <span className="ml-2">{action.label}</span>
                                </DropdownMenuItem>
                              </React.Fragment>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </DndContext>

      {/* 分页 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t('common.perPage')}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>{t('common.items')}，{t('common.total')} {sortedData.length} {t('common.items')}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-4 text-sm">
            {t('common.page')} {currentPage} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
