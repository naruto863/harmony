import { isDemoModeEnabled } from "@/lib/demoMode";
import {
  DEPT_TREE,
  MENU_ITEMS,
  PERMISSION_GROUPS,
  PERMISSIONS,
  POSITIONS,
  ROLES,
  TENANTS,
  USERS,
  USER_GROUP_MEMBERS,
  USER_GROUPS,
  USER_PASSWORDS,
  USER_TENANT_ROLES,
  type DemoPosition,
  type DemoUserGroup,
} from "@/data/mock-data";
import type { LoginResponse } from "./authService";
import type { SwitchTenantResponse, TenantDto } from "./tenantService";
import type { DeptNode, MenuItem, Permission, PermissionGroup, Position, Role, User, UserGroup } from "@/types";

const DEMO_USER_ID_KEY = "ha_demo:auth_user_id";
const DEMO_TENANT_ID_KEY = "ha_demo:tenant_id";
const TENANT_KEY = "admin_studio_tenant";
const DEMO_DEPTS_KEY = "ha_demo:depts";
const DEMO_POSITIONS_KEY = "ha_demo:positions";
const DEMO_USER_GROUPS_KEY = "ha_demo:user_groups";
const DEMO_USER_GROUP_MEMBERS_KEY = "ha_demo:user_group_members";

/**
 * localStorage 在测试、SSR-like 环境或浏览器隐私模式下都可能不可用。
 * Demo API 统一通过这个入口访问，调用方拿到 null 时回退到内存种子数据。
 */
const getStorage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * 读取可变演示数据。
 * 首次读取时把 mock-data 的种子写入 localStorage，让后续 CRUD 能表现得像真实后端状态。
 * JSON 损坏时用种子数据自愈，避免演示页面因为手工改坏存储而白屏。
 */
const readDemoJson = <T>(key: string, fallback: T): T => {
  const storage = getStorage();
  if (!storage) return clone(fallback);
  const stored = storage.getItem(key);
  if (!stored) {
    const seeded = clone(fallback);
    storage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(stored) as T;
  } catch {
    const seeded = clone(fallback);
    storage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }
};

const writeDemoJson = <T>(key: string, value: T): void => {
  const storage = getStorage();
  storage?.setItem(key, JSON.stringify(value));
};

/**
 * Demo token 只用于驱动前端鉴权流程，不具备真实安全含义。
 * token 中包含 userId、tenantId 和签发时间，便于调试当前演示会话归属。
 */
const buildDemoTokens = (userId: string, tenantId?: string) => {
  const issuedAt = Date.now();
  const tenantPart = tenantId ?? "none";
  return {
    accessToken: `demo-access-${userId}-${tenantPart}-${issuedAt}`,
    refreshToken: `demo-refresh-${userId}-${tenantPart}-${issuedAt}`,
  };
};

const toTenantDto = (tenant: (typeof TENANTS)[number]): TenantDto => ({
  id: tenant.id,
  name: tenant.name,
  plan: tenant.plan,
  status: "active",
  createdAt: tenant.createdAt,
  updatedAt: tenant.updatedAt,
});

/**
 * 同步写入 ha_demo:* 和历史 tenant key。
 * 这样新 Demo API 与既有 TenantContext/localStorage 恢复逻辑可以同时工作。
 */
const setDemoSession = (userId: string, tenantId?: string) => {
  const storage = getStorage();
  storage?.setItem(DEMO_USER_ID_KEY, userId);
  if (tenantId) {
    storage?.setItem(DEMO_TENANT_ID_KEY, tenantId);
    storage?.setItem(TENANT_KEY, tenantId);
  }
};

/**
 * 优先读取 Demo 专用 userId；没有时兼容 AuthContext 持久化的 admin_studio_user。
 * 兼容逻辑保证从老登录态刷新页面时，Demo 服务仍能恢复当前用户。
 */
const getStoredUserId = (): string | null => {
  const storage = getStorage();
  if (!storage) return null;
  const demoUserId = storage.getItem(DEMO_USER_ID_KEY);
  if (demoUserId) return demoUserId;
  const storedUser = storage.getItem("admin_studio_user");
  if (!storedUser) return null;
  try {
    return (JSON.parse(storedUser) as Partial<User>).id ?? null;
  } catch {
    return null;
  }
};

