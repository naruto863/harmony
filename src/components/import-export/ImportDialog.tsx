import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle, XCircle, Download, AlertTriangle } from 'lucide-react';
import { ExportEntityType, ExportFormat, ImportResult, validateImportFile, downloadTemplate } from '@/services/importExportService';
import { ImportExportTask } from '@/types';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: ExportEntityType;
  entityLabel: string;
  onImport: (file: File) => Promise<ImportResult | ImportExportTask>;
  onSuccess?: () => void;
  task?: ImportExportTask | null;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  open,
  onOpenChange,
  entityType,
  entityLabel,
  onImport,
  onSuccess,
  task: externalTask,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [task, setTask] = useState<ImportExportTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const templateFormat: ExportFormat = 'csv';

  const handleReset = () => {
    setFile(null);
    setProgress(0);
    setResult(null);
    setTask(null);
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    
    const validation = validateImportFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || '文件验证失败');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    setResult(null);
    setTask(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    setProgress(0);
    setError(null);
    
    try {
      // 模拟进度
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      const importResult = await onImport(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      if ('taskType' in importResult) {
        setTask(importResult);
      } else {
        setResult(importResult);
      }
      
      if (!('taskType' in importResult) && importResult.success > 0 && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const displayTask = externalTask ?? task;
  const taskErrors = displayTask?.errors ?? [];

  const handleDownloadTemplate = async () => {
    await downloadTemplate(entityType, templateFormat);
  };

  const getFileIcon = () => {
    if (!file) return null;
    return <FileText className="h-10 w-10 mx-auto text-primary" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>导入{entityLabel}</DialogTitle>
          <DialogDescription>
            上传 CSV 文件以批量导入{entityLabel}数据
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 模板下载 */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">下载导入模板</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="flex items-center gap-1 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                CSV
              </Label>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="ml-auto">
                <Download className="h-4 w-4 mr-1" />
                下载
              </Button>
            </div>
          </div>

          {/* 文件上传区域 */}
          {!result && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {file ? (
                <div className="space-y-2">
                  {getFileIcon()}
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    更换文件
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    拖拽文件到此处，或点击选择
                  </p>
                  <p className="text-xs text-muted-foreground">
                    支持 .csv 格式
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id="import-file"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="import-file" className="cursor-pointer">
                      选择文件
                    </label>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 进度条 */}
          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                正在导入... {progress}%
              </p>
            </div>
          )}

          {/* 导入结果 */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-6 py-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-2xl font-bold">{result.success}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">成功</span>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-destructive mb-1">
                    <XCircle className="h-5 w-5" />
                    <span className="text-2xl font-bold">{result.failed}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">失败</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {result.errors.slice(0, 5).map((err, index) => (
                    <Alert key={index} variant="destructive" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        第 {err.row} 行: {err.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {result.errors.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      还有 {result.errors.length - 5} 个错误...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 导入任务状态 */}
          {displayTask && (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">任务状态</span>
                <span className="text-muted-foreground">{displayTask.status} / {displayTask.phase}</span>
              </div>
              <Progress value={displayTask.totalCount > 0 ? Math.round((displayTask.successCount / displayTask.totalCount) * 100) : progress} />
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <div className="font-semibold">{displayTask.totalCount}</div>
                  <div className="text-muted-foreground">总数</div>
                </div>
                <div>
                  <div className="font-semibold text-green-600">{displayTask.successCount}</div>
                  <div className="text-muted-foreground">成功</div>
                </div>
                <div>
                  <div className="font-semibold text-destructive">{displayTask.failedCount}</div>
                  <div className="text-muted-foreground">失败</div>
                </div>
              </div>
              {taskErrors.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {taskErrors.slice(0, 5).map((err, index) => (
                    <Alert key={index} variant="destructive" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {err.row ? `第 ${err.row} 行` : '任务错误'}
                        {err.field ? ` / ${err.field}` : ''}: {err.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result || displayTask ? '关闭' : '取消'}
          </Button>
          {!result && !displayTask && (
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? '导入中...' : '开始导入'}
            </Button>
          )}
          {result && result.success > 0 && (
            <Button onClick={handleClose}>完成</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
