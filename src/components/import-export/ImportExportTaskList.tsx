import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Ban, Download, RefreshCw, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  cancelImportExportTask,
  downloadImportExportErrorReport,
  ExportEntityType,
  getImportExportTasks,
  retryImportExportTask,
} from '@/services/importExportService';
import { ImportExportTask, ImportExportTaskStatus, ImportExportTaskType } from '@/types';

interface ImportExportTaskListProps {
  entityType?: ExportEntityType;
  taskType?: ImportExportTaskType;
  refreshKey?: number;
  onTaskUpdated?: () => void;
}

const statusLabels: Record<ImportExportTaskStatus, string> = {
  pending: '排队中',
  running: '运行中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
};

const statusVariants: Record<ImportExportTaskStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  running: 'default',
  completed: 'outline',
  failed: 'destructive',
  cancelled: 'secondary',
};

const taskTypeLabels: Record<ImportExportTaskType, string> = {
  import: '导入',
  export: '导出',
};

const getProgressValue = (task: ImportExportTask) => {
  if (task.totalCount <= 0) return task.status === 'completed' ? 100 : 0;
  return Math.min(100, Math.round(((task.successCount + task.failedCount) / task.totalCount) * 100));
};

export const ImportExportTaskList: React.FC<ImportExportTaskListProps> = ({
  entityType,
  taskType,
  refreshKey = 0,
  onTaskUpdated,
}) => {
  const [tasks, setTasks] = useState<ImportExportTask[]>([]);
  const [statusFilter, setStatusFilter] = useState<ImportExportTaskStatus | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [actionTaskId, setActionTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredStatus = statusFilter === 'all' ? undefined : statusFilter;

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getImportExportTasks({
      entityType,
      taskType,
      status: filteredStatus,
    });
    if (result.success && result.data) {
      setTasks(result.data);
    } else {
      setTasks([]);
      setError(result.error?.message || '加载导入导出任务失败');
    }
    setLoading(false);
  }, [entityType, filteredStatus, taskType]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks, refreshKey]);

  const summary = useMemo(() => {
    const failed = tasks.filter((task) => task.status === 'failed').length;
    const running = tasks.filter((task) => task.status === 'running' || task.status === 'pending').length;
    return { failed, running };
  }, [tasks]);

  const handleRetry = async (taskId: string) => {
    setActionTaskId(taskId);
    setError(null);
    const result = await retryImportExportTask(taskId);
    if (!result.success) {
      setError(result.error?.message || '重试任务失败');
    }
    setActionTaskId(null);
    onTaskUpdated?.();
    await loadTasks();
  };

  const handleCancel = async (taskId: string) => {
    setActionTaskId(taskId);
    setError(null);
    const result = await cancelImportExportTask(taskId);
    if (!result.success) {
      setError(result.error?.message || '取消任务失败');
    }
    setActionTaskId(null);
    onTaskUpdated?.();
    await loadTasks();
  };

  const handleDownloadErrorReport = async (taskId: string) => {
    setActionTaskId(taskId);
    setError(null);
    const result = await downloadImportExportErrorReport(taskId);
    if (result.success && result.data) {
      window.open(result.data, '_blank', 'noopener,noreferrer');
    } else {
      setError(result.error?.message || '下载错误报告失败');
    }
    setActionTaskId(null);
  };

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-medium">任务列表</div>
          <div className="text-xs text-muted-foreground">
            {summary.running} 个进行中，{summary.failed} 个失败
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ImportExportTaskStatus | 'all')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">排队中</SelectItem>
              <SelectItem value="running">运行中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="failed">失败</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" onClick={loadTasks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-md bg-muted/50 px-3 py-6 text-center text-sm text-muted-foreground">
          暂无任务
        </div>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {tasks.map((task) => {
            const canRetry = task.status === 'failed' || task.failedCount > 0;
            const canCancel = task.status === 'pending' || task.status === 'running';
            const busy = actionTaskId === task.id;

            return (
              <div key={task.id} className="space-y-2 rounded-md border bg-background p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{taskTypeLabels[task.taskType]}</span>
                      <Badge variant={statusVariants[task.status]}>{statusLabels[task.status]}</Badge>
                      <span className="text-xs text-muted-foreground">{task.entityType}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(task.updatedAt).toLocaleString('zh-CN')} · {task.phase}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {task.failedCount > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadErrorReport(task.id)}
                        disabled={busy}
                      >
                        <Download className="mr-1 h-4 w-4" />
                        错误报告
                      </Button>
                    )}
                    {canRetry && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(task.id)}
                        disabled={busy}
                      >
                        <RotateCcw className="mr-1 h-4 w-4" />
                        重试
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancel(task.id)}
                        disabled={busy}
                      >
                        <Ban className="mr-1 h-4 w-4" />
                        取消
                      </Button>
                    )}
                  </div>
                </div>

                <Progress value={getProgressValue(task)} />
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="font-semibold">{task.totalCount}</div>
                    <div className="text-muted-foreground">总数</div>
                  </div>
                  <div>
                    <div className="font-semibold text-green-600">{task.successCount}</div>
                    <div className="text-muted-foreground">成功</div>
                  </div>
                  <div>
                    <div className="font-semibold text-destructive">{task.failedCount}</div>
                    <div className="text-muted-foreground">失败</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