const getStoredTenantId = (): string | null => {
  const storage = getStorage();
  if (!storage) return null;
  return storage.getItem(DEMO_TENANT_ID_KEY) ?? storage.getItem(TENANT_KEY);
};

/**
 * Demo API 的认证边界。
 * 任何需要用户身份的演示接口都先通过这里确认当前会话仍能映射到 mock 用户。
 */
const getCurrentUser = (): User => {
  const userId = getStoredUserId();
  const user = USERS.find((item) => item.id === userId);
  if (!user) {
    throw new Error("演示登录已过期，请重新登录");
  }
  return user;
};

const getTenantsForUser = (userId: string): TenantDto[] => {
  const tenantIds = new Set(USER_TENANT_ROLES.filter((item) => item.userId === userId).map((item) => item.tenantId));
  return TENANTS.filter((tenant) => tenantIds.has(tenant.id)).map(toTenantDto);
};

/**
 * Demo 租户解析同时承担授权校验：
 * 请求的 tenantId 必须在该用户的租户关系表中，否则抛出无权访问错误。
 */
const getCurrentTenant = (userId: string, requestedTenantId?: string): TenantDto => {
  const tenants = getTenantsForUser(userId);
  const tenantId = requestedTenantId ?? getStoredTenantId() ?? tenants[0]?.id;
  const tenant = tenants.find((item) => item.id === tenantId);
  if (!tenant) {
    throw new Error("当前演示账号无权访问该工作空间");
  }
  return tenant;
};

const getRoleForUser = (userId: string, tenantId: string): Role | null => {
  const relation = USER_TENANT_ROLES.find((item) => item.userId === userId && item.tenantId === tenantId);
  if (!relation) return null;
  return ROLES.find((role) => role.id === relation.roleId) ?? null;
};

const flattenDepts = (items: DeptNode[]): DeptNode[] =>
  items.flatMap((item) => [item, ...(item.children ? flattenDepts(item.children) : [])]);

const getDeptName = (deptId?: string | null): string | null => {
  if (!deptId) return null;
  return flattenDepts(readDemoJson(DEMO_DEPTS_KEY, DEPT_TREE)).find((dept) => dept.id === deptId)?.name ?? null;
};

const readPositions = (): DemoPosition[] => readDemoJson(DEMO_POSITIONS_KEY, POSITIONS);

const writePositions = (positions: DemoPosition[]): void => writeDemoJson(DEMO_POSITIONS_KEY, positions);

const readUserGroups = (): DemoUserGroup[] => readDemoJson(DEMO_USER_GROUPS_KEY, USER_GROUPS);

const writeUserGroups = (groups: DemoUserGroup[]): void => writeDemoJson(DEMO_USER_GROUPS_KEY, groups);

const readUserGroupMembers = (): Record<string, string[]> =>
  readDemoJson(DEMO_USER_GROUP_MEMBERS_KEY, USER_GROUP_MEMBERS);

const writeUserGroupMembers = (members: Record<string, string[]>): void =>
  writeDemoJson(DEMO_USER_GROUP_MEMBERS_KEY, members);

/**
 * mock-data 中的 DemoUserGroup 保留 tenantId 用于过滤；
 * 对页面暴露时移除内部 tenantId，并根据成员关系动态计算 memberCount。
 */
const withMemberCount = (group: DemoUserGroup, members = readUserGroupMembers()): UserGroup => {
  const { tenantId: _tenantId, ...publicGroup } = group;
  return {
    ...publicGroup,
    memberCount: members[group.id]?.length ?? 0,
  };
};

export const isDemoApiEnabled = (): boolean => isDemoModeEnabled();

/**
 * 演示登录尽量模拟真实登录的关键约束：
 * 校验账号密码、账号状态、可访问租户，并返回 token + user + tenants。
 * 页面和 Context 不需要知道当前走的是 Demo API 还是真实 API。
 */
export const demoLogin = async (email: string, password: string, tenantId?: string): Promise<LoginResponse> => {
  const user = USERS.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user || USER_PASSWORDS[user.email] !== password) {
    throw new Error("邮箱或密码错误");
  }
  if (user.status !== "active") {
    throw new Error("账号不可用，请切换其他演示账号");
  }

  const tenants = getTenantsForUser(user.id);
  if (tenants.length === 0) {
    throw new Error("当前演示账号未分配工作空间");
  }
  const currentTenant = getCurrentTenant(user.id, tenantId);
  setDemoSession(user.id, currentTenant.id);
  const tokens = buildDemoTokens(user.id, currentTenant.id);

  return {
    ...tokens,
    user,
    tenants,
    passwordChangeRequired: false,
  };
};

