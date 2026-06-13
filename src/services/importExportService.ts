import {
  ImportExportTask,
  ImportExportTaskError,
  ImportExportTaskStatus,
  ImportExportTaskType,
  Project,
  Role,
  ServiceResult,
  User,
} from '@/types';
import { demoStorageKey, isDemoModeEnabled, requireDemoMode } from '@/lib/demoMode';
import { ApiError, apiClient } from './apiClient';

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 导出类型
export type ExportFormat = 'csv';
export type ExportEntityType = 'users' | 'projects' | 'roles';

// 导入结果
export interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; field?: string; message: string }[];
}

export interface ImportExportTaskQuery {
  taskType?: ImportExportTaskType;
  entityType?: ExportEntityType;
  status?: ImportExportTaskStatus;
}

type ImportExportTaskPayload = Omit<ImportExportTask, 'errors'> & {
  errorDetails?: string | null;
};

const IMPORT_EXPORT_TASK_API = '/api/import-export/tasks';
const IMPORT_EXPORT_DEMO_TASK_KEY = demoStorageKey('import-export-tasks');

const wrapSuccess = <T>(data: T): ServiceResult<T> => ({
  success: true,
  data,
});

const wrapError = (message: string, error?: unknown): ServiceResult<never> => ({
  success: false,
  error: {
    code: error instanceof ApiError && error.code ? String(error.code) : 'REQUEST_FAILED',
    message,
    status: error instanceof ApiError ? error.status : undefined,
    traceId: error instanceof ApiError ? error.traceId : undefined,
    fieldErrors: error instanceof ApiError ? error.fieldErrors : undefined,
  },
});

