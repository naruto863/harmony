import {
  User,
  Tenant,
  Role,
  Permission,
  Project,
  AuditLog,
  MenuItem,
  PermissionGroup,
  DeptNode,
  Position,
  UserGroup,
} from '@/types';
import type { MonitoringAlert, MonitoringHealthSummary } from '@/types/monitoring';
import type { SchedulerExecution, SchedulerJob } from '@/types/scheduler';
import type { DynamicFormSchema, WorkflowDefinition, WorkflowInstance } from '@/types/workflow';
import type { MaintenanceResource } from '@/types/maintenance';
import type { SaasPlan, SaasQuotaUsage } from '@/types/saas';

// ==================== 权限定义 ====================
export const PERMISSIONS: Permission[] = [
  // 用户管理
  { id: 'users.create', resource: 'users', action: 'create', description: '创建用户' },
  { id: 'users.read', resource: 'users', action: 'read', description: '查看用户' },
  { id: 'users.update', resource: 'users', action: 'update', description: '编辑用户' },
  { id: 'users.delete', resource: 'users', action: 'delete', description: '删除用户' },
  // 岗位管理
  { id: 'positions.create', resource: 'positions', action: 'create', description: '创建岗位' },
  { id: 'positions.read', resource: 'positions', action: 'read', description: '查看岗位' },
  { id: 'positions.update', resource: 'positions', action: 'update', description: '编辑岗位' },
  { id: 'positions.delete', resource: 'positions', action: 'delete', description: '删除岗位' },
  // 用户组管理
  { id: 'user-groups.create', resource: 'user-groups', action: 'create', description: '创建用户组' },
  { id: 'user-groups.read', resource: 'user-groups', action: 'read', description: '查看用户组' },
  { id: 'user-groups.update', resource: 'user-groups', action: 'update', description: '编辑用户组' },
  { id: 'user-groups.delete', resource: 'user-groups', action: 'delete', description: '删除用户组' },
  // 角色管理
  { id: 'roles.create', resource: 'roles', action: 'create', description: '创建角色' },
  { id: 'roles.read', resource: 'roles', action: 'read', description: '查看角色' },
  { id: 'roles.update', resource: 'roles', action: 'update', description: '编辑角色' },
  { id: 'roles.delete', resource: 'roles', action: 'delete', description: '删除角色' },
  // 项目管理
  { id: 'projects.create', resource: 'projects', action: 'create', description: '创建项目' },
  { id: 'projects.read', resource: 'projects', action: 'read', description: '查看项目' },
  { id: 'projects.update', resource: 'projects', action: 'update', description: '编辑项目' },
  { id: 'projects.delete', resource: 'projects', action: 'delete', description: '删除项目' },
  // 审计日志
  { id: 'audit.read', resource: 'audit', action: 'read', description: '查看审计日志' },
  // 文件管理
  { id: 'files.create', resource: 'files', action: 'create', description: '上传文件' },
  { id: 'files.read', resource: 'files', action: 'read', description: '查看文件' },
  { id: 'files.delete', resource: 'files', action: 'delete', description: '删除文件' },
  // 设置
  { id: 'settings.read', resource: 'settings', action: 'read', description: '查看设置' },
  { id: 'settings.update', resource: 'settings', action: 'update', description: '修改设置' },
  // 租户管理
  { id: 'tenant.manage', resource: 'tenant', action: 'manage', description: '管理租户' },
  // 任务调度
  { id: 'scheduler.jobs.read', resource: 'scheduler.jobs', action: 'read', description: '查看任务定义' },
  { id: 'scheduler.jobs.execute', resource: 'scheduler.jobs', action: 'execute', description: '立即执行任务' },
  { id: 'scheduler.executions.read', resource: 'scheduler.executions', action: 'read', description: '查看执行日志' },
  { id: 'scheduler.executions.retry', resource: 'scheduler.executions', action: 'retry', description: '重试失败任务' },
  // 监控告警
  { id: 'monitoring.health.read', resource: 'monitoring.health', action: 'read', description: '查看健康状态' },
  { id: 'monitoring.metrics.read', resource: 'monitoring.metrics', action: 'read', description: '查看监控指标' },
  { id: 'monitoring.alerts.read', resource: 'monitoring.alerts', action: 'read', description: '查看告警历史' },
  { id: 'monitoring.alerts.manage', resource: 'monitoring.alerts', action: 'manage', description: '管理告警' },
  { id: 'monitoring.alert-rules.manage', resource: 'monitoring.alert-rules', action: 'manage', description: '管理告警规则' },
  // 开发者工具
  { id: 'developer.openapi.read', resource: 'developer.openapi', action: 'read', description: '查看 OpenAPI 草稿' },
  { id: 'developer.openapi.manage', resource: 'developer.openapi', action: 'manage', description: '生成 OpenAPI 草稿建议' },
  // 模块清单
  { id: 'modules.read', resource: 'modules', action: 'read', description: '查看模块清单' },
  { id: 'modules.manage', resource: 'modules', action: 'manage', description: '管理模块 manifest' },
  // 工作流与动态表单
  { id: 'workflows.definitions.read', resource: 'workflows.definitions', action: 'read', description: '查看流程定义' },
  { id: 'workflows.instances.read', resource: 'workflows.instances', action: 'read', description: '查看流程实例' },
  { id: 'workflows.instances.start', resource: 'workflows.instances', action: 'start', description: '发起流程' },
  { id: 'workflows.tasks.approve', resource: 'workflows.tasks', action: 'approve', description: '审批流程任务' },
  { id: 'workflows.tasks.reject', resource: 'workflows.tasks', action: 'reject', description: '驳回流程任务' },
  { id: 'forms.schemas.read', resource: 'forms.schemas', action: 'read', description: '查看动态表单' },
  { id: 'forms.schemas.preview', resource: 'forms.schemas', action: 'preview', description: '预览动态表单' },
  // 数据维护与 SaaS 扩展
  { id: 'maintenance.resources.read', resource: 'maintenance.resources', action: 'read', description: '查看维护资源' },
  { id: 'maintenance.cache.clear', resource: 'maintenance.cache', action: 'clear', description: '清理受控缓存' },
  { id: 'maintenance.reference-data.sync', resource: 'maintenance.reference-data', action: 'sync', description: '同步基础数据' },
  { id: 'saas.plans.read', resource: 'saas.plans', action: 'read', description: '查看 SaaS 套餐' },
  { id: 'saas.quotas.read', resource: 'saas.quotas', action: 'read', description: '查看 SaaS 配额' },
  { id: 'saas.modules.toggle', resource: 'saas.modules', action: 'toggle', description: '切换 SaaS 模块' },
];

