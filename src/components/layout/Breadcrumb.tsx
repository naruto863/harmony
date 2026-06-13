import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { useMenu } from '@/contexts/MenuContext';

const pathNameMap: { [key: string]: string } = {
  '': '仪表盘',
  'projects': '项目管理',
  'users': '用户管理',
  'roles': '角色权限',
  'files': '文件中心',
  'audit-logs': '审计日志',
  'login-logs': '登录日志',
  'depts': '组织管理',
  'positions': '岗位管理',
  'user-groups': '用户组管理',
  'menus': '菜单管理',
  'dicts': '字典管理',
  'configs': '参数配置',
  'settings': '系统设置',
  'profile': '个人资料',
  'tenant': '租户设置',
  'notifications': '通知偏好',
  'features': '功能开关',
};

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const { menuItems } = useMenu();
  const pathnames = location.pathname.split('/').filter(x => x);

  const menuPathMap = React.useMemo(() => {
    const map = new Map<string, string>();
    const walk = (items: typeof menuItems) => {
      items.forEach(item => {
        if (item.path) {
          map.set(item.path, item.label);
        }
        if (item.children && item.children.length > 0) {
          walk(item.children);
        }
      });
    };
    walk(menuItems);
    return map;
  }, [menuItems]);

  return (
    <ShadcnBreadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="sr-only">首页</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathnames.length > 0 && <BreadcrumbSeparator />}
        
        {pathnames.map((segment, index) => {
          const isLast = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const label = menuPathMap.get(to) || pathNameMap[segment] || segment;

          return (
            <React.Fragment key={to}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={to}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </ShadcnBreadcrumb>
  );
};