const buildTaskQuery = (query: ImportExportTaskQuery = {}) => {
  const params = new URLSearchParams();
  if (query.taskType) params.set('taskType', query.taskType);
  if (query.entityType) params.set('entityType', query.entityType);
  if (query.status) params.set('status', query.status);
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const parseImportExportTaskErrors = (errorDetails?: string | null): ImportExportTaskError[] => {
  if (!errorDetails) return [];
  try {
    const parsed = JSON.parse(errorDetails) as unknown;
    if (!Array.isArray(parsed)) return [{ message: errorDetails }];
    return parsed.map((item) => {
      if (!item || typeof item !== 'object') {
        return { message: String(item) };
      }
      const detail = item as Partial<ImportExportTaskError>;
      return {
        row: typeof detail.row === 'number' ? detail.row : undefined,
        field: typeof detail.field === 'string' ? detail.field : undefined,
        message: typeof detail.message === 'string' ? detail.message : errorDetails,
      };
    });
  } catch {
    return [{ message: errorDetails }];
  }
};

const normalizeTask = (task: ImportExportTaskPayload): ImportExportTask => ({
  ...task,
  totalCount: task.totalCount ?? 0,
  successCount: task.successCount ?? 0,
  failedCount: task.failedCount ?? 0,
  errorDetails: task.errorDetails ?? undefined,
  errors: parseImportExportTaskErrors(task.errorDetails),
});

const createDemoTask = (taskType: ImportExportTaskType, entityType: ExportEntityType): ImportExportTask => {
  const now = new Date().toISOString();
  const task: ImportExportTask = {
    id: `demo_task_${taskType}_${Date.now()}`,
    createdBy: 'demo',
    taskType,
    entityType,
    format: 'csv',
    status: taskType === 'export' ? 'completed' : 'pending',
    phase: taskType === 'export' ? 'generated' : 'queued',
    sourceFileId: taskType === 'import' ? 'demo_upload' : undefined,
    downloadUrl: taskType === 'export' ? 'data:text/csv;charset=utf-8,%EF%BB%BFid,name%0A1,demo' : undefined,
    totalCount: taskType === 'export' ? 12 : 0,
    successCount: taskType === 'export' ? 12 : 0,
    failedCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  const tasks = readDemoTasks();
  writeDemoTasks([task, ...tasks]);
  return task;
};

const getSeedDemoTasks = (): ImportExportTask[] => {
  const now = new Date().toISOString();
  return [
    {
      id: 'demo_import_failed',
      createdBy: 'demo',
      taskType: 'import',
      entityType: 'users',
      format: 'csv',
      status: 'failed',
      phase: 'failed',
      totalCount: 8,
      successCount: 6,
      failedCount: 2,
      errorDetails: JSON.stringify([
        { row: 3, field: 'email', message: '邮箱已存在' },
        { row: 7, field: 'name', message: '姓名不能为空' },
      ]),
      errors: [
        { row: 3, field: 'email', message: '邮箱已存在' },
        { row: 7, field: 'name', message: '姓名不能为空' },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_export_completed',
      createdBy: 'demo',
      taskType: 'export',
      entityType: 'users',
      format: 'csv',
      status: 'completed',
      phase: 'generated',
      totalCount: 12,
      successCount: 12,
      failedCount: 0,
      downloadUrl: 'data:text/csv;charset=utf-8,%EF%BB%BFid,name%0A1,demo',
      createdAt: now,
      updatedAt: now,
    },
  ];
};

const readDemoTasks = (): ImportExportTask[] => {
  if (typeof localStorage === 'undefined') return getSeedDemoTasks();
  const raw = localStorage.getItem(IMPORT_EXPORT_DEMO_TASK_KEY);
  if (!raw) {
    const seeded = getSeedDemoTasks();
    writeDemoTasks(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as ImportExportTaskPayload[];
    return parsed.map(normalizeTask);
  } catch {
    return getSeedDemoTasks();
  }
};

const writeDemoTasks = (tasks: ImportExportTask[]) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(IMPORT_EXPORT_DEMO_TASK_KEY, JSON.stringify(tasks));
};

const filterTasks = (tasks: ImportExportTask[], query: ImportExportTaskQuery) => (
  tasks.filter((task) => {
    if (query.taskType && task.taskType !== query.taskType) return false;
    if (query.entityType && task.entityType !== query.entityType) return false;
    if (query.status && task.status !== query.status) return false;
    return true;
  })
);

export const getImportExportTasks = async (
  query: ImportExportTaskQuery = {}
): Promise<ServiceResult<ImportExportTask[]>> => {
  if (isDemoModeEnabled()) {
    return wrapSuccess(filterTasks(readDemoTasks(), query));
  }

  try {
    const tasks = await apiClient.get<ImportExportTaskPayload[]>(`${IMPORT_EXPORT_TASK_API}${buildTaskQuery(query)}`);
    return wrapSuccess(tasks.map(normalizeTask));
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : '加载导入导出任务失败', error);
  }
};

export const getImportExportTask = async (taskId: string): Promise<ServiceResult<ImportExportTask>> => {
  try {
    const task = await apiClient.get<ImportExportTaskPayload>(`${IMPORT_EXPORT_TASK_API}/${taskId}`);
    return wrapSuccess(normalizeTask(task));
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : '加载导入导出任务失败', error);
  }
};

export const createExportTask = async (
  entityType: ExportEntityType,
  format: ExportFormat = 'csv'
): Promise<ServiceResult<ImportExportTask>> => {
  if (isDemoModeEnabled()) {
    return wrapSuccess(createDemoTask('export', entityType));
  }

  try {
    const task = await apiClient.post<ImportExportTaskPayload>(`${IMPORT_EXPORT_TASK_API}/export`, {
      entityType,
      format,
    });
    return wrapSuccess(normalizeTask(task));
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : '创建导出任务失败', error);
  }
};

export const createImportTask = async (
  entityType: ExportEntityType,
  fileId: string
): Promise<ServiceResult<ImportExportTask>> => {
  if (isDemoModeEnabled()) {
    return wrapSuccess(createDemoTask('import', entityType));
  }

  try {
    const task = await apiClient.post<ImportExportTaskPayload>(`${IMPORT_EXPORT_TASK_API}/import`, {
      entityType,
      fileId,
    });
    return wrapSuccess(normalizeTask(task));
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : '创建导入任务失败', error);
  }
};

export const createImportTaskFromFile = async (
  entityType: ExportEntityType,
  file: File,
  tenantId: string
): Promise<ServiceResult<ImportExportTask>> => {
  if (isDemoModeEnabled()) {
    return wrapSuccess(createDemoTask('import', entityType));
  }

  try {
    const query = new URLSearchParams();
    if (tenantId) query.set('tenantId', tenantId);
    const uploaded = await apiClient.upload<{ id: string }>(
      `/api/files/upload${query.toString() ? `?${query.toString()}` : ''}`,
      file
    );
    return createImportTask(entityType, uploaded.id);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : '上传并创建导入任务失败', error);
  }
};