// ==================== 权限分组 ====================
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    resource: 'users',
    label: '用户管理',
    permissions: PERMISSIONS.filter(p => p.resource === 'users'),
  },
  {
    resource: 'positions',
    label: '岗位管理',
    permissions: PERMISSIONS.filter(p => p.resource === 'positions'),
  },
  {
    resource: 'user-groups',
    label: '用户组管理',
    permissions: PERMISSIONS.filter(p => p.resource === 'user-groups'),
  },
  {
    resource: 'roles',
    label: '角色管理',
    permissions: PERMISSIONS.filter(p => p.resource === 'roles'),
  },
  {
    resource: 'projects',
    label: '项目管理',
    permissions: PERMISSIONS.filter(p => p.resource === 'projects'),
  },
  {
    resource: 'files',
    label: '文件管理',
    permissions: PERMISSIONS.filter(p => p.resource === 'files'),
  },
  {
    resource: 'audit',
    label: '审计日志',
    permissions: PERMISSIONS.filter(p => p.resource === 'audit'),
  },
  {
    resource: 'settings',
    label: '系统设置',
    permissions: PERMISSIONS.filter(p => p.resource === 'settings'),
  },
  {
    resource: 'tenant',
    label: '租户管理',
    permissions: PERMISSIONS.filter(p => p.resource === 'tenant'),
  },
  {
    resource: 'scheduler.jobs',
    label: '任务定义',
    permissions: PERMISSIONS.filter(p => p.resource === 'scheduler.jobs'),
  },
  {
    resource: 'scheduler.executions',
    label: '执行日志',
    permissions: PERMISSIONS.filter(p => p.resource === 'scheduler.executions'),
  },
  {
    resource: 'monitoring.health',
    label: '监控健康',
    permissions: PERMISSIONS.filter(p => p.resource === 'monitoring.health'),
  },
  {
    resource: 'monitoring.metrics',
    label: '监控指标',
    permissions: PERMISSIONS.filter(p => p.resource === 'monitoring.metrics'),
  },
  {
    resource: 'monitoring.alerts',
    label: '监控告警',
    permissions: PERMISSIONS.filter(p => p.resource === 'monitoring.alerts'),
  },
  {
    resource: 'monitoring.alert-rules',
    label: '告警规则',
    permissions: PERMISSIONS.filter(p => p.resource === 'monitoring.alert-rules'),
  },
  {
    resource: 'developer.openapi',
    label: 'OpenAPI 辅助',
    permissions: PERMISSIONS.filter(p => p.resource === 'developer.openapi'),
  },
  {
    resource: 'modules',
    label: '模块清单',
    permissions: PERMISSIONS.filter(p => p.resource === 'modules'),
  },
  {
    resource: 'workflows.definitions',
    label: '流程定义',
    permissions: PERMISSIONS.filter(p => p.resource === 'workflows.definitions'),
  },
  {
    resource: 'workflows.instances',
    label: '流程实例',
    permissions: PERMISSIONS.filter(p => p.resource === 'workflows.instances'),
  },
  {
    resource: 'workflows.tasks',
    label: '流程任务',
    permissions: PERMISSIONS.filter(p => p.resource === 'workflows.tasks'),
  },
  {
    resource: 'forms.schemas',
    label: '动态表单',
    permissions: PERMISSIONS.filter(p => p.resource === 'forms.schemas'),
  },
  {
    resource: 'maintenance.resources',
    label: '维护资源',
    permissions: PERMISSIONS.filter(p => p.resource === 'maintenance.resources'),
  },
  {
    resource: 'maintenance.cache',
    label: '缓存维护',
    permissions: PERMISSIONS.filter(p => p.resource === 'maintenance.cache'),
  },
  {
    resource: 'maintenance.reference-data',
    label: '基础数据维护',
    permissions: PERMISSIONS.filter(p => p.resource === 'maintenance.reference-data'),
  },
  {
    resource: 'saas.plans',
    label: 'SaaS 套餐',
    permissions: PERMISSIONS.filter(p => p.resource === 'saas.plans'),
  },
  {
    resource: 'saas.quotas',
    label: 'SaaS 配额',
    permissions: PERMISSIONS.filter(p => p.resource === 'saas.quotas'),
  },
  {
    resource: 'saas.modules',
    label: 'SaaS 模块',
    permissions: PERMISSIONS.filter(p => p.resource === 'saas.modules'),
  },
];

