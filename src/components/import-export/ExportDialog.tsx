import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileText, AlertTriangle } from 'lucide-react';
import { ExportFormat } from '@/services/importExportService';
import { ImportExportTask } from '@/types';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel: string;
  totalCount: number;
  selectedCount: number;
  onExport: (format: ExportFormat, exportSelected: boolean) => Promise<void | ImportExportTask>;
  task?: ImportExportTask | null;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  entityLabel,
  totalCount,
  selectedCount,
  onExport,
  task: externalTask,
}) => {
  const format: ExportFormat = 'csv';
  const [exportSelected, setExportSelected] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [task, setTask] = useState<ImportExportTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const result = await onExport(format, exportSelected && selectedCount > 0);
      if (result && 'taskType' in result) {
        setTask(result);
      } else {
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const exportCount = exportSelected && selectedCount > 0 ? selectedCount : totalCount;
  const displayTask = externalTask ?? task;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>导出{entityLabel}</DialogTitle>
          <DialogDescription>
            选择导出格式和范围
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 导出格式 */}
          <div className="space-y-3">
            <Label>导出格式</Label>
            <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/40">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">CSV</p>
                <p className="text-xs text-muted-foreground">通用文本格式，避免引入高风险表格解析依赖</p>
              </div>
            </div>
          </div>

          {/* 导出范围 */}
          {selectedCount > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exportSelected"
                checked={exportSelected}
                onCheckedChange={(checked) => setExportSelected(checked === true)}
              />
              <Label htmlFor="exportSelected" className="cursor-pointer">
                仅导出选中的 {selectedCount} 条数据
              </Label>
            </div>
          )}

          {/* 导出数量预览 */}
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              将导出 <span className="font-semibold text-foreground">{exportCount}</span> 条{entityLabel}数据
            </p>
          </div>

          {displayTask && (
            <div className="space-y-2 rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">任务状态</span>
                <span className="text-muted-foreground">{displayTask.status} / {displayTask.phase}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">成功/总数</span>
                <span>{displayTask.successCount} / {displayTask.totalCount}</span>
              </div>
              {displayTask.downloadUrl && (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href={displayTask.downloadUrl}>
                    <Download className="h-4 w-4 mr-2" />
                    下载结果文件
                  </a>
                </Button>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? '导出中...' : '导出'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