export const retryImportExportTask = async (taskId: string): Promise<ServiceResult<ImportExportTask>> => {
  if (isDemoModeEnabled()) {
    const tasks = readDemoTasks();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return wrapError('任务不存在');
    const updated: ImportExportTask = {
      ...task,
      status: 'pending',
      phase: 'queued',
      updatedAt: new Date().toISOString(),
    };
    writeDemoTasks(tasks.map((item) => item.id === taskId ? updated : item));
    return wrapSuccess(updated);
  }

  try {
    const task = await apiClient.post<ImportExportTaskPayload>(`${IMPORT_EXPORT_TASK_API}/${taskId}/retry`);
    return wrapSuccess(normalizeTask(task));
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : '重试导入导出任务失败', error);
  }
};

export const cancelImportExportTask = async (taskId: string): Promise<ServiceResult<ImportExportTask>> => {
  if (isDemoModeEnabled()) {
    const tasks = readDemoTasks();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return wrapError('任务不存在');
    const updated: ImportExportTask = {
      ...task,
      status: 'cancelled',
      phase: 'cancelled',
      updatedAt: new Date().toISOString(),
    };
    writeDemoTasks(tasks.map((item) => item.id === taskId ? updated : item));
    return wrapSuccess(updated);
  }

  try {
    const task = await apiClient.post<ImportExportTaskPayload>(`${IMPORT_EXPORT_TASK_API}/${taskId}/cancel`);
    return wrapSuccess(normalizeTask(task));
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : '取消导入导出任务失败', error);
  }
};

export const downloadImportExportErrorReport = async (taskId: string): Promise<ServiceResult<string>> => {
  if (isDemoModeEnabled()) {
    const tasks = readDemoTasks();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return wrapError('任务不存在');
    const rows = ['row,field,message', ...(task.errors ?? []).map((error) => (
      `${error.row ?? ''},${error.field ?? ''},${error.message}`
    ))];
    return wrapSuccess(`data:text/csv;charset=utf-8,%EF%BB%BF${encodeURIComponent(rows.join('\n'))}`);
  }

  try {
    const report = await apiClient.get<{ downloadUrl: string }>(`${IMPORT_EXPORT_TASK_API}/${taskId}/error-report`);
    return wrapSuccess(report.downloadUrl);
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : '下载错误报告失败', error);
  }
};

// CSV 解析
const parseCSV = (content: string): string[][] => {
  const lines = content.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
};

// CSV 生成
const generateCSV = (headers: string[], rows: string[][]): string => {
  const escapeCsv = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  
  const headerLine = headers.map(escapeCsv).join(',');
  const dataLines = rows.map(row => row.map(escapeCsv).join(','));
  
  return [headerLine, ...dataLines].join('\n');
};

