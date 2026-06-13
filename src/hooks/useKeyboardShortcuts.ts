import { useEffect, useCallback } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
  enabled?: boolean;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 如果在输入框中，忽略大多数快捷键
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable;

    for (const shortcut of shortcuts) {
      if (shortcut.enabled === false) continue;

      // 检查修饰键
      const ctrlOrMeta = isMac ? event.metaKey : event.ctrlKey;
      const ctrlMatch = shortcut.ctrl ? ctrlOrMeta : !ctrlOrMeta || shortcut.meta;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const metaMatch = shortcut.meta ? event.metaKey : true;

      // 检查按键
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
        // 某些快捷键在输入框中也需要工作
        const alwaysWork = ['Escape', 'k', 'g', 'b', 'p', 'u'];
        if (isInput && shortcut.ctrl && !alwaysWork.includes(shortcut.key)) {
          continue;
        }

        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// 常用快捷键预设
export const defaultShortcuts = {
  search: { key: 'k', ctrl: true, description: '打开搜索' },
  escape: { key: 'Escape', description: '关闭对话框/取消' },
  save: { key: 's', ctrl: true, description: '保存' },
  newItem: { key: 'n', ctrl: true, description: '新建项目' },
  goBack: { key: 'b', ctrl: true, description: '返回' },
  goHome: { key: 'h', ctrl: true, shift: true, description: '返回首页' },
  toggleSidebar: { key: 'b', ctrl: true, shift: true, description: '切换侧边栏' },
  help: { key: '/', ctrl: true, description: '显示帮助' },
};

// 格式化快捷键显示
export function formatShortcut(config: Partial<ShortcutConfig>): string {
  const parts: string[] = [];
  
  if (config.ctrl) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (config.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (config.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (config.key) {
    parts.push(config.key.toUpperCase());
  }
  
  return parts.join(isMac ? '' : '+');
}
