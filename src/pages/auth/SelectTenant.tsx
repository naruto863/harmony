import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowRight } from 'lucide-react';

export const SelectTenant: React.FC = () => {
  const navigate = useNavigate();
  const { userTenants, switchTenant, currentTenant } = useTenant();

  // 如果已选择租户，重定向
  React.useEffect(() => {
    if (currentTenant) {
      navigate('/', { replace: true });
    }
  }, [currentTenant, navigate]);

  const handleSelect = async (tenantId: string) => {
    await switchTenant(tenantId);
    navigate('/');
  };

  const planLabels: { [key: string]: string } = {
    free: '免费版',
    pro: '专业版',
    enterprise: '企业版',
  };

  const planVariants: { [key: string]: 'secondary' | 'default' | 'outline' } = {
    free: 'secondary',
    pro: 'default',
    enterprise: 'outline',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">AS</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">选择工作空间</h1>
          <p className="text-muted-foreground mt-2">
            您属于多个工作空间，请选择要进入的空间
          </p>
        </div>

        <div className="space-y-3">
          {userTenants.map(tenant => (
            <Card 
              key={tenant.id} 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleSelect(tenant.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tenant.name}</CardTitle>
                      <CardDescription className="text-xs">
                        创建于 {new Date(tenant.createdAt).toLocaleDateString('zh-CN')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={planVariants[tenant.plan]}>
                    {planLabels[tenant.plan]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="ghost" className="w-full justify-between group">
                  进入工作空间
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
