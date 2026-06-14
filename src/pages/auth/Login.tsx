import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getCaptchaChallenge, getSsoProviders, startSsoLogin, type CaptchaChallenge, type SsoProvider } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { isDemoModeEnabled } from '@/lib/demoMode';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [captchaCode, setCaptchaCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [ssoProviders, setSsoProviders] = useState<SsoProvider[]>([]);
  const [loadingSsoId, setLoadingSsoId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  // 如果已登录，重定向
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const loadCaptcha = async () => {
    if (isDemoModeEnabled()) return;
    try {
      const challenge = await getCaptchaChallenge();
      setCaptcha(challenge);
      setCaptchaCode('');
    } catch {
      setCaptcha(null);
    }
  };

  useEffect(() => {
    if (isDemoModeEnabled()) return;
    loadCaptcha();
    getSsoProviders()
      .then((providers) => setSsoProviders(providers.filter((provider) => provider.enabled)))
      .catch(() => setSsoProviders([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password, {
      captchaId: captcha?.captchaId,
      captchaCode: captcha ? captchaCode : undefined,
      rememberMe,
    });
    
    if (result.success) {
      navigate(result.passwordChangeRequired ? '/settings/profile' : from, { replace: true });
    } else {
      setError(result.error || '登录失败');
      loadCaptcha();
    }
    
    setIsLoading(false);
  };

  const handleSsoLogin = async (provider: SsoProvider) => {
    setError('');
    setLoadingSsoId(provider.id);
    try {
      const callbackUrl = `${window.location.origin}/auth/sso/callback?providerId=${encodeURIComponent(provider.id)}`;
      const response = await startSsoLogin({ providerId: provider.id, redirectUri: callbackUrl });
      window.location.assign(response.redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SSO 登录失败');
    } finally {
      setLoadingSsoId(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">AS</span>
          </div>
          <CardTitle className="text-2xl">登录 Admin Studio</CardTitle>
          <CardDescription>输入您的邮箱和密码登录系统</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {captcha && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="captchaCode">验证码</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={loadCaptcha}>
                    <RefreshCw className="mr-1 h-3.5 w-3.5" />
                    换一张
                  </Button>
                </div>
                {captcha.imageUrl || captcha.imageBase64 ? (
                  <img
                    src={captcha.imageUrl || captcha.imageBase64}
                    alt="登录验证码"
                    className="h-12 rounded border bg-background"
                  />
                ) : null}
                <Input
                  id="captchaCode"
                  value={captchaCode}
                  onChange={(e) => setCaptchaCode(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                记住我
              </label>
              <Link to="/forgot-password" className="text-primary hover:underline">
                忘记密码
              </Link>
            </div>

            {isDemoModeEnabled() && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p className="font-medium mb-1">演示账号：</p>
                <p>管理员：admin@example.com / local-demo-admin</p>
                <p>经理：manager@example.com / local-demo-manager</p>
                <p>查看者：viewer@example.com / local-demo-viewer</p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              登录
            </Button>
            {ssoProviders.length > 0 && (
              <div className="grid w-full gap-2">
                {ssoProviders.map((provider) => (
                  <Button
                    key={provider.id}
                    type="button"
                    variant="outline"
                    disabled={!!loadingSsoId}
                    onClick={() => handleSsoLogin(provider)}
                  >
                    {loadingSsoId === provider.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    使用 {provider.name} 登录
                  </Button>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              需要新账号时请联系管理员邀请；公开注册默认关闭。
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
