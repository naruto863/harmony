import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Database, 
  HardDrive, 
  Cpu,
  CheckCircle,
} from 'lucide-react';

const systemMetrics = [
  { label: 'CPU 使用率', value: 35, icon: Cpu, status: 'normal' },
  { label: '内存使用', value: 62, icon: Server, status: 'normal' },
  { label: '存储空间', value: 48, icon: HardDrive, status: 'normal' },
  { label: '数据库', value: 25, icon: Database, status: 'normal' },
];

const getProgressColor = (value: number) => {
  if (value < 60) return 'bg-success';
  if (value < 80) return 'bg-warning';
  return 'bg-destructive';
};

export const SystemInfoWidget: React.FC = () => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-success to-success/70 flex items-center justify-center">
              <Server className="h-3.5 w-3.5 text-white" />
            </div>
            系统状态
          </CardTitle>
          <Badge variant="outline" className="text-success border-success/30 bg-success/10">
            <CheckCircle className="h-3 w-3 mr-1" />
            正常
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {systemMetrics.map((metric) => (
          <div key={metric.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <metric.icon className="h-3 w-3" />
                <span>{metric.label}</span>
              </div>
              <span className="font-medium">{metric.value}%</span>
            </div>
            <Progress 
              value={metric.value} 
              className="h-1.5"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
