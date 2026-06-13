import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/components/ui/sidebar';
import { useKeyboardShortcuts, ShortcutConfig } from './useKeyboardShortcuts';

interface UseGlobalShortcutsReturn {
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  shortcutsDialogOpen: boolean;
  setShortcutsDialogOpen: (open: boolean) => void;
  goToDialogOpen: boolean;
  setGoToDialogOpen: (open: boolean) => void;
}

export function useGlobalShortcuts(): UseGlobalShortcutsReturn {
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [goToDialogOpen, setGoToDialogOpen] = useState(false);

  const shortcuts: ShortcutConfig[] = [
    // 搜索
    {
      key: 'k',
      ctrl: true,
      action: () => setSearchOpen(true),
      description: '打开搜索',
    },
    // 关闭对话框
    {
      key: 'Escape',
      action: () => {
        setSearchOpen(false);
        setShortcutsDialogOpen(false);
        setGoToDialogOpen(false);
      },
      description: '关闭对话框',
    },
    // 切换侧边栏
    {
      key: 'b',
      ctrl: true,
      shift: true,
      action: () => toggleSidebar(),
      description: '切换侧边栏',
    },
    // 显示快捷键帮助
    {
      key: '/',
      ctrl: true,
      action: () => setShortcutsDialogOpen(true),
      description: '显示快捷键帮助',
    },
    // 快速导航
    {
      key: 'g',
      ctrl: true,
      action: () => setGoToDialogOpen(true),
      description: '快速导航',
    },
    // 返回首页
    {
      key: 'h',
      ctrl: true,
      shift: true,
      action: () => navigate('/'),
      description: '返回首页',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return {
    searchOpen,
    setSearchOpen,
    shortcutsDialogOpen,
    setShortcutsDialogOpen,
    goToDialogOpen,
    setGoToDialogOpen,
  };
}
