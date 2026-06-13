import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';

interface FunnelChartProps {
  title?: string;
  description?: string;
  data?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

// 默认数据：销售漏斗
const defaultData = [
  { name: '访问量', value: 10000, color: 'hsl(var(--primary))' },
  { name: '注册用户', value: 5000, color: 'hsl(var(--info))' },
  { name: '活跃用户', value: 2500, color: 'hsl(var(--success))' },
  { name: '付费用户', value: 1000, color: 'hsl(var(--warning))' },
  { name: 'VIP用户', value: 300, color: 'hsl(var(--destructive))' },
];

export const FunnelChartComponent: React.FC<FunnelChartProps> = ({
  title = '用户转化漏斗',
  description = '从访问到付费的转化分析',
  data = defaultData,
}) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-warning to-warning/70 flex items-center justify-center">
            <Filter className="h-4 w-4 text-white" />
          </div>
          {title}
        </CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const widthPercent = (item.value / maxValue) * 100;
            const conversionRate = index > 0 
              ? ((item.value / data[index - 1].value) * 100).toFixed(1) 
              : '100';
            
            return (
              <div key={item.name} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {item.value.toLocaleString()}
                    </span>
                    {index > 0 && (
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {conversionRate}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center justify-center"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: item.color,
                      marginLeft: `${(100 - widthPercent) / 2}%`,
                    }}
                  >
                    <span className="text-xs font-medium text-white">
                      {((item.value / maxValue) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">总转化率</span>
            <span className="font-bold text-primary">
              {((data[data.length - 1].value / data[0].value) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
