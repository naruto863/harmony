import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Lock,
  Unlock,
  Shield,
  Clock,
  AlertTriangle,
  Settings2,
  Save,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getLoginLockSettings,
  updateLoginLockSettings,
  getAccountLockStatus,
  unlockAccount,
  LoginLockSettings,
  AccountLockStatus,
} from '@/services/securityService';
import { useAuth } from '@/contexts/AuthContext';

export const LoginLockCard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [settings, setSettings] = useState<LoginLockSettings | null>(null);
  const [lockStatus, setLockStatus] = useState<AccountLockStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 表单状态
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [lockDuration, setLockDuration] = useState(15);
  const [resetWindow, setResetWindow] = useState(30);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsData, statusData] = await Promise.all([
        getLoginLockSettings(),
        user?.email ? getAccountLockStatus(user.email) : Promise.resolve(null),
      ]);
      setSettings(settingsData);
      setLockStatus(statusData);
      setMaxAttempts(settingsData.maxFailedAttempts);
      setLockDuration(settingsData.lockDurationMinutes);
      setResetWindow(settingsData.resetWindowMinutes);
    } catch (error) {
      toast.error(t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    try {
      await updateLoginLockSettings({ enabled });
      setSettings(prev => prev ? { ...prev, enabled } : null);
      toast.success(enabled ? t('common.enabled') : t('common.disabled'));
    } catch (error) {
      toast.error(t('errors.networkError'));
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateLoginLockSettings({
        maxFailedAttempts: maxAttempts,
        lockDurationMinutes: lockDuration,
        resetWindowMinutes: resetWindow,
      });
      setSettings(prev => prev ? {
        ...prev,
        maxFailedAttempts: maxAttempts,
        lockDurationMinutes: lockDuration,
        resetWindowMinutes: resetWindow,
      } : null);
      toast.success(t('success.saved'));
      setShowSettings(false);
    } catch (error) {
      toast.error(t('errors.networkError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlockAccount = async (email: string) => {
    try {
      await unlockAccount(email);
      if (user?.email === email) {
        const statusData = await getAccountLockStatus(email);
        setLockStatus(statusData);
      }
      toast.success(t('settings.security.accountUnlocked'));
    } catch (error) {
      toast.error(t('errors.networkError'));
    }
  };

  const formatTimeRemaining = (lockedUntil: string): string => {
    const remaining = new Date(lockedUntil).getTime() - Date.now();
    if (remaining <= 0) return '0:00';
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('settings.security.loginLock')}</CardTitle>
              <CardDescription>{t('settings.security.loginLockDesc')}</CardDescription>
            </div>
          </div>
          <Switch
            checked={settings?.enabled}
            onCheckedChange={handleToggleEnabled}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 当前状态 */}
        {lockStatus && (
          <Alert variant={lockStatus.isLocked ? 'destructive' : 'default'}>
            {lockStatus.isLocked ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            <AlertDescription className="flex items-center justify-between">
              <div>
                {lockStatus.isLocked ? (
                  <span>
                    {t('settings.security.accountLocked')} - {t('settings.security.unlocksIn')}{' '}
                    <strong>{formatTimeRemaining(lockStatus.lockedUntil!)}</strong>
                  </span>
                ) : (
                  <span>
                    {t('settings.security.failedAttempts')}: {lockStatus.failedAttempts} / {settings?.maxFailedAttempts}
                    {lockStatus.remainingAttempts > 0 && (
                      <span className="text-muted-foreground ml-2">
                        ({t('settings.security.attemptsRemaining', { count: lockStatus.remainingAttempts })})
                      </span>
                    )}
                  </span>
                )}
              </div>
              {lockStatus.isLocked && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => user?.email && handleUnlockAccount(user.email)}
                >
                  <Unlock className="h-4 w-4 mr-1" />
                  {t('settings.security.unlockNow')}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* 设置概览 */}
        {settings?.enabled && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{settings.maxFailedAttempts}</div>
              <div className="text-xs text-muted-foreground">{t('settings.security.maxAttempts')}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{settings.lockDurationMinutes}</div>
              <div className="text-xs text-muted-foreground">{t('settings.security.lockDurationMin')}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{settings.resetWindowMinutes}</div>
              <div className="text-xs text-muted-foreground">{t('settings.security.resetWindowMin')}</div>
            </div>
          </div>
        )}

        <Separator />

        {/* 设置按钮 */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            {t('settings.security.configureSettings')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </Button>
        </div>

        {/* 详细设置 */}
        {showSettings && (
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxAttempts">{t('settings.security.maxFailedAttempts')}</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min={1}
                  max={20}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 5)}
                />
                <p className="text-xs text-muted-foreground">
                  {t('settings.security.maxAttemptsHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockDuration">{t('settings.security.lockDuration')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="lockDuration"
                    type="number"
                    min={1}
                    max={1440}
                    value={lockDuration}
                    onChange={(e) => setLockDuration(parseInt(e.target.value) || 15)}
                  />
                  <span className="text-sm text-muted-foreground">{t('common.minutes')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resetWindow">{t('settings.security.resetWindow')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="resetWindow"
                    type="number"
                    min={1}
                    max={1440}
                    value={resetWindow}
                    onChange={(e) => setResetWindow(parseInt(e.target.value) || 30)}
                  />
                  <span className="text-sm text-muted-foreground">{t('common.minutes')}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('settings.security.resetWindowHint')}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveSettings}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
