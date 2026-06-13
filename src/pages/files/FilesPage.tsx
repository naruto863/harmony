import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FolderPlus,
  Search, 
  RefreshCw,
  MoreHorizontal,
  Eye,
  Download,
  Edit,
  Trash2,
  Folder,
  FileText,
  Image,
  File,
  FileSpreadsheet,
  ChevronRight,
  Home,
  HardDrive,
} from 'lucide-react';
import { PermissionGuard } from '@/components/guards';
import { ConfirmDialog } from '@/components/crud';
import { 
  FileUploadDialog, 
  CreateFolderDialog, 
  FilePreviewDialog,
  FileIcon,
  FolderFormValues,
} from '@/components/files';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  getFiles,
  getFolderPath,
  createFolder,
  uploadFile,
  renameFile,
  deleteFile,
  batchDeleteFiles,
  getStorageStats,
  formatFileSize,
  getFileIconType,
  FileItem,
} from '@/services/fileService';

export const FilesPage: React.FC = () => {
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // 状态
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folderPath, setFolderPath] = useState<FileItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [storageStats, setStorageStats] = useState<{ used: number; total: number; fileCount: number; folderCount: number } | null>(null);
  
  // 弹窗状态
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [folderLoading, setFolderLoading] = useState(false);
  
  // 加载文件列表
  const loadFiles = useCallback(async () => {
    if (!currentTenant) return;
    
    setIsLoading(true);
    try {
      const response = await getFiles({
        tenantId: currentTenant.id,
        parentId: currentFolderId,
        search: search || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      });
      
      if (response.success && response.data) {
        setFiles(response.data);
      }
    } catch (error) {
      toast({ title: '加载文件失败', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant, currentFolderId, search, typeFilter, toast]);
  
  // 加载文件夹路径
  const loadFolderPath = useCallback(async () => {
    const response = await getFolderPath(currentFolderId);
    if (response.success && response.data) {
      setFolderPath(response.data);
    }
  }, [currentFolderId]);
  
  // 加载存储统计
  const loadStorageStats = useCallback(async () => {
    if (!currentTenant) return;
    
    const response = await getStorageStats(currentTenant.id);
    if (response.success && response.data) {
      setStorageStats(response.data);
    }
  }, [currentTenant]);
  
  useEffect(() => {
    loadFiles();
    loadFolderPath();
  }, [loadFiles, loadFolderPath]);
  
  useEffect(() => {
    loadStorageStats();
  }, [loadStorageStats]);
  
  // 进入文件夹
  const handleFolderClick = (folder: FileItem) => {
    setCurrentFolderId(folder.id);
    setSearch('');
    setSelectedIds([]);
  };
  
  // 导航到指定文件夹
  const handleNavigate = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSearch('');
    setSelectedIds([]);
  };
  
  // 创建文件夹
  const handleCreateFolder = async (data: FolderFormValues) => {
    if (!currentTenant || !user) return;
    
    setFolderLoading(true);
    try {
      const response = await createFolder({
        name: data.name,
        parentId: currentFolderId,
        tenantId: currentTenant.id,
        userId: user.id,
        userName: user.name,
      });
      
      if (response.success) {
        toast({ title: '文件夹创建成功' });
        setFolderOpen(false);
        loadFiles();
        loadStorageStats();
      } else {
        toast({ title: response.error?.message || '创建失败', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '创建失败', variant: 'destructive' });
    } finally {
      setFolderLoading(false);
    }
  };
  
  // 上传文件
  const handleUpload = async (uploadFiles: File[]) => {
    if (!currentTenant || !user) return;
    
    setIsUploading(true);
    try {
      for (const file of uploadFiles) {
        await uploadFile({
          file,
          parentId: currentFolderId,
          tenantId: currentTenant.id,
          userId: user.id,
          userName: user.name,
        });
      }
      
      toast({ title: `成功上传 ${uploadFiles.length} 个文件` });
      setUploadOpen(false);
      loadFiles();
      loadStorageStats();
    } catch (error) {
      toast({ title: '上传失败', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };
  
  // 删除文件
  const handleDelete = async () => {
    if (!currentFile) return;
    
    try {
      const response = await deleteFile(currentFile.id);
      if (response.success) {
        toast({ title: currentFile.isFolder ? '文件夹已删除' : '文件已删除' });
        setDeleteOpen(false);
        setCurrentFile(null);
        loadFiles();
        loadStorageStats();
      } else {
        toast({ title: response.error?.message || '删除失败', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '删除失败', variant: 'destructive' });
    }
  };
  
  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      const response = await batchDeleteFiles(selectedIds);
      if (response.success) {
        toast({ title: `已删除 ${selectedIds.length} 个文件` });
        setSelectedIds([]);
        loadFiles();
        loadStorageStats();
      }
    } catch (error) {
      toast({ title: '删除失败', variant: 'destructive' });
    }
  };
  
  // 下载文件
  const handleDownload = (file: FileItem) => {
    window.open(file.url, '_blank');
  };
  
  // 选择处理
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(files.map(f => f.id));
    } else {
      setSelectedIds([]);
    }
  };
  
  const handleSelectOne = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, fileId]);
    } else {
      setSelectedIds(selectedIds.filter(id => id !== fileId));
    }
  };
  
  const storagePercentage = storageStats ? (storageStats.used / storageStats.total) * 100 : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">文件中心</h1>
          <p className="text-muted-foreground">管理和组织所有文件</p>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGuard permission="files.create">
            <Button variant="outline" onClick={() => setFolderOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              新建文件夹
            </Button>
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              上传文件
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 存储统计 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              存储空间
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {storageStats && (
              <>
                <Progress value={storagePercentage} className="h-2" />
                <div className="text-sm">
                  <span className="font-medium">{formatFileSize(storageStats.used)}</span>
                  <span className="text-muted-foreground"> / {formatFileSize(storageStats.total)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span>{storageStats.fileCount} 个文件</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span>{storageStats.folderCount} 个文件夹</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 文件列表 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex flex-col gap-4">
              {/* 面包屑导航 */}
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink 
                      onClick={() => handleNavigate(null)}
                      className="cursor-pointer flex items-center gap-1"
                    >
                      <Home className="h-4 w-4" />
                      根目录
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {folderPath.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                      <BreadcrumbSeparator>
                        <ChevronRight className="h-4 w-4" />
                      </BreadcrumbSeparator>
                      <BreadcrumbItem>
                        {index === folderPath.length - 1 ? (
                          <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink 
                            onClick={() => handleNavigate(folder.id)}
                            className="cursor-pointer"
                          >
                            {folder.name}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
              
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>文件列表</CardTitle>
                <div className="flex items-center gap-2">
                  {/* 搜索 */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索文件..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 w-[200px]"
                    />
                  </div>
                  
                  {/* 类型筛选 */}
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      <SelectItem value="folder">文件夹</SelectItem>
                      <SelectItem value="image">图片</SelectItem>
                      <SelectItem value="document">文档</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* 刷新 */}
                  <Button variant="outline" size="icon" onClick={loadFiles}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 批量操作栏 */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
                <span className="text-sm">已选择 {selectedIds.length} 项</span>
                <div className="flex-1" />
                <PermissionGuard permission="files.delete">
                  <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    批量删除
                  </Button>
                </PermissionGuard>
              </div>
            )}
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={files.length > 0 && selectedIds.length === files.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>大小</TableHead>
                    <TableHead>上传者</TableHead>
                    <TableHead>上传时间</TableHead>
                    <TableHead className="w-[80px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : files.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        {search ? '没有找到匹配的文件' : '暂无文件，点击上传按钮添加文件'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    files.map(file => {
                      const iconType = getFileIconType(file);
                      return (
                        <TableRow key={file.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(file.id)}
                              onCheckedChange={(checked) => handleSelectOne(file.id, checked === true)}
                            />
                          </TableCell>
                          <TableCell>
                            <div 
                              className={`flex items-center gap-3 ${file.isFolder ? 'cursor-pointer hover:text-primary' : ''}`}
                              onClick={() => file.isFolder && handleFolderClick(file)}
                            >
                              <FileIcon type={iconType} className="h-8 w-8" />
                              <span className="font-medium">{file.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {file.isFolder ? '-' : formatFileSize(file.size)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {file.uploadedByName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(file.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!file.isFolder && (
                                  <>
                                    <DropdownMenuItem onClick={() => { setCurrentFile(file); setPreviewOpen(true); }}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      预览
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload(file)}>
                                      <Download className="mr-2 h-4 w-4" />
                                      下载
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <PermissionGuard permission="files.delete">
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => { setCurrentFile(file); setDeleteOpen(true); }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    删除
                                  </DropdownMenuItem>
                                </PermissionGuard>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 弹窗 */}
      <FileUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={handleUpload}
        isUploading={isUploading}
      />
      
      <CreateFolderDialog
        open={folderOpen}
        onOpenChange={setFolderOpen}
        onSubmit={handleCreateFolder}
        isLoading={folderLoading}
      />
      
      <FilePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        file={currentFile}
      />
      
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={currentFile?.isFolder ? '删除文件夹' : '删除文件'}
        description={
          currentFile?.isFolder 
            ? `确定要删除文件夹 "${currentFile?.name}" 吗？文件夹内的所有文件也将被删除。`
            : `确定要删除文件 "${currentFile?.name}" 吗？此操作不可撤销。`
        }
        confirmLabel="删除"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
};
