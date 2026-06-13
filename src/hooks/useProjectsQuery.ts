import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, CACHE_TIME, createOptimisticUpdate } from '@/lib/queryClient';
import * as projectService from '@/services/projectService';
import { useTenant } from '@/contexts/TenantContext';
import type { Project } from '@/types';

// 获取项目列表
export function useProjectsQuery() {
  const { currentTenant } = useTenant();
  
  return useQuery({
    queryKey: [...QUERY_KEYS.projects, currentTenant?.id],
    queryFn: () => {
      if (!currentTenant?.id) return [];
      return projectService.getProjects(currentTenant.id);
    },
    enabled: !!currentTenant?.id,
    staleTime: CACHE_TIME.FREQUENT,
    gcTime: CACHE_TIME.MODERATE,
  });
}

// 获取单个项目
export function useProjectQuery(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.project(id || ''),
    queryFn: () => {
      if (!id) return null;
      return projectService.getProject(id);
    },
    enabled: !!id,
    staleTime: CACHE_TIME.MODERATE,
  });
}

// 创建项目
export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();
  
  return useMutation({
    mutationFn: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      return projectService.createProject(project);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [...QUERY_KEYS.projects, currentTenant?.id] 
      });
    },
  });
}

// 更新项目
export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { 
      id: string; 
      updates: Partial<Omit<Project, 'id' | 'createdAt'>> 
    }) => {
      return projectService.updateProject(id, updates);
    },
    ...createOptimisticUpdate<Project[]>(
      [...QUERY_KEYS.projects, currentTenant?.id],
      (old) => old || []
    ),
  });
}

// 删除项目
export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return projectService.deleteProject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [...QUERY_KEYS.projects, currentTenant?.id] 
      });
    },
  });
}

// 批量删除项目
export function useDeleteProjectsMutation() {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      return projectService.deleteProjects(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [...QUERY_KEYS.projects, currentTenant?.id] 
      });
    },
  });
}

// 批量更新项目状态
export function useUpdateProjectsStatusMutation() {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();
  
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: Project['status'] }) => {
      return projectService.updateProjectsStatus(ids, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [...QUERY_KEYS.projects, currentTenant?.id] 
      });
    },
  });
}
