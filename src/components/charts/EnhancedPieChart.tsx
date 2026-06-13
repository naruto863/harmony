import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Sector,
} from 'recharts';
import { PieChartIcon } from 'lucide-react';

interface EnhancedPieChartProps {
  title?: string;
  description?: string;
  data?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  showPercentage?: boolean;
}

// 默认数据：收入来源分布
const defaultData = [
  { name: '订阅收入', value: 45000, color: 'hsl(var(--primary))' },
  { name: '广告收入', value: 28000, color: 'hsl(var(--success))' },
  { name: '增值服务', value: 18000, color: 'hsl(var(--warning))' },
  { name: '其他收入', value: 9000, color: 'hsl(var(--muted-foreground))' },
];

type ActiveShapeProps = {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: {
    name: string;
  };
  percent: number;
  value: number;
};

// 自定义活动扇区
const renderActiveShape = (props: ActiveShapeProps) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value,
  } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" className="fill-foreground font-medium text-sm">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} dy={8} textAnchor="middle" className="fill-muted-foreground text-xs">
        ¥{value.toLocaleString()}
      </text>
      <text x={cx} y={cy + 28} dy={8} textAnchor="middle" className="fill-primary font-bold text-sm">
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
    </g>
  );
};

export const EnhancedPieChart: React.FC<EnhancedPieChartProps> = ({
  title = '收入来源分布',
  description = '各渠道收入占比分析',
  data = defaultData,
  showPercentage = true,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-success to-success/70 flex items-center justify-center">
            <PieChartIcon className="h-4 w-4 text-white" />
          </div>
          {title}
        </CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                onMouseEnter={onPieEnter}
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
                formatter={(value: number) => [`¥${value.toLocaleString()}`, '金额']}
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
          <p className="text-3xl font-bold gradient-text">¥{total.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">总收入</p>
        </div>
      </CardContent>
    </Card>
  );
};
