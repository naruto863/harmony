import { QueryClient } from '@tanstack/react-query';

// 全局 React Query 客户端配置
// 针对不同类型的数据设置不同的缓存策略
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 默认缓存时间: 5分钟
      staleTime: 5 * 60 * 1000,
      // 缓存保留时间: 30分钟
      gcTime: 30 * 60 * 1000,
      // 窗口聚焦时不自动重新获取
      refetchOnWindowFocus: false,
      // 重连时不自动重新获取
      refetchOnReconnect: false,
      // 重试次数
      retry: 1,
      // 重试延迟
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // 变更失败时重试次数
      retry: 0,
    },
  },
});

// 缓存键常量
export const QUERY_KEYS = {
  // 项目相关
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  
  // 用户相关
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  
  // 角色相关
  roles: ['roles'] as const,
  role: (id: string) => ['roles', id] as const,
  
  // 审计日志
  auditLogs: ['audit-logs'] as const,
  
  // 文件相关
  files: ['files'] as const,
  file: (id: string) => ['files', id] as const,
  
  // 设置相关
  settings: ['settings'] as const,
  profileSettings: ['settings', 'profile'] as const,
  tenantSettings: ['settings', 'tenant'] as const,
  notificationSettings: ['settings', 'notifications'] as const,
  
  // 仪表盘
  dashboardStats: ['dashboard', 'stats'] as const,
  dashboardActivity: ['dashboard', 'activity'] as const,
  dashboardCharts: ['dashboard', 'charts'] as const,
  
  // 通知
  notifications: ['notifications'] as const,
};

// 缓存时间常量（毫秒）
export const CACHE_TIME = {
  // 实时数据 - 短缓存
  REALTIME: 10 * 1000, // 10秒
  
  // 频繁变化 - 中等缓存
  FREQUENT: 1 * 60 * 1000, // 1分钟
  
  // 较少变化 - 长缓存
  MODERATE: 5 * 60 * 1000, // 5分钟
  
  // 很少变化 - 超长缓存
  STABLE: 30 * 60 * 1000, // 30分钟
  
  // 静态数据 - 持久缓存
  STATIC: 60 * 60 * 1000, // 1小时
};

// 预取数据的辅助函数
export const prefetchQueries = async () => {
  // 可以在这里预取常用数据
  // await queryClient.prefetchQuery({
  //   queryKey: QUERY_KEYS.dashboardStats,
  //   queryFn: fetchDashboardStats,
  // });
};

// 清除特定模块的缓存
export const invalidateModule = (module: keyof typeof QUERY_KEYS) => {
  const key = QUERY_KEYS[module];
  if (Array.isArray(key)) {
    queryClient.invalidateQueries({ queryKey: key });
  }
};

// 清除所有缓存
export const clearAllCache = () => {
  queryClient.clear();
};

// 乐观更新辅助函数
export function createOptimisticUpdate<T>(
  queryKey: readonly unknown[],
  updateFn: (old: T | undefined) => T
) {
  return {
    onMutate: async (newData: unknown) => {
      // 取消正在进行的请求
      await queryClient.cancelQueries({ queryKey });
      
      // 保存之前的值
      const previousData = queryClient.getQueryData<T>(queryKey);
      
      // 乐观更新
      queryClient.setQueryData<T>(queryKey, updateFn);
      
      // 返回上下文
      return { previousData };
    },
    onError: (_err: unknown, _newData: unknown, context: { previousData?: T } | undefined) => {
      // 回滚到之前的值
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // 重新获取数据
      queryClient.invalidateQueries({ queryKey });
    },
  };
}
