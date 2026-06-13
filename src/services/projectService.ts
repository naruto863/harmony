import { Project } from '@/types';
import { demoStorageKey, requireDemoMode } from '@/lib/demoMode';

const PROJECTS_KEY = demoStorageKey('projects');

// 初始化默认数据
const DEFAULT_PROJECTS: Project[] = [
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
  {
    id: 'proj_5',
    name: 'CRM 系统升级',
    description: '升级现有 CRM 系统，增加自动化营销功能',
    status: 'active',
    ownerId: 'user_admin',
    ownerName: '管理员',
    tenantId: 'tenant_demo',
    startDate: '2024-01-10',
    tags: ['CRM', '营销', '自动化'],
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-25T00:00:00Z',
  },
  {
    id: 'proj_6',
    name: '内部知识库',
    description: '搭建企业内部知识管理和分享平台',
    status: 'draft',
    ownerId: 'user_manager',
    ownerName: '项目经理',
    tenantId: 'tenant_demo',
    startDate: '2024-04-01',
    tags: ['知识管理', '协作'],
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
];

// 获取项目列表
export const getProjects = (tenantId: string): Project[] => {
  requireDemoMode('projectService');
  const stored = localStorage.getItem(PROJECTS_KEY);
  if (stored) {
    const all: Project[] = JSON.parse(stored);
    return all.filter(p => p.tenantId === tenantId);
  }
  // 初始化默认数据
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(DEFAULT_PROJECTS));
  return DEFAULT_PROJECTS.filter(p => p.tenantId === tenantId);
};

// 获取单个项目
export const getProject = (id: string): Project | null => {
  requireDemoMode('projectService');
  const stored = localStorage.getItem(PROJECTS_KEY);
  if (stored) {
    const all: Project[] = JSON.parse(stored);
    return all.find(p => p.id === id) || null;
  }
  return DEFAULT_PROJECTS.find(p => p.id === id) || null;
};

// 创建项目
export const createProject = (
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Project => {
  requireDemoMode('projectService');
  const stored = localStorage.getItem(PROJECTS_KEY);
  const all: Project[] = stored ? JSON.parse(stored) : [...DEFAULT_PROJECTS];
  
  const newProject: Project = {
    ...project,
    id: `proj_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  all.push(newProject);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(all));
  
  return newProject;
};

// 更新项目
export const updateProject = (
  id: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt'>>
): Project | null => {
  requireDemoMode('projectService');
  const stored = localStorage.getItem(PROJECTS_KEY);
  if (!stored) return null;
  
  const all: Project[] = JSON.parse(stored);
  const index = all.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  all[index] = {
    ...all[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(all));
  return all[index];
};

// 删除项目
export const deleteProject = (id: string): boolean => {
  requireDemoMode('projectService');
  const stored = localStorage.getItem(PROJECTS_KEY);
  if (!stored) return false;
  
  const all: Project[] = JSON.parse(stored);
  const filtered = all.filter(p => p.id !== id);
  
  if (filtered.length === all.length) return false;
  
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
  return true;
};

// 批量删除项目
export const deleteProjects = (ids: string[]): number => {
  requireDemoMode('projectService');
  const stored = localStorage.getItem(PROJECTS_KEY);
  if (!stored) return 0;
  
  const all: Project[] = JSON.parse(stored);
  const idSet = new Set(ids);
  const filtered = all.filter(p => !idSet.has(p.id));
  const deletedCount = all.length - filtered.length;
  
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
  return deletedCount;
};

// 批量更新状态
export const updateProjectsStatus = (
  ids: string[],
  status: Project['status']
): number => {
  requireDemoMode('projectService');
  const stored = localStorage.getItem(PROJECTS_KEY);
  if (!stored) return 0;
  
  const all: Project[] = JSON.parse(stored);
  const idSet = new Set(ids);
  let updatedCount = 0;
  
  const updated = all.map(p => {
    if (idSet.has(p.id)) {
      updatedCount++;
      return { ...p, status, updatedAt: new Date().toISOString() };
    }
    return p;
  });
  
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
  return updatedCount;
};
