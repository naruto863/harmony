import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('重置链接无效或已过期');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setIsLoading(true);
    try {
      await confirmPasswordReset({ token, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置密码失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">重置密码</CardTitle>
          <CardDescription>设置一个新的登录密码</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>密码已重置，请使用新密码登录。</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading || success}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              重置密码
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

