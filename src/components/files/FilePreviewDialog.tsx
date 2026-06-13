import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FileItem,
  FilePreviewUrl,
  formatFileSize,
  getFileDownloadUrl,
  getFileIconType,
  getFilePreviewUrl,
} from '@/services/fileService';
import { 
  AlertTriangle,
  Download, 
  ExternalLink,
  Folder,
  FileText,
  Image,
  File,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Archive,
  Presentation,
} from 'lucide-react';

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
}

const FileIcon: React.FC<{ type: string; className?: string }> = ({ type, className = "h-12 w-12" }) => {
  const iconProps = { className: `${className} text-muted-foreground` };
  
  switch (type) {
    case 'folder': return <Folder {...iconProps} className={`${className} text-yellow-500`} />;
    case 'image': return <Image {...iconProps} className={`${className} text-green-500`} />;
    case 'pdf': return <FileText {...iconProps} className={`${className} text-red-500`} />;
    case 'word': return <FileText {...iconProps} className={`${className} text-blue-500`} />;
    case 'excel': return <FileSpreadsheet {...iconProps} className={`${className} text-green-600`} />;
    case 'ppt': return <Presentation {...iconProps} className={`${className} text-orange-500`} />;
    case 'video': return <FileVideo {...iconProps} className={`${className} text-purple-500`} />;
    case 'audio': return <FileAudio {...iconProps} className={`${className} text-pink-500`} />;
    case 'archive': return <Archive {...iconProps} className={`${className} text-amber-600`} />;
    default: return <File {...iconProps} />;
  }
};

export const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  open,
  onOpenChange,
  file,
}) => {
  const [preview, setPreview] = React.useState<FilePreviewUrl | null>(null);
  const [loadingPreview, setLoadingPreview] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !file || file.isFolder) return;

    setLoadingPreview(true);
    setPreview(null);
    setError(null);
    getFilePreviewUrl(file.id)
      .then((response) => {
        if (response.success && response.data) {
          setPreview(response.data);
        } else {
          setError(response.error?.message || '获取预览链接失败');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '获取预览链接失败');
      })
      .finally(() => setLoadingPreview(false));
  }, [file, open]);

  if (!file) return null;

  const iconType = getFileIconType(file);
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type.includes('pdf');
  const previewUrl = preview?.previewUrl;

  const handleDownload = async () => {
    setError(null);
    const response = await getFileDownloadUrl(file.id);
    if (response.success && response.data?.url) {
      window.open(response.data.url, '_blank', 'noopener,noreferrer');
    } else {
      setError(response.error?.message || '获取下载链接失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileIcon type={iconType} className="h-5 w-5" />
            {file.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loadingPreview && (
            <div className="rounded-lg border bg-muted/50 p-8 text-center text-sm text-muted-foreground">
              正在获取预览链接...
            </div>
          )}

          {/* 预览区域 */}
          {!loadingPreview && preview && !preview.previewable && (
            <div className="rounded-lg border bg-muted/50 p-8 flex flex-col items-center justify-center min-h-[200px]">
              <FileIcon type={iconType} className="h-16 w-16 mb-4" />
              <p className="text-sm text-muted-foreground">
                {preview.reason || '此文件暂不支持在线预览'}
              </p>
            </div>
          )}

          {!loadingPreview && isImage && preview?.previewable && previewUrl && (
            <div className="rounded-lg border bg-muted/50 p-4 flex items-center justify-center min-h-[300px]">
              <img 
                src={previewUrl} 
                alt={file.name}
                className="max-w-full max-h-[400px] object-contain rounded"
              />
            </div>
          )}
          
          {!loadingPreview && isPdf && preview?.previewable && previewUrl && (
            <div className="rounded-lg border bg-muted/50 p-4 flex flex-col items-center justify-center min-h-[300px]">
              <FileIcon type="pdf" className="h-16 w-16 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">PDF 文件预览</p>
              <Button variant="outline" onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                在新标签页打开
              </Button>
            </div>
          )}
          
          {!loadingPreview && !preview && !isImage && !isPdf && !file.isFolder && (
            <div className="rounded-lg border bg-muted/50 p-8 flex flex-col items-center justify-center min-h-[200px]">
              <FileIcon type={iconType} className="h-16 w-16 mb-4" />
              <p className="text-sm text-muted-foreground">
                此文件类型不支持预览
              </p>
            </div>
          )}
          
          <Separator />
          
          {/* 文件信息 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">文件名称</span>
              <p className="font-medium">{file.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">文件类型</span>
              <p className="font-medium">{file.type || '未知'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">文件大小</span>
              <p className="font-medium">{formatFileSize(file.size)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">上传者</span>
              <p className="font-medium">{file.uploadedByName}</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">上传时间</span>
              <p className="font-medium">
                {format(new Date(file.createdAt), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })}
              </p>
            </div>
          </div>
          
          {/* 操作按钮 */}
          {!file.isFolder && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                关闭
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                下载
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { FileIcon };
