import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Loader2, ShieldAlert, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfirmationType = 'simple' | 'checkbox' | 'input';
export type ConfirmVariant = 'default' | 'destructive' | 'warning';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void;
  // 二次确认增强
  confirmationType?: ConfirmationType;
  // 复选框确认文本
  checkboxLabel?: string;
  // 输入确认 - 需要用户输入的文本
  confirmText?: string;
  // 输入确认提示
  confirmPlaceholder?: string;
  // 额外警告信息
  warnings?: string[];
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'default',
  isLoading = false,
  onConfirm,
  confirmationType = 'simple',
  checkboxLabel = '我已了解此操作的风险',
  confirmText,
  confirmPlaceholder,
  warnings = [],
}) => {
  const [checked, setChecked] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // 重置状态
  useEffect(() => {
    if (open) {
      setChecked(false);
      setInputValue('');
    }
  }, [open]);

  // 判断确认按钮是否可用
  const isConfirmDisabled = () => {
    if (isLoading) return true;
    if (confirmationType === 'checkbox' && !checked) return true;
    if (confirmationType === 'input' && inputValue !== confirmText) return true;
    return false;
  };

  // 获取图标
  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <ShieldAlert className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  // 获取图标背景色
  const getIconBg = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-destructive/10';
      case 'warning':
        return 'bg-amber-500/10';
      default:
        return 'bg-primary/10';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
              getIconBg()
            )}>
              {getIcon()}
            </div>
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1.5">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 警告列表 */}
        {warnings.length > 0 && (
          <div className="space-y-2 py-2">
            {warnings.map((warning, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* 复选框确认 */}
        {confirmationType === 'checkbox' && (
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="confirm-checkbox"
              checked={checked}
              onCheckedChange={(value) => setChecked(value === true)}
            />
            <Label
              htmlFor="confirm-checkbox"
              className="text-sm font-normal cursor-pointer"
            >
              {checkboxLabel}
            </Label>
          </div>
        )}

        {/* 输入确认 */}
        {confirmationType === 'input' && confirmText && (
          <div className="space-y-3 py-4">
            <Label className="text-sm">
              请输入 <span className="font-mono font-semibold text-destructive">{confirmText}</span> 以确认操作
            </Label>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={confirmPlaceholder || confirmText}
              className={cn(
                inputValue && inputValue !== confirmText && "border-destructive focus-visible:ring-destructive"
              )}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : variant === 'warning' ? 'default' : 'default'}
            onClick={onConfirm}
            disabled={isConfirmDisabled()}
            className={cn(
              variant === 'warning' && "bg-amber-500 hover:bg-amber-600 text-white"
            )}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 便捷的 Hook 来管理确认对话框状态
export interface UseConfirmDialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: ConfirmVariant;
  confirmationType?: ConfirmationType;
  checkboxLabel?: string;
  confirmText?: string;
  warnings?: string[];
}

export interface UseConfirmDialogReturn {
  open: boolean;
  setOpen: (open: boolean) => void;
  confirm: () => Promise<boolean>;
  dialogProps: Omit<ConfirmDialogProps, 'onConfirm'> & { onConfirm: () => void };
}

export function useConfirmDialog(options: UseConfirmDialogOptions): UseConfirmDialogReturn {
  const [open, setOpen] = useState(false);
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null);

  const confirm = (): Promise<boolean> => {
    setOpen(true);
    return new Promise((res) => {
      setResolve(() => res);
    });
  };

  const handleConfirm = () => {
    setOpen(false);
    resolve?.(true);
  };

  const handleCancel = (value: boolean) => {
    if (!value) {
      resolve?.(false);
    }
    setOpen(value);
  };

  return {
    open,
    setOpen,
    confirm,
    dialogProps: {
      open,
      onOpenChange: handleCancel,
      onConfirm: handleConfirm,
      ...options,
    },
  };
}
