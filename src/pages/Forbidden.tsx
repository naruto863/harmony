import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

const Forbidden: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">403</h1>
        <h2 className="text-xl font-semibold text-foreground mb-4">访问被拒绝</h2>
        <p className="text-muted-foreground mb-8">
          抱歉，您没有权限访问此页面。如需访问，请联系管理员获取相应权限。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回上页
          </Button>
          <Button onClick={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            回到首页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
