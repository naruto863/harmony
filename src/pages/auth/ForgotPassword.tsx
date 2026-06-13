import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送重置邮件失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">找回密码</CardTitle>
          <CardDescription>输入邮箱后，外部身份服务会发送重置链接</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {sent && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>如果该邮箱存在，重置链接会发送到对应邮箱。</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading || sent}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              发送重置链接
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link to="/login">返回登录</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

