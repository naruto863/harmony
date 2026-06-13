import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Target } from 'lucide-react';

interface RadarChartProps {
  title?: string;
  description?: string;
  data?: Array<{
    subject: string;
    [key: string]: string | number;
  }>;
  dataKeys?: Array<{
    key: string;
    name: string;
    color: string;
  }>;
}

// 默认数据：团队能力雷达图
const defaultData = [
  { subject: '前端开发', A: 120, B: 110, fullMark: 150 },
  { subject: 'API集成', A: 98, B: 130, fullMark: 150 },
  { subject: 'UI设计', A: 86, B: 130, fullMark: 150 },
  { subject: '项目管理', A: 99, B: 100, fullMark: 150 },
  { subject: '测试能力', A: 85, B: 90, fullMark: 150 },
  { subject: '沟通协作', A: 65, B: 85, fullMark: 150 },
];

const defaultDataKeys = [
  { key: 'A', name: '团队A', color: 'hsl(var(--primary))' },
  { key: 'B', name: '团队B', color: 'hsl(var(--success))' },
];

export const RadarChartComponent: React.FC<RadarChartProps> = ({
  title = '团队能力分析',
  description = '各团队技能水平对比',
  data = defaultData,
  dataKeys = defaultDataKeys,
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Target className="h-4 w-4 text-white" />
          </div>
          {title}
        </CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsRadarChart data={data}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 150]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              {dataKeys.map((dk) => (
                <Radar
                  key={dk.key}
                  name={dk.name}
                  dataKey={dk.key}
                  stroke={dk.color}
                  fill={dk.color}
                  fillOpacity={0.3}
                />
              ))}
              <Legend />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </RechartsRadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
