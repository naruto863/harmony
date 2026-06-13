import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { formatFileSize, UploadPolicy } from '@/services/fileService';

const ACCEPTED_FILE_TYPES = '.pdf,.png,.jpg,.jpeg,.gif,.txt,.csv,.doc,.docx';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => Promise<void>;
  isUploading?: boolean;
  uploadPolicy?: UploadPolicy | null;
  policyError?: string | null;
}

export const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  open,
  onOpenChange,
  onUpload,
  isUploading,
  uploadPolicy,
  policyError,
}) => {
  const [files, setFiles] = React.useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const maxFileSize = uploadPolicy?.maxFileSize ?? MAX_FILE_SIZE_BYTES;
    const maxFiles = uploadPolicy?.maxFilesPerUpload ?? Number.POSITIVE_INFINITY;
    const allowedMimeTypes = uploadPolicy?.allowedMimeTypes ?? [];
    
    const newFiles: UploadFile[] = Array.from(selectedFiles).map((file, index) => {
      let error: string | undefined;
      if (files.length + index >= maxFiles) {
        error = `单次最多上传 ${maxFiles} 个文件`;
      } else if (file.size > maxFileSize) {
        error = `文件超过 ${formatFileSize(maxFileSize)} 限制`;
      } else if (uploadPolicy && file.size > uploadPolicy.remainingQuota) {
        error = '文件大小超过当前剩余配额';
      } else if (allowedMimeTypes.length > 0 && file.type && !allowedMimeTypes.includes(file.type)) {
        error = '文件类型不在允许范围内';
      }

      return {
        id: `${file.name}_${Date.now()}`,
        file,
        progress: 0,
        status: error ? 'error' : 'pending',
        error,
      };
    });
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    const pendingFiles = files.filter(f => f.status !== 'error');
    if (pendingFiles.length === 0) return;
    
    await onUpload(pendingFiles.map(f => f.file));
    setFiles([]);
  };

  const handleClose = () => {
    if (!isUploading) {
      setFiles([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>上传文件</DialogTitle>
          <DialogDescription>
            拖拽文件到此处或点击选择文件
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {policyError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {policyError}
            </div>
          )}

          {/* 拖拽区域 */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={uploadPolicy?.allowedMimeTypes?.join(',') || ACCEPTED_FILE_TYPES}
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              点击或拖拽文件到此处上传
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              单个文件最大 {formatFileSize(uploadPolicy?.maxFileSize ?? MAX_FILE_SIZE_BYTES)}
              {uploadPolicy ? `，单次最多 ${uploadPolicy.maxFilesPerUpload} 个，剩余配额 ${formatFileSize(uploadPolicy.remainingQuota)}` : ''}
            </p>
            {uploadPolicy?.allowedMimeTypes?.length ? (
              <p className="text-xs text-muted-foreground mt-1">
                允许类型：{uploadPolicy.allowedMimeTypes.join('、')}
              </p>
            ) : null}
          </div>
          
          {/* 文件列表 */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {files.map(uploadFile => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                    {uploadFile.error && (
                      <p className="text-xs text-destructive">{uploadFile.error}</p>
                    )}
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="h-1 mt-1" />
                    )}
                  </div>
                  {uploadFile.status === 'done' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleRemove(uploadFile.id)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            取消
          </Button>
          <Button onClick={handleUpload} disabled={files.length === 0 || files.every(f => f.status === 'error') || isUploading}>
            {isUploading ? '上传中...' : `上传 ${files.filter(f => f.status !== 'error').length} 个文件`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