export const demoRegister = async (): Promise<void> => {
  throw new Error("演示模式不开放注册，请使用页面中的演示账号登录");
};

export const demoRefreshToken = async (): Promise<{ accessToken: string; refreshToken: string }> => {
  const user = getCurrentUser();
  const tenant = getCurrentTenant(user.id);
  const tokens = buildDemoTokens(user.id, tenant.id);
  setDemoSession(user.id, tenant.id);
  return tokens;
};

export const demoLogout = async (): Promise<void> => {
  const storage = getStorage();
  storage?.removeItem(DEMO_USER_ID_KEY);
  storage?.removeItem(DEMO_TENANT_ID_KEY);
};

export const demoGetMyTenants = async (): Promise<TenantDto[]> => {
  const user = getCurrentUser();
  return getTenantsForUser(user.id);
};

export const demoSwitchTenant = async (tenantId: string): Promise<SwitchTenantResponse> => {
  const user = getCurrentUser();
  const tenant = getCurrentTenant(user.id, tenantId);
  setDemoSession(user.id, tenant.id);
  return {
    ...buildDemoTokens(user.id, tenant.id),
    tenant,
  };
};

export const demoGetMyRole = async (): Promise<Role | null> => {
  const user = getCurrentUser();
  const tenant = getCurrentTenant(user.id);
  return getRoleForUser(user.id, tenant.id);
};

export const demoGetMyPermissions = async (): Promise<string[]> => {
  const role = await demoGetMyRole();
  return role?.permissions ?? [];
};

export const demoGetRoles = async (): Promise<Role[]> => ROLES;

export const demoGetAllPermissions = async (): Promise<Permission[]> => PERMISSIONS;

export const demoGetPermissionGroups = async (): Promise<PermissionGroup[]> => PERMISSION_GROUPS;

export const demoGetMenuTree = async (): Promise<MenuItem[]> => MENU_ITEMS;

export const demoGetDeptTree = async (): Promise<DeptNode[]> => readDemoJson(DEMO_DEPTS_KEY, DEPT_TREE);

export const demoGetUsers = async (params: {
  tenantId: string;
  search?: string;
  status?: string;
  roleId?: string;
}): Promise<Array<User & { roleId?: string; roleName?: string; joinedAt?: string; deptId?: string; deptName?: string }>> => {
  // 用户列表来自用户-租户-角色关系表，而不是直接返回全量 USERS，确保租户隔离语义与真实接口一致。
  const relations = USER_TENANT_ROLES.filter((relation) => relation.tenantId === params.tenantId);
  const users = relations.flatMap((relation) => {
    const user = USERS.find((item) => item.id === relation.userId);
    if (!user) return [];
    const role = ROLES.find((item) => item.id === relation.roleId);
    return [{
      ...user,
      roleId: relation.roleId,
      roleName: role?.name,
      joinedAt: relation.joinedAt,
    }];
  });

  return users.filter((user) => {
    const matchesSearch = !params.search || [user.name, user.email, user.phone]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(params.search!.toLowerCase()));
    const matchesStatus = !params.status || user.status === params.status;
    const matchesRole = !params.roleId || user.roleId === params.roleId;
    return matchesSearch && matchesStatus && matchesRole;
  });
};

export const demoGetPositions = async (tenantId?: string): Promise<Position[]> => {
  return readPositions()
    .filter((position) => !tenantId || position.tenantId === tenantId)
    .map(({ tenantId: _tenantId, ...position }) => position);
};

export const demoCreatePosition = async (data: {
  name: string;
  code: string;
  deptId?: string | null;
  description?: string;
  sortOrder?: number;
  status?: string;
  tenantId?: string;
}): Promise<Position> => {
  const positions = readPositions();
  const newPosition: DemoPosition = {
    id: `position_${Date.now()}`,
    tenantId: data.tenantId ?? getStoredTenantId() ?? "tenant_demo",
    name: data.name,
    code: data.code,
    deptId: data.deptId ?? null,
    deptName: getDeptName(data.deptId),
    description: data.description,
    sortOrder: data.sortOrder ?? positions.length * 10,
    status: data.status ?? "active",
  };
  writePositions([...positions, newPosition]);
  const { tenantId: _tenantId, ...position } = newPosition;
  return position;
};

