import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const StatCardSkeleton: React.FC = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

export const ChartSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={className}>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[250px] w-full rounded-lg" />
    </CardContent>
  </Card>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* 欢迎信息 */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>

    {/* 统计卡片 */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    {/* 图表区域 */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ChartSkeleton className="lg:col-span-2" />
      <ChartSkeleton />
    </div>

    {/* 活动区域 */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ChartSkeleton className="lg:col-span-2" />
      <ChartSkeleton />
    </div>
  </div>
);