// 下载文件
const downloadFile = (content: string | ArrayBuffer, filename: string, mimeType: string) => {
  const blob = typeof content === 'string' 
    ? new Blob(['\ufeff' + content], { type: mimeType })
    : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 解析文件
const parseFile = async (file: File): Promise<string[][]> => {
  const content = await file.text();
  return parseCSV(content);
};

// 用户模板
const USER_TEMPLATE_HEADERS = ['姓名', '邮箱', '手机号', '角色', '状态'];
const USER_TEMPLATE_EXAMPLE = [
      ['张三', 'zhangsan@example.com', '10000000000', '普通用户', 'active'],
      ['李四', 'lisi@example.com', '10000000001', '项目经理', 'active'],
];

// 项目模板
const PROJECT_TEMPLATE_HEADERS = ['项目名称', '描述', '状态', '开始日期', '结束日期', '标签（逗号分隔）'];
const PROJECT_TEMPLATE_EXAMPLE = [
  ['示例项目1', '这是一个示例项目', 'active', '2024-01-01', '2024-12-31', '重要,紧急'],
  ['示例项目2', '另一个示例项目', 'draft', '2024-02-01', '2024-06-30', '研发'],
];

// 角色模板
const ROLE_TEMPLATE_HEADERS = ['角色名称', '描述', '权限（逗号分隔）'];
const ROLE_TEMPLATE_EXAMPLE = [
  ['自定义角色1', '这是一个自定义角色', 'projects:read,projects:create'],
  ['自定义角色2', '另一个自定义角色', 'users:read,users:create,users:update'],
];

// 下载模板
export const downloadTemplate = async (
  entityType: ExportEntityType,
  _format: ExportFormat = 'csv'
): Promise<void> => {
  await delay(300);
  
  let headers: string[];
  let example: string[][];
  let filename: string;
  
  switch (entityType) {
    case 'users':
      headers = USER_TEMPLATE_HEADERS;
      example = USER_TEMPLATE_EXAMPLE;
      filename = '用户导入模板';
      break;
    case 'projects':
      headers = PROJECT_TEMPLATE_HEADERS;
      example = PROJECT_TEMPLATE_EXAMPLE;
      filename = '项目导入模板';
      break;
    case 'roles':
      headers = ROLE_TEMPLATE_HEADERS;
      example = ROLE_TEMPLATE_EXAMPLE;
      filename = '角色导入模板';
      break;
  }
  
  const csv = generateCSV(headers, example);
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8');
};

// 导出用户
export const exportUsers = async (
  users: User[],
  _format: ExportFormat = 'csv'
): Promise<void> => {
  await delay(500);
  
  const headers = ['ID', '姓名', '邮箱', '手机号', '状态', '创建时间'];
  const rows = users.map(user => [
    user.id,
    user.name,
    user.email,
    user.phone || '',
    user.status,
    new Date(user.createdAt).toLocaleString('zh-CN'),
  ]);
  
  const dateStr = new Date().toISOString().split('T')[0];
  
  const csv = generateCSV(headers, rows);
  downloadFile(csv, `用户列表_${dateStr}.csv`, 'text/csv;charset=utf-8');
};

// 导出项目
export const exportProjects = async (
  projects: Project[],
  _format: ExportFormat = 'csv'
): Promise<void> => {
  await delay(500);
  
  const headers = ['ID', '项目名称', '描述', '状态', '负责人', '开始日期', '结束日期', '标签', '创建时间', '更新时间'];
  const rows = projects.map(project => [
    project.id,
    project.name,
    project.description,
    project.status,
    project.ownerName,
    project.startDate,
    project.endDate || '',
    project.tags.join(','),
    new Date(project.createdAt).toLocaleString('zh-CN'),
    new Date(project.updatedAt).toLocaleString('zh-CN'),
  ]);
  
  const dateStr = new Date().toISOString().split('T')[0];
  
  const csv = generateCSV(headers, rows);
  downloadFile(csv, `项目列表_${dateStr}.csv`, 'text/csv;charset=utf-8');
};

// 导出角色
export const exportRoles = async (
  roles: Role[],
  _format: ExportFormat = 'csv'
): Promise<void> => {
  await delay(500);
  
  const headers = ['ID', '角色名称', '类型', '描述', '权限', '是否系统角色', '创建时间'];
  const rows = roles.map(role => [
    role.id,
    role.name,
    role.type,
    role.description,
    role.permissions.join(','),
    role.isSystem ? '是' : '否',
    new Date(role.createdAt).toLocaleString('zh-CN'),
  ]);
  
  const dateStr = new Date().toISOString().split('T')[0];
  
  const csv = generateCSV(headers, rows);
  downloadFile(csv, `角色列表_${dateStr}.csv`, 'text/csv;charset=utf-8');
};

// 导入用户
export const importUsers = async (
  file: File,
  tenantId: string
): Promise<ImportResult> => {
  requireDemoMode('importExportService.importUsers');
  await delay(1000);
  
  const rows = await parseFile(file);
  
  if (rows.length < 2) {
    return { success: 0, failed: 0, errors: [{ row: 0, message: '文件为空或格式不正确' }] };
  }
  
  const result: ImportResult = { success: 0, failed: 0, errors: [] };
  const users = JSON.parse(localStorage.getItem(demoStorageKey('users')) || '[]');
  
  // 跳过表头
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) {
      result.failed++;
      result.errors.push({ row: i + 1, message: '列数不足' });
      continue;
    }
    
    const [name, email, phone, roleName, status] = row;
    
    // 验证必填字段
    if (!name || !email) {
      result.failed++;
      result.errors.push({ row: i + 1, message: '姓名和邮箱为必填项' });
      continue;
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      result.failed++;
      result.errors.push({ row: i + 1, message: '邮箱格式不正确' });
      continue;
    }
    
    // 检查邮箱是否已存在
    if (users.some((u: User) => u.email === email)) {
      result.failed++;
      result.errors.push({ row: i + 1, message: '邮箱已存在' });
      continue;
    }
    
    // 创建用户
    const now = new Date().toISOString();
    const newUser: User = {
      id: `imported_${Date.now()}_${i}`,
      name,
      email,
      phone: phone || undefined,
      status: (status as 'active' | 'inactive' | 'pending') || 'pending',
      createdAt: now,
      updatedAt: now,
    };
    
    users.push(newUser);
    result.success++;
  }
  
  localStorage.setItem(demoStorageKey('users'), JSON.stringify(users));
  return result;
};

