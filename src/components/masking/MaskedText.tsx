import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { mask, MaskingType } from '@/lib/masking';
import { cn } from '@/lib/utils';

interface MaskedTextProps {
  /** 原始值 */
  value: string | undefined | null;
  /** 脱敏类型 */
  type: MaskingType;
  /** 是否允许切换显示/隐藏 */
  toggleable?: boolean;
  /** 默认是否显示原文 */
  defaultVisible?: boolean;
  /** 权限检查 - 如果返回false则始终脱敏 */
  canView?: boolean;
  /** 自定义样式 */
  className?: string;
  /** 空值时显示的文本 */
  placeholder?: string;
  /** 复制按钮（仅在显示原文时可用） */
  copyable?: boolean;
  /** 切换时的回调 */
  onToggle?: (visible: boolean) => void;
  /** 文字大小 */
  size?: 'sm' | 'md' | 'lg';
}

export const MaskedText: React.FC<MaskedTextProps> = ({
  value,
  type,
  toggleable = false,
  defaultVisible = false,
  canView = true,
  className,
  placeholder = '-',
  copyable = false,
  onToggle,
  size = 'md',
}) => {
  const [isVisible, setIsVisible] = useState(defaultVisible);

  if (!value) {
    return <span className={cn('text-muted-foreground', className)}>{placeholder}</span>;
  }

  const maskedValue = mask(value, type);
  const displayValue = isVisible && canView ? value : maskedValue;
  const showToggle = toggleable && canView && maskedValue !== value;

  const handleToggle = () => {
    const newValue = !isVisible;
    setIsVisible(newValue);
    onToggle?.(newValue);
  };

  const handleCopy = async () => {
    if (isVisible && value) {
      await navigator.clipboard.writeText(value);
    }
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className={cn('font-mono', sizeClasses[size])}>
        {displayValue}
      </span>
      
      {showToggle && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                onClick={handleToggle}
              >
                {isVisible ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{isVisible ? '隐藏' : '显示'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {copyable && isVisible && canView && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>复制</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  );
};
