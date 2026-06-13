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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface SaveFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, isQuickFilter: boolean) => Promise<void>;
  defaultName?: string;
  isUpdate?: boolean;
}

export const SaveFilterDialog: React.FC<SaveFilterDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  defaultName = '',
  isUpdate = false,
}) => {
  const [name, setName] = useState(defaultName);
  const [isQuickFilter, setIsQuickFilter] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setSaving(true);
    try {
      await onSave(name.trim(), isQuickFilter);
      setName('');
      setIsQuickFilter(false);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isUpdate ? '更新筛选器' : '保存筛选器'}</DialogTitle>
          <DialogDescription>
            保存当前筛选条件以便快速使用
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filterName">筛选器名称</Label>
            <Input
              id="filterName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：活跃用户"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="quickFilter"
              checked={isQuickFilter}
              onCheckedChange={(checked) => setIsQuickFilter(checked === true)}
            />
            <Label htmlFor="quickFilter" className="text-sm cursor-pointer">
              设为快捷筛选（显示在工具栏）
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isUpdate ? '更新' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
