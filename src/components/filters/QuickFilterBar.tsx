import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Filter, X, Star } from 'lucide-react';
import {
  FilterGroup,
  SavedFilter,
  getSavedFilters,
} from '@/services/filterService';

interface QuickFilterBarProps {
  entityType: string;
  tenantId: string;
  userId: string;
  activeGroups: FilterGroup[];
  onApplyFilter: (groups: FilterGroup[]) => void;
  onOpenAdvanced: () => void;
  onClear: () => void;
}

export const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  entityType,
  tenantId,
  userId,
  activeGroups,
  onApplyFilter,
  onOpenAdvanced,
  onClear,
}) => {
  const [quickFilters, setQuickFilters] = useState<SavedFilter[]>([]);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);

  useEffect(() => {
    loadQuickFilters();
  }, [entityType, tenantId, userId]);

  const loadQuickFilters = async () => {
    const filters = await getSavedFilters(entityType, tenantId, userId);
    setQuickFilters(filters.filter(f => f.isQuickFilter));
  };

  const handleQuickFilterClick = (filter: SavedFilter) => {
    if (activeFilterId === filter.id) {
      // 取消选中
      setActiveFilterId(null);
      onClear();
    } else {
      setActiveFilterId(filter.id);
      onApplyFilter(filter.groups);
    }
  };

  const activeConditionsCount = activeGroups.reduce(
    (sum, g) => sum + g.conditions.length,
    0
  );

  const hasActiveFilter = activeConditionsCount > 0;

  return (
    <div className="flex items-center gap-2">
      {/* 高级筛选按钮 */}
      <Button
        variant={hasActiveFilter ? 'default' : 'outline'}
        size="sm"
        onClick={onOpenAdvanced}
        className="shrink-0"
      >
        <Filter className="h-4 w-4 mr-1" />
        高级筛选
        {hasActiveFilter && (
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
            {activeConditionsCount}
          </Badge>
        )}
      </Button>

      {/* 快捷筛选 */}
      {quickFilters.length > 0 && (
        <>
          <div className="h-5 w-px bg-border" />
          <ScrollArea className="max-w-[400px]">
            <div className="flex items-center gap-1.5">
              {quickFilters.map(filter => {
                const isActive = activeFilterId === filter.id;
                return (
                  <Button
                    key={filter.id}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2.5 shrink-0"
                    onClick={() => handleQuickFilterClick(filter)}
                  >
                    <Star className={`h-3 w-3 mr-1 ${isActive ? 'fill-current' : ''}`} />
                    {filter.name}
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </>
      )}

      {/* 清除按钮 */}
      {hasActiveFilter && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground"
          onClick={() => {
            setActiveFilterId(null);
            onClear();
          }}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          清除
        </Button>
      )}
    </div>
  );
};
