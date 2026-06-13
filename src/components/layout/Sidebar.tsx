import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePermission } from '@/contexts/PermissionContext';
import { useMenu } from '@/contexts/MenuContext';
import { MenuItem } from '@/types';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Shield,
  Files,
  ScrollText,
  Settings,
  User,
  Building2,
  Bell,
  ToggleRight,
  ChevronRight,
  ShieldCheck,
  Monitor,
  BarChart3,
  MessageSquare,
  Menu,
  BookOpen,
  SlidersHorizontal,
  Network,
  LogIn,
  Briefcase,
  UsersRound,
} from 'lucide-react';

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  LayoutDashboard,
  FolderKanban,
  Users,
  Shield,
  Files,
  ScrollText,
  Settings,
  User,
  Building2,
  Bell,
  ToggleRight,
  ShieldCheck,
  Monitor,
  BarChart3,
  MessageSquare,
  Menu,
  BookOpen,
  SlidersHorizontal,
  Network,
  LogIn,
  Briefcase,
  UsersRound,
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { hasPermission } = usePermission();
  const { menuItems } = useMenu();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderMenuItem = (item: MenuItem) => {
    // 权限检查
    if (item.visible === false || item.type === 'button') {
      return null;
    }
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

    const Icon = iconMap[item.icon] || LayoutDashboard;

    // 有子菜单
    if (item.children && item.children.length > 0) {
      const visibleChildren = item.children.filter(child => {
        if (child.visible === false || child.type === 'button') return false;
        return !child.permission || hasPermission(child.permission);
      });

      if (visibleChildren.length === 0) return null;

      const isOpen = visibleChildren.some(child => isActive(child.path));

      return (
        <Collapsible key={item.id} defaultOpen={isOpen} className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={item.label}>
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {visibleChildren.map(child => {
                  const ChildIcon = iconMap[child.icon] || LayoutDashboard;
                  return (
                    <SidebarMenuSubItem key={child.id}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isActive(child.path)}
                      >
                        <NavLink to={child.path || '#'}>
                          <ChildIcon className="h-4 w-4" />
                          <span>{child.label}</span>
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    // 无子菜单
    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          asChild
          isActive={isActive(item.path)}
          tooltip={item.label}
        >
          <NavLink to={item.path || '#'}>
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <ShadcnSidebar collapsible="icon" className="glass-sidebar" data-tour="sidebar">
      <div className={cn(
        "flex h-14 items-center border-b border-sidebar-border px-4",
        isCollapsed && "justify-center px-2"
      )}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg btn-gradient flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">AS</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold gradient-text">Admin Studio</span>
          )}
        </div>
      </div>
      
      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-xs font-medium tracking-wider">
            导航菜单
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </ShadcnSidebar>
  );
};
