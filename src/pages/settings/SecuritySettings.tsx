import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Shield, ShieldCheck, ShieldOff, QrCode, Key, Download, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getTwoFactorSettings,
  generateTwoFactorSecret,
  enableTwoFactor,
  disableTwoFactor,
  regenerateRecoveryCodes,
  TwoFactorSettings,
} from '@/services/securityService';
import { IpWhitelistCard, LoginLockCard, AnomalyDetectionCard } from '@/components/security';
export const SecuritySettings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<TwoFactorSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await getTwoFactorSettings(user.id);
      setSettings(data);
    } catch (error) {
      console.error('Failed to load 2FA settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSetup = async () => {
    if (!user) return;
    
    try {
      const { qrCode: qr } = await generateTwoFactorSecret(user.id);
      setQrCode(qr);
      setVerificationCode('');
      setSetupDialogOpen(true);
    } catch (error) {
      toast({
        title: t('errors.serverError'),
        variant: 'destructive',
      });
    }
  };

  const handleEnableTwoFactor = async () => {
    if (!user || !verificationCode) return;
    
    setIsVerifying(true);
    try {
      const result = await enableTwoFactor(user.id, verificationCode);
      
      if (result.success) {
        setSetupDialogOpen(false);
        setRecoveryCodes(result.recoveryCodes || []);
        setShowRecoveryCodes(true);
        await loadSettings();
        toast({
          title: t('settings.security.twoFactorEnabled'),
        });
      } else {
        toast({
          title: t('settings.security.invalidCode'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('errors.serverError'),
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!user || !verificationCode) return;
    
    setIsVerifying(true);
    try {
      const success = await disableTwoFactor(user.id, verificationCode);
      
      if (success) {
        setDisableDialogOpen(false);
        setVerificationCode('');
        await loadSettings();
        toast({
          title: t('settings.security.twoFactorDisabled'),
        });
      } else {
        toast({
          title: t('settings.security.invalidCode'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('errors.serverError'),
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegenerateCodes = async () => {
    if (!user) return;
    
    try {
      const codes = await regenerateRecoveryCodes(user.id);
      setRecoveryCodes(codes);
      setRecoveryDialogOpen(false);
      setShowRecoveryCodes(true);
      toast({
        title: t('success.updated'),
      });
    } catch (error) {
      toast({
        title: t('errors.serverError'),
        variant: 'destructive',
      });
    }
  };

  const downloadRecoveryCodes = () => {
    const content = recoveryCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('settings.security.title')}</h1>
        <p className="text-muted-foreground">{t('settings.security.description')}</p>
      </div>

      {/* 双因素认证卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${settings?.enabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                {settings?.enabled ? (
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <ShieldOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{t('settings.security.twoFactor')}</CardTitle>
                <CardDescription>{t('settings.security.twoFactorDesc')}</CardDescription>
              </div>
            </div>
            <Badge variant={settings?.enabled ? 'default' : 'secondary'}>
              {settings?.enabled ? t('common.enabled') : t('common.disabled')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {settings?.enabled 
                ? t('settings.security.twoFactorEnabled')
                : t('settings.security.twoFactorDisabled')
              }
            </p>
            {settings?.enabled ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRecoveryDialogOpen(true)}
                >
                  <Key className="h-4 w-4 mr-2" />
                  {t('settings.security.recoveryCodes')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setVerificationCode('');
                    setDisableDialogOpen(true);
                  }}
                >
                  {t('settings.security.disableTwoFactor')}
                </Button>
              </div>
            ) : (
              <Button onClick={handleStartSetup}>
                <Shield className="h-4 w-4 mr-2" />
                {t('settings.security.enableTwoFactor')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 登录失败锁定卡片 */}
      <LoginLockCard />

      {/* 异常登录检测卡片 */}
      <AnomalyDetectionCard />

      {/* IP白名单卡片 */}
      <IpWhitelistCard />

      {/* 2FA设置对话框 */}
      <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('settings.security.enableTwoFactor')}</DialogTitle>
            <DialogDescription>{t('settings.security.scanQRCode')}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 模拟二维码 */}
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                <QrCode className="h-24 w-24 text-muted-foreground" />
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              {t('settings.security.enterCode')} (测试代码: 123456)
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="code">{t('settings.security.enterCode')}</Label>
              <Input
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleEnableTwoFactor}
              disabled={verificationCode.length !== 6 || isVerifying}
            >
              {isVerifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('settings.security.verifyCode')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 禁用2FA对话框 */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('settings.security.disableTwoFactor')}</DialogTitle>
            <DialogDescription>{t('settings.security.enterCode')}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="disable-code">{t('settings.security.enterCode')}</Label>
            <Input
              id="disable-code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDisableTwoFactor}
              disabled={verificationCode.length !== 6 || isVerifying}
            >
              {isVerifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('settings.security.disableTwoFactor')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 恢复码重新生成确认 */}
      <AlertDialog open={recoveryDialogOpen} onOpenChange={setRecoveryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.security.regenerateCodes')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.security.recoveryCodesDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateCodes}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('settings.security.regenerateCodes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 恢复码显示对话框 */}
      <Dialog open={showRecoveryCodes} onOpenChange={setShowRecoveryCodes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('settings.security.recoveryCodes')}</DialogTitle>
            <DialogDescription>{t('settings.security.recoveryCodesDesc')}</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
            {recoveryCodes.map((code, index) => (
              <code key={index} className="text-sm font-mono text-center py-1">
                {code}
              </code>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={downloadRecoveryCodes}>
              <Download className="h-4 w-4 mr-2" />
              {t('settings.security.downloadCodes')}
            </Button>
            <Button onClick={() => setShowRecoveryCodes(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