// 导入项目
export const importProjects = async (
  file: File,
  tenantId: string
): Promise<ImportResult> => {
  requireDemoMode('importExportService.importProjects');
  await delay(1000);
  
  const rows = await parseFile(file);
  
  if (rows.length < 2) {
    return { success: 0, failed: 0, errors: [{ row: 0, message: '文件为空或格式不正确' }] };
  }
  
  const result: ImportResult = { success: 0, failed: 0, errors: [] };
  const projects = JSON.parse(localStorage.getItem(demoStorageKey('projects')) || '[]');
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) {
      result.failed++;
      result.errors.push({ row: i + 1, message: '列数不足' });
      continue;
    }
    
    const [name, description, status, startDate, endDate, tags] = row;
    
    if (!name) {
      result.failed++;
      result.errors.push({ row: i + 1, message: '项目名称为必填项' });
      continue;
    }
    
    const now = new Date().toISOString();
    const newProject: Project = {
      id: `imported_${Date.now()}_${i}`,
      name,
      description: description || '',
      status: (status as 'active' | 'archived' | 'draft') || 'draft',
      tenantId,
      ownerId: '',
      ownerName: '',
      startDate: startDate || now,
      endDate: endDate || undefined,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      createdAt: now,
      updatedAt: now,
    };
    
    projects.push(newProject);
    result.success++;
  }
  
  localStorage.setItem(demoStorageKey('projects'), JSON.stringify(projects));
  return result;
};

// 导入角色
export const importRoles = async (
  file: File,
  tenantId: string
): Promise<ImportResult> => {
  requireDemoMode('importExportService.importRoles');
  await delay(1000);
  
  const rows = await parseFile(file);
  
  if (rows.length < 2) {
    return { success: 0, failed: 0, errors: [{ row: 0, message: '文件为空或格式不正确' }] };
  }
  
  const result: ImportResult = { success: 0, failed: 0, errors: [] };
  const roles = JSON.parse(localStorage.getItem(demoStorageKey('roles')) || '[]');
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) {
      result.failed++;
      result.errors.push({ row: i + 1, message: '列数不足' });
      continue;
    }
    
    const [name, description, permissions] = row;
    
    if (!name) {
      result.failed++;
      result.errors.push({ row: i + 1, message: '角色名称为必填项' });
      continue;
    }
    
    // 检查角色名是否已存在
    if (roles.some((r: Role) => r.name === name)) {
      result.failed++;
      result.errors.push({ row: i + 1, message: '角色名称已存在' });
      continue;
    }
    
    const now = new Date().toISOString();
    const newRole: Role = {
      id: `imported_${Date.now()}_${i}`,
      name,
      type: 'custom',
      description: description || '',
      permissions: permissions ? permissions.split(',').map(p => p.trim()).filter(Boolean) : [],
      tenantId,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    };
    
    roles.push(newRole);
    result.success++;
  }
  
  localStorage.setItem(demoStorageKey('roles'), JSON.stringify(roles));
  return result;
};

// 验证导入文件
export const validateImportFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!file.name.endsWith('.csv')) {
    return { valid: false, error: '请上传 CSV 文件' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: '文件大小不能超过 10MB' };
  }
  
  return { valid: true };
};
