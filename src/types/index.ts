// ==================== 认证相关类型 ====================
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  user: User;
  accessToken: string;
  expiresAt: string;
  passwordChangeRequired?: boolean;
}

// ==================== 租户相关类型 ====================
export interface Tenant {
  id: string;
  name: string;
  logo?: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface TenantMembership {
  tenantId: string;
  userId: string;
  roleId: string;
  joinedAt: string;
}

export interface TenantMember {
  userId: string;
  userName: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  roleId?: string;
  roleName?: string;
  isAdmin: boolean;
  joinedAt: string;
}

// ==================== 权限相关类型 ====================
export type RoleType = 'super_admin' | 'tenant_admin' | 'manager' | 'viewer' | 'custom';
export type DataScopeType = 'ALL' | 'DEPT' | 'DEPT_AND_CHILDREN' | 'SELF' | 'CUSTOM';

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  description: string;
  permissions: string[];
  tenantId?: string; // null 表示系统级角色
  isSystem?: boolean; // 是否为系统预设角色
  dataScopeType?: DataScopeType;
  dataScopeDeptIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  description: string;
}

export interface PermissionGroup {
  resource: string;
  label: string;
  permissions: Permission[];
}

// ==================== 用户-租户-角色关联类型 ====================
export interface UserTenantRole {
  id: string;
  userId: string;
  tenantId: string;
  roleId: string;
  deptId?: string;
  user?: User;
  role?: Role;
  joinedAt: string;
}

// ==================== 菜单相关类型 ====================
export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  permission?: string;
  children?: MenuItem[];
  badge?: string | number;
  parentId?: string | null;
  type?: string;
  sortOrder?: number;
  visible?: boolean;
}

// ==================== 字典/参数/组织/菜单 ====================
export interface DictGroup {
  id: string;
  groupKey: string;
  groupName: string;
  scope?: string;
  readonly?: boolean;
  version?: number;
  status: string;
  items?: DictItem[];
}

export interface DictItem {
  id: string;
  groupId: string;
  itemKey: string;
  itemValue: string;
  status: string;
  sortOrder?: number;
}

export interface ConfigItem {
  id: string;
  configKey: string;
  configValue: string;
  env: string;
  type: string;
  sensitive?: boolean;
  validationRule?: string;
  version?: number;
  status: string;
}

export interface DeptNode {
  id: string;
  name: string;
  parentId?: string | null;
  sortOrder?: number;
  status: string;
  children?: DeptNode[];
}

export interface Position {
  id: string;
  name: string;
  code: string;
  deptId?: string | null;
  deptName?: string | null;
  description?: string;
  sortOrder?: number;
  status: string;
}

export interface UserGroup {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  memberCount?: number;
}

export interface LoginLog {
  id: string;
  userId?: string;
  userName?: string;
  status: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
  device?: string;
  createdAt: string;
}

// ==================== API 相关类型 ====================
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status?: number;
    traceId?: string | null;
    fieldErrors?: Record<string, string[]>;
  };
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * @deprecated 页面服务层历史返回类型。新代码优先使用 ServiceResult<T> 命名，
 * 外部 API 原始响应 envelope 统一使用 src/services/apiClient.ts 的 ApiEnvelopeResponse<T>。
 */
export type ApiResponse<T> = ServiceResult<T>;

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterParams {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
  value: string | number | boolean | (string | number)[];
}

export interface QueryParams {
  pagination?: PaginationParams;
  sort?: SortParams;
  filters?: FilterParams[];
  search?: string;
}

// ==================== CRUD 相关类型 ====================
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface BatchAction {
  key: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive';
  permission?: string;
}

// ==================== 审计日志类型 ====================
export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'role_change' | 'permission_change';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  tenantId: string;
  eventType?: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  result?: string;
  failureReason?: string;
  traceId?: string;
  durationMs?: number;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// ==================== 项目模块类型（示例） ====================
export type ProjectStatus = 'active' | 'archived' | 'draft';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  ownerName: string;
  tenantId: string;
  startDate: string;
  endDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ==================== 文件中心类型 ====================
export interface FileRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  tenantId: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
}

// ==================== 导入导出任务类型 ====================
export type ImportExportTaskType = 'import' | 'export';
export type ImportExportTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ImportExportTaskPhase =
  | 'queued'
  | 'uploaded'
  | 'parsing'
  | 'validating'
  | 'confirmed'
  | 'executing'
  | 'generated'
  | 'cancelled'
  | 'failed';

export interface ImportExportTaskError {
  row?: number;
  field?: string;
  message: string;
}

export interface ImportExportTask {
  id: string;
  createdBy?: string;
  taskType: ImportExportTaskType;
  entityType: string;
  format?: string;
  status: ImportExportTaskStatus;
  phase: ImportExportTaskPhase;
  sourceFileId?: string;
  downloadFileId?: string;
  downloadUrl?: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  errorDetails?: string;
  errors?: ImportExportTaskError[];
  durationMs?: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== 设置相关类型 ====================
export interface NotificationPreference {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  tenantId?: string;
}
