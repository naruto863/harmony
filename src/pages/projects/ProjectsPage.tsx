import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DataTable, 
  Column, 
  RowAction,
  ConfirmDialog,
  DetailPanel,
  Timeline,
  ProjectFormDialog,
  ProjectFormValues,
} from '@/components/crud';
import { PermissionGuard } from '@/components/guards';
import { ImportDialog, ExportDialog } from '@/components/import-export';
import {
  AdvancedFilterPanel,
  QuickFilterBar,
  FilterFieldDefinition,
  FilterGroup,
  applyFilters,
} from '@/components/filters';
import { usePermission } from '@/contexts/PermissionContext';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Project } from '@/types';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  deleteProjects,
  updateProjectsStatus,
} from '@/services/projectService';
import { exportProjects, importProjects } from '@/services/importExportService';
import { 
  Plus, 
  Eye, 
  Pencil, 
  Trash2, 
  Archive,
  Download,
  Upload,
} from 'lucide-react';

// 项目筛选字段定义
const PROJECT_FILTER_FIELDS: FilterFieldDefinition[] = [
  { key: 'name', label: '项目名称', type: 'text' },
  { key: 'description', label: '描述', type: 'text' },
  { 
    key: 'status', 
    label: '状态', 
    type: 'select',
    options: [
      { value: 'active', label: '进行中' },
      { value: 'draft', label: '草稿' },
      { value: 'archived', label: '已归档' },
    ],
  },
  { key: 'ownerName', label: '负责人', type: 'text' },
  { key: 'startDate', label: '开始日期', type: 'date' },
  { key: 'endDate', label: '结束日期', type: 'date' },
];

