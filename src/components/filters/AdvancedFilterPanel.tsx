import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Plus,
  Filter,
  Save,
  Trash2,
  ChevronDown,
  ChevronRight,
  Star,
  MoreHorizontal,
  X,
  RotateCcw,
} from 'lucide-react';
import { FilterGroupCard } from './FilterGroupCard';
import { SaveFilterDialog } from './SaveFilterDialog';
import {
  FilterGroup,
  FilterFieldDefinition,
  SavedFilter,
  generateId,
  getSavedFilters,
  saveFilter,
  deleteFilter,
} from '@/services/filterService';
import { toast } from 'sonner';

interface AdvancedFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  tenantId: string;
  userId: string;
  fields: FilterFieldDefinition[];
  groups: FilterGroup[];
  onGroupsChange: (groups: FilterGroup[]) => void;
  onApply: () => void;
  onReset: () => void;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  open,
  onOpenChange,
  entityType,
  tenantId,
  userId,
  fields,
  groups,
  onGroupsChange,
  onApply,
  onReset,
}) => {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savedFiltersExpanded, setSavedFiltersExpanded] = useState(true);

  useEffect(() => {
    if (open) {
      loadSavedFilters();
    }
  }, [open, entityType, tenantId, userId]);

  const loadSavedFilters = async () => {
    const filters = await getSavedFilters(entityType, tenantId, userId);
    setSavedFilters(filters);
  };

  const handleAddGroup = () => {
    const defaultField = fields[0];
    const newGroup: FilterGroup = {
      id: generateId(),
      logic: 'and',
      conditions: [
        {
          id: generateId(),
          field: defaultField?.key || '',
          operator: 'equals',
          value: '',
        },
      ],
    };
    onGroupsChange([...groups, newGroup]);
  };

  const handleGroupChange = (index: number, group: FilterGroup) => {
    const newGroups = [...groups];
    newGroups[index] = group;
    onGroupsChange(newGroups);
  };

  const handleGroupRemove = (index: number) => {
    const newGroups = groups.filter((_, i) => i !== index);
    onGroupsChange(newGroups);
  };

  const handleSaveFilter = async (name: string, isQuickFilter: boolean) => {
    await saveFilter({
      name,
      entityType,
      tenantId,
      userId,
      groups,
      isQuickFilter,
    });
    toast.success('筛选器已保存');
    await loadSavedFilters();
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    onGroupsChange(filter.groups);
    toast.success(`已加载筛选器「${filter.name}」`);
  };

  const handleDeleteFilter = async (filter: SavedFilter) => {
    await deleteFilter(filter.id, entityType, tenantId);
    toast.success('筛选器已删除');
    await loadSavedFilters();
  };

  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  const handleReset = () => {
    onReset();
  };

  const activeConditionsCount = groups.reduce(
    (sum, g) => sum + g.conditions.length,
    0
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[500px] sm:max-w-[500px] p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              高级筛选
              {activeConditionsCount > 0 && (
                <Badge variant="secondary">{activeConditionsCount} 个条件</Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              创建复杂的筛选条件组合
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-6 space-y-6">
              {/* 已保存的筛选器 */}
              {savedFilters.length > 0 && (
                <Collapsible
                  open={savedFiltersExpanded}
                  onOpenChange={setSavedFiltersExpanded}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">已保存的筛选器</span>
                        <Badge variant="outline" className="text-xs">
                          {savedFilters.length}
                        </Badge>
                      </div>
                      {savedFiltersExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-2">
                    {savedFilters.map(filter => (
                      <div
                        key={filter.id}
                        className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <button
                          className="flex items-center gap-2 flex-1 text-left"
                          onClick={() => handleLoadFilter(filter)}
                        >
                          {filter.isQuickFilter && (
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          )}
                          <span className="text-sm font-medium">{filter.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {filter.groups.reduce((s, g) => s + g.conditions.length, 0)} 条件
                          </Badge>
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleLoadFilter(filter)}>
                              应用筛选器
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteFilter(filter)}
                            >
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {savedFilters.length > 0 && <Separator />}

              {/* 条件组 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">筛选条件</h4>
                  {groups.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={handleReset}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      重置
                    </Button>
                  )}
                </div>

                {groups.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                      <Filter className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">
                        暂无筛选条件
                      </p>
                      <Button variant="outline" size="sm" onClick={handleAddGroup}>
                        <Plus className="h-4 w-4 mr-1" />
                        添加条件组
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {groups.map((group, index) => (
                      <React.Fragment key={group.id}>
                        {index > 0 && (
                          <div className="flex items-center justify-center">
                            <Badge variant="outline" className="text-xs bg-background">
                              或 (OR)
                            </Badge>
                          </div>
                        )}
                        <FilterGroupCard
                          group={group}
                          fields={fields}
                          groupIndex={index}
                          onChange={(g) => handleGroupChange(index, g)}
                          onRemove={() => handleGroupRemove(index)}
                          canRemove={groups.length > 1}
                        />
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {groups.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleAddGroup}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    添加条件组 (OR)
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="p-6 pt-4 border-t gap-2">
            {groups.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setSaveDialogOpen(true)}
              >
                <Save className="h-4 w-4 mr-2" />
                保存筛选器
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleApply}>
              应用筛选
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <SaveFilterDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveFilter}
      />
    </>
  );
};
