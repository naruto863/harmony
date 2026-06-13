import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const SsoCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeSsoLogin } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const errorDescription = searchParams.get('error_description') || searchParams.get('error');
    if (errorDescription) {
      setError(errorDescription);
      return;
    }

    const code = searchParams.get('code');
    if (!code) {
      setError('SSO 回调缺少授权码');
      return;
    }

    const providerId = searchParams.get('providerId') || undefined;
    const state = searchParams.get('state') || undefined;
    const redirectUri = `${window.location.origin}/auth/sso/callback${providerId ? `?providerId=${encodeURIComponent(providerId)}` : ''}`;

    completeSsoLogin({ providerId, code, state, redirectUri }).then((result) => {
      if (result.success) {
        setSuccess(true);
        navigate(result.passwordChangeRequired ? '/settings/profile' : '/', { replace: true });
        return;
      }
      setError(result.error || 'SSO 登录失败');
    });
  }, [completeSsoLogin, navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">SSO 登录</CardTitle>
          <CardDescription>正在处理外部身份源回调</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!error && !success && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在完成登录
            </div>
          )}
          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>登录成功，正在跳转。</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        {error && (
          <CardFooter>
            <Button type="button" variant="outline" className="w-full" asChild>
              <Link to="/login">返回登录</Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

