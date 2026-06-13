import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTenant } from '@/contexts/TenantContext';
import { PROJECTS, USERS, AUDIT_LOGS } from '@/data/mock-data';
import { FolderKanban, Users, Activity, FileText, TrendingUp } from 'lucide-react';

export const StatsWidget: React.FC = () => {
  const { currentTenant } = useTenant();

  const stats = [
    {
      title: '项目总数',
      value: PROJECTS.filter(p => p.tenantId === currentTenant?.id).length,
      change: '+12%',
      icon: FolderKanban,
      gradient: 'from-primary to-primary/70',
    },
    {
      title: '团队成员',
      value: USERS.length,
      change: '+3',
      icon: Users,
      gradient: 'from-success to-success/70',
    },
    {
      title: '本月活动',
      value: AUDIT_LOGS.filter(l => l.tenantId === currentTenant?.id).length,
      change: '+28%',
      icon: Activity,
      gradient: 'from-accent-foreground to-primary',
    },
    {
      title: '文件数量',
      value: 24,
      change: '+5',
      icon: FileText,
      gradient: 'from-warning to-warning/70',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 h-full p-1">
      {stats.map((stat, index) => (
        <Card key={index} className="hover-lift overflow-hidden">
          <CardContent className="p-3 md:p-4 relative h-full flex items-center">
            <div className="flex items-center justify-between w-full relative z-10">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">{stat.title}</p>
                <p className="text-lg md:text-2xl font-bold mt-0.5">{stat.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="text-xs text-success font-medium">{stat.change}</span>
                </div>
              </div>
              <div className={`h-8 w-8 md:h-10 md:w-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