export const ProjectsPage: React.FC = () => {
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog 状态
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 删除确认
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 批量操作确认
  const [batchActionOpen, setBatchActionOpen] = useState(false);
  const [batchAction, setBatchAction] = useState<'delete' | 'archive' | null>(null);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  
  // 详情面板
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // 导入导出
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  
  // 高级筛选
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);

  // 应用筛选后的数据
  const filteredProjects = useMemo(() => {
    if (filterGroups.length === 0) return projects;
    return applyFilters(projects, filterGroups);
  }, [projects, filterGroups]);

  // 加载数据
  const loadProjects = useCallback(() => {
    if (!currentTenant) return;
    setIsLoading(true);
    // 模拟异步加载
    setTimeout(() => {
      const data = getProjects(currentTenant.id);
      setProjects(data);
      setIsLoading(false);
    }, 300);
  }, [currentTenant]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // 状态显示
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    active: { label: '进行中', variant: 'default' },
    draft: { label: '草稿', variant: 'secondary' },
    archived: { label: '已归档', variant: 'outline' },
  };

  // 表格列定义
  const columns: Column<Project>[] = [
    {
      key: 'name',
      label: '项目名称',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: '状态',
      sortable: true,
      width: 100,
      render: (value) => {
        const config = statusConfig[value as string];
        return <Badge variant={config?.variant}>{config?.label}</Badge>;
      },
    },
    {
      key: 'ownerName',
      label: '负责人',
      sortable: true,
      width: 120,
    },
    {
      key: 'startDate',
      label: '开始日期',
      sortable: true,
      width: 120,
    },
    {
      key: 'tags',
      label: '标签',
      width: 200,
      render: (value) => {
        const tags = value as string[];
        return (
          <div className="flex gap-1 flex-wrap">
            {tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">+{tags.length - 2}</Badge>
            )}
          </div>
        );
      },
    },
  ];

  // 行操作
  const rowActions: RowAction<Project>[] = [
    {
      label: '查看详情',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row) => {
        setSelectedProject(row);
        setDetailOpen(true);
      },
    },
    {
      label: '编辑',
      icon: <Pencil className="h-4 w-4" />,
      onClick: (row) => {
        setEditingProject(row);
        setFormMode('edit');
        setFormOpen(true);
      },
      show: () => hasPermission('projects.update'),
    },
    {
      label: '删除',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      onClick: (row) => {
        setDeletingProject(row);
        setDeleteOpen(true);
      },
      show: () => hasPermission('projects.delete'),
    },
  ];

  // 批量操作 - 需要确认
  const openBatchConfirm = (action: 'delete' | 'archive', ids: string[]) => {
    setBatchAction(action);
    setBatchIds(ids);
    setBatchActionOpen(true);
  };

  const handleBatchConfirm = () => {
    setBatchLoading(true);
    setTimeout(() => {
      if (batchAction === 'delete') {
        const count = deleteProjects(batchIds);
        if (count > 0) {
          toast({ title: '删除成功', description: `已删除 ${count} 个项目` });
          loadProjects();
        }
      } else if (batchAction === 'archive') {
        const count = updateProjectsStatus(batchIds, 'archived');
        if (count > 0) {
          toast({ title: '操作成功', description: `已归档 ${count} 个项目` });
          loadProjects();
        }
      }
      setBatchLoading(false);
      setBatchActionOpen(false);
      setBatchAction(null);
      setBatchIds([]);
    }, 500);
  };

  const batchActions = hasPermission('projects.delete') ? [
    {
      label: '批量删除',
      icon: <Trash2 className="h-4 w-4 mr-1" />,
      variant: 'destructive' as const,
      onClick: (ids: string[]) => openBatchConfirm('delete', ids),
    },
    {
      label: '归档',
      icon: <Archive className="h-4 w-4 mr-1" />,
      onClick: (ids: string[]) => openBatchConfirm('archive', ids),
    },
  ] : undefined;

  // 新建项目
  const handleCreate = () => {
    setEditingProject(null);
    setFormMode('create');
    setFormOpen(true);
  };

  // 表单提交
  const handleFormSubmit = (values: ProjectFormValues) => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      if (formMode === 'create') {
        createProject({
          name: values.name,
          description: values.description || '',
          status: values.status,
          startDate: values.startDate,
          endDate: values.endDate,
          tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          ownerId: user?.id || '',
          ownerName: user?.name || '',
          tenantId: currentTenant?.id || '',
        });
        toast({ title: '创建成功', description: '项目已创建' });
      } else if (editingProject) {
        updateProject(editingProject.id, {
          name: values.name,
          description: values.description || '',
          status: values.status,
          startDate: values.startDate,
          endDate: values.endDate,
          tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        });
        toast({ title: '保存成功', description: '项目已更新' });
      }
      
      setIsSubmitting(false);
      setFormOpen(false);
      loadProjects();
    }, 500);
  };

  // 删除确认
  const handleDelete = () => {
    if (!deletingProject) return;
    
    setIsDeleting(true);
    setTimeout(() => {
      deleteProject(deletingProject.id);
      toast({ title: '删除成功', description: '项目已删除' });
      setIsDeleting(false);
      setDeleteOpen(false);
      setDeletingProject(null);
      loadProjects();
    }, 500);
  };

  // 详情面板数据
  const detailSections = selectedProject ? [
    {
      title: '基本信息',
      fields: [
        { label: '项目名称', value: selectedProject.name, span: 2 as const },
        { label: '项目描述', value: selectedProject.description || '-', span: 2 as const },
        { 
          label: '状态', 
          value: <Badge variant={statusConfig[selectedProject.status]?.variant}>
            {statusConfig[selectedProject.status]?.label}
          </Badge> 
        },
        { label: '负责人', value: selectedProject.ownerName },
        { label: '开始日期', value: selectedProject.startDate },
        { label: '结束日期', value: selectedProject.endDate || '-' },
        { 
          label: '标签', 
          value: selectedProject.tags.length > 0 
            ? <div className="flex gap-1 flex-wrap">
                {selectedProject.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            : '-',
          span: 2 as const,
        },
      ],
    },
    {
      title: '时间信息',
      fields: [
        { label: '创建时间', value: new Date(selectedProject.createdAt).toLocaleString('zh-CN') },
        { label: '更新时间', value: new Date(selectedProject.updatedAt).toLocaleString('zh-CN') },
      ],
    },
  ] : [];

  const detailTabs = selectedProject ? [
    {
      id: 'logs',
      label: '操作日志',
      content: (
        <Timeline
          items={[
            {
              id: '1',
              title: '项目已创建',
              description: `由 ${selectedProject.ownerName} 创建`,
              time: new Date(selectedProject.createdAt).toLocaleString('zh-CN'),
              icon: <Plus className="h-4 w-4 text-primary" />,
            },
            {
              id: '2',
              title: '项目已更新',
              description: '更新了项目信息',
              time: new Date(selectedProject.updatedAt).toLocaleString('zh-CN'),
              icon: <Pencil className="h-4 w-4 text-primary" />,
            },
          ]}
        />
      ),
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">项目管理</h1>
          <p className="text-muted-foreground">管理和跟踪所有项目</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
          <PermissionGuard permission="projects.create">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              导入
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              新建项目
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* 数据表格 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>项目列表</CardTitle>
          <QuickFilterBar
            entityType="projects"
            tenantId={currentTenant?.id || ''}
            userId={user?.id || ''}
            activeGroups={filterGroups}
            onApplyFilter={setFilterGroups}
            onOpenAdvanced={() => setFilterPanelOpen(true)}
            onClear={() => setFilterGroups([])}
          />
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredProjects}
            columns={columns}
            rowActions={rowActions}
            batchActions={batchActions}
            searchPlaceholder="搜索项目名称或标签..."
            searchKeys={['name', 'description', 'tags']}
            isLoading={isLoading}
            emptyMessage="暂无项目，点击右上角创建第一个项目"
          />
        </CardContent>
      </Card>

      {/* 新建/编辑表单 */}
      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        defaultValues={editingProject ? {
          name: editingProject.name,
          description: editingProject.description,
          status: editingProject.status,
          startDate: editingProject.startDate,
          endDate: editingProject.endDate,
          tags: editingProject.tags.join(', '),
        } : undefined}
        isLoading={isSubmitting}
        onSubmit={handleFormSubmit}
      />

      {/* 删除确认 */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="确认删除"
        description={`确定要删除项目「${deletingProject?.name}」吗？`}
        confirmLabel="删除"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        confirmationType="checkbox"
        checkboxLabel="我确认要删除此项目"
        warnings={['删除后数据无法恢复', '相关的文件和记录也将被删除']}
      />

      {/* 批量操作确认 */}
      <ConfirmDialog
        open={batchActionOpen}
        onOpenChange={setBatchActionOpen}
        title={batchAction === 'delete' ? '批量删除项目' : '批量归档项目'}
        description={batchAction === 'delete' 
          ? `确定要删除选中的 ${batchIds.length} 个项目吗？` 
          : `确定要归档选中的 ${batchIds.length} 个项目吗？`
        }
        confirmLabel={batchAction === 'delete' ? '删除' : '归档'}
        variant={batchAction === 'delete' ? 'destructive' : 'warning'}
        isLoading={batchLoading}
        onConfirm={handleBatchConfirm}
        confirmationType={batchAction === 'delete' ? 'checkbox' : 'simple'}
        checkboxLabel="我确认要删除这些项目"
        warnings={batchAction === 'delete' 
          ? ['删除后数据无法恢复', '相关的文件和记录也将被删除'] 
          : ['归档后项目将不再显示在活动列表中']
        }
      />

      {/* 详情面板 */}
      <DetailPanel
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={selectedProject?.name || ''}
        description="项目详情"
        sections={detailSections}
        tabs={detailTabs}
        footer={
          <div className="flex gap-2">
            <PermissionGuard permission="projects.update">
              <Button
                variant="outline"
                onClick={() => {
                  setDetailOpen(false);
                  setEditingProject(selectedProject);
                  setFormMode('edit');
                  setFormOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                编辑
              </Button>
            </PermissionGuard>
            <Button onClick={() => setDetailOpen(false)}>关闭</Button>
          </div>
        }
      />
      
      {/* 导入导出 */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entityType="projects"
        entityLabel="项目"
        onImport={(file) => importProjects(file, currentTenant?.id || '')}
        onSuccess={loadProjects}
      />
      
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        entityLabel="项目"
        totalCount={filteredProjects.length}
        selectedCount={0}
        onExport={async (format) => {
          await exportProjects(filteredProjects, format);
        }}
      />
      
      {/* 高级筛选面板 */}
      <AdvancedFilterPanel
        open={filterPanelOpen}
        onOpenChange={setFilterPanelOpen}
        entityType="projects"
        tenantId={currentTenant?.id || ''}
        userId={user?.id || ''}
        fields={PROJECT_FILTER_FIELDS}
        groups={filterGroups}
        onGroupsChange={setFilterGroups}
        onApply={() => {}}
        onReset={() => setFilterGroups([])}
      />
    </div>
  );
};
