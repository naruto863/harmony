import { User, Project, AuditLog } from '@/types';
import { USERS, PROJECTS, AUDIT_LOGS } from '@/data/mock-data';
import { FileItem, getFiles } from '@/services/fileService';

export type SearchResultType = 'user' | 'project' | 'file' | 'log';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  icon: string;
  url: string;
  data: User | Project | FileItem | AuditLog;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

// 搜索所有模块
export const globalSearch = async (
  query: string,
  tenantId: string,
  options?: {
    types?: SearchResultType[];
    limit?: number;
  }
): Promise<SearchResponse> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const searchQuery = query.toLowerCase().trim();
  if (!searchQuery) {
    return { results: [], total: 0 };
  }

  const limit = options?.limit || 20;
  const types = options?.types || ['user', 'project', 'file', 'log'];
  const results: SearchResult[] = [];

  // 搜索用户
  if (types.includes('user')) {
    const userResults = USERS
      .filter(user => 
        user.name.toLowerCase().includes(searchQuery) ||
        user.email.toLowerCase().includes(searchQuery) ||
        user.phone?.includes(searchQuery)
      )
      .slice(0, 5)
      .map(user => ({
        id: user.id,
        type: 'user' as SearchResultType,
        title: user.name,
        subtitle: user.email,
        icon: 'User',
        url: '/users',
        data: user,
      }));
    results.push(...userResults);
  }

  // 搜索项目
  if (types.includes('project')) {
    const projectResults = PROJECTS
      .filter(project => 
        project.tenantId === tenantId &&
        (project.name.toLowerCase().includes(searchQuery) ||
         project.description?.toLowerCase().includes(searchQuery) ||
         project.tags?.some(tag => tag.toLowerCase().includes(searchQuery)))
      )
      .slice(0, 5)
      .map(project => ({
        id: project.id,
        type: 'project' as SearchResultType,
        title: project.name,
        subtitle: project.description || '',
        icon: 'FolderKanban',
        url: '/projects',
        data: project,
      }));
    results.push(...projectResults);
  }

  // 搜索文件
  if (types.includes('file')) {
    const filesResponse = await getFiles({ tenantId });
    const allFiles = filesResponse.data || [];
    const fileResults = allFiles
      .filter(file => 
        file.name.toLowerCase().includes(searchQuery)
      )
      .slice(0, 5)
      .map(file => ({
        id: file.id,
        type: 'file' as SearchResultType,
        title: file.name,
        subtitle: file.type === 'folder' ? '文件夹' : `${file.size} bytes`,
        icon: file.type === 'folder' ? 'Folder' : 'File',
        url: '/files',
        data: file,
      }));
    results.push(...fileResults);
  }

  // 搜索审计日志
  if (types.includes('log')) {
    const logResults = AUDIT_LOGS
      .filter(log => 
        log.tenantId === tenantId &&
        (log.userName.toLowerCase().includes(searchQuery) ||
         log.action.toLowerCase().includes(searchQuery) ||
         log.resource.toLowerCase().includes(searchQuery))
      )
      .slice(0, 5)
      .map(log => ({
        id: log.id,
        type: 'log' as SearchResultType,
        title: `${log.userName} ${log.action} ${log.resource}`,
        subtitle: new Date(log.createdAt).toLocaleString('zh-CN'),
        icon: 'ScrollText',
        url: '/audit-logs',
        data: log,
      }));
    results.push(...logResults);
  }

  return {
    results: results.slice(0, limit),
    total: results.length,
  };
};

// 获取最近访问的项目
export const getRecentItems = async (tenantId: string): Promise<SearchResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const recentProjects = PROJECTS
    .filter(p => p.tenantId === tenantId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)
    .map(project => ({
      id: project.id,
      type: 'project' as SearchResultType,
      title: project.name,
      subtitle: project.description || '',
      icon: 'FolderKanban',
      url: '/projects',
      data: project,
    }));

  return recentProjects;
};
