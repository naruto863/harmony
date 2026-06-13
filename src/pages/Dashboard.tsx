import React, { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { usePermission } from '@/contexts/PermissionContext';
import { DashboardGrid } from '@/components/dashboard';
import { DashboardSkeleton } from '@/components/skeleton';
import { TourTrigger } from '@/components/tour';
import { useDashboardTour } from '@/hooks/useDashboardTour';

const Dashboard: React.FC = () => {
  const { currentTenant } = useTenant();
  const { role } = usePermission();
  const [isLoading, setIsLoading] = useState(true);
  const { steps, tourId } = useDashboardTour();

  // 模拟加载
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 欢迎信息 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            欢迎回来，<span className="gradient-text">{currentTenant?.name}</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            您当前的角色是 <span className="font-medium text-foreground">{role?.name}</span>
          </p>
        </div>
        <TourTrigger tourId={tourId} steps={steps} autoStart />
      </div>

      {/* 可拖拽看板 */}
      <div data-tour="dashboard-widgets">
        <DashboardGrid />
      </div>
    </div>
  );
};

export default Dashboard;
