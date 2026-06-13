// 筛选条件类型
import { demoStorageKey, requireDemoMode } from '@/lib/demoMode';

export type FilterOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in'
  | 'is_empty'
  | 'is_not_empty';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | number | string[] | [string, string];
}

export interface FilterGroup {
  id: string;
  logic: 'and' | 'or';
  conditions: FilterCondition[];
}

export interface SavedFilter {
  id: string;
  name: string;
  entityType: string;
  tenantId: string;
  userId: string;
  groups: FilterGroup[];
  isQuickFilter: boolean;
  createdAt: string;
  updatedAt: string;
}

// 字段定义
export interface FilterFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  options?: { value: string; label: string }[];
}

// 操作符配置
export const OPERATOR_CONFIG: Record<FilterOperator, { label: string; types: string[] }> = {
  equals: { label: '等于', types: ['text', 'number', 'date', 'select'] },
  not_equals: { label: '不等于', types: ['text', 'number', 'date', 'select'] },
  contains: { label: '包含', types: ['text'] },
  not_contains: { label: '不包含', types: ['text'] },
  starts_with: { label: '开头是', types: ['text'] },
  ends_with: { label: '结尾是', types: ['text'] },
  greater_than: { label: '大于', types: ['number', 'date'] },
  less_than: { label: '小于', types: ['number', 'date'] },
  between: { label: '介于', types: ['number', 'date'] },
  in: { label: '属于', types: ['multiselect'] },
  is_empty: { label: '为空', types: ['text', 'number', 'date', 'select'] },
  is_not_empty: { label: '不为空', types: ['text', 'number', 'date', 'select'] },
};

// 根据字段类型获取可用操作符
export const getOperatorsForType = (type: string): { value: FilterOperator; label: string }[] => {
  return Object.entries(OPERATOR_CONFIG)
    .filter(([_, config]) => config.types.includes(type))
    .map(([key, config]) => ({ value: key as FilterOperator, label: config.label }));
};

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 获取保存的筛选器
export const getSavedFilters = async (
  entityType: string,
  tenantId: string,
  userId: string
): Promise<SavedFilter[]> => {
  requireDemoMode('filterService');
  await delay(300);
  const key = demoStorageKey(`saved_filters_${entityType}_${tenantId}`);
  const filters = localStorage.getItem(key);
  if (!filters) return [];
  
  const parsed = JSON.parse(filters) as SavedFilter[];
  return parsed.filter(f => f.userId === userId || f.isQuickFilter);
};

// 保存筛选器
export const saveFilter = async (filter: Omit<SavedFilter, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedFilter> => {
  requireDemoMode('filterService');
  await delay(300);
  const key = demoStorageKey(`saved_filters_${filter.entityType}_${filter.tenantId}`);
  const existing = localStorage.getItem(key);
  const filters: SavedFilter[] = existing ? JSON.parse(existing) : [];
  
  const newFilter: SavedFilter = {
    ...filter,
    id: `filter_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  filters.push(newFilter);
  localStorage.setItem(key, JSON.stringify(filters));
  
  return newFilter;
};

// 更新筛选器
export const updateFilter = async (
  filterId: string,
  entityType: string,
  tenantId: string,
  updates: Partial<Pick<SavedFilter, 'name' | 'groups' | 'isQuickFilter'>>
): Promise<SavedFilter | null> => {
  requireDemoMode('filterService');
  await delay(300);
  const key = demoStorageKey(`saved_filters_${entityType}_${tenantId}`);
  const existing = localStorage.getItem(key);
  if (!existing) return null;
  
  const filters: SavedFilter[] = JSON.parse(existing);
  const index = filters.findIndex(f => f.id === filterId);
  
  if (index === -1) return null;
  
  filters[index] = {
    ...filters[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(key, JSON.stringify(filters));
  return filters[index];
};

// 删除筛选器
export const deleteFilter = async (
  filterId: string,
  entityType: string,
  tenantId: string
): Promise<boolean> => {
  requireDemoMode('filterService');
  await delay(300);
  const key = demoStorageKey(`saved_filters_${entityType}_${tenantId}`);
  const existing = localStorage.getItem(key);
  if (!existing) return false;
  
  const filters: SavedFilter[] = JSON.parse(existing);
  const newFilters = filters.filter(f => f.id !== filterId);
  
  localStorage.setItem(key, JSON.stringify(newFilters));
  return true;
};

// 应用筛选条件到数据
export const applyFilters = <T extends object>(
  data: T[],
  groups: FilterGroup[]
): T[] => {
  if (groups.length === 0) return data;
  
  return data.filter(item => {
    // 所有组之间是 OR 关系
    return groups.some(group => {
      if (group.conditions.length === 0) return true;
      
      // 组内条件根据 logic 决定关系
      const results = group.conditions.map(condition => 
        evaluateCondition(item as Record<string, unknown>, condition)
      );
      
      return group.logic === 'and' 
        ? results.every(Boolean)
        : results.some(Boolean);
    });
  });
};

// 评估单个条件
const evaluateCondition = <T extends Record<string, unknown>>(
  item: T,
  condition: FilterCondition
): boolean => {
  const fieldValue = item[condition.field];
  const { operator, value } = condition;
  
  // 处理空值检查
  if (operator === 'is_empty') {
    return fieldValue === null || fieldValue === undefined || fieldValue === '';
  }
  if (operator === 'is_not_empty') {
    return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
  }
  
  // 如果字段值为空，其他操作符返回 false
  if (fieldValue === null || fieldValue === undefined) return false;
  
  const strValue = String(fieldValue).toLowerCase();
  const compareValue = String(value).toLowerCase();
  
  switch (operator) {
    case 'equals':
      return strValue === compareValue;
    case 'not_equals':
      return strValue !== compareValue;
    case 'contains':
      return strValue.includes(compareValue);
    case 'not_contains':
      return !strValue.includes(compareValue);
    case 'starts_with':
      return strValue.startsWith(compareValue);
    case 'ends_with':
      return strValue.endsWith(compareValue);
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    case 'less_than':
      return Number(fieldValue) < Number(value);
    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        const numValue = Number(fieldValue);
        return numValue >= Number(value[0]) && numValue <= Number(value[1]);
      }
      return false;
    case 'in':
      if (Array.isArray(value)) {
        return value.some(v => String(v).toLowerCase() === strValue);
      }
      return false;
    default:
      return false;
  }
};

// 生成唯一 ID
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
