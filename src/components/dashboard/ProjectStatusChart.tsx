import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FolderKanban } from 'lucide-react';
import { PROJECTS } from '@/data/mock-data';
import { useTenant } from '@/contexts/TenantContext';

const STATUS_COLORS = {
  active: 'hsl(var(--success))',
  draft: 'hsl(var(--warning))',
  archived: 'hsl(var(--muted-foreground))',
};

const STATUS_LABELS = {
  active: '进行中',
  draft: '草稿',
  archived: '已归档',
};

export const ProjectStatusChart: React.FC = () => {
  const { currentTenant } = useTenant();
  
  const tenantProjects = PROJECTS.filter(p => p.tenantId === currentTenant?.id);
  
  const data = Object.entries(
    tenantProjects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({
    name: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
    value: count,
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'hsl(var(--muted))',
  }));

  const total = tenantProjects.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent-foreground to-primary flex items-center justify-center">
            <FolderKanban className="h-4 w-4 text-white" />
          </div>
          项目状态分布
        </CardTitle>
        <CardDescription className="mt-1">当前租户的项目状态统计</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-2">
          <p className="text-3xl font-bold gradient-text">{total}</p>
          <p className="text-sm text-muted-foreground">项目总数</p>
        </div>
      </CardContent>
    </Card>
  );
};
