import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { FilterConditionRow } from './FilterConditionRow';
import {
  FilterGroup,
  FilterCondition,
  FilterFieldDefinition,
  generateId,
} from '@/services/filterService';

interface FilterGroupCardProps {
  group: FilterGroup;
  fields: FilterFieldDefinition[];
  groupIndex: number;
  onChange: (group: FilterGroup) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export const FilterGroupCard: React.FC<FilterGroupCardProps> = ({
  group,
  fields,
  groupIndex,
  onChange,
  onRemove,
  canRemove,
}) => {
  const handleLogicChange = (logic: 'and' | 'or') => {
    onChange({ ...group, logic });
  };

  const handleConditionChange = (index: number, condition: FilterCondition) => {
    const newConditions = [...group.conditions];
    newConditions[index] = condition;
    onChange({ ...group, conditions: newConditions });
  };

  const handleConditionRemove = (index: number) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    onChange({ ...group, conditions: newConditions });
  };

  const handleAddCondition = () => {
    const defaultField = fields[0];
    const newCondition: FilterCondition = {
      id: generateId(),
      field: defaultField?.key || '',
      operator: 'equals',
      value: '',
    };
    onChange({ ...group, conditions: [...group.conditions, newCondition] });
  };

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4 space-y-3">
        {/* 组头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              条件组 {groupIndex + 1}
            </Badge>
            {group.conditions.length > 1 && (
              <Select value={group.logic} onValueChange={(v) => handleLogicChange(v as 'and' | 'or')}>
                <SelectTrigger className="h-7 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="and">且 (AND)</SelectItem>
                  <SelectItem value="or">或 (OR)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              删除组
            </Button>
          )}
        </div>

        {/* 条件列表 */}
        <div className="space-y-2">
          {group.conditions.map((condition, index) => (
            <div key={condition.id} className="flex items-center gap-2">
              {index > 0 && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {group.logic === 'and' ? '且' : '或'}
                </Badge>
              )}
              <FilterConditionRow
                condition={condition}
                fields={fields}
                onChange={(c) => handleConditionChange(index, c)}
                onRemove={() => handleConditionRemove(index)}
                canRemove={group.conditions.length > 1}
              />
            </div>
          ))}
        </div>

        {/* 添加条件 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={handleAddCondition}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          添加条件
        </Button>
      </CardContent>
    </Card>
  );
};
