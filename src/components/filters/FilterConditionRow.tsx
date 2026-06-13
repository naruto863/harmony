import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import {
  FilterCondition,
  FilterFieldDefinition,
  FilterOperator,
  getOperatorsForType,
} from '@/services/filterService';

interface FilterConditionRowProps {
  condition: FilterCondition;
  fields: FilterFieldDefinition[];
  onChange: (condition: FilterCondition) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export const FilterConditionRow: React.FC<FilterConditionRowProps> = ({
  condition,
  fields,
  onChange,
  onRemove,
  canRemove,
}) => {
  const selectedField = fields.find(f => f.key === condition.field);
  const operators = selectedField 
    ? getOperatorsForType(selectedField.type)
    : [];
  
  const needsValue = !['is_empty', 'is_not_empty'].includes(condition.operator);
  const needsSecondValue = condition.operator === 'between';

  const handleFieldChange = (fieldKey: string) => {
    const field = fields.find(f => f.key === fieldKey);
    const newOperators = field ? getOperatorsForType(field.type) : [];
    const defaultOperator = newOperators[0]?.value || 'equals';
    
    onChange({
      ...condition,
      field: fieldKey,
      operator: defaultOperator,
      value: '',
    });
  };

  const handleOperatorChange = (operator: FilterOperator) => {
    let newValue: string | string[] | [string, string] = '';
    if (operator === 'between') {
      newValue = ['', ''] as [string, string];
    } else if (operator === 'in') {
      newValue = [] as string[];
    }
    
    onChange({
      ...condition,
      operator,
      value: newValue,
    });
  };

  const handleValueChange = (value: string, index?: number) => {
    if (condition.operator === 'between' && typeof index === 'number') {
      const currentValue = Array.isArray(condition.value) 
        ? condition.value as [string, string]
        : ['', ''];
      const newValue = [...currentValue] as [string, string];
      newValue[index] = value;
      onChange({ ...condition, value: newValue });
    } else {
      onChange({ ...condition, value });
    }
  };

  const renderValueInput = () => {
    if (!needsValue) return null;

    if (needsSecondValue) {
      const values = Array.isArray(condition.value) 
        ? condition.value as [string, string]
        : ['', ''];
      
      return (
        <div className="flex items-center gap-1">
          <Input
            value={values[0]}
            onChange={(e) => handleValueChange(e.target.value, 0)}
            placeholder="起始值"
            className="h-8 w-24"
          />
          <span className="text-muted-foreground text-sm">至</span>
          <Input
            value={values[1]}
            onChange={(e) => handleValueChange(e.target.value, 1)}
            placeholder="结束值"
            className="h-8 w-24"
          />
        </div>
      );
    }

    if (selectedField?.type === 'select' && selectedField.options) {
      return (
        <Select
          value={condition.value as string}
          onValueChange={(v) => handleValueChange(v)}
        >
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="选择值" />
          </SelectTrigger>
          <SelectContent>
            {selectedField.options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (selectedField?.type === 'date') {
      return (
        <Input
          type="date"
          value={condition.value as string}
          onChange={(e) => handleValueChange(e.target.value)}
          className="h-8 w-[140px]"
        />
      );
    }

    return (
      <Input
        value={condition.value as string}
        onChange={(e) => handleValueChange(e.target.value)}
        placeholder="输入值"
        className="h-8 w-[140px]"
        type={selectedField?.type === 'number' ? 'number' : 'text'}
      />
    );
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 字段选择 */}
      <Select value={condition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue placeholder="选择字段" />
        </SelectTrigger>
        <SelectContent>
          {fields.map(field => (
            <SelectItem key={field.key} value={field.key}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 操作符选择 */}
      <Select
        value={condition.operator}
        onValueChange={(v) => handleOperatorChange(v as FilterOperator)}
      >
        <SelectTrigger className="h-8 w-[120px]">
          <SelectValue placeholder="操作符" />
        </SelectTrigger>
        <SelectContent>
          {operators.map(op => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 值输入 */}
      {renderValueInput()}

      {/* 删除按钮 */}
      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
