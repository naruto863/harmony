import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InternalServerError: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-foreground">500</h1>
        <h2 className="mb-4 text-xl font-semibold text-foreground">服务暂不可用</h2>
        <p className="mb-8 text-muted-foreground">
          当前请求未能完成，请稍后重试。如问题持续存在，请联系管理员。
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新页面
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

export default InternalServerError;
