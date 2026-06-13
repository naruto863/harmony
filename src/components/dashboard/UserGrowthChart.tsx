import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

// 模拟用户增长数据
const generateUserGrowthData = () => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  let total = 50;
  
  return months.map((month, index) => {
    const newUsers = Math.floor(Math.random() * 20) + 5;
    total += newUsers;
    return {
      month,
      新增用户: newUsers,
      累计用户: total,
    };
  });
};

const data = generateUserGrowthData();

export const UserGrowthChart: React.FC = () => {
  const latestTotal = data[data.length - 1].累计用户;
  const previousTotal = data[data.length - 2].累计用户;
  const growthRate = ((latestTotal - previousTotal) / previousTotal * 100).toFixed(1);

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              用户增长趋势
            </CardTitle>
            <CardDescription className="mt-1">过去12个月的用户增长情况</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold gradient-text">{latestTotal}</p>
            <p className="text-sm text-success font-medium">+{growthRate}% 环比</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTotalUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="新增用户"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorNewUsers)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="累计用户"
                stroke="hsl(var(--success))"
                fillOpacity={1}
                fill="url(#colorTotalUsers)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
