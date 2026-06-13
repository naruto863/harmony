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
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role_tenant_admin',
    name: '租户管理员',
    type: 'tenant_admin',
    description: '管理本租户所有资源',
    permissions: PERMISSIONS.filter(p => p.resource !== 'tenant').map(p => p.id),
    isSystem: true,
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