export const demoUpdatePosition = async (
  positionId: string,
  data: {
    name?: string;
    code?: string;
    deptId?: string | null;
    description?: string;
    sortOrder?: number;
    status?: string;
  }
): Promise<Position> => {
  const positions = readPositions();
  const index = positions.findIndex((position) => position.id === positionId);
  if (index === -1) {
    throw new Error("演示岗位不存在");
  }
  const nextPosition: DemoPosition = {
    ...positions[index],
    ...data,
    deptId: data.deptId === undefined ? positions[index].deptId : data.deptId,
    deptName: data.deptId === undefined ? positions[index].deptName : getDeptName(data.deptId),
  };
  const nextPositions = [...positions];
  nextPositions[index] = nextPosition;
  writePositions(nextPositions);
  const { tenantId: _tenantId, ...position } = nextPosition;
  return position;
};

export const demoDeletePosition = async (positionId: string): Promise<void> => {
  const positions = readPositions();
  const nextPositions = positions.filter((position) => position.id !== positionId);
  if (nextPositions.length === positions.length) {
    throw new Error("演示岗位不存在");
  }
  writePositions(nextPositions);
};

export const demoGetUserGroups = async (tenantId?: string): Promise<UserGroup[]> => {
  const members = readUserGroupMembers();
  return readUserGroups()
    .filter((group) => !tenantId || group.tenantId === tenantId)
    .map((group) => withMemberCount(group, members));
};

export const demoCreateUserGroup = async (data: {
  name: string;
  code: string;
  description?: string;
  status?: string;
  tenantId?: string;
}): Promise<UserGroup> => {
  const groups = readUserGroups();
  const newGroup: DemoUserGroup = {
    id: `group_${Date.now()}`,
    tenantId: data.tenantId ?? getStoredTenantId() ?? "tenant_demo",
    name: data.name,
    code: data.code,
    description: data.description,
    status: data.status ?? "active",
    memberCount: 0,
  };
  writeUserGroups([...groups, newGroup]);
  const members = readUserGroupMembers();
  writeUserGroupMembers({ ...members, [newGroup.id]: [] });
  return withMemberCount(newGroup, members);
};

export const demoUpdateUserGroup = async (
  groupId: string,
  data: { name?: string; code?: string; description?: string; status?: string }
): Promise<UserGroup> => {
  const groups = readUserGroups();
  const index = groups.findIndex((group) => group.id === groupId);
  if (index === -1) {
    throw new Error("演示用户组不存在");
  }
  const nextGroup: DemoUserGroup = {
    ...groups[index],
    ...data,
  };
  const nextGroups = [...groups];
  nextGroups[index] = nextGroup;
  writeUserGroups(nextGroups);
  return withMemberCount(nextGroup);
};

export const demoDeleteUserGroup = async (groupId: string): Promise<void> => {
  const groups = readUserGroups();
  const nextGroups = groups.filter((group) => group.id !== groupId);
  if (nextGroups.length === groups.length) {
    throw new Error("演示用户组不存在");
  }
  writeUserGroups(nextGroups);
  const members = readUserGroupMembers();
  const { [groupId]: _removed, ...nextMembers } = members;
  writeUserGroupMembers(nextMembers);
};

export const demoGetUserGroupMembers = async (groupId: string): Promise<string[]> => {
  return readUserGroupMembers()[groupId] ?? [];
};

export const demoUpdateUserGroupMembers = async (groupId: string, userIds: string[]): Promise<void> => {
  const groupExists = readUserGroups().some((group) => group.id === groupId);
  if (!groupExists) {
    throw new Error("演示用户组不存在");
  }
  const allowedUserIds = new Set(USERS.map((user) => user.id));
  // 写入成员前做白名单和去重，避免 UI 传入不存在用户或重复 id 后污染演示状态。
  const nextUserIds = userIds.filter((userId, index) => allowedUserIds.has(userId) && userIds.indexOf(userId) === index);
  writeUserGroupMembers({
    ...readUserGroupMembers(),
    [groupId]: nextUserIds,
  });
};
