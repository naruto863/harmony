import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTenant } from '@/contexts/TenantContext';
import { getFeatures, updateFeature, Feature } from '@/services/settingsService';
import { toast } from 'sonner';
import { Loader2, Lock, Sparkles, FlaskConical } from 'lucide-react';

export const FeatureSettings: React.FC = () => {
  const { currentTenant } = useTenant();
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const loadFeatures = async () => {
      if (!currentTenant) return;
      try {
        const data = await getFeatures(currentTenant.id);
        setFeatures(data);
      } catch (error) {
        toast.error('加载功能设置失败');
      } finally {
        setLoading(false);
      }
    };
    loadFeatures();
  }, [currentTenant]);

  const handleToggle = async (feature: Feature) => {
    if (!currentTenant) return;
    
    // 检查是否有权限
    if (feature.requiresPlan) {
      const planOrder = ['free', 'pro', 'enterprise'];
      const currentPlanIndex = planOrder.indexOf(currentTenant.plan);
      const requiredPlanIndex = planOrder.indexOf(feature.requiresPlan);
      
      if (currentPlanIndex < requiredPlanIndex) {
        toast.error(`此功能需要 ${feature.requiresPlan === 'pro' ? '专业版' : '企业版'} 套餐`);
        return;
      }
    }
    
    setUpdatingId(feature.id);
    try {
      await updateFeature(currentTenant.id, feature.id, !feature.enabled);
      setFeatures(prev => 
        prev.map(f => f.id === feature.id ? { ...f, enabled: !f.enabled } : f)
      );
      toast.success(`${feature.name} 已${feature.enabled ? '关闭' : '开启'}`);
    } catch (error) {
      toast.error('更新失败');
    } finally {
      setUpdatingId(null);
    }
  };

  const isFeatureLocked = (feature: Feature) => {
    if (!feature.requiresPlan || !currentTenant) return false;
    const planOrder = ['free', 'pro', 'enterprise'];
    const currentPlanIndex = planOrder.indexOf(currentTenant.plan);
    const requiredPlanIndex = planOrder.indexOf(feature.requiresPlan);
    return currentPlanIndex < requiredPlanIndex;
  };

  const getPlanBadge = (plan: string) => {
    const labels: { [key: string]: string } = {
      pro: '专业版',
      enterprise: '企业版',
    };
    return labels[plan] || plan;
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">功能开关</h1>
        <p className="text-muted-foreground">管理实验性功能和高级选项</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            功能列表
          </CardTitle>
          <CardDescription>开启或关闭特定功能</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {features.map(feature => {
            const locked = isFeatureLocked(feature);
            
            return (
              <div 
                key={feature.id} 
                className={`flex items-start justify-between gap-4 p-4 border rounded-lg transition-colors ${
                  locked ? 'bg-muted/50 opacity-75' : 'hover:bg-muted/30'
                }`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label htmlFor={feature.id} className="font-medium">
                      {feature.name}
                    </Label>
                    {feature.beta && (
                      <Badge variant="secondary" className="text-xs">
                        <FlaskConical className="h-3 w-3 mr-1" />
                        Beta
                      </Badge>
                    )}
                    {feature.requiresPlan && (
                      <Badge variant="outline" className="text-xs">
                        {getPlanBadge(feature.requiresPlan)}
                      </Badge>
                    )}
                    {locked && (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
                
                {locked ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Switch id={feature.id} disabled />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>需要升级到{getPlanBadge(feature.requiresPlan!)}才能使用</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div className="flex items-center gap-2">
                    {updatingId === feature.id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <Switch 
                      id={feature.id} 
                      checked={feature.enabled}
                      onCheckedChange={() => handleToggle(feature)}
                      disabled={updatingId === feature.id}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">解锁更多功能</h3>
              <p className="text-sm text-muted-foreground mt-1">
                升级到专业版或企业版，解锁高级分析、API 访问、Webhooks 等更多强大功能。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