// ==================== 角色定义 ====================
export const ROLES: Role[] = [
  {
    id: 'role_super_admin',
    name: '超级管理员',
    type: 'super_admin',
    description: '拥有所有权限，可跨租户操作',
    permissions: PERMISSIONS.map(p => p.id),
    isSystem: true,
    dataScopeType: 'ALL',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role_tenant_admin',
    name: '租户管理员',
    type: 'tenant_admin',
    description: '管理本租户所有资源',
    permissions: PERMISSIONS.map(p => p.id),
    isSystem: true,
    dataScopeType: 'ALL',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role_manager',
    name: '经理',
    type: 'manager',
    description: '管理项目和文件',
    permissions: [
      'projects.create',
      'projects.read',
      'projects.update',
      'projects.delete',
      'files.create',
      'files.read',
      'files.delete',
      'users.read',
      'positions.read',
      'user-groups.read',
      'settings.read',
    ],
    isSystem: true,
    dataScopeType: 'DEPT_AND_CHILDREN',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role_viewer',
    name: '查看者',
    type: 'viewer',
    description: '只读权限',
    permissions: ['projects.read', 'files.read', 'users.read', 'positions.read', 'user-groups.read', 'settings.read'],
    isSystem: true,
    dataScopeType: 'SELF',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role_custom_1',
    name: '项目专员',
    type: 'custom',
    description: '仅负责项目相关工作',
    permissions: ['projects.create', 'projects.read', 'projects.update'],
    tenantId: 'tenant_demo',
    isSystem: false,
    dataScopeType: 'CUSTOM',
    dataScopeDeptIds: ['dept_product'],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
];

// ==================== 租户数据 ====================
export const TENANTS: Tenant[] = [
  {
    id: 'tenant_demo',
    name: 'Demo 公司',
    plan: 'pro',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tenant_test',
    name: '测试团队',
    plan: 'free',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
];

// ==================== 用户数据 ====================
export const USERS: User[] = [
  {
    id: 'user_admin',
    email: 'admin@example.com',
    name: '管理员',
    phone: '10000000001',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user_manager',
    email: 'manager@example.com',
    name: '项目经理',
    phone: '10000000002',
    status: 'active',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 'user_viewer',
    email: 'viewer@example.com',
    name: '访客用户',
    phone: '10000000003',
    status: 'active',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'user_pending',
    email: 'pending@example.com',
    name: '待激活用户',
    status: 'pending',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'user_inactive',
    email: 'inactive@example.com',
    name: '已禁用用户',
    status: 'inactive',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-02-10T00:00:00Z',
  },
];

// 用户-租户-角色映射
export const USER_TENANT_ROLES: { id: string; userId: string; tenantId: string; roleId: string; joinedAt: string }[] = [
  { id: 'utr_1', userId: 'user_admin', tenantId: 'tenant_demo', roleId: 'role_tenant_admin', joinedAt: '2024-01-01T00:00:00Z' },
  { id: 'utr_2', userId: 'user_admin', tenantId: 'tenant_test', roleId: 'role_manager', joinedAt: '2024-01-15T00:00:00Z' },
  { id: 'utr_3', userId: 'user_manager', tenantId: 'tenant_demo', roleId: 'role_manager', joinedAt: '2024-01-05T00:00:00Z' },
  { id: 'utr_4', userId: 'user_viewer', tenantId: 'tenant_demo', roleId: 'role_viewer', joinedAt: '2024-01-10T00:00:00Z' },
  { id: 'utr_5', userId: 'user_pending', tenantId: 'tenant_demo', roleId: 'role_viewer', joinedAt: '2024-02-01T00:00:00Z' },
  { id: 'utr_6', userId: 'user_inactive', tenantId: 'tenant_demo', roleId: 'role_viewer', joinedAt: '2024-01-20T00:00:00Z' },
];

// Mock 密码（实际项目中不要这样做）
export const USER_PASSWORDS: { [email: string]: string } = {
  'admin@example.com': 'local-demo-admin',
  'manager@example.com': 'local-demo-manager',
  'viewer@example.com': 'local-demo-viewer',
};

// ==================== 项目数据 ====================
export const PROJECTS: Project[] = [
  {
    id: 'proj_1',
    name: '电商平台重构',
    description: '对现有电商平台进行技术架构升级和UI优化',
    status: 'active',
    ownerId: 'user_admin',
    ownerName: '管理员',
    tenantId: 'tenant_demo',
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    tags: ['重构', '电商', 'React'],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'proj_2',
    name: '移动端 App 开发',
    description: '开发 iOS 和 Android 客户端应用',
    status: 'active',
    ownerId: 'user_manager',
    ownerName: '项目经理',
    tenantId: 'tenant_demo',
    startDate: '2024-02-01',
    tags: ['移动端', 'React Native'],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
  {
    id: 'proj_3',
    name: '数据分析平台',
    description: '构建企业级数据分析和可视化平台',
    status: 'draft',
    ownerId: 'user_admin',
    ownerName: '管理员',
    tenantId: 'tenant_demo',
    startDate: '2024-03-01',
    tags: ['数据', '可视化', 'BI'],
    createdAt: '2024-02-20T00:00:00Z',
    updatedAt: '2024-02-20T00:00:00Z',
  },
  {
    id: 'proj_4',
    name: '客服系统优化',
    description: '升级客服工单系统，引入AI智能客服',
    status: 'archived',
    ownerId: 'user_manager',
    ownerName: '项目经理',
    tenantId: 'tenant_demo',
    startDate: '2023-06-01',
    endDate: '2023-12-31',
    tags: ['客服', 'AI'],
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
];

// ==================== 审计日志数据 ====================
export const AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    userId: 'user_admin',
    userName: '管理员',
    tenantId: 'tenant_demo',
    action: 'login',
    resource: 'auth',
    resourceId: 'user_admin',
    details: { method: 'password' },
    ipAddress: '203.0.113.10',
    userAgent: 'Mozilla/5.0',
    createdAt: '2024-01-20T10:30:00Z',
  },
  {
    id: 'log_2',
    userId: 'user_admin',
    userName: '管理员',
    tenantId: 'tenant_demo',
    action: 'create',
    resource: 'projects',
    resourceId: 'proj_1',
    details: { name: '电商平台重构' },
    ipAddress: '203.0.113.10',
    userAgent: 'Mozilla/5.0',
    createdAt: '2024-01-15T14:20:00Z',
  },
  {
    id: 'log_3',
    userId: 'user_manager',
    userName: '项目经理',
    tenantId: 'tenant_demo',
    action: 'update',
    resource: 'projects',
    resourceId: 'proj_2',
    details: { field: 'status', from: 'draft', to: 'active' },
    ipAddress: '203.0.113.11',
    userAgent: 'Mozilla/5.0',
    createdAt: '2024-02-05T09:15:00Z',
  },
];

// ==================== v0.5 系统管理演示数据 ====================
export const DEPT_TREE: DeptNode[] = [
  {
    id: 'dept_root',
    name: 'Demo 公司',
    parentId: null,
    sortOrder: 0,
    status: 'active',
    children: [
      {
        id: 'dept_product',
        name: '产品部',
        parentId: 'dept_root',
        sortOrder: 10,
        status: 'active',
      },
      {
        id: 'dept_operations',
        name: '运营部',
        parentId: 'dept_root',
        sortOrder: 20,
        status: 'active',
      },
      {
        id: 'dept_finance',
        name: '财务部',
        parentId: 'dept_root',
        sortOrder: 30,
        status: 'active',
      },
    ],
  },
];

export type DemoPosition = Position & { tenantId: string };

export const POSITIONS: DemoPosition[] = [
  {
    id: 'position_ceo',
    tenantId: 'tenant_demo',
    name: '总经理',
    code: 'CEO',
    deptId: 'dept_root',
    deptName: 'Demo 公司',
    description: '负责 Demo 公司整体经营管理',
    sortOrder: 0,
    status: 'active',
  },
  {
    id: 'position_pm',
    tenantId: 'tenant_demo',
    name: '产品经理',
    code: 'PM',
    deptId: 'dept_product',
    deptName: '产品部',
    description: '负责产品规划和需求协同',
    sortOrder: 10,
    status: 'active',
  },
  {
    id: 'position_ops',
    tenantId: 'tenant_demo',
    name: '运营专员',
    code: 'OPS',
    deptId: 'dept_operations',
    deptName: '运营部',
    description: '负责客户运营和日常协作',
    sortOrder: 20,
    status: 'active',
  },
];

export type DemoUserGroup = UserGroup & { tenantId: string };

export const USER_GROUPS: DemoUserGroup[] = [
  {
    id: 'group_ops',
    tenantId: 'tenant_demo',
    name: '运营小组',
    code: 'OPS',
    description: '负责日常运营协作',
    status: 'active',
    memberCount: 2,
  },
  {
    id: 'group_product',
    tenantId: 'tenant_demo',
    name: '产品小组',
    code: 'PRODUCT',
    description: '负责产品规划和需求评审',
    status: 'active',
    memberCount: 2,
  },
];

export const USER_GROUP_MEMBERS: Record<string, string[]> = {
  group_ops: ['user_admin', 'user_manager'],
  group_product: ['user_admin', 'user_viewer'],
};

// ==================== v1.5 任务调度演示数据 ====================
export const SCHEDULER_JOBS: SchedulerJob[] = [
  {
    id: 'job_billing_sync',
    name: '账单同步',
    status: 'enabled',
    triggerType: 'cron',
    triggerExpression: '0 */15 * * * ?',
    ownerName: '运营团队',
    lastResult: 'success',
    lastRunAt: '2026-06-14T08:00:00Z',
    nextRunAt: '2026-06-14T08:15:00Z',
    alertEnabled: true,
  },
  {
    id: 'job_audit_archive',
    name: '审计归档',
    status: 'paused',
    triggerType: 'cron',
    triggerExpression: '0 0 2 * * ?',
    ownerName: '平台管理员',
    lastResult: 'failed',
    lastRunAt: '2026-06-14T02:00:00Z',
    nextRunAt: null,
    alertEnabled: true,
  },
];

export const SCHEDULER_EXECUTIONS: SchedulerExecution[] = [
  {
    id: 'exec_billing_sync_001',
    jobId: 'job_billing_sync',
    jobName: '账单同步',
    status: 'success',
    startedAt: '2026-06-14T08:00:00Z',
    finishedAt: '2026-06-14T08:00:18Z',
    durationMs: 18000,
    traceId: 'trace-scheduler-demo-001',
    retryable: false,
  },
  {
    id: 'exec_audit_archive_001',
    jobId: 'job_audit_archive',
    jobName: '审计归档',
    status: 'failed',
    startedAt: '2026-06-14T02:00:00Z',
    finishedAt: '2026-06-14T02:01:00Z',
    durationMs: 60000,
    traceId: 'trace-scheduler-demo-002',
    errorSummary: '外部归档 API 超时',
    retryable: true,
  },
];

// ==================== v1.5 监控告警演示数据 ====================
export const MONITORING_HEALTH: MonitoringHealthSummary = {
  overallStatus: 'degraded',
  generatedAt: '2026-06-14T09:00:00Z',
  services: [
    {
      id: 'api-gateway',
      name: 'API 网关',
      status: 'healthy',
      latencyMs: 32,
      errorRate: 0.01,
      traceId: 'trace-health-api',
    },
    {
      id: 'file-service',
      name: '文件服务',
      status: 'degraded',
      latencyMs: 380,
      errorRate: 0.03,
      traceId: 'trace-health-file',
    },
  ],
  latency: [
    { path: '/api/users', p95Ms: 120, avgMs: 48, samples: 260 },
    { path: '/api/files/upload', p95Ms: 420, avgMs: 180, samples: 52 },
  ],
  errorRates: [
    { path: '/api/files/upload', rate: 0.03, count: 3, window: '5m' },
    { path: '/api/scheduler/jobs', rate: 0.01, count: 1, window: '5m' },
  ],
};

export const MONITORING_ALERTS: MonitoringAlert[] = [
  {
    id: 'alert_1',
    title: '错误率升高',
    severity: 'critical',
    status: 'open',
    source: 'api-gateway',
    triggeredAt: '2026-06-14T09:00:00Z',
    traceId: 'trace-alert-1',
    description: 'Demo 样例：外部 API 聚合后的错误率告警。',
  },
  {
    id: 'alert_2',
    title: '文件服务延迟升高',
    severity: 'warning',
    status: 'acknowledged',
    source: 'file-service',
    triggeredAt: '2026-06-14T08:45:00Z',
    traceId: 'trace-alert-2',
  },
];

// ==================== v1.5 工作流与动态表单演示数据 ====================
export const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  {
    id: 'wf_leave',
    name: '请假审批',
    status: 'active',
    version: 1,
    description: 'Demo 样例：外部工作流引擎提供流程执行。',
  },
];

export const WORKFLOW_INSTANCES: WorkflowInstance[] = [
  {
    id: 'inst_1',
    definitionId: 'wf_leave',
    title: '年假申请',
    status: 'running',
    currentNodeName: '部门审批',
    traceId: 'trace-workflow-demo-1',
  },
];

export const DYNAMIC_FORM_SCHEMAS: DynamicFormSchema[] = [
  {
    id: 'form_leave',
    name: '请假表单',
    version: 1,
    status: 'active',
    fields: [
      { key: 'reason', label: '请假原因', type: 'textarea', required: true },
      { key: 'days', label: '请假天数', type: 'number', required: true },
      { key: 'handoverUser', label: '工作交接人', type: 'user-picker' },
    ],
  },
];

// ==================== v1.5 数据维护与 SaaS 演示数据 ====================
export const MAINTENANCE_RESOURCES: MaintenanceResource[] = [
  {
    id: 'cache_menu_tree',
    name: '菜单树缓存',
    type: 'cache',
    status: 'healthy',
    scope: 'tenant',
    updatedAt: '2026-06-14T08:00:00Z',
    ownerName: '平台管理员',
    auditRequired: true,
    allowedOperations: ['refresh', 'clear'],
    description: '仅允许清理预注册的菜单树缓存，不支持任意 key 删除。',
  },
  {
    id: 'ref_region_cn',
    name: '地区基础数据',
    type: 'reference-data',
    status: 'stale',
    scope: 'global',
    updatedAt: '2026-06-13T08:00:00Z',
    ownerName: '数据治理',
    auditRequired: true,
    allowedOperations: ['sync'],
    description: '地区字典由外部 API 校验来源、版本和同步窗口。',
  },
  {
    id: 'ref_industry_catalog',
    name: '行业分类',
    type: 'industry',
    status: 'healthy',
    scope: 'global',
    updatedAt: '2026-06-12T08:00:00Z',
    ownerName: '运营团队',
    auditRequired: true,
    allowedOperations: ['sync'],
  },
];

export const SAAS_QUOTA_USAGE: SaasQuotaUsage[] = [
  { key: 'members', label: '成员数', used: 8, limit: 50, unit: '人', enforcedBy: 'external-api' },
  { key: 'storage', label: '存储空间', used: 18, limit: 200, unit: 'GB', enforcedBy: 'external-api' },
  { key: 'workflowInstances', label: '流程实例', used: 36, limit: 1000, unit: '个', enforcedBy: 'external-api' },
];

export const SAAS_PLANS: SaasPlan[] = [
  {
    id: 'free',
    name: '免费版',
    tier: 'free',
    priceLabel: '免费',
    auditRetentionDays: 30,
    quotas: SAAS_QUOTA_USAGE.slice(0, 1),
    moduleCodes: ['projects', 'files'],
  },
  {
    id: 'pro',
    name: '专业版',
    tier: 'pro',
    priceLabel: '按月订阅',
    auditRetentionDays: 180,
    quotas: SAAS_QUOTA_USAGE.slice(0, 2),
    moduleCodes: ['projects', 'files', 'scheduler'],
  },
  {
    id: 'enterprise',
    name: '企业版',
    tier: 'enterprise',
    priceLabel: '联系销售',
    auditRetentionDays: 365,
    quotas: SAAS_QUOTA_USAGE,
    moduleCodes: ['projects', 'files', 'scheduler', 'monitoring', 'workflows'],
  },
];

// ==================== 菜单配置 ====================
export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: '仪表盘',
    icon: 'LayoutDashboard',
    path: '/',
  },
  {
    id: 'projects',
    label: '项目管理',
    icon: 'FolderKanban',
    path: '/projects',
    permission: 'projects.read',
  },
  {
    id: 'users',
    label: '用户管理',
    icon: 'Users',
    path: '/users',
    permission: 'users.read',
  },
  {
    id: 'roles',
    label: '角色权限',
    icon: 'Shield',
    path: '/roles',
    permission: 'roles.read',
  },
  {
    id: 'files',
    label: '文件中心',
    icon: 'Files',
    path: '/files',
    permission: 'files.read',
  },
  {
    id: 'audit',
    label: '审计日志',
    icon: 'ScrollText',
    path: '/audit-logs',
    permission: 'audit.read',
  },
  {
    id: 'login-logs',
    label: '登录日志',
    icon: 'LogIn',
    path: '/login-logs',
    permission: 'audit.read',
  },
  {
    id: 'depts',
    label: '组织管理',
    icon: 'Network',
    path: '/depts',
    permission: 'settings.update',
  },
  {
    id: 'positions',
    label: '岗位管理',
    icon: 'Briefcase',
    path: '/positions',
    permission: 'positions.read',
  },
  {
    id: 'user-groups',
    label: '用户组管理',
    icon: 'UsersRound',
    path: '/user-groups',
    permission: 'user-groups.read',
  },
  {
    id: 'data-screen',
    label: '数据大屏',
    icon: 'BarChart3',
    path: '/data-screen',
  },
  {
    id: 'messages',
    label: '消息中心',
    icon: 'MessageSquare',
    path: '/messages',
  },
  {
    id: 'scheduler',
    label: '任务调度',
    icon: 'Monitor',
    children: [
      { id: 'scheduler-jobs', label: '任务定义', icon: 'ToggleRight', path: '/scheduler/jobs', permission: 'scheduler.jobs.read' },
      { id: 'scheduler-executions', label: '执行日志', icon: 'ScrollText', path: '/scheduler/executions', permission: 'scheduler.executions.read' },
    ],
  },
  {
    id: 'monitoring',
    label: '监控告警',
    icon: 'BarChart3',
    children: [
      { id: 'monitoring-health', label: '健康状态', icon: 'Monitor', path: '/monitoring/health', permission: 'monitoring.health.read' },
      { id: 'monitoring-alerts', label: '告警历史', icon: 'Bell', path: '/monitoring/alerts', permission: 'monitoring.alerts.read' },
    ],
  },
  {
    id: 'developer',
    label: '开发者工具',
    icon: 'BookOpen',
    children: [
      { id: 'developer-openapi', label: 'OpenAPI 辅助', icon: 'BookOpen', path: '/developer/openapi', permission: 'developer.openapi.read' },
      { id: 'modules', label: '模块清单', icon: 'SlidersHorizontal', path: '/modules', permission: 'modules.read' },
    ],
  },
  {
    id: 'workflow-forms',
    label: '流程表单',
    icon: 'ScrollText',
    children: [
      { id: 'workflows', label: '工作流模板', icon: 'ScrollText', path: '/workflows', permission: 'workflows.definitions.read' },
      { id: 'dynamic-forms', label: '动态表单', icon: 'BookOpen', path: '/dynamic-forms', permission: 'forms.schemas.read' },
    ],
  },
  {
    id: 'maintenance-saas',
    label: '维护与套餐',
    icon: 'SlidersHorizontal',
    children: [
      { id: 'maintenance-cache', label: '缓存管理', icon: 'SlidersHorizontal', path: '/maintenance/cache', permission: 'maintenance.resources.read' },
      { id: 'saas-plans', label: '套餐与配额', icon: 'ToggleRight', path: '/saas/plans', permission: 'saas.plans.read' },
    ],
  },
  {
    id: 'settings',
    label: '系统设置',
    icon: 'Settings',
    children: [
      { id: 'settings-profile', label: '个人资料', icon: 'User', path: '/settings/profile' },
      { id: 'settings-tenant', label: '租户设置', icon: 'Building2', path: '/settings/tenant', permission: 'tenant.manage' },
      { id: 'settings-notifications', label: '通知偏好', icon: 'Bell', path: '/settings/notifications' },
      { id: 'settings-security', label: '安全设置', icon: 'ShieldCheck', path: '/settings/security' },
      { id: 'settings-sessions', label: '会话管理', icon: 'Monitor', path: '/settings/sessions' },
      { id: 'settings-features', label: '功能开关', icon: 'ToggleRight', path: '/settings/features', permission: 'settings.update' },
    ],
  },
  {
    id: 'system-config',
    label: '系统配置',
    icon: 'SlidersHorizontal',
    children: [
      { id: 'menus', label: '菜单管理', icon: 'Menu', path: '/menus', permission: 'settings.update' },
      { id: 'dicts', label: '字典管理', icon: 'BookOpen', path: '/dicts', permission: 'settings.update' },
      { id: 'configs', label: '参数配置', icon: 'SlidersHorizontal', path: '/configs', permission: 'settings.update' },
    ],
  },
];
