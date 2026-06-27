import { QueryClient } from '@tanstack/react-query';

/**
 * 全局 React Query 客户端配置。
 *
 * 本项目以管理后台为主，数据可读性比极致实时性更重要：
 * 默认 5 分钟 staleTime 可以减少页面来回切换时的重复请求；
 * 关闭窗口聚焦/网络重连自动刷新，可以避免用户编辑表单时列表突然变化。
 * 对真正实时的数据，应在具体 query 上覆盖 staleTime 或使用独立轮询逻辑。
 */
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

/**
 * 缓存键统一在这里声明，避免不同页面手写 key 导致缓存失效范围不一致。
 * 详情 key 使用函数生成，保证列表和详情可以分别失效。
 */
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

/**
 * 语义化缓存时长，供具体 query 按数据变化频率选择。
 * 注意这些只是推荐值，不会自动作用到 queryClient，调用方需要显式使用。
 */
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

/**
 * 预取常用数据的预留入口。
 * 当前保持空实现，避免在没有明确首屏收益前增加启动请求数量。
 */
export const prefetchQueries = async () => {
  // 可以在这里预取常用数据
  // await queryClient.prefetchQuery({
  //   queryKey: QUERY_KEYS.dashboardStats,
  //   queryFn: fetchDashboardStats,
  // });
};

/**
 * 按模块失效缓存。
 * 仅支持 QUERY_KEYS 中直接声明为数组的列表级 key；函数型详情 key 需要调用方自己传入具体 id。
 */
export const invalidateModule = (module: keyof typeof QUERY_KEYS) => {
  const key = QUERY_KEYS[module];
  if (Array.isArray(key)) {
    queryClient.invalidateQueries({ queryKey: key });
  }
};

// 登出或切换账号时可调用，确保不会把上一个用户的数据残留给新会话。
export const clearAllCache = () => {
  queryClient.clear();
};

/**
 * 乐观更新辅助函数：
 * 1. 先取消同 key 的在途请求，避免旧响应覆盖乐观结果。
 * 2. 保存旧值并立即写入新值，提升列表操作反馈速度。
 * 3. 失败时回滚，结束后重新失效，最终以服务端数据为准。
 */
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
