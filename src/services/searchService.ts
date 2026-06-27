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

/**
 * 全局搜索当前是前端聚合搜索：
 * 用户、项目和审计日志来自 mock-data，文件结果通过 fileService 拉取当前租户列表后再过滤。
 * 它适合 Demo 和轻量预览，不等价于生产搜索引擎或后端全文检索能力。
 */
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

  // 用户 mock 数据没有 tenantId 字段，真实租户隔离应由后端搜索接口处理。
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

  // 项目和审计日志在 mock 数据中有 tenantId，可以在前端做最小隔离过滤。
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

  // 文件搜索复用文件列表接口，只过滤当前页可见文件；大规模文件检索应接入后端搜索。
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

  // 审计日志搜索仅覆盖前端样例字段，真实审计检索应支持时间、动作、资源等服务端索引。
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

/**
 * 最近访问当前用项目更新时间近似。
 * 如果后续需要真实“最近访问”，应新增访问日志或用户行为接口，而不是继续复用 updatedAt。
 */
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
