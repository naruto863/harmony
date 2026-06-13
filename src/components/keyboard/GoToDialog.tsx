import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Shield,
  Files,
  ScrollText,
  Settings,
  User,
  Menu,
  BookOpen,
  SlidersHorizontal,
  Network,
  LogIn,
  MessageSquare,
  BarChart3,
  Building2,
  Bell,
  ToggleRight,
  ShieldCheck,
  Monitor,
} from 'lucide-react';
import { useMenu } from '@/contexts/MenuContext';
import { MenuItem } from '@/types';
import { usePermission } from '@/contexts/PermissionContext';

interface GoToDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FolderKanban,
  Users,
  Shield,
  Files,
  ScrollText,
  Settings,
  User,
  Menu,
  BookOpen,
  SlidersHorizontal,
  Network,
  LogIn,
  MessageSquare,
  BarChart3,
  Building2,
  Bell,
  ToggleRight,
  ShieldCheck,
  Monitor,
};

const flattenMenus = (items: MenuItem[]): MenuItem[] => {
  return items.flatMap(item => {
    const current = item.path ? [item] : [];
    const children = item.children ? flattenMenus(item.children) : [];
    return [...current, ...children];
  });
};

export const GoToDialog: React.FC<GoToDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { menuItems } = useMenu();
  const { hasPermission } = usePermission();
  const [search, setSearch] = useState('');

  const menuList = useMemo(() => {
    return flattenMenus(menuItems).filter(item => {
      if (!item.path || item.path === '/' || item.type === 'external' || item.type === 'button') return false;
      if (item.visible === false) return false;
      if (item.permission && !hasPermission(item.permission)) return false;
      return true;
    });
  }, [menuItems, hasPermission]);

  const handleSelect = (path: string) => {
    navigate(path);
    onOpenChange(false);
    setSearch('');
  };

  const filteredPages = menuList.filter(page =>
    page.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={t('shortcuts.goToPlaceholder')}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>{t('search.noResults')}</CommandEmpty>
        <CommandGroup heading={t('shortcuts.pages')}>
          {filteredPages.map(page => {
            const Icon = iconMap[page.icon] || LayoutDashboard;
            return (
              <CommandItem
                key={page.path}
                value={page.path}
                onSelect={() => handleSelect(page.path || '/')}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{page.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
