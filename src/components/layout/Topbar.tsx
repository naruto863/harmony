import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Search,
  Command,
  Shield,
  Keyboard,
} from 'lucide-react';
import { GlobalSearch } from '@/components/search';
import { NotificationCenter } from '@/components/notifications';
import { LanguageSwitcher } from '@/components/language';
import { ThemeToggle } from '@/components/theme';
import { KeyboardShortcutsDialog, GoToDialog } from '@/components/keyboard';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';

export const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { currentTenant, userTenants, switchTenant } = useTenant();
  
  const {
    searchOpen,
    setSearchOpen,
    shortcutsDialogOpen,
    setShortcutsDialogOpen,
    goToDialogOpen,
    setGoToDialogOpen,
  } = useGlobalShortcuts();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="h-14 border-b bg-card/80 backdrop-blur-lg flex items-center justify-between px-2 md:px-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <SidebarTrigger />
          
          {/* 租户切换 */}
          {userTenants.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-[100px] truncate">{currentTenant?.name || t('common.select')}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>切换租户</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userTenants.map(tenant => (
                  <DropdownMenuItem
                    key={tenant.id}
                    onClick={() => switchTenant(tenant.id)}
                    className="gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    <span>{tenant.name}</span>
                    {tenant.id === currentTenant?.id && (
                      <Badge variant="secondary" className="ml-auto">当前</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* 搜索按钮 */}
          <div data-tour="global-search">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-muted-foreground hidden sm:flex"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span>{t('common.search')}...</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <Command className="h-3 w-3" />K
              </kbd>
            </Button>
          </div>
          
          {/* 快捷键帮助按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex"
            onClick={() => setShortcutsDialogOpen(true)}
            title={t('shortcuts.title')}
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          
          {/* 移动端搜索图标 */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* 主题切换 */}
          <div data-tour="theme-toggle">
            <ThemeToggle />
          </div>

          {/* 语言切换 */}
          <LanguageSwitcher />

          {/* 通知中心 */}
          <div data-tour="notifications">
            <NotificationCenter />
          </div>

          {/* 用户菜单 */}
          <div data-tour="user-menu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 md:gap-2 pl-1 md:pl-2">
                  <Avatar className="h-7 w-7 md:h-8 md:w-8 ring-2 ring-primary/20">
                    <AvatarFallback className="btn-gradient text-white text-xs md:text-sm">
                      {user ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-medium max-w-[100px] truncate">{user?.name}</span>
                    <span className="text-xs text-muted-foreground max-w-[100px] truncate">{user?.email}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 hidden lg:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t('auth.login')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  {t('nav.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings/security')}>
                  <Shield className="mr-2 h-4 w-4" />
                  {t('nav.security')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings/notifications')}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('nav.notifications')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('auth.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* 全局搜索对话框 */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      
      {/* 快捷键帮助对话框 */}
      <KeyboardShortcutsDialog open={shortcutsDialogOpen} onOpenChange={setShortcutsDialogOpen} />
      
      {/* 快速导航对话框 */}
      <GoToDialog open={goToDialogOpen} onOpenChange={setGoToDialogOpen} />
    </>
  );
};
