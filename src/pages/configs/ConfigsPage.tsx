import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/crud";
import { useToast } from "@/hooks/use-toast";
import { ConfigItem } from "@/types";
import {
  createConfig,
  deleteConfig,
  getConfigs,
  updateConfig,
} from "@/services/configService";
import { Plus, MoreHorizontal, RefreshCw, Edit, Trash2, Search } from "lucide-react";

type ConfigFormState = {
  configKey: string;
  configValue: string;
  env: string;
  type: string;
  sensitive: boolean;
  validationRule: string;
  status: string;
};

const envOptions = [
  { value: "dev", label: "开发" },
  { value: "test", label: "测试" },
  { value: "prod", label: "生产" },
];

const typeOptions = [
  { value: "string", label: "字符串" },
  { value: "number", label: "数字" },
  { value: "boolean", label: "布尔" },
  { value: "json", label: "JSON" },
];

const statusOptions = [
  { value: "active", label: "启用" },
  { value: "inactive", label: "停用" },
];

const defaultConfigForm = (): ConfigFormState => ({
  configKey: "",
  configValue: "",
  env: "prod",
  type: "string",
  sensitive: false,
  validationRule: "",
  status: "active",
});

export const ConfigsPage: React.FC = () => {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [envFilter, setEnvFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ConfigItem | null>(null);
  const [formState, setFormState] = useState<ConfigFormState>(defaultConfigForm());
  const [formLoading, setFormLoading] = useState(false);

  const loadConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getConfigs(envFilter === "all" ? undefined : envFilter);
      if (response.success && response.data) {
        setConfigs(response.data);
      } else {
        setConfigs([]);
      }
    } catch (error) {
      toast({ title: "加载参数失败", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [envFilter, toast]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  useEffect(() => {
    if (currentConfig && formOpen) {
      setFormState({
        configKey: currentConfig.configKey,
        configValue: currentConfig.configValue || "",
        env: currentConfig.env || "prod",
        type: currentConfig.type || "string",
        sensitive: !!currentConfig.sensitive,
        validationRule: currentConfig.validationRule || "",
        status: currentConfig.status || "active",
      });
    } else if (formOpen) {
      setFormState(defaultConfigForm());
    }
  }, [currentConfig, formOpen]);

  const filteredConfigs = useMemo(() => {
    if (!search.trim()) return configs;
    const keyword = search.toLowerCase();
    return configs.filter(config =>
      config.configKey.toLowerCase().includes(keyword) ||
      (config.configValue || "").toLowerCase().includes(keyword)
    );
  }, [configs, search]);

  const handleSubmit = async () => {
    if (!formState.configKey.trim()) {
      toast({ title: "请填写参数Key", variant: "destructive" });
      return;
    }
    setFormLoading(true);
    try {
      if (currentConfig) {
        const response = await updateConfig(currentConfig.id, {
          configValue: formState.configValue,
          env: formState.env,
          type: formState.type,
          sensitive: formState.sensitive,
          validationRule: formState.validationRule || undefined,
          status: formState.status,
        });
        if (response.success) {
          toast({ title: "参数已更新" });
          setFormOpen(false);
          setCurrentConfig(null);
          loadConfigs();
        } else {
          toast({ title: response.error?.message || "更新失败", variant: "destructive" });
        }
      } else {
        const response = await createConfig({
          configKey: formState.configKey.trim(),
          configValue: formState.configValue,
          env: formState.env,
          type: formState.type,
          sensitive: formState.sensitive,
          validationRule: formState.validationRule || undefined,
          status: formState.status,
        });
        if (response.success) {
          toast({ title: "参数已创建" });
          setFormOpen(false);
          loadConfigs();
        } else {
          toast({ title: response.error?.message || "创建失败", variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "操作失败", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentConfig) return;
    try {
      const response = await deleteConfig(currentConfig.id);
      if (response.success) {
        toast({ title: "参数已删除" });
        setDeleteOpen(false);
        setCurrentConfig(null);
        loadConfigs();
      } else {
        toast({ title: response.error?.message || "删除失败", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "删除失败", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">参数配置</h1>
          <p className="text-muted-foreground">维护系统运行参数与开关</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadConfigs}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => { setCurrentConfig(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            新建参数
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>参数列表</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索参数..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select value={envFilter} onValueChange={setEnvFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="环境" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部环境</SelectItem>
                  {envOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>值</TableHead>
                  <TableHead>环境</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>敏感</TableHead>
                  <TableHead>版本</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="w-[70px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredConfigs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      暂无参数
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConfigs.map(config => (
                    <TableRow key={config.id}>
                      <TableCell className="font-mono text-xs">{config.configKey}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {config.configValue || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {envOptions.find(opt => opt.value === config.env)?.label || config.env}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {typeOptions.find(opt => opt.value === config.type)?.label || config.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.sensitive ? "destructive" : "outline"}>
                          {config.sensitive ? "敏感" : "普通"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        v{config.version || 1}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.status === "inactive" ? "secondary" : "default"}>
                          {config.status === "inactive" ? "停用" : "启用"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setCurrentConfig(config); setFormOpen(true); }}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { setCurrentConfig(config); setDeleteOpen(true); }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{currentConfig ? "编辑参数" : "新建参数"}</DialogTitle>
            <DialogDescription>修改参数将影响系统运行逻辑</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>参数Key *</Label>
              <Input
                value={formState.configKey}
                onChange={(e) => setFormState(prev => ({ ...prev, configKey: e.target.value }))}
                disabled={!!currentConfig}
                placeholder="例如 feature.user.register"
              />
            </div>
            <div className="space-y-2">
              <Label>参数值</Label>
              <Textarea
                value={formState.configValue}
                onChange={(e) => setFormState(prev => ({ ...prev, configValue: e.target.value }))}
                placeholder="输入参数值"
              />
            </div>
            <div className="space-y-2">
              <Label>校验规则</Label>
              <Input
                value={formState.validationRule}
                onChange={(e) => setFormState(prev => ({ ...prev, validationRule: e.target.value }))}
                placeholder="例如 min=1,max=10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>环境</Label>
                <Select
                  value={formState.env}
                  onValueChange={(value) => setFormState(prev => ({ ...prev, env: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {envOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>类型</Label>
                <Select
                  value={formState.type}
                  onValueChange={(value) => setFormState(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={formState.status}
                onValueChange={(value) => setFormState(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formState.sensitive}
                onChange={(e) => setFormState(prev => ({ ...prev, sensitive: e.target.checked }))}
              />
              <span>敏感参数</span>
            </label>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={formLoading}>
              {formLoading ? "处理中..." : currentConfig ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="删除参数"
        description={`确定要删除参数 "${currentConfig?.configKey}" 吗？`}
        confirmLabel="删除"
        variant="destructive"
        onConfirm={handleDelete}
        warnings={["删除后不可恢复"]}
      />
    </div>
  );
};
